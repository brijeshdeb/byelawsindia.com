"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { addWingAction } from "@/app/actions/wings";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddWingModal({ open, onClose }: Props) {
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

    const totalUnitsRaw = fd.get("totalUnits") as string;

    startTransition(async () => {
      const result = await addWingAction({
        name: fd.get("name") as string,
        code: fd.get("code") as string,
        totalUnits: totalUnitsRaw ? parseInt(totalUnitsRaw, 10) : undefined,
        address: (fd.get("address") as string) || undefined,
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
    <Modal open={open} onClose={handleClose} title="Add Wing" description="Register a new wing or block in the society.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Wing name" htmlFor="name" required>
            <Input id="name" name="name" placeholder="e.g. Wing A" required />
          </FormField>
          <FormField label="Wing code" htmlFor="code" required hint="Short unique code, e.g. A, B, C">
            <Input id="code" name="code" placeholder="A" maxLength={10} required />
          </FormField>
        </div>

        <FormField label="Total units" htmlFor="totalUnits">
          <Input id="totalUnits" name="totalUnits" type="number" min="1" placeholder="e.g. 24" />
        </FormField>

        <FormField label="Address / Location" htmlFor="address">
          <Input id="address" name="address" placeholder="e.g. North block, near main gate" />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Add Wing</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
