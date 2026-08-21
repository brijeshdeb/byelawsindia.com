import { getServerContext } from "@/lib/context";
import { writeAudit } from "@/lib/audit";

function esc(value: unknown): string { return String(value ?? "—").replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]!)); }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { supabase, societyId, userId } = await getServerContext();
  const [{ data: payment }, { data: society }, { data: refunds }] = await Promise.all([
    supabase.from("finance_payments").select("id, receipt_number, amount_paid, payment_method, payment_date, reference_number, notes, status, finance_dues(due_type, description, members(full_name), units(unit_number))").eq("id",id).eq("society_id",societyId).single(),
    supabase.from("societies").select("name, registration_number, address, city, state, pin_code").eq("id",societyId).single(),
    supabase.from("finance_refunds").select("amount").eq("payment_id",id).eq("status","COMPLETED"),
  ]);
  if(!payment||!society) return new Response("Receipt not found",{status:404});
  const relation=payment.finance_dues as any; const refunded=(refunds??[]).reduce((sum,row)=>sum+row.amount,0);
  await writeAudit({societyId,actorUserId:userId,action:"DOCUMENT_ACCESSED",entityType:"payment_receipt",entityId:id,metadata:{receiptNumber:payment.receipt_number}});
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(payment.receipt_number)}</title><style>body{font:14px Arial;color:#111;max-width:760px;margin:40px auto;padding:28px;border:1px solid #bbb}h1{font-size:24px;margin:0}.muted{color:#666}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:10px 0}.total{font-size:20px;font-weight:bold}.actions{margin-top:24px}@media print{.actions{display:none}body{border:0;margin:0}}</style></head><body><h1>${esc(society.name)}</h1><p class="muted">${esc(society.registration_number)} · ${esc(society.address)}, ${esc(society.city)} ${esc(society.pin_code)}</p><hr><h2>Payment Receipt</h2><div class="row"><span>Receipt number</span><strong>${esc(payment.receipt_number)}</strong></div><div class="row"><span>Member</span><strong>${esc(relation?.members?.full_name)}</strong></div><div class="row"><span>Unit</span><strong>${esc(relation?.units?.unit_number)}</strong></div><div class="row"><span>Due type</span><strong>${esc(relation?.due_type)}</strong></div><div class="row"><span>Payment date</span><strong>${esc(new Date(payment.payment_date).toLocaleDateString("en-IN"))}</strong></div><div class="row"><span>Method / reference</span><strong>${esc(payment.payment_method)} / ${esc(payment.reference_number)}</strong></div><div class="row total"><span>Amount received</span><span>INR ${Number(payment.amount_paid).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>${refunded>0?`<div class="row"><span>Refunded</span><strong>INR ${refunded.toLocaleString("en-IN",{minimumFractionDigits:2})}</strong></div>`:""}<p class="muted">Computer-generated receipt. Payment status: ${esc(payment.status)}.</p><div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div></body></html>`;
  return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","content-disposition":`inline; filename="${payment.receipt_number}.html"`,"cache-control":"private, no-store"}});
}
