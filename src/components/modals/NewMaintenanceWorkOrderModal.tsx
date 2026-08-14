"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { createMaintenanceWorkOrderAction, type WorkOrderPriority } from "@/app/actions/maintenance";

interface Props {
  open: boolean;
  onClose: () => void;
  vendors: { id: string; name: string; vendor_type: string }[];
  complaints?: { id: string; title: string }[];
}

export function NewMaintenanceWorkOrderModal({ open, onClose, vendors, complaints = [] }: Props) {
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

    const costRaw = fd.get("estimatedCost") as string;

    startTransition(async () => {
      const result = await createMaintenanceWorkOrderAction({
        title: fd.get("title") as string,
        description: fd.get("description") as string,
        priority: fd.get("priority") as WorkOrderPriority,
        complaintId: (fd.get("complaintId") as string) || undefined,
        vendorId: (fd.get("vendorId") as string) || undefined,
        estimatedCost: costRaw ? parseFloat(costRaw) : undefined,
        scheduledDate: (fd.get("scheduledDate") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="New Work Order" description="Create a maintenance work order." maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required>
          <Input id="title" name="title" placeholder="e.g. Fix corridor lighting - Wing B" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Priority" htmlFor="priority" required>
            <Select id="priority" name="priority" required>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </FormField>
          <FormField label="Scheduled date" htmlFor="scheduledDate">
            <Input id="scheduledDate" name="scheduledDate" type="date" />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description" required>
          <Textarea id="description" name="description" rows={3} placeholder="Scope of work..." required />
        </FormField>

        {complaints.length > 0 && (
          <FormField label="Related complaint" htmlFor="complaintId">
            <Select id="complaintId" name="complaintId">
              <option value="">None</option>
              {complaints.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Assign vendor" htmlFor="vendorId">
            <Select id="vendorId" name="vendorId">
              <option value="">Not assigned</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Estimated cost (INR)" htmlFor="estimatedCost">
            <Input id="estimatedCost" name="estimatedCost" type="number" min="0" step="0.01" placeholder="0.00" />
          </FormField>
        </div>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Create Work Order</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
