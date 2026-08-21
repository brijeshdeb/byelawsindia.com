import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { DocumentsClient } from "./DocumentsClient";
import { resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const { supabase, societyId, wingId } = await getServerContext();
  const context=await resolveUserContext(societyId,wingId);

  const { data: docs } = await supabase
    .from("society_documents")
    .select("id, document_number, title, category, description, file_size_bytes, mime_type, metadata, is_verified, status, version, expires_on, classification, rejection_reason, created_at")
    .eq("society_id", societyId)
    .order("created_at", { ascending: false });

  return <DocumentsClient docs={docs ?? []} societyId={societyId}
    canUpload={context.isPlatformAdmin||context.permissions.has(PERMISSIONS.DOCUMENT_UPLOAD)}
    canReview={!context.isPlatformAdmin&&context.roleName==="Society Admin"&&!context.wingId&&context.permissions.has(PERMISSIONS.DOCUMENT_VERIFY)} />;
}
