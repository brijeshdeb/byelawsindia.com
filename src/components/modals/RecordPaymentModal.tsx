"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { recordPaymentAction, type PaymentMethod } from "@/app/actions/finance";

interface Due {
  id: string;
  due_type: string;
  amount: number;
  status: string;
  member_name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  dues: Due[];
  preselectedDueId?: string;
}

export function RecordPaymentModal({ open, onClose, dues, preselectedDueId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const unpaidDues = dues.filter((d) => d.status === "UNPAID" || d.status === "PARTIALLY_PAID");

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
      const result = await recordPaymentAction({
        dueId: fd.get("dueId") as string,
        amountPaid: parseFloat(fd.get("amountPaid") as string),
        paymentMethod: fd.get("paymentMethod") as PaymentMethod,
        paymentDate: fd.get("paymentDate") as string,
        referenceNumber: (fd.get("referenceNumber") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="Record Payment" description="Log a payment against an outstanding due.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Due" htmlFor="dueId" required>
          <Select id="dueId" name="dueId" defaultValue={preselectedDueId ?? ""} required>
            <option value="" disabled>Select due</option>
            {unpaidDues.map((d) => (
              <option key={d.id} value={d.id}>
                {d.member_name} - {d.due_type.replace("_", " ")} (INR {d.amount.toLocaleString("en-IN")})
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount paid (INR)" htmlFor="amountPaid" required>
            <Input id="amountPaid" name="amountPaid" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </FormField>
          <FormField label="Payment date" htmlFor="paymentDate" required>
            <Input id="paymentDate" name="paymentDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          </FormField>
        </div>

        <FormField label="Payment method" htmlFor="paymentMethod" required>
          <Select id="paymentMethod" name="paymentMethod" required>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="UPI">UPI</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="OTHER">Other</option>
          </Select>
        </FormField>

        <FormField label="Reference / transaction number" htmlFor="referenceNumber">
          <Input id="referenceNumber" name="referenceNumber" placeholder="UPI ref, cheque no., NEFT ref..." />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} placeholder="Any additional notes..." />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Record Payment</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
