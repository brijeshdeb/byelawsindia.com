import "server-only";

import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type ClaimedDelivery = {
  id: string;
  notification_id: string;
  society_id: string;
  recipient: string;
  subject: string;
  text_body: string;
  action_url: string | null;
  idempotency_key: string;
  attempt_count: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function absoluteActionUrl(actionUrl: string | null) {
  if (!actionUrl) return null;
  try {
    return new URL(actionUrl, env.NEXT_PUBLIC_APP_URL).toString();
  } catch {
    return null;
  }
}

function emailHtml(delivery: ClaimedDelivery) {
  const actionUrl = absoluteActionUrl(delivery.action_url);
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#171717"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px"><p style="margin:0 0 8px;color:#059669;font-size:13px;font-weight:700">BYELAWSINDIA</p><h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(delivery.subject)}</h1><p style="margin:0;line-height:1.6;color:#4b5563">${escapeHtml(delivery.text_body).replace(/\n/g, "<br>")}</p>${actionUrl ? `<p style="margin:24px 0 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;border-radius:7px;padding:11px 16px;font-weight:700">Open in ByelawsIndia</a></p>` : ""}<p style="margin:24px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;color:#9ca3af;font-size:12px">This is an automated society workflow notification.</p></div></div></body></html>`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 2000);
  try { return JSON.stringify(error).slice(0, 2000); } catch { return "Unknown email provider error"; }
}

export async function processNotificationDeliveryBatch(batchSize = 20) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return { configured: false, claimed: 0, sent: 0, failed: 0 };
  }

  const admin = createAdminClient();
  const resend = new Resend(env.RESEND_API_KEY);
  const workerId = `notification-cron-${randomUUID()}`;
  const { data, error } = await admin.rpc("claim_notification_deliveries" as never, {
    p_batch_size: batchSize,
    p_worker_id: workerId,
  } as never);
  if (error) throw new Error(`Unable to claim notification deliveries: ${error.message}`);
  const deliveries = (data ?? []) as unknown as ClaimedDelivery[];
  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    try {
      const { data: providerData, error: providerError } = await resend.emails.send({
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
        to: delivery.recipient,
        subject: delivery.subject,
        text: delivery.text_body,
        html: emailHtml(delivery),
      }, { idempotencyKey: delivery.idempotency_key });
      if (providerError || !providerData?.id) throw new Error(errorMessage(providerError));
      const { error: completeError } = await admin.rpc("complete_notification_delivery" as never, {
        p_delivery_id: delivery.id,
        p_succeeded: true,
        p_provider: "RESEND",
        p_provider_message_id: providerData.id,
        p_error: null,
        p_worker_id: workerId,
      } as never);
      if (completeError) throw new Error(completeError.message);
      sent += 1;
    } catch (error) {
      failed += 1;
      await admin.rpc("complete_notification_delivery" as never, {
        p_delivery_id: delivery.id,
        p_succeeded: false,
        p_provider: "RESEND",
        p_provider_message_id: null,
        p_error: errorMessage(error),
        p_worker_id: workerId,
      } as never);
    }
  }

  return { configured: true, claimed: deliveries.length, sent, failed };
}
