/**
 * Application domain types.
 *
 * These are the types used throughout the application layer.
 * They are deliberately separate from the raw database types
 * so that the service layer can shape data before it reaches components.
 */
import type {
  Database,
  LoginEventType,
  OfficerType,
  UnitType,
  UnitStatus,
} from "./database";

// ── Re-export raw DB row types for convenience ───────────────────────────────
export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbSociety = Database["public"]["Tables"]["societies"]["Row"];
export type DbWing = Database["public"]["Tables"]["wings"]["Row"];
export type DbUnit = Database["public"]["Tables"]["units"]["Row"];
export type DbRole = Database["public"]["Tables"]["roles"]["Row"];
export type DbPermission = Database["public"]["Tables"]["permissions"]["Row"];
export type DbUserAccessAssignment =
  Database["public"]["Tables"]["user_access_assignments"]["Row"];
export type DbAuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// Re-export enum types
export type { LoginEventType, OfficerType, UnitType, UnitStatus };

// ── User context ─────────────────────────────────────────────────────────────
/**
 * The resolved context of the currently authenticated user.
 * This is computed from user_access_assignments and permissions,
 * and is the primary authorization object passed through the app.
 *
 * It answers the question: "Who is this user, and what are they allowed
 * to do right now, in which society, in which wing?"
 */
export interface UserContext {
  /** The authenticated user's profile ID (auth.uid()) */
  userId: string;
  /** The selected society for this session */
  societyId: string;
  societyName: string;
  /** The selected wing, if the user's assignment is wing-scoped */
  wingId: string | null;
  wingName: string | null;
  wingCode: string | null;
  /** The user's role in this context */
  roleId: string;
  roleName: string;
  /** Flat set of permission codes. Check with hasPermission(). */
  permissions: Set<string>;
  /** True if this user is a platform administrator */
  isPlatformAdmin: boolean;
  /** The society's environment classification */
  environmentType: "CUSTOMER" | "DEMO" | "TEST";
  /** Full profile data */
  profile: DbProfile;
}

/**
 * An access option shown in the context selector.
 * One option per active user_access_assignment.
 */
export interface AccessOption {
  assignmentId: string;
  societyId: string;
  societyName: string;
  societyLogoUrl: string | null;
  wingId: string | null;
  wingName: string | null;
  wingCode: string | null;
  roleId: string;
  roleName: string;
}

// ── Permission codes ─────────────────────────────────────────────────────────
/**
 * All permission codes used in the application.
 * These must match the `code` column in the `permissions` table exactly.
 * Centralizing them here ensures type-safety and makes refactoring safe.
 */
export const PERMISSIONS = {
  // Society
  SOCIETY_READ: "society.read",
  SOCIETY_UPDATE: "society.update",

  // Wings
  WING_READ: "wing.read",
  WING_MANAGE: "wing.manage",

  // Members
  MEMBER_READ: "member.read",
  MEMBER_CREATE: "member.create",
  MEMBER_UPDATE: "member.update",
  MEMBER_ARCHIVE: "member.archive",

  // Applications
  APPLICATION_READ: "application.read",
  APPLICATION_CREATE: "application.create",
  APPLICATION_SUBMIT: "application.submit",
  APPLICATION_VERIFY: "application.verify",
  APPLICATION_APPROVE_LEVEL1: "application.approve.level1",
  APPLICATION_APPROVE_LEVEL2: "application.approve.level2",
  APPLICATION_APPROVE_FINAL: "application.approve.final",

  // Documents
  DOCUMENT_READ: "document.read",
  DOCUMENT_UPLOAD: "document.upload",
  DOCUMENT_VERIFY: "document.verify",
  DOCUMENT_REPLACE: "document.replace",
  DOCUMENT_ARCHIVE: "document.archive",

  // Nominations
  NOMINATION_READ: "nomination.read",
  NOMINATION_MANAGE: "nomination.manage",

  // Associate members
  ASSOCIATE_MEMBER_READ: "associate_member.read",
  ASSOCIATE_MEMBER_MANAGE: "associate_member.manage",

  // Service requests
  SERVICE_REQUEST_READ: "service_request.read",
  SERVICE_REQUEST_CREATE: "service_request.create",
  SERVICE_REQUEST_PROCESS: "service_request.process",
  SERVICE_REQUEST_APPROVE: "service_request.approve",

  // Vendors
  VENDOR_READ: "vendor.read",
  VENDOR_CREATE: "vendor.create",
  VENDOR_UPDATE: "vendor.update",
  VENDOR_VERIFY: "vendor.verify",
  VENDOR_PORTAL: "vendor.portal",
  VENDOR_PERFORMANCE_MANAGE: "vendor.performance.manage",

  // RFQ
  RFQ_READ: "rfq.read",
  RFQ_CREATE: "rfq.create",
  RFQ_PUBLISH: "rfq.publish",
  RFQ_EVALUATE: "rfq.evaluate",

  // Quotations
  QUOTATION_READ: "quotation.read",
  QUOTATION_EVALUATE: "quotation.evaluate",
  QUOTATION_COMPARE: "quotation.compare",
  QUOTATION_CREATE: "quotation.create",
  QUOTATION_SUBMIT: "quotation.submit",

  // Vendor selection
  VENDOR_SELECTION_RECOMMEND: "vendor_selection.recommend",
  VENDOR_SELECTION_APPROVE: "vendor_selection.approve",
  VENDOR_SELECTION_APPROVE_LEVEL1: "vendor_selection.approve.level1",
  VENDOR_SELECTION_APPROVE_LEVEL2: "vendor_selection.approve.level2",
  VENDOR_SELECTION_APPROVE_FINAL: "vendor_selection.approve.final",

  // Work orders
  WORK_ORDER_CREATE: "work_order.create",
  WORK_ORDER_APPROVE: "work_order.approve",

  // Contracts
  CONTRACT_READ: "contract.read",
  CONTRACT_CREATE: "contract.create",
  CONTRACT_UPDATE: "contract.update",
  CONTRACT_APPROVE: "contract.approve",
  CONTRACT_RENEW: "contract.renew",
  CONTRACT_TERMINATE: "contract.terminate",
  CONTRACT_RENEWAL_MANAGE: "contract.renewal.manage",

  // Maintenance / facilities
  MAINTENANCE_VIEW: "maintenance.view",
  MAINTENANCE_MANAGE: "maintenance.manage",

  // Finance
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  FINANCE_DUES_MANAGE: "finance.dues.manage",
  FINANCE_PAYMENT_RECORD: "finance.payment.record",
  FINANCE_PAYMENT_RECONCILE: "finance.payment.reconcile",
  FINANCE_PAYMENT_REFUND: "finance.payment.refund",
  FINANCE_DUE_WAIVE: "finance.due.waive",
  FINANCE_SETTINGS_MANAGE: "finance.settings.manage",
  FINANCE_ADJUSTMENT_APPROVE: "finance.adjustment.approve",

  // RFQ approval (separate from rfq.publish)
  RFQ_APPROVE: "rfq.approve",

  // Reports
  REPORT_VIEW: "report.view",
  REPORT_MEMBER: "report.member",
  REPORT_VENDOR: "report.vendor",
  REPORT_CONTRACT: "report.contract",
  REPORT_PROCUREMENT: "report.procurement",
  REPORT_AUDIT: "report.audit",
  AUDIT_LOG_VIEW: "audit.log.view",

  // Audit
  AUDIT_READ: "audit.read",

  // Administration
  ADMIN_USERS: "admin.users",
  ADMIN_ROLES: "admin.roles",
  ADMIN_PERMISSIONS: "admin.permissions",
  ADMIN_MASTER_DATA: "admin.master_data",
  ADMIN_TEMPLATES: "admin.templates",
  ADMIN_SETTINGS: "admin.settings",

  // Aliases used in the navigation tree and permission checks
  MEMBER_VIEW: "member.read",
  APPLICATION_VIEW: "application.read",
  DOCUMENT_VIEW: "document.read",
  VENDOR_VIEW: "vendor.read",
  VENDOR_MANAGE: "vendor.manage",
  RFQ_VIEW: "rfq.read",
  CONTRACT_VIEW: "contract.read",
  SOCIETY_SETTINGS_MANAGE: "admin.settings",
  USER_MANAGE: "admin.users",
  ROLE_MANAGE: "admin.roles",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Navigation types ─────────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  permission?: PermissionCode;
  badge?: number;
  children?: NavItem[];
}

export interface NavGroup {
  label?: string; // undefined = ungrouped (Dashboard)
  items: NavItem[];
}

// ── Application error types ───────────────────────────────────────────────────
export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "WORKFLOW_STATE_ERROR"
  | "FILE_REJECTED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static unauthorized(message = "Authentication required") {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "You don't have permission to perform this action") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(entity: string, id?: string) {
    const msg = id ? `${entity} '${id}' not found` : `${entity} not found`;
    return new AppError("NOT_FOUND", msg, 404);
  }

  static conflict(message: string) {
    return new AppError("CONFLICT", message, 409);
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new AppError("VALIDATION_ERROR", message, 422, details);
  }

  static workflowState(message: string) {
    return new AppError("WORKFLOW_STATE_ERROR", message, 409);
  }

  static fileRejected(reason: string) {
    return new AppError("FILE_REJECTED", reason, 422);
  }

  static rateLimited() {
    return new AppError("RATE_LIMITED", "Too many requests. Please wait before trying again.", 429);
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationParams {
  page: number;
  pageSize: 25 | 50 | 100;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── API response envelope ─────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  code: AppErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
