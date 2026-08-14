import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { DocumentsClient } from "./DocumentsClient";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const { supabase, societyId } = await getServerContext();

  const { data: docs } = await supabase
    .from("society_documents")
    .select("id, title, category, description, file_size_bytes, mime_type, metadata, is_verified, created_at")
    .eq("society_id", societyId)
    .order("created_at", { ascending: false });

  return <DocumentsClient docs={docs ?? []} societyId={societyId} />;
}
