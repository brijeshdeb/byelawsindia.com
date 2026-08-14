"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { createRfqAction, type RfqCategory } from "@/app/actions/procurement";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewRfqModal({ open, onClose }: Props) {
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

    const budgetRaw = fd.get("estimatedBudget") as string;

    startTransition(async () => {
      const result = await createRfqAction({
        title: fd.get("title") as string,
        category: fd.get("category") as RfqCategory,
        description: fd.get("description") as string,
        estimatedBudget: budgetRaw ? parseFloat(budgetRaw) : undefined,
        submissionDeadline: (fd.get("submissionDeadline") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="New RFQ" description="Create a Request for Quotation from vendors." maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required>
          <Input id="title" name="title" placeholder="e.g. Annual housekeeping contract 2026-27" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" htmlFor="category" required>
            <Select id="category" name="category" required>
              <option value="CIVIL">Civil</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="SECURITY">Security</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="IT">IT</option>
              <option value="LANDSCAPING">Landscaping</option>
              <option value="GENERAL">General</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>
          <FormField label="Submission deadline" htmlFor="submissionDeadline">
            <Input id="submissionDeadline" name="submissionDeadline" type="date" />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description" required>
          <Textarea id="description" name="description" rows={4} placeholder="Detailed scope of work, requirements, and evaluation criteria..." required />
        </FormField>

        <FormField label="Estimated budget (INR)" htmlFor="estimatedBudget">
          <Input id="estimatedBudget" name="estimatedBudget" type="number" min="0" step="0.01" placeholder="Optional" />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} placeholder="Internal notes..." />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Create RFQ</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
