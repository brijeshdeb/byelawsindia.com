"use server";
import { createHash } from "node:crypto";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { AppError, PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";

export interface RegisterMemberInput {
  fullName: string;
  fatherSpouseName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  pan?: string;
  identityType?: "AADHAAR" | "PASSPORT" | "VOTER_ID" | "DRIVING_LICENCE" | "OTHER";
  identityNumber?: string;
  correspondenceAddress?: string;
  permanentAddress?: string;
  ownershipType?: "SOLE" | "JOINT" | "ASSOCIATE" | "TENANT" | "OTHER";
  ownershipDocumentNumber?: string;
  ownershipDate?: string;
  shareCertificateNumber?: string;
  sharesHeld?: number;
  occupation?: string;
  ageAtAdmission?: number;
  entranceFeePaidAt?: string;
  nomineeNameAddress?: string;
  nominationDate?: string;
  unitId?: string;
  memberType: "OWNER" | "TENANT" | "ASSOCIATE" | "COMMITTEE";
  effectiveFrom?: string; // ISO date
  notes?: string;
  jointMembers?: JointMemberInput[];
}

export interface JointMemberInput {
  fullName: string;
  fatherSpouseName?: string;
  relationship?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  pan?: string;
  identityType?: "AADHAAR" | "PASSPORT" | "VOTER_ID" | "DRIVING_LICENCE" | "OTHER";
  identityNumber?: string;
  ownershipShare?: number;
}

function protectIdentity(value?: string): { identityNumberMasked?: string; identityNumberHash?: string } {
  const normalized = value?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  if (!normalized) return {};
  if (normalized.length < 4 || normalized.length > 32) {
    throw AppError.validation("Identity number must contain between 4 and 32 letters or digits.");
  }
  return {
    identityNumberMasked: `****${normalized.slice(-4)}`,
    identityNumberHash: createHash("sha256").update(normalized).digest("hex"),
  };
}

export async function registerMemberAction(
  input: RegisterMemberInput
): Promise<ActionResult<{ id: string; memberNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.MEMBER_CREATE);
    if (userCtx.isPlatformAdmin) {
      throw AppError.forbidden("Platform administrators cannot register society members.");
    }

    if (!input.fullName.trim()) throw AppError.validation("Full name is required.");

    if (input.ageAtAdmission !== undefined && (!Number.isInteger(input.ageAtAdmission) || input.ageAtAdmission < 0 || input.ageAtAdmission > 120)) {
      throw AppError.validation("Age on admission must be a whole number between 0 and 120.");
    }

    if (input.sharesHeld !== undefined && (!Number.isFinite(input.sharesHeld) || input.sharesHeld < 0)) {
      throw AppError.validation("Shares held cannot be negative.");
    }

    const identity = protectIdentity(input.identityNumber);
    const jointMembers = (input.jointMembers ?? []).map((joint) => ({
      fullName: joint.fullName.trim(),
      fatherSpouseName: joint.fatherSpouseName?.trim() || undefined,
      relationship: joint.relationship?.trim() || undefined,
      dateOfBirth: joint.dateOfBirth || undefined,
      email: joint.email?.trim() || undefined,
      phone: joint.phone?.trim() || undefined,
      pan: joint.pan?.trim().toUpperCase() || undefined,
      identityType: joint.identityType,
      ...protectIdentity(joint.identityNumber),
      ownershipShare: joint.ownershipShare,
    }));

    const { data, error } = await supabase.rpc("register_member_atomic" as never, {
      p_society_id: societyId,
      p_member: {
        fullName: input.fullName.trim(),
        fatherSpouseName: input.fatherSpouseName?.trim() || undefined,
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        dateOfBirth: input.dateOfBirth || undefined,
        pan: input.pan?.trim().toUpperCase() || undefined,
        identityType: input.identityType,
        ...identity,
        correspondenceAddress: input.correspondenceAddress?.trim() || undefined,
        permanentAddress: input.permanentAddress?.trim() || undefined,
        ownershipType: input.ownershipType,
        ownershipDocumentNumber: input.ownershipDocumentNumber?.trim() || undefined,
        ownershipDate: input.ownershipDate || undefined,
        shareCertificateNumber: input.shareCertificateNumber?.trim() || undefined,
        sharesHeld: input.sharesHeld,
        occupation: input.occupation?.trim() || undefined,
        ageAtAdmission: input.ageAtAdmission,
        entranceFeePaidAt: input.entranceFeePaidAt || undefined,
        nomineeNameAddress: input.nomineeNameAddress?.trim() || undefined,
        nominationDate: input.nominationDate || undefined,
        unitId: input.unitId || undefined,
        memberType: input.memberType,
        effectiveFrom: input.effectiveFrom ?? new Date().toISOString().split("T")[0],
        notes: input.notes?.trim() || undefined,
      },
      p_joint_members: jointMembers,
      p_actor_user_id: userId,
    } as never);

    if (error) throw new Error(error.message);

    const result = data as unknown as { id: string; memberNumber: string };

    revalidatePath("/members");
    revalidatePath("/members/statutory-registers");
    return result;
  });
}

export interface UpdateMemberStatutoryInput {
  memberId: string;
  address?: string;
  occupation?: string;
  ageAtAdmission?: number;
  entranceFeePaidAt?: string;
  nomineeNameAddress?: string;
  nominationDate?: string;
  effectiveUntil?: string;
  cessationReason?: string;
  remark?: string;
}

export async function updateMemberStatutoryDetailsAction(
  input: UpdateMemberStatutoryInput
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.MEMBER_UPDATE);

    if (!input.memberId) throw AppError.validation("Member is required.");
    if (input.ageAtAdmission !== undefined && (!Number.isInteger(input.ageAtAdmission) || input.ageAtAdmission < 0 || input.ageAtAdmission > 120)) {
      throw AppError.validation("Age on admission must be a whole number between 0 and 120.");
    }

    const { data, error } = await supabase
      .from("members")
      .update({
        address: input.address?.trim() || null,
        occupation: input.occupation?.trim() || null,
        age_at_admission: input.ageAtAdmission ?? null,
        entrance_fee_paid_at: input.entranceFeePaidAt || null,
        nominee_name_address: input.nomineeNameAddress?.trim() || null,
        nomination_date: input.nominationDate || null,
        effective_until: input.effectiveUntil || null,
        cessation_reason: input.cessationReason?.trim() || null,
        remark: input.remark?.trim() || null,
      })
      .eq("id", input.memberId)
      .eq("society_id", societyId)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/members");
    revalidatePath("/members/statutory-registers");
    return { id: data.id };
  });
}
