"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberStatutoryDetailsAction } from "@/app/actions/members";
import { CancelButton, FormField, Input, Modal, ModalActions, SubmitButton, Textarea } from "@/components/ui/Modal";

export interface StatutoryMemberDetails {
  id: string;
  full_name: string;
  address: string | null;
  occupation: string | null;
  age_at_admission: number | null;
  entrance_fee_paid_at: string | null;
  nominee_name_address: string | null;
  nomination_date: string | null;
  effective_until: string | null;
  cessation_reason: string | null;
  remark: string | null;
}

export function EditMemberStatutoryModal({
  open,
  member,
  onClose,
}: {
  open: boolean;
  member: StatutoryMemberDetails;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const age = (form.get("ageAtAdmission") as string) || "";
    setError(null);

    startTransition(async () => {
      const result = await updateMemberStatutoryDetailsAction({
        memberId: member.id,
        address: (form.get("address") as string) || undefined,
        occupation: (form.get("occupation") as string) || undefined,
        ageAtAdmission: age ? Number(age) : undefined,
        entranceFeePaidAt: (form.get("entranceFeePaidAt") as string) || undefined,
        nomineeNameAddress: (form.get("nomineeNameAddress") as string) || undefined,
        nominationDate: (form.get("nominationDate") as string) || undefined,
        effectiveUntil: (form.get("effectiveUntil") as string) || undefined,
        cessationReason: (form.get("cessationReason") as string) || undefined,
        remark: (form.get("remark") as string) || undefined,
      });
      if (!result.success) return setError(result.error);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Form I Details" description={member.full_name} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField label="Member address" htmlFor="stat-address">
          <Textarea id="stat-address" name="address" defaultValue={member.address ?? ""} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Occupation" htmlFor="stat-occupation">
            <Input id="stat-occupation" name="occupation" defaultValue={member.occupation ?? ""} />
          </FormField>
          <FormField label="Age on admission" htmlFor="stat-age">
            <Input id="stat-age" name="ageAtAdmission" type="number" min="0" max="120" defaultValue={member.age_at_admission ?? ""} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Entrance fee paid on" htmlFor="stat-fee-date">
            <Input id="stat-fee-date" name="entranceFeePaidAt" type="date" defaultValue={member.entrance_fee_paid_at ?? ""} />
          </FormField>
          <FormField label="Nomination date" htmlFor="stat-nomination-date">
            <Input id="stat-nomination-date" name="nominationDate" type="date" defaultValue={member.nomination_date ?? ""} />
          </FormField>
        </div>
        <FormField label="Nominee name and address" htmlFor="stat-nominee">
          <Textarea id="stat-nominee" name="nomineeNameAddress" defaultValue={member.nominee_name_address ?? ""} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Membership ceased on" htmlFor="stat-cessation-date">
            <Input id="stat-cessation-date" name="effectiveUntil" type="date" defaultValue={member.effective_until ?? ""} />
          </FormField>
          <FormField label="Reason for cessation" htmlFor="stat-cessation-reason">
            <Input id="stat-cessation-reason" name="cessationReason" defaultValue={member.cessation_reason ?? ""} />
          </FormField>
        </div>
        <FormField label="Remark" htmlFor="stat-remark">
          <Textarea id="stat-remark" name="remark" defaultValue={member.remark ?? ""} />
        </FormField>
        {error && <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>}
        <ModalActions>
          <CancelButton onClick={onClose} />
          <SubmitButton loading={isPending}>Save Form I Details</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
