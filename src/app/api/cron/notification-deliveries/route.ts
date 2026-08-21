import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processNotificationDeliveryBatch } from "@/lib/notifications/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await processNotificationDeliveryBatch();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[notification-delivery-cron]", error);
    return NextResponse.json({ error: "Notification delivery failed" }, { status: 500 });
  }
}
