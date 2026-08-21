"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { createApplicationAction, type ApplicationType } from "@/app/actions/applications";

interface Props {
  open: boolean;
  onClose: () => void;
  units: { id: string; unit_number: string; wing_name: string }[];
}

export function NewApplicationModal({ open, onClose, units }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [applicationType, setApplicationType] = useState<ApplicationType>("MEMBERSHIP");
  const [jointMembers, setJointMembers] = useState<Array<{key:string;fullName:string;relationship?:string;pan?:string;identityType?:"AADHAAR"|"PASSPORT"|"VOTER_ID"|"DRIVING_LICENCE"|"OTHER";identityNumber?:string;ownershipShare?:number}>>([]);

  function handleClose() {
    if (isPending) return;
    setError(null);
    setJointMembers([]);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createApplicationAction({
        applicantName: fd.get("applicantName") as string,
        fatherSpouseName: (fd.get("fatherSpouseName") as string) || undefined,
        applicantEmail: (fd.get("applicantEmail") as string) || undefined,
        applicantPhone: (fd.get("applicantPhone") as string) || undefined,
        dateOfBirth: (fd.get("dateOfBirth") as string) || undefined,
        pan: (fd.get("pan") as string) || undefined,
        identityType: ((fd.get("identityType") as string) || undefined) as "AADHAAR"|"PASSPORT"|"VOTER_ID"|"DRIVING_LICENCE"|"OTHER"|undefined,
        identityNumber: (fd.get("identityNumber") as string) || undefined,
        correspondenceAddress: (fd.get("correspondenceAddress") as string) || undefined,
        permanentAddress: (fd.get("permanentAddress") as string) || undefined,
        ownershipType: ((fd.get("ownershipType") as string) || undefined) as "SOLE"|"JOINT"|"ASSOCIATE"|"TENANT"|"OTHER"|undefined,
        ownershipDocumentNumber: (fd.get("ownershipDocumentNumber") as string) || undefined,
        ownershipDate: (fd.get("ownershipDate") as string) || undefined,
        shareCertificateNumber: (fd.get("shareCertificateNumber") as string) || undefined,
        sharesHeld: fd.get("sharesHeld") ? Number(fd.get("sharesHeld")) : undefined,
        jointMembers: applicationType === "MEMBERSHIP" ? jointMembers.map(({key: _key,...joint})=>joint) : undefined,
        unitId: (fd.get("unitId") as string) || undefined,
        applicationType,
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
    <Modal open={open} onClose={handleClose} title="New Application" description="Submit a new member application or NOC request.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Application type" htmlFor="applicationType" required>
          <Select id="applicationType" name="applicationType" required value={applicationType} onChange={(event)=>setApplicationType(event.target.value as ApplicationType)}>
            <option value="MEMBERSHIP">Membership</option>
            <option value="NOC_SALE">NOC - Sale</option>
            <option value="NOC_RENOVATION">NOC - Renovation</option>
            <option value="PARKING">Parking</option>
            <option value="NOMINATION">Nomination</option>
            <option value="ASSOCIATE_MEMBERSHIP">Associate membership</option>
            <option value="OTHER">Other</option>
          </Select>
        </FormField>

        <FormField label="Applicant name" htmlFor="applicantName" required>
          <Input id="applicantName" name="applicantName" placeholder="Full name" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="applicantEmail">
            <Input id="applicantEmail" name="applicantEmail" type="email" placeholder="applicant@email.com" />
          </FormField>
          <FormField label="Phone" htmlFor="applicantPhone">
            <Input id="applicantPhone" name="applicantPhone" type="tel" placeholder="+91 98765 43210" />
          </FormField>
        </div>

        <FormField label="Related unit" htmlFor="unitId">
          <Select id="unitId" name="unitId">
            <option value="">No unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.wing_name} - {u.unit_number}
              </option>
            ))}
          </Select>
        </FormField>

        {applicationType === "MEMBERSHIP" && (
          <section className="flex flex-col gap-4 border-t border-[#333] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Membership details</p>
            <FormField label="Father / spouse name" htmlFor="fatherSpouseName"><Input id="fatherSpouseName" name="fatherSpouseName" /></FormField>
            <div className="grid grid-cols-2 gap-4"><FormField label="Date of birth" htmlFor="dateOfBirth"><Input id="dateOfBirth" name="dateOfBirth" type="date" /></FormField><FormField label="PAN" htmlFor="pan"><Input id="pan" name="pan" maxLength={10} /></FormField></div>
            <div className="grid grid-cols-2 gap-4"><FormField label="Identity type" htmlFor="identityType"><Select id="identityType" name="identityType"><option value="">Not provided</option><option value="AADHAAR">Aadhaar</option><option value="PASSPORT">Passport</option><option value="VOTER_ID">Voter ID</option><option value="DRIVING_LICENCE">Driving licence</option><option value="OTHER">Other permitted ID</option></Select></FormField><FormField label="Identity number" htmlFor="identityNumber"><Input id="identityNumber" name="identityNumber" autoComplete="off" /></FormField></div>
            <p className="-mt-3 text-xs text-[#6B7280]">Only a masked value and non-reversible hash are retained.</p>
            <FormField label="Correspondence address" htmlFor="correspondenceAddress"><Textarea id="correspondenceAddress" name="correspondenceAddress" /></FormField>
            <FormField label="Permanent address" htmlFor="permanentAddress"><Textarea id="permanentAddress" name="permanentAddress" /></FormField>
            <div className="grid grid-cols-2 gap-4"><FormField label="Ownership" htmlFor="ownershipType"><Select id="ownershipType" name="ownershipType"><option value="">Not specified</option><option value="SOLE">Sole</option><option value="JOINT">Joint</option><option value="ASSOCIATE">Associate</option><option value="TENANT">Tenant</option><option value="OTHER">Other</option></Select></FormField><FormField label="Ownership date" htmlFor="ownershipDate"><Input id="ownershipDate" name="ownershipDate" type="date" /></FormField></div>
            <FormField label="Ownership document number" htmlFor="ownershipDocumentNumber"><Input id="ownershipDocumentNumber" name="ownershipDocumentNumber" /></FormField>
            <div className="grid grid-cols-2 gap-4"><FormField label="Share certificate" htmlFor="shareCertificateNumber"><Input id="shareCertificateNumber" name="shareCertificateNumber" /></FormField><FormField label="Shares held" htmlFor="sharesHeld"><Input id="sharesHeld" name="sharesHeld" type="number" min="0" step="0.001" /></FormField></div>
            <div className="flex items-center justify-between"><p className="text-sm font-medium text-text-primary">Joint members</p><button type="button" onClick={()=>setJointMembers((rows)=>[...rows,{key:crypto.randomUUID(),fullName:"",ownershipShare:0}])} className="rounded border border-[#444] px-3 py-1.5 text-xs text-[#D1D5DB]">Add joint member</button></div>
            {jointMembers.map((joint,index)=><div key={joint.key} className="space-y-3 rounded border border-[#333] p-3"><div className="flex justify-between"><p className="text-xs text-[#9CA3AF]">Joint member {index+1}</p><button type="button" className="text-xs text-[#EF4444]" onClick={()=>setJointMembers((rows)=>rows.filter((row)=>row.key!==joint.key))}>Remove</button></div><div className="grid grid-cols-2 gap-3"><Input aria-label={`Joint member ${index+1} name`} required placeholder="Full name" value={joint.fullName} onChange={(event)=>setJointMembers((rows)=>rows.map((row)=>row.key===joint.key?{...row,fullName:event.target.value}:row))}/><Input aria-label={`Joint member ${index+1} relationship`} placeholder="Relationship" value={joint.relationship??""} onChange={(event)=>setJointMembers((rows)=>rows.map((row)=>row.key===joint.key?{...row,relationship:event.target.value}:row))}/></div><div className="grid grid-cols-2 gap-3"><Input aria-label={`Joint member ${index+1} PAN`} placeholder="PAN" value={joint.pan??""} onChange={(event)=>setJointMembers((rows)=>rows.map((row)=>row.key===joint.key?{...row,pan:event.target.value}:row))}/><Input aria-label={`Joint member ${index+1} ownership share`} type="number" min="0" max="100" step="0.01" placeholder="Ownership %" value={joint.ownershipShare??""} onChange={(event)=>setJointMembers((rows)=>rows.map((row)=>row.key===joint.key?{...row,ownershipShare:event.target.value===""?undefined:Number(event.target.value)}:row))}/></div></div>)}
          </section>
        )}

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" placeholder="Additional context or requirements..." />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isPending}>Submit Application</SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
