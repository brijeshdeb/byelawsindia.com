"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { revalidatePath } from "next/cache";

export type DocumentCategory =
  | "MINUTES"
  | "NOTICE"
  | "CIRCULAR"
  | "COMPLIANCE"
  | "FINANCIAL"
  | "LEGAL"
  | "OTHER";

export interface UploadDocumentInput {
  title: string;
  category: DocumentCategory;
  description?: string;
  // fileStoragePath is the path already uploaded to Supabase Storage.
  // Upload is handled client-side via supabase-js, then the path is passed here.
  fileStoragePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function uploadDocumentAction(
  input: UploadDocumentInput
): Promise<ActionResult<{ id: string; documentNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId } = await getServerContext();

    // Validate the storage path belongs to this society (path must start with societyId).
    if (!input.fileStoragePath.startsWith(`${societyId}/`)) {
      throw new Error("Invalid file storage path.");
    }

    // Generate a human-readable document number and store it in metadata.
    // The society_documents table uses metadata jsonb for this purpose.
    const documentNumber = await nextSequenceNumber(supabase, societyId, "DOCUMENT", "DOC");

    const { data, error } = await supabase
      .from("society_documents")
      .insert({
        society_id: societyId,
        title: input.title.trim(),
        category: input.category,
        description: input.description?.trim() || null,
        file_name: input.fileName,
        storage_path: input.fileStoragePath,
        file_size_bytes: input.fileSize,
        mime_type: input.mimeType,
        metadata: { document_number: documentNumber },
        uploaded_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/documents");
    return { id: data.id, documentNumber };
  });
}
