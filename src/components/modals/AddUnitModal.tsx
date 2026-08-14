"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { addUnitAction } from "@/app/actions/units";

interface Wing {
  id: string;
  name: string;
  code: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  wings: Wing[];
  preselectedWingId?: string;
}

export function AddUnitModal({ open, onClose, wings, preselectedWingId }: Props) {
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

    const floorRaw = fd.get("floor") as string;
    const carpetRaw = fd.get("carpetAreaSqft") as string;

    startTransition(async () => {
      const result = await addUnitAction({
        wingId: fd.get("wingId") as string,
        unitNumber: fd.get("unitNumber") as string,
        floor: floorRaw ? parseInt(floorRaw, 10) : undefined,
        unitType: fd.get("unitType") as "RESIDENTIAL" | "COMMERCIAL" | "PARKING" | "OTHER",
        carpetAreaSqft: carpetRaw ? parseFloat(carpetRaw) : undefined,
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
    <Modal open={open} onClose={handleClose} title="Add Unit" description="Register a new unit in the society.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Wing" htmlFor="wingId" required>
            <Select id="wingId" name="wingId" defaultValue={preselectedWingId ?? ""} required>
              <option value="" disabled>Select wing</option>
              {wings.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Unit number" htmlFor="unitNumber" required hint="e.g. 101, A-401">
            <Input id="unitNumber" name="unitNumber" placeholder="101" required />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Floor" htmlFor="floor">
            <Input id="floor" name="floor" type="number" placeholder="1" />
          </FormField>
          <FormField label="Unit type" htmlFor="unitType" required>
            <Select id="unitType" name="unitType" required>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="PARKING">Parking</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Carpet area (sq ft)" htmlFor="carpetAreaSqft">
          <Input id="carpetAreaSqft" name="carpetAreaSqft" type="number" min="0" step="0.01" placeholder="950" />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Add Unit</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
