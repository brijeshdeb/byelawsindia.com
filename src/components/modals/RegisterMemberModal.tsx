"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { registerMemberAction } from "@/app/actions/members";

interface Props {
  open: boolean;
  onClose: () => void;
  units: { id: string; unit_number: string; wing_name: string }[];
}

export function RegisterMemberModal({ open, onClose, units }: Props) {
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
      const result = await registerMemberAction({
        fullName: fd.get("fullName") as string,
        email: (fd.get("email") as string) || undefined,
        phone: (fd.get("phone") as string) || undefined,
        unitId: (fd.get("unitId") as string) || undefined,
        memberType: fd.get("memberType") as "OWNER" | "TENANT" | "ASSOCIATE" | "COMMITTEE",
        effectiveFrom: (fd.get("effectiveFrom") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="Register Member" description="Add a new member to the society registry.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Full name" htmlFor="fullName" required>
          <Input id="fullName" name="fullName" placeholder="e.g. Ramesh Iyer" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" placeholder="name@email.com" />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Member type" htmlFor="memberType" required>
            <Select id="memberType" name="memberType" required>
              <option value="OWNER">Owner</option>
              <option value="TENANT">Tenant</option>
              <option value="ASSOCIATE">Associate</option>
              <option value="COMMITTEE">Committee</option>
            </Select>
          </FormField>
          <FormField label="Unit" htmlFor="unitId">
            <Select id="unitId" name="unitId">
              <option value="">No unit assigned</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.wing_name} - {u.unit_number}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Effective from" htmlFor="effectiveFrom">
          <Input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" placeholder="Any additional notes..." />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Register Member</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
