import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { TemplatesClient } from "./TemplatesClient";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const { supabase, societyId } = await getServerContext();
  const { data } = await supabase.from("content_templates")
    .select("id, society_id, template_key, name, category, version, status, subject_template, body_template, variables, output_format, updated_at")
    .or(`society_id.is.null,society_id.eq.${societyId}`).order("template_key").order("version", { ascending: false });
  return <TemplatesClient templates={(data ?? []) as any} />;
}
