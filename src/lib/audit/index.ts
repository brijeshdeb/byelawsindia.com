/**
 * Audit service — server-side only.
 *
 * All audit writes go through this module. It uses the admin client
 * (service role) to ensure audit records are always written, regardless
 * of the current user's RLS context.
 *
 * The audit_logs table has no UPDATE or DELETE policy — records are
 * append-only and tamper-resistant for normal database users.
 *
 * Usage: import this only in server-side code (services, route handlers).
 * Never import in client components.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export type AuditAction =
  // Authentication
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  // User management
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DEACTIVATED"
  | "ACCESS_ASSIGNED"
  | "ACCESS_REVOKED"
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "PERMISSION_GRANTED"
  | "PERMISSION_REVOKED"
  // Member
  | "MEMBER_CREATED"
  | "MEMBER_UPDATED"
  | "MEMBER_ARCHIVED"
  | "NOMINATION_SUBMITTED"
  | "NOMINATION_DECIDED"
  | "ASSOCIATE_MEMBERSHIP_SUBMITTED"
  | "ASSOCIATE_MEMBERSHIP_DECIDED"
  // Application
  | "APPLICATION_CREATED"
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_DOCUMENT_UPLOADED"
  | "APPLICATION_FORM_DOWNLOADED"
  | "APPLICATION_CHECKLIST_UPDATED"
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_CORRECTION_REQUESTED"
  | "APPLICATION_RESUBMITTED"
  | "APPLICATION_CANCELLED"
  // Document
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_REPLACED"
  | "DOCUMENT_ACCESSED"
  | "DOCUMENT_VERIFIED"
  | "DOCUMENT_REJECTED"
  | "DOCUMENT_ARCHIVED"
  | "GENERATED_DOCUMENT_EXPORTED"
  // Vendor
  | "VENDOR_CREATED"
  | "VENDOR_UPDATED"
  | "VENDOR_VERIFIED"
  | "VENDOR_SUSPENDED"
  | "VENDOR_BLACKLISTED"
  | "VENDOR_USER_INVITED"
  | "VENDOR_USER_LINKED"
  | "VENDOR_USER_REVOKED"
  | "VENDOR_DOCUMENT_UPLOADED"
  | "VENDOR_DOCUMENT_REPLACED"
  | "VENDOR_DOCUMENT_VERIFIED"
  | "VENDOR_DOCUMENT_REJECTED"
  // Procurement
  | "RFQ_CREATED"
  | "RFQ_PUBLISHED"
  | "RFQ_INVITATIONS_SENT"
  | "RFQ_CLOSED"
  | "QUOTATION_SUBMITTED"
  | "QUOTATION_EVALUATED"
  | "VENDOR_SELECTED"
  | "VENDOR_PERFORMANCE_RECORDED"
  | "WORK_ORDER_CREATED"
  // Contract
  | "CONTRACT_CREATED"
  | "CONTRACT_APPROVED"
  | "CONTRACT_RENEWED"
  | "CONTRACT_TERMINATED"
  | "CONTRACT_REMINDER_SENT"
  | "CONTRACT_RENEWAL_INITIATED"
  | "REPORT_GENERATED"
  | "CONTRACT_RENEWAL_RESPONDED"
  | "CONTRACT_RENEWAL_DECIDED"
  // Finance
  | "DUE_CREATED"
  | "PAYMENT_RECORDED"
  | "PAYMENT_RECONCILED"
  | "PAYMENT_REFUNDED"
  // Reporting
  | "REPORT_EXPORTED"
  | "AUDIT_LOG_EXPORTED"
  // Administration
  | "SOCIETY_SETTINGS_UPDATED"
  | "WORKFLOW_DEFINITION_UPDATED"
  | "TEMPLATE_UPDATED"
  | "MASTER_DATA_UPDATED"
  | "SERVICE_REQUEST_CREATED"
  | "SERVICE_REQUEST_STATUS_CHANGED"
  | "DOCUMENT_GENERATED"
  // Platform
  | "PLATFORM_CONTEXT_SWITCHED"
  | "SOCIETY_REGISTERED"
  | "USER_INVITED"
  | "SOCIETY_ADMIN_INVITED"
  | "SOCIETY_ADMIN_ASSIGNED"
  | "STATUTORY_REGISTER_EXPORTED";

export interface AuditParams {
  societyId?: string | null;
  wingId?: string | null;
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Write an audit record.
 *
 * This function uses the service role client — it bypasses RLS on purpose
 * so that audit records are always written even when the user's own RLS
 * context is restricted.
 *
 * This function should never throw in production — audit failures must not
 * block the business operation. Errors are logged to stderr but not re-thrown.
 * For CRITICAL audit events (approvals, security events), use writeAuditCritical()
 * which does throw and forces the caller to handle the failure.
 */
export async function writeAudit(params: AuditParams): Promise<void> {
  try {
    await _writeAuditRecord(params);
  } catch (err) {
    // Audit must not fail the business operation.
    // But it must be visible in monitoring.
    console.error("[audit] Failed to write audit record:", {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Write a critical audit record that must succeed.
 *
 * Use for security-critical events: approval decisions, access changes,
 * document access. If the audit write fails, the caller SHOULD NOT
 * commit the business transaction.
 *
 * The typical pattern:
 *   await db.transaction(async (trx) => {
 *     await businessOperation(trx);
 *     await writeAuditCritical(params); // throws if audit fails
 *   });
 */
export async function writeAuditCritical(params: AuditParams): Promise<void> {
  await _writeAuditRecord(params);
}

async function _writeAuditRecord(params: AuditParams): Promise<void> {
  const admin = createAdminClient();

  const record: AuditLogInsert = {
    society_id: params.societyId ?? null,
    wing_id: params.wingId ?? null,
    actor_user_id: params.actorUserId ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_values: (params.oldValues ?? null) as Json | null,
    new_values: (params.newValues ?? null) as Json | null,
    metadata: (params.metadata ?? {}) as Json,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  };

  const { error } = await admin.from("audit_logs").insert(record);

  if (error) {
    throw new Error(`Audit write failed: ${error.message}`);
  }
}
