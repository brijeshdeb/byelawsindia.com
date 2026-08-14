"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { createComplaintAction, type ComplaintUrgency } from "@/app/actions/maintenance";

interface Props {
  open: boolean;
  onClose: () => void;
  units?: { id: string; unit_number: string; wing_name: string }[];
}

export function NewComplaintModal({ open, onClose, units = [] }: Props) {
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
      const result = await createComplaintAction({
        title: fd.get("title") as string,
        description: fd.get("description") as string,
        urgency: fd.get("urgency") as ComplaintUrgency,
        location: (fd.get("location") as string) || undefined,
        unitId: (fd.get("unitId") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="New Complaint" description="Log a maintenance issue or complaint.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required hint="Brief description of the issue">
          <Input id="title" name="title" placeholder="e.g. Water leakage in corridor" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Urgency" htmlFor="urgency" required>
            <Select id="urgency" name="urgency" required>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </FormField>
          <FormField label="Location" htmlFor="location">
            <Input id="location" name="location" placeholder="e.g. Wing A, 3rd floor" />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description" required>
          <Textarea id="description" name="description" rows={4} placeholder="Describe the issue in detail..." required />
        </FormField>

        {units.length > 0 && (
          <FormField label="Related unit" htmlFor="unitId">
            <Select id="unitId" name="unitId">
              <option value="">Not unit-specific</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.wing_name} - {u.unit_number}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Log Complaint</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
