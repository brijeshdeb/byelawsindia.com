"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { createApplicationAction, type ApplicationType } from "@/app/actions/applications";

interface Props {
  open: boolean;
  onClose: () => void;
  units: { id: string; unit_number: string; wing_name: string }[];
}

export function NewApplicationModal({ open, onClose, units }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (isPending) return;
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createApplicationAction({
        applicantName: fd.get("applicantName") as string,
        applicantEmail: (fd.get("applicantEmail") as string) || undefined,
        applicantPhone: (fd.get("applicantPhone") as string) || undefined,
        unitId: (fd.get("unitId") as string) || undefined,
        applicationType: fd.get("applicationType") as ApplicationType,
        notes: (fd.get("notes") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="New Application" description="Submit a new member application or NOC request.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Application type" htmlFor="applicationType" required>
          <Select id="applicationType" name="applicationType" required>
            <option value="MEMBERSHIP">Membership</option>
            <option value="NOC_SALE">NOC - Sale</option>
            <option value="NOC_RENOVATION">NOC - Renovation</option>
            <option value="PARKING">Parking</option>
            <option value="OTHER">Other</option>
          </Select>
        </FormField>

        <FormField label="Applicant name" htmlFor="applicantName" required>
          <Input id="applicantName" name="applicantName" placeholder="Full name" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="applicantEmail">
            <Input id="applicantEmail" name="applicantEmail" type="email" placeholder="applicant@email.com" />
          </FormField>
          <FormField label="Phone" htmlFor="applicantPhone">
            <Input id="applicantPhone" name="applicantPhone" type="tel" placeholder="+91 98765 43210" />
          </FormField>
        </div>

        <FormField label="Related unit" htmlFor="unitId">
          <Select id="unitId" name="unitId">
            <option value="">No unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.wing_name} - {u.unit_number}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" placeholder="Additional context or requirements..." />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Submit Application</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
