import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { WorkOrdersClient } from "./WorkOrdersClient";

export const metadata: Metadata = { title: "Work Orders" };

export default async function MaintenanceWorkOrdersPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: ordersRaw }, { data: vendors }] = await Promise.all([
    supabase
      .from("maintenance_work_orders")
      .select("id, title, priority, status, estimated_cost, scheduled_date, created_at, vendors(name)")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendors")
      .select("id, name, vendor_type")
      .eq("society_id", societyId)
      .eq("status", "ACTIVE")
      .order("name"),
  ]);

  const workOrders = (ordersRaw ?? []).map((o: any) => ({
    id: o.id,
    title: o.title,
    priority: o.priority,
    status: o.status,
    estimated_cost: o.estimated_cost,
    scheduled_date: o.scheduled_date,
    vendor_name: o.vendors?.name ?? null,
    created_at: o.created_at,
  }));

  return <WorkOrdersClient workOrders={workOrders} vendors={vendors ?? []} />;
}
