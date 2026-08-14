"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { createProcurementWorkOrderAction } from "@/app/actions/procurement";

interface Props {
  open: boolean;
  onClose: () => void;
  vendors: { id: string; name: string }[];
  rfqs?: { id: string; rfq_number: string; title: string }[];
}

export function NewProcurementWorkOrderModal({ open, onClose, vendors, rfqs = [] }: Props) {
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
      const result = await createProcurementWorkOrderAction({
        title: fd.get("title") as string,
        vendorId: fd.get("vendorId") as string,
        rfqId: (fd.get("rfqId") as string) || undefined,
        amount: parseFloat(fd.get("amount") as string),
        description: fd.get("description") as string,
        startDate: (fd.get("startDate") as string) || undefined,
        completionDate: (fd.get("completionDate") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="New Work Order" description="Issue a procurement work order to a vendor." maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required>
          <Input id="title" name="title" placeholder="e.g. Terrace waterproofing - Phase 1" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Vendor" htmlFor="vendorId" required>
            <Select id="vendorId" name="vendorId" required>
              <option value="" disabled>Select vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Amount (INR)" htmlFor="amount" required>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description" required>
          <Textarea id="description" name="description" rows={3} placeholder="Scope of work..." required />
        </FormField>

        {rfqs.length > 0 && (
          <FormField label="Based on RFQ" htmlFor="rfqId">
            <Select id="rfqId" name="rfqId">
              <option value="">Not linked to an RFQ</option>
              {rfqs.map((r) => (
                <option key={r.id} value={r.id}>{r.rfq_number} - {r.title}</option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start date" htmlFor="startDate">
            <Input id="startDate" name="startDate" type="date" />
          </FormField>
          <FormField label="Completion date" htmlFor="completionDate">
            <Input id="completionDate" name="completionDate" type="date" />
          </FormField>
        </div>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Issue Work Order</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
