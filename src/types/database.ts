/**
 * Database schema types for Supabase.
 *
 * These types mirror the PostgreSQL schema defined in supabase/migrations/.
 * When the schema changes, update these types to match.
 *
 * In production, generate these automatically with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          is_platform_admin: boolean;
          mfa_enabled: boolean;
          last_sign_in_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["profiles"]["Row"],
              "created_at" | "updated_at"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };

      login_activity: {
        Row: {
          id: string;
          user_id: string;
          event_type: LoginEventType;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["login_activity"]["Row"],
          "id" | "created_at"
        >;
        Update: never; // Login activity is immutable
      };

      societies: {
        Row: {
          id: string;
          name: string;
          registration_number: string;
          society_type: string;
          address: string;
          city: string;
          state: string;
          pin_code: string;
          email: string;
          phone: string;
          website: string | null;
          pan: string | null;
          gstin: string | null;
          registered_at: string;
          logo_url: string | null;
          letterhead_url: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["societies"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["societies"]["Insert"]>;
      };

      society_settings: {
        Row: {
          id: string;
          society_id: string;
          application_number_pattern: string;
          contract_number_pattern: string;
          rfq_number_pattern: string;
          work_order_number_pattern: string;
          default_timezone: string;
          allowed_mime_types: string[];
          max_upload_size_bytes: number;
          contract_reminder_days: number[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["society_settings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["society_settings"]["Insert"]
        >;
      };

      society_officers: {
        Row: {
          id: string;
          society_id: string;
          officer_type: OfficerType;
          member_id: string | null;
          name: string;
          designation: string | null;
          phone: string | null;
          email: string | null;
          is_signatory: boolean;
          display_order: number;
          effective_from: string;
          effective_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["society_officers"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["society_officers"]["Insert"]
        >;
      };

      document_number_sequences: {
        Row: {
          id: string;
          society_id: string;
          sequence_type: SequenceType;
          year: number;
          wing_code: string | null;
          last_sequence: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["document_number_sequences"]["Row"],
          "id" | "created_at"
        >;
        Update: never; // Updated atomically via get_next_sequence() function
      };

      wings: {
        Row: {
          id: string;
          society_id: string;
          name: string;
          code: string;
          address: string | null;
          total_units: number | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["wings"]["Insert"]>;
      };

      units: {
        Row: {
          id: string;
          society_id: string;
          wing_id: string;
          unit_number: string;
          floor: number | null;
          unit_type: UnitType | null;
          carpet_area_sqft: number | null;
          built_up_area_sqft: number | null;
          status: UnitStatus;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["units"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
      };

      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_system_role: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["roles"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
      };

      permissions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          module: string;
          is_system_permission: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["permissions"]["Row"],
          "id" | "created_at"
        >;
        Update: never; // Permissions are system-defined; code changes break authorization
      };

      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["role_permissions"]["Row"],
          "id" | "created_at"
        >;
        Update: never;
      };

      user_access_assignments: {
        Row: {
          id: string;
          user_id: string;
          society_id: string;
          wing_id: string | null; // null = society-wide
          role_id: string;
          is_active: boolean;
          valid_from: string | null;
          valid_until: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_access_assignments"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["user_access_assignments"]["Insert"]
        >;
      };

      audit_logs: {
        Row: {
          id: string;
          society_id: string | null;
          wing_id: string | null;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["audit_logs"]["Row"],
          "id" | "created_at"
        >;
        Update: never; // Audit logs are immutable
      };
    };

    Functions: {
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_access_society: {
        Args: { p_society_id: string };
        Returns: boolean;
      };
      can_access_wing: {
        Args: { p_society_id: string; p_wing_id: string };
        Returns: boolean;
      };
      has_permission: {
        Args: {
          p_society_id: string;
          p_permission_code: string;
          p_wing_id?: string | null;
        };
        Returns: boolean;
      };
      get_next_sequence: {
        Args: {
          p_society_id: string;
          p_sequence_type: string;
          p_year: number;
          p_wing_code?: string | null;
        };
        Returns: number;
      };
    };

    Enums: Record<string, never>;
  };
};

// ── Domain enum types ─────────────────────────────────────────────────────────
export type LoginEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_RESET"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "ACCOUNT_LOCKED";

export type OfficerType =
  | "CHAIRMAN"
  | "SECRETARY"
  | "TREASURER"
  | "COMMITTEE_MEMBER"
  | "MANAGING_COMMITTEE";

export type SequenceType =
  | "MEMBER_APPLICATION"
  | "CONTRACT"
  | "RFQ"
  | "WORK_ORDER"
  | "SERVICE_REQUEST"
  | "QUOTATION";

export type UnitType = "RESIDENTIAL" | "COMMERCIAL" | "PARKING" | "OTHER";
export type UnitStatus = "OCCUPIED" | "VACANT" | "UNDER_TRANSFER" | "DISPUTED";
