import { NextResponse } from "next/server";
import { Resend, type WebhookEventPayload } from "resend";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const statusByEvent: Record<string, "DELIVERED" | "BOUNCED" | "COMPLAINED" | "SUPPRESSED"> = {
  "email.delivered": "DELIVERED",
  "email.bounced": "BOUNCED",
  "email.complained": "COMPLAINED",
  "email.suppressed": "SUPPRESSED",
};

export async function POST(request: Request) {
  if (!env.RESEND_API_KEY || !env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }
  const payload = await request.text();
  let event: WebhookEventPayload;
  try {
    event = new Resend(env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const deliveryStatus = statusByEvent[event.type];
  if (!deliveryStatus || !("email_id" in event.data)) {
    return NextResponse.json({ received: true, tracked: false });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("record_notification_delivery_event" as never, {
    p_provider_message_id: event.data.email_id,
    p_event_status: deliveryStatus,
    p_event_id: request.headers.get("svix-id") ?? `${event.type}-${event.data.email_id}`,
    p_event_payload: JSON.parse(payload),
  } as never);
  if (error) {
    console.error("[resend-webhook]", error);
    return NextResponse.json({ error: "Unable to record webhook" }, { status: 500 });
  }
  return NextResponse.json({ received: true, tracked: Boolean(data) });
}
