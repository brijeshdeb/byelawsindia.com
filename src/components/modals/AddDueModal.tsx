"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { createDueAction, type DueType } from "@/app/actions/finance";

interface Props {
  open: boolean;
  onClose: () => void;
  members: { id: string; full_name: string; member_number: string }[];
  units?: { id: string; unit_number: string; wing_name: string }[];
}

export function AddDueModal({ open, onClose, members, units = [] }: Props) {
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
      const result = await createDueAction({
        memberId: fd.get("memberId") as string,
        unitId: (fd.get("unitId") as string) || undefined,
        dueType: fd.get("dueType") as DueType,
        amount: parseFloat(fd.get("amount") as string),
        dueDate: fd.get("dueDate") as string,
        description: (fd.get("description") as string) || undefined,
        periodFrom: (fd.get("periodFrom") as string) || undefined,
        periodTo: (fd.get("periodTo") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="Add Due" description="Create a new payment due for a member." maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Member" htmlFor="memberId" required>
            <Select id="memberId" name="memberId" required>
              <option value="" disabled>Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Due type" htmlFor="dueType" required>
            <Select id="dueType" name="dueType" required>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="SPECIAL_LEVY">Special levy</option>
              <option value="PARKING">Parking</option>
              <option value="WATER">Water</option>
              <option value="SINKING_FUND">Sinking fund</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount (INR)" htmlFor="amount" required>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </FormField>
          <FormField label="Due date" htmlFor="dueDate" required>
            <Input id="dueDate" name="dueDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          </FormField>
        </div>

        {units.length > 0 && (
          <FormField label="Unit" htmlFor="unitId">
            <Select id="unitId" name="unitId">
              <option value="">No specific unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.wing_name} - {u.unit_number}</option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Period from" htmlFor="periodFrom">
            <Input id="periodFrom" name="periodFrom" type="date" />
          </FormField>
          <FormField label="Period to" htmlFor="periodTo">
            <Input id="periodTo" name="periodTo" type="date" />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description">
          <Input id="description" name="description" placeholder="e.g. Maintenance charges - April 2026" />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Add Due</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
