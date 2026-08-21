"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { registerVendorAction, type VendorType } from "@/app/actions/vendors";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RegisterVendorModal({ open, onClose }: Props) {
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
      const result = await registerVendorAction({
        name: fd.get("name") as string,
        vendorType: fd.get("vendorType") as VendorType,
        contactName: (fd.get("contactName") as string) || undefined,
        email: (fd.get("email") as string) || undefined,
        phone: (fd.get("phone") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
        gstin: (fd.get("gstin") as string) || undefined,
        pan: (fd.get("pan") as string) || undefined,
        serviceAreas: String(fd.get("serviceAreas")??"").split(","),
        branchAvailability: (fd.get("branchAvailability") as string) || undefined,
        isPreferred: fd.get("isPreferred")==="on",
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
    <Modal open={open} onClose={handleClose} title="Register Vendor" description="Add a new vendor to the approved vendor list." maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Company / vendor name" htmlFor="name" required>
            <Input id="name" name="name" placeholder="e.g. Sharma Electricals" required />
          </FormField>
          <FormField label="Vendor type" htmlFor="vendorType" required>
            <Select id="vendorType" name="vendorType" required>
              <option value="CIVIL">Civil</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="SECURITY">Security</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="IT">IT</option>
              <option value="LANDSCAPING">Landscaping</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Contact person" htmlFor="contactName">
          <Input id="contactName" name="contactName" placeholder="e.g. Rajesh Sharma" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" placeholder="vendor@email.com" />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
          </FormField>
        </div>

        <FormField label="Address" htmlFor="address">
          <Input id="address" name="address" placeholder="Business address" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Service areas / wings" htmlFor="serviceAreas" hint="Comma-separated">
            <Input id="serviceAreas" name="serviceAreas" placeholder="Mumbai, Wing A, Wing B" />
          </FormField>
          <FormField label="Branch availability" htmlFor="branchAvailability">
            <Input id="branchAvailability" name="branchAvailability" placeholder="Mumbai office; 24x7 team" />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm text-[#D1D5DB]">
          <input name="isPreferred" type="checkbox" /> Preferred vendor
        </label>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="GSTIN" htmlFor="gstin" hint="15-character GST number">
            <Input id="gstin" name="gstin" placeholder="29AABCU9603R1Z2" maxLength={15} />
          </FormField>
          <FormField label="PAN" htmlFor="pan">
            <Input id="pan" name="pan" placeholder="AABCU9603R" maxLength={10} />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" placeholder="Any additional information..." />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Register Vendor</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
