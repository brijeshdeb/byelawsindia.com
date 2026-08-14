"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal, FormField, Input, Select, Textarea, ModalActions, CancelButton, SubmitButton } from "@/components/ui/Modal";
import { uploadDocumentAction, type DocumentCategory } from "@/app/actions/documents";

interface Props {
  open: boolean;
  onClose: () => void;
  societyId: string;
}

export function UploadDocumentModal({ open, onClose, societyId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLoading = isPending || uploading;

  function handleClose() {
    if (isLoading) return;
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be 20 MB or less.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "bin";
      // Use a generated path — never raw filenames (Rule 13)
      const storagePath = `${societyId}/documents/${crypto.randomUUID()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("society-documents")
        .upload(storagePath, file, { upsert: false });

      if (storageError) {
        setError(`Upload failed: ${storageError.message}`);
        setUploading(false);
        return;
      }

      setUploading(false);

      startTransition(async () => {
        const result = await uploadDocumentAction({
          title: fd.get("title") as string,
          category: fd.get("category") as DocumentCategory,
          description: (fd.get("description") as string) || undefined,
          fileStoragePath: storagePath,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        if (!result.success) {
          // Clean up uploaded file on action failure
          await supabase.storage.from("society-documents").remove([storagePath]);
          setError(result.error);
          return;
        }

        router.refresh();
        handleClose();
      });
    } catch {
      setUploading(false);
      setError("An unexpected error occurred during upload.");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload Document" description="Add a document to the society document library.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required>
          <Input id="title" name="title" placeholder="e.g. AGM Minutes - April 2026" required />
        </FormField>

        <FormField label="Category" htmlFor="category" required>
          <Select id="category" name="category" required>
            <option value="MINUTES">Minutes</option>
            <option value="NOTICE">Notice</option>
            <option value="CIRCULAR">Circular</option>
            <option value="COMPLIANCE">Compliance</option>
            <option value="FINANCIAL">Financial</option>
            <option value="LEGAL">Legal</option>
            <option value="OTHER">Other</option>
          </Select>
        </FormField>

        <FormField label="File" htmlFor="file" required hint="PDF, DOC, DOCX, XLS, XLSX, PNG, JPG - max 20 MB">
          <input
            id="file"
            name="file"
            type="file"
            ref={fileRef}
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            style={{
              backgroundColor: "#121212",
              border: "1px solid #333333",
              borderRadius: "6px",
              color: "#9CA3AF",
              fontSize: "14px",
              padding: "8px 12px",
              width: "100%",
            }}
          />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" rows={2} placeholder="Brief summary of the document..." />
        </FormField>

        {error && (
          <p className="text-sm p-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </p>
        )}

        <ModalActions>
          <CancelButton onClick={handleClose} />
          <SubmitButton loading={isLoading}>
            {uploading ? "Uploading..." : "Upload Document"}
          </SubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
