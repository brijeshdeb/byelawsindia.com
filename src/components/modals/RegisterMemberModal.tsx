"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  FormField,
  Input,
  Select,
  Textarea,
  ModalActions,
  CancelButton,
  SubmitButton,
} from "@/components/ui/Modal";
import { registerMemberAction, type JointMemberInput } from "@/app/actions/members";

interface Props {
  open: boolean;
  onClose: () => void;
  units: { id: string; unit_number: string; wing_name: string }[];
}

type JointDraft = JointMemberInput & { key: string };

const identityOptions = (
  <>
    <option value="">Not provided</option>
    <option value="AADHAAR">Aadhaar</option>
    <option value="PASSPORT">Passport</option>
    <option value="VOTER_ID">Voter ID</option>
    <option value="DRIVING_LICENCE">Driving licence</option>
    <option value="OTHER">Other permitted ID</option>
  </>
);

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  return value === null || String(value).trim() === "" ? undefined : Number(value);
}

export function RegisterMemberModal({ open, onClose, units }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [jointMembers, setJointMembers] = useState<JointDraft[]>([]);

  function handleClose() {
    if (isPending) return;
    setError(null);
    setJointMembers([]);
    onClose();
  }

  function updateJoint(key: string, changes: Partial<JointDraft>) {
    setJointMembers((current) => current.map((joint) => (joint.key === key ? { ...joint, ...changes } : joint)));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await registerMemberAction({
        fullName: String(form.get("fullName") ?? ""),
        fatherSpouseName: String(form.get("fatherSpouseName") ?? "") || undefined,
        email: String(form.get("email") ?? "") || undefined,
        phone: String(form.get("phone") ?? "") || undefined,
        dateOfBirth: String(form.get("dateOfBirth") ?? "") || undefined,
        pan: String(form.get("pan") ?? "") || undefined,
        identityType: (String(form.get("identityType") ?? "") || undefined) as
          | "AADHAAR"
          | "PASSPORT"
          | "VOTER_ID"
          | "DRIVING_LICENCE"
          | "OTHER"
          | undefined,
        identityNumber: String(form.get("identityNumber") ?? "") || undefined,
        correspondenceAddress: String(form.get("correspondenceAddress") ?? "") || undefined,
        permanentAddress: String(form.get("permanentAddress") ?? "") || undefined,
        ownershipType: (String(form.get("ownershipType") ?? "") || undefined) as
          | "SOLE"
          | "JOINT"
          | "ASSOCIATE"
          | "TENANT"
          | "OTHER"
          | undefined,
        ownershipDocumentNumber: String(form.get("ownershipDocumentNumber") ?? "") || undefined,
        ownershipDate: String(form.get("ownershipDate") ?? "") || undefined,
        shareCertificateNumber: String(form.get("shareCertificateNumber") ?? "") || undefined,
        sharesHeld: optionalNumber(form.get("sharesHeld")),
        occupation: String(form.get("occupation") ?? "") || undefined,
        ageAtAdmission: optionalNumber(form.get("ageAtAdmission")),
        entranceFeePaidAt: String(form.get("entranceFeePaidAt") ?? "") || undefined,
        nomineeNameAddress: String(form.get("nomineeNameAddress") ?? "") || undefined,
        nominationDate: String(form.get("nominationDate") ?? "") || undefined,
        unitId: String(form.get("unitId") ?? "") || undefined,
        memberType: String(form.get("memberType")) as "OWNER" | "TENANT" | "ASSOCIATE" | "COMMITTEE",
        effectiveFrom: String(form.get("effectiveFrom") ?? "") || undefined,
        notes: String(form.get("notes") ?? "") || undefined,
        jointMembers: jointMembers.map(({ key: _key, ...joint }) => joint),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      handleClose();
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Register Member" description="Create the complete membership and statutory record.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Section title="Personal details">
          <FormField label="Full name" htmlFor="fullName" required>
            <Input id="fullName" name="fullName" required />
          </FormField>
          <FormField label="Father / spouse name" htmlFor="fatherSpouseName">
            <Input id="fatherSpouseName" name="fatherSpouseName" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date of birth" htmlFor="dateOfBirth"><Input id="dateOfBirth" name="dateOfBirth" type="date" /></FormField>
            <FormField label="Occupation" htmlFor="occupation"><Input id="occupation" name="occupation" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" htmlFor="email"><Input id="email" name="email" type="email" /></FormField>
            <FormField label="Mobile" htmlFor="phone"><Input id="phone" name="phone" type="tel" /></FormField>
          </div>
        </Section>

        <Section title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="PAN" htmlFor="pan"><Input id="pan" name="pan" maxLength={10} placeholder="ABCDE1234F" /></FormField>
            <FormField label="Identity type" htmlFor="identityType"><Select id="identityType" name="identityType">{identityOptions}</Select></FormField>
          </div>
          <FormField label="Identity number" htmlFor="identityNumber">
            <Input id="identityNumber" name="identityNumber" autoComplete="off" />
            <p className="mt-1 text-xs text-[#6B7280]">The number is hashed immediately; only its last four characters are retained for display.</p>
          </FormField>
        </Section>

        <Section title="Address and membership">
          <FormField label="Correspondence address" htmlFor="correspondenceAddress"><Textarea id="correspondenceAddress" name="correspondenceAddress" /></FormField>
          <FormField label="Permanent address" htmlFor="permanentAddress"><Textarea id="permanentAddress" name="permanentAddress" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Member type" htmlFor="memberType" required>
              <Select id="memberType" name="memberType" required><option value="OWNER">Owner</option><option value="TENANT">Tenant</option><option value="ASSOCIATE">Associate</option><option value="COMMITTEE">Committee</option></Select>
            </FormField>
            <FormField label="Unit" htmlFor="unitId"><Select id="unitId" name="unitId"><option value="">No unit assigned</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.wing_name} - {unit.unit_number}</option>)}</Select></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ownership" htmlFor="ownershipType"><Select id="ownershipType" name="ownershipType"><option value="">Not specified</option><option value="SOLE">Sole</option><option value="JOINT">Joint</option><option value="ASSOCIATE">Associate</option><option value="TENANT">Tenant</option><option value="OTHER">Other</option></Select></FormField>
            <FormField label="Ownership date" htmlFor="ownershipDate"><Input id="ownershipDate" name="ownershipDate" type="date" /></FormField>
          </div>
          <FormField label="Ownership document number" htmlFor="ownershipDocumentNumber"><Input id="ownershipDocumentNumber" name="ownershipDocumentNumber" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Share certificate" htmlFor="shareCertificateNumber"><Input id="shareCertificateNumber" name="shareCertificateNumber" /></FormField>
            <FormField label="Shares held" htmlFor="sharesHeld"><Input id="sharesHeld" name="sharesHeld" type="number" min="0" step="0.001" /></FormField>
          </div>
        </Section>

        <Section title="Joint members">
          {jointMembers.map((joint, index) => (
            <div key={joint.key} className="space-y-3 rounded border border-[#333] p-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-text-primary">Joint member {index + 1}</p><button type="button" onClick={() => setJointMembers((rows) => rows.filter((row) => row.key !== joint.key))} className="text-xs text-[#EF4444]">Remove</button></div>
              <div className="grid grid-cols-2 gap-3"><Input aria-label={`Joint member ${index + 1} full name`} placeholder="Full name" required value={joint.fullName} onChange={(event) => updateJoint(joint.key, { fullName: event.target.value })} /><Input aria-label={`Joint member ${index + 1} relationship`} placeholder="Relationship" value={joint.relationship ?? ""} onChange={(event) => updateJoint(joint.key, { relationship: event.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3"><Input aria-label={`Joint member ${index + 1} PAN`} placeholder="PAN" maxLength={10} value={joint.pan ?? ""} onChange={(event) => updateJoint(joint.key, { pan: event.target.value })} /><Input aria-label={`Joint member ${index + 1} ownership share`} placeholder="Ownership %" type="number" min="0" max="100" step="0.01" value={joint.ownershipShare ?? ""} onChange={(event) => updateJoint(joint.key, { ownershipShare: event.target.value === "" ? undefined : Number(event.target.value) })} /></div>
              <div className="grid grid-cols-2 gap-3"><Select aria-label={`Joint member ${index + 1} identity type`} value={joint.identityType ?? ""} onChange={(event) => updateJoint(joint.key, { identityType: (event.target.value || undefined) as JointMemberInput["identityType"] })}>{identityOptions}</Select><Input aria-label={`Joint member ${index + 1} identity number`} placeholder="Identity number" autoComplete="off" value={joint.identityNumber ?? ""} onChange={(event) => updateJoint(joint.key, { identityNumber: event.target.value })} /></div>
            </div>
          ))}
          <button type="button" onClick={() => setJointMembers((rows) => [...rows, { key: crypto.randomUUID(), fullName: "", ownershipShare: 0 }])} className="self-start rounded border border-[#444] px-3 py-2 text-sm text-[#D1D5DB]">Add joint member</button>
        </Section>

        <Section title="Form I details">
          <div className="grid grid-cols-2 gap-4"><FormField label="Age on admission" htmlFor="ageAtAdmission"><Input id="ageAtAdmission" name="ageAtAdmission" type="number" min="0" max="120" /></FormField><FormField label="Entrance fee paid on" htmlFor="entranceFeePaidAt"><Input id="entranceFeePaidAt" name="entranceFeePaidAt" type="date" /></FormField></div>
          <FormField label="Nominee name and address" htmlFor="nomineeNameAddress"><Textarea id="nomineeNameAddress" name="nomineeNameAddress" /></FormField>
          <div className="grid grid-cols-2 gap-4"><FormField label="Nomination date" htmlFor="nominationDate"><Input id="nominationDate" name="nominationDate" type="date" /></FormField><FormField label="Effective from" htmlFor="effectiveFrom"><Input id="effectiveFrom" name="effectiveFrom" type="date" defaultValue={new Date().toISOString().split("T")[0]} /></FormField></div>
        </Section>

        <FormField label="Notes" htmlFor="notes"><Textarea id="notes" name="notes" /></FormField>
        {error && <p className="rounded border border-red-900 bg-red-950/30 p-3 text-sm text-[#EF4444]">{error}</p>}
        <ModalActions><CancelButton onClick={handleClose} /><SubmitButton loading={isPending}>Register Member</SubmitButton></ModalActions>
      </form>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="flex flex-col gap-4 border-t border-[#333] pt-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">{title}</h3>{children}</section>;
}
