import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { VendorsClient } from "./VendorsClient";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const { supabase, societyId } = await getServerContext();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, vendor_code, name, vendor_type, contact_name, email, phone, status, is_verified")
    .eq("society_id", societyId)
    .order("vendor_code", { ascending: true });

  return <VendorsClient vendors={vendors ?? []} />;
}
