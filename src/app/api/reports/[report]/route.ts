import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

import { getServerContext } from "@/lib/context";
import { writeAudit } from "@/lib/audit";
import { buildSimplePdf } from "@/lib/reports/simple-pdf";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReportData = {
  title: string;
  headers: string[];
  rows: unknown[][];
};

type ReportFormat = "csv" | "xlsx" | "html" | "pdf";

const REPORT_FORMATS = new Set<ReportFormat>(["csv", "xlsx", "html", "pdf"]);

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toCsv(rows: unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");
}

function toBlob(bytes: Uint8Array) {
  const copy = Uint8Array.from(bytes);
  return new Blob([copy.buffer]);
}

async function loadReport(
  db: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  societyId: string,
  key: string,
): Promise<ReportData> {
  if (key === "member-directory") {
    const { data, error } = await db
      .from("members")
      .select(
        "member_number,full_name,member_type,email,phone,status,effective_from,units(unit_number,wings(name))",
      )
      .eq("society_id", societyId)
      .order("member_number");
    if (error) throw error;
    return {
      title: "Member Directory",
      headers: [
        "Member No",
        "Name",
        "Unit",
        "Wing",
        "Type",
        "Email",
        "Phone",
        "Status",
        "Effective From",
      ],
      rows: (data ?? []).map((item) => {
        const unit = item.units as unknown as {
          unit_number: string | null;
          wings: { name: string | null } | null;
        } | null;
        return [
          item.member_number,
          item.full_name,
          unit?.unit_number,
          unit?.wings?.name,
          item.member_type,
          item.email,
          item.phone,
          item.status,
          item.effective_from,
        ];
      }),
    };
  }

  if (key === "outstanding-dues") {
    const [duesResult, paymentsResult, refundsResult] = await Promise.all([
      db
        .from("finance_dues")
        .select(
          "id,due_type,amount,waived_amount,due_date,status,members(member_number,full_name),units(unit_number)",
        )
        .eq("society_id", societyId)
        .in("status", ["UNPAID", "PARTIALLY_PAID"])
        .order("due_date"),
      db
        .from("finance_payments")
        .select("id,due_id,amount_paid")
        .eq("society_id", societyId),
      db
        .from("finance_refunds")
        .select("payment_id,amount,status")
        .eq("society_id", societyId)
        .eq("status", "COMPLETED"),
    ]);
    if (duesResult.error) throw duesResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (refundsResult.error) throw refundsResult.error;

    const refundedByPayment = new Map<string, number>();
    for (const refund of refundsResult.data ?? []) {
      refundedByPayment.set(
        refund.payment_id,
        (refundedByPayment.get(refund.payment_id) ?? 0) + Number(refund.amount),
      );
    }
    const netPaidByDue = new Map<string, number>();
    for (const payment of paymentsResult.data ?? []) {
      if (!payment.due_id) continue;
      netPaidByDue.set(
        payment.due_id,
        (netPaidByDue.get(payment.due_id) ?? 0) +
          Number(payment.amount_paid) -
          (refundedByPayment.get(payment.id) ?? 0),
      );
    }

    return {
      title: "Outstanding Dues",
      headers: [
        "Member No",
        "Member",
        "Unit",
        "Type",
        "Original Amount",
        "Paid",
        "Waived",
        "Outstanding",
        "Due Date",
        "Status",
      ],
      rows: (duesResult.data ?? []).map((item) => {
        const member = item.members as unknown as {
          member_number: string | null;
          full_name: string | null;
        } | null;
        const unit = item.units as unknown as { unit_number: string | null } | null;
        const paid = netPaidByDue.get(item.id) ?? 0;
        const waived = Number(item.waived_amount ?? 0);
        return [
          member?.member_number,
          member?.full_name,
          unit?.unit_number,
          item.due_type,
          item.amount,
          paid,
          waived,
          Math.max(0, Number(item.amount) - paid - waived),
          item.due_date,
          item.status,
        ];
      }),
    };
  }

  if (key === "monthly-collections") {
    const { data, error } = await db
      .from("finance_payments")
      .select(
        "receipt_number,payment_date,amount_paid,payment_method,reference_number,status,finance_dues(members(member_number,full_name))",
      )
      .eq("society_id", societyId)
      .order("payment_date", { ascending: false });
    if (error) throw error;
    return {
      title: "Collection Statement",
      headers: [
        "Receipt",
        "Date",
        "Member No",
        "Member",
        "Amount",
        "Method",
        "Reference",
        "Status",
      ],
      rows: (data ?? []).map((item) => {
        const due = item.finance_dues as unknown as {
          members: { member_number: string | null; full_name: string | null } | null;
        } | null;
        return [
          item.receipt_number,
          item.payment_date,
          due?.members?.member_number,
          due?.members?.full_name,
          item.amount_paid,
          item.payment_method,
          item.reference_number,
          item.status,
        ];
      }),
    };
  }

  if (key === "complaint-ageing") {
    const { data, error } = await db
      .from("maintenance_complaints")
      .select("complaint_number,title,urgency,status,location,assigned_to,created_at")
      .eq("society_id", societyId)
      .order("created_at");
    if (error) throw error;
    return {
      title: "Complaint Ageing",
      headers: [
        "Complaint",
        "Title",
        "Urgency",
        "Status",
        "Location",
        "Assigned",
        "Age Days",
      ],
      rows: (data ?? []).map((item) => [
        item.complaint_number,
        item.title,
        item.urgency,
        item.status,
        item.location,
        item.assigned_to,
        Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86_400_000),
      ]),
    };
  }

  if (key === "work-orders") {
    const { data, error } = await db
      .from("procurement_work_orders")
      .select(
        "work_order_number,title,amount,status,start_date,completion_date,vendors(name)",
      )
      .eq("society_id", societyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return {
      title: "Work Order Summary",
      headers: ["Work Order", "Title", "Vendor", "Amount", "Status", "Start", "Completion"],
      rows: (data ?? []).map((item) => {
        const vendor = item.vendors as unknown as { name: string | null } | null;
        return [
          item.work_order_number,
          item.title,
          vendor?.name,
          item.amount,
          item.status,
          item.start_date,
          item.completion_date,
        ];
      }),
    };
  }

  if (key === "vendor-spend") {
    const { data, error } = await db
      .from("procurement_work_orders")
      .select("amount,status,vendors(vendor_code,name,vendor_type)")
      .eq("society_id", societyId)
      .neq("status", "CANCELLED");
    if (error) throw error;

    const totals = new Map<
      string,
      { code: string; name: string; type: string; count: number; amount: number }
    >();
    for (const item of data ?? []) {
      const vendor = item.vendors as unknown as {
        vendor_code: string;
        name: string;
        vendor_type: string;
      } | null;
      if (!vendor) continue;
      const current = totals.get(vendor.vendor_code) ?? {
        code: vendor.vendor_code,
        name: vendor.name,
        type: vendor.vendor_type,
        count: 0,
        amount: 0,
      };
      current.count += 1;
      current.amount += Number(item.amount ?? 0);
      totals.set(vendor.vendor_code, current);
    }
    return {
      title: "Vendor Spend Analysis",
      headers: ["Vendor Code", "Vendor", "Category", "Orders", "Total Amount"],
      rows: [...totals.values()].map((item) => [
        item.code,
        item.name,
        item.type,
        item.count,
        item.amount,
      ]),
    };
  }

  if (key === "contracts") {
    const { data, error } = await db
      .from("contracts")
      .select("contract_number,title,value,status,start_date,end_date,auto_renew,vendors(name)")
      .eq("society_id", societyId)
      .order("end_date");
    if (error) throw error;
    return {
      title: "Contract Register",
      headers: ["Contract", "Title", "Vendor", "Value", "Status", "Start", "End", "Auto Renew"],
      rows: (data ?? []).map((item) => {
        const vendor = item.vendors as unknown as { name: string | null } | null;
        return [
          item.contract_number,
          item.title,
          vendor?.name,
          item.value,
          item.status,
          item.start_date,
          item.end_date,
          item.auto_renew ? "Yes" : "No",
        ];
      }),
    };
  }

  if (key === "applications") {
    const { data, error } = await db
      .from("member_applications")
      .select(
        "application_number,applicant_name,application_type,status,submitted_at,updated_at",
      )
      .eq("society_id", societyId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return {
      title: "Application Register",
      headers: ["Application", "Applicant", "Type", "Status", "Submitted", "Last Updated"],
      rows: (data ?? []).map((item) => [
        item.application_number,
        item.applicant_name,
        item.application_type,
        item.status,
        item.submitted_at,
        item.updated_at,
      ]),
    };
  }

  if (key === "audit-trail") {
    const { data, error } = await db
      .from("audit_logs")
      .select("created_at,action,entity_type,entity_id,actor_user_id")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    return {
      title: "Audit Trail",
      headers: ["Timestamp", "Action", "Entity", "Entity ID", "Actor"],
      rows: (data ?? []).map((item) => [
        item.created_at,
        item.action,
        item.entity_type,
        item.entity_id,
        item.actor_user_id,
      ]),
    };
  }

  throw new Error("Unknown report.");
}

function buildPrintableHtml(data: ReportData) {
  const rows = data.rows
    .map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.title)}</title><style>body{font:12px Arial;margin:28px;color:#111}h1{font-size:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:6px;text-align:left}th{background:#eee}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>${escapeHtml(data.title)}</h1><p>Generated ${new Date().toLocaleString("en-IN")}</p><table><thead><tr>${data.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    const { report } = await params;
    const { supabase, societyId, wingId, userId } = await getServerContext();
    const access = await resolveUserContext(societyId, wingId);
    requirePermission(access, PERMISSIONS.REPORT_VIEW);

    const requestedFormat = request.nextUrl.searchParams.get("format") ?? "pdf";
    if (!REPORT_FORMATS.has(requestedFormat as ReportFormat)) {
      return NextResponse.json({ error: "Unsupported report format." }, { status: 400 });
    }
    const format = requestedFormat as ReportFormat;
    const data = await loadReport(supabase, societyId, report);

    let body: string | Blob;
    let contentType: string;
    let extension: string;

    if (format === "csv") {
      body = toCsv([data.headers, ...data.rows]);
      contentType = "text/csv; charset=utf-8";
      extension = "csv";
    } else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(data.title.slice(0, 31));
      sheet.addRow(data.headers);
      for (const row of data.rows) sheet.addRow(row as ExcelJS.CellValue[]);
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.columns = data.headers.map((header) => ({
        width: Math.min(35, Math.max(12, header.length + 4)),
      }));
      const workbookBuffer = await workbook.xlsx.writeBuffer();
      const workbookBytes = Uint8Array.from(workbookBuffer as unknown as Uint8Array);
      body = toBlob(workbookBytes);
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      extension = "xlsx";
    } else if (format === "html") {
      body = buildPrintableHtml(data);
      contentType = "text/html; charset=utf-8";
      extension = "html";
    } else {
      body = toBlob(buildSimplePdf(data.title, data.headers, data.rows));
      contentType = "application/pdf";
      extension = "pdf";
    }

    await writeAudit({
      societyId,
      wingId,
      actorUserId: userId,
      action: "REPORT_GENERATED",
      entityType: "report",
      entityId: report,
      metadata: { format, rowCount: data.rows.length },
    });

    const safeBaseName = report.replace(/[^a-z0-9-]/g, "");
    return new NextResponse(body, {
      headers: {
        "content-type": contentType,
        "content-disposition":
          format === "html"
            ? "inline"
            : `attachment; filename="${safeBaseName}.${extension}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report generation failed." },
      { status: 400 },
    );
  }
}
