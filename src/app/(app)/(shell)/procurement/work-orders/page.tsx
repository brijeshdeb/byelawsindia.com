import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { ProcurementWorkOrdersClient } from "./ProcurementWorkOrdersClient";

export const metadata: Metadata = { title: "Work Orders" };

export default async function ProcurementWorkOrdersPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: ordersRaw }, { data: vendors }, { data: rfqs }] = await Promise.all([
    supabase
      .from("procurement_work_orders")
      .select("id, work_order_number, title, amount, status, start_date, completion_date, created_at, vendors(name)")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendors")
      .select("id, name")
      .eq("society_id", societyId)
      .eq("status", "ACTIVE")
      .order("name"),
    supabase
      .from("rfqs")
      .select("id, rfq_number, title")
      .eq("society_id", societyId)
      .in("status", ["AWARDED", "EVALUATION"])
      .order("rfq_number"),
  ]);

  const workOrders = (ordersRaw ?? []).map((o: any) => ({
    id: o.id,
    work_order_number: o.work_order_number,
    title: o.title,
    amount: o.amount,
    status: o.status,
    start_date: o.start_date,
    completion_date: o.completion_date,
    vendor_name: o.vendors?.name ?? null,
    created_at: o.created_at,
  }));

  return <ProcurementWorkOrdersClient workOrders={workOrders} vendors={vendors ?? []} rfqs={rfqs ?? []} />;
}
