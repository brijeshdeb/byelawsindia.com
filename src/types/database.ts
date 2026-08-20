/**
 * Database schema types for Supabase.
 *
 * These types mirror the PostgreSQL schema defined in supabase/migrations/.
 * When the schema changes, update these types to match.
 *
 * In production, generate these automatically with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 *
 * NOTE: All Insert/Update types are written as flat explicit literals (no Omit<Row, ...>
 * self-references). Self-referential types collapse to `never` under TypeScript's
 * recursion depth limits when the overall Database type is large.
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
      // ── profiles ──────────────────────────────────────────────────────────────
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
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          is_platform_admin?: boolean;
          mfa_enabled?: boolean;
          last_sign_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          is_platform_admin?: boolean;
          mfa_enabled?: boolean;
          last_sign_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };

      // ── login_activity ────────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          user_id: string;
          event_type: LoginEventType;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      // ── societies ─────────────────────────────────────────────────────────────
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
          environment_type: "CUSTOMER" | "DEMO" | "TEST";
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          registration_number: string;
          society_type: string;
          address: string;
          city: string;
          state: string;
          pin_code: string;
          email: string;
          phone: string;
          website?: string | null;
          pan?: string | null;
          gstin?: string | null;
          registered_at?: string;
          logo_url?: string | null;
          letterhead_url?: string | null;
          is_active?: boolean;
          environment_type?: "CUSTOMER" | "DEMO" | "TEST";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          registration_number?: string;
          society_type?: string;
          address?: string;
          city?: string;
          state?: string;
          pin_code?: string;
          email?: string;
          phone?: string;
          website?: string | null;
          pan?: string | null;
          gstin?: string | null;
          registered_at?: string;
          logo_url?: string | null;
          letterhead_url?: string | null;
          is_active?: boolean;
          environment_type?: "CUSTOMER" | "DEMO" | "TEST";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };

      // ── society_settings ──────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          society_id: string;
          application_number_pattern?: string;
          contract_number_pattern?: string;
          rfq_number_pattern?: string;
          work_order_number_pattern?: string;
          default_timezone?: string;
          allowed_mime_types?: string[];
          max_upload_size_bytes?: number;
          contract_reminder_days?: number[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          application_number_pattern?: string;
          contract_number_pattern?: string;
          rfq_number_pattern?: string;
          work_order_number_pattern?: string;
          default_timezone?: string;
          allowed_mime_types?: string[];
          max_upload_size_bytes?: number;
          contract_reminder_days?: number[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── society_officers ──────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          society_id: string;
          officer_type: OfficerType;
          member_id?: string | null;
          name: string;
          designation?: string | null;
          phone?: string | null;
          email?: string | null;
          is_signatory?: boolean;
          display_order?: number;
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          officer_type?: OfficerType;
          member_id?: string | null;
          name?: string;
          designation?: string | null;
          phone?: string | null;
          email?: string | null;
          is_signatory?: boolean;
          display_order?: number;
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── document_number_sequences ─────────────────────────────────────────────
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
        Insert: {
          id?: string;
          society_id: string;
          sequence_type: SequenceType;
          year: number;
          wing_code?: string | null;
          last_sequence?: number;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      // ── wings ─────────────────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          society_id: string;
          name: string;
          code: string;
          address?: string | null;
          total_units?: number | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          name?: string;
          code?: string;
          address?: string | null;
          total_units?: number | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── units ─────────────────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          society_id: string;
          wing_id: string;
          unit_number: string;
          floor?: number | null;
          unit_type?: UnitType | null;
          carpet_area_sqft?: number | null;
          built_up_area_sqft?: number | null;
          status?: UnitStatus;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          wing_id?: string;
          unit_number?: string;
          floor?: number | null;
          unit_type?: UnitType | null;
          carpet_area_sqft?: number | null;
          built_up_area_sqft?: number | null;
          status?: UnitStatus;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── roles ─────────────────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_system_role?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_system_role?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── permissions ───────────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          module: string;
          is_system_permission?: boolean;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      // ── role_permissions ──────────────────────────────────────────────────────
      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      // ── user_access_assignments ───────────────────────────────────────────────
      user_access_assignments: {
        Row: {
          id: string;
          user_id: string;
          society_id: string;
          wing_id: string | null;
          role_id: string;
          is_active: boolean;
          valid_from: string | null;
          valid_until: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          society_id: string;
          wing_id?: string | null;
          role_id: string;
          is_active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          society_id?: string;
          wing_id?: string | null;
          role_id?: string;
          is_active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── audit_logs ────────────────────────────────────────────────────────────
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
        Insert: {
          id?: string;
          society_id?: string | null;
          wing_id?: string | null;
          actor_user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      // ── members ───────────────────────────────────────────────────────────────
      members: {
        Row: {
          id: string;
          society_id: string;
          unit_id: string | null;
          member_number: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          occupation: string | null;
          age_at_admission: number | null;
          entrance_fee_paid_at: string | null;
          nominee_name_address: string | null;
          nomination_date: string | null;
          cessation_reason: string | null;
          remark: string | null;
          member_type: string;
          status: string;
          effective_from: string;
          effective_until: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          society_id: string;
          unit_id?: string | null;
          member_number: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          occupation?: string | null;
          age_at_admission?: number | null;
          entrance_fee_paid_at?: string | null;
          nominee_name_address?: string | null;
          nomination_date?: string | null;
          cessation_reason?: string | null;
          remark?: string | null;
          member_type?: string;
          status?: string;
          effective_from?: string;
          effective_until?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          society_id?: string;
          unit_id?: string | null;
          member_number?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          occupation?: string | null;
          age_at_admission?: number | null;
          entrance_fee_paid_at?: string | null;
          nominee_name_address?: string | null;
          nomination_date?: string | null;
          cessation_reason?: string | null;
          remark?: string | null;
          member_type?: string;
          status?: string;
          effective_from?: string;
          effective_until?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };

      // ── society_documents ─────────────────────────────────────────────────────
      society_documents: {
        Row: {
          id: string;
          society_id: string;
          title: string;
          category: string;
          description: string | null;
          file_name: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          storage_path: string | null;
          is_verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          id?: string;
          society_id: string;
          title: string;
          category?: string;
          description?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          storage_path?: string | null;
          is_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          id?: string;
          society_id?: string;
          title?: string;
          category?: string;
          description?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          storage_path?: string | null;
          is_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };

      // ── member_applications ───────────────────────────────────────────────────
      member_applications: {
        Row: {
          id: string;
          society_id: string;
          application_number: string;
          applicant_name: string;
          applicant_email: string | null;
          applicant_phone: string | null;
          unit_id: string | null;
          application_type: string;
          status: string;
          submitted_at: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          society_id: string;
          application_number: string;
          applicant_name: string;
          applicant_email?: string | null;
          applicant_phone?: string | null;
          unit_id?: string | null;
          application_type?: string;
          status?: string;
          submitted_at?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          society_id?: string;
          application_number?: string;
          applicant_name?: string;
          applicant_email?: string | null;
          applicant_phone?: string | null;
          unit_id?: string | null;
          application_type?: string;
          status?: string;
          submitted_at?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };

      // ── vendors ───────────────────────────────────────────────────────────────
      vendors: {
        Row: {
          id: string;
          society_id: string;
          vendor_code: string;
          name: string;
          vendor_type: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          gstin: string | null;
          pan: string | null;
          status: string;
          is_verified: boolean;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          society_id: string;
          vendor_code: string;
          name: string;
          vendor_type?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          gstin?: string | null;
          pan?: string | null;
          status?: string;
          is_verified?: boolean;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          society_id?: string;
          vendor_code?: string;
          name?: string;
          vendor_type?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          gstin?: string | null;
          pan?: string | null;
          status?: string;
          is_verified?: boolean;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };

      // ── maintenance_complaints ────────────────────────────────────────────────
      maintenance_complaints: {
        Row: {
          id: string;
          society_id: string;
          complaint_number: string;
          title: string;
          description: string | null;
          location: string | null;
          wing_id: string | null;
          unit_id: string | null;
          urgency: string;
          status: string;
          reported_by_member_id: string | null;
          assigned_to: string | null;
          resolved_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          society_id: string;
          complaint_number: string;
          title: string;
          description?: string | null;
          location?: string | null;
          wing_id?: string | null;
          unit_id?: string | null;
          urgency?: string;
          status?: string;
          reported_by_member_id?: string | null;
          assigned_to?: string | null;
          resolved_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          society_id?: string;
          complaint_number?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          wing_id?: string | null;
          unit_id?: string | null;
          urgency?: string;
          status?: string;
          reported_by_member_id?: string | null;
          assigned_to?: string | null;
          resolved_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };

      // ── maintenance_work_orders ───────────────────────────────────────────────
      maintenance_work_orders: {
        Row: {
          id: string;
          society_id: string;
          work_order_number: string;
          title: string;
          description: string | null;
          wing_id: string | null;
          priority: string;
          status: string;
          vendor_id: string | null;
          complaint_id: string | null;
          estimated_cost: number | null;
          actual_cost: number | null;
          scheduled_date: string | null;
          completed_at: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          work_order_number: string;
          title: string;
          description?: string | null;
          wing_id?: string | null;
          priority?: string;
          status?: string;
          vendor_id?: string | null;
          complaint_id?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          scheduled_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          work_order_number?: string;
          title?: string;
          description?: string | null;
          wing_id?: string | null;
          priority?: string;
          status?: string;
          vendor_id?: string | null;
          complaint_id?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          scheduled_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── rfqs ──────────────────────────────────────────────────────────────────
      rfqs: {
        Row: {
          id: string;
          society_id: string;
          rfq_number: string;
          title: string;
          description: string | null;
          category: string;
          status: string;
          submission_deadline: string | null;
          estimated_budget: number | null;
          notes: string | null;
          awarded_vendor: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          rfq_number: string;
          title: string;
          description?: string | null;
          category?: string;
          status?: string;
          submission_deadline?: string | null;
          estimated_budget?: number | null;
          notes?: string | null;
          awarded_vendor?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          rfq_number?: string;
          title?: string;
          description?: string | null;
          category?: string;
          status?: string;
          submission_deadline?: string | null;
          estimated_budget?: number | null;
          notes?: string | null;
          awarded_vendor?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── procurement_work_orders ───────────────────────────────────────────────
      procurement_work_orders: {
        Row: {
          id: string;
          society_id: string;
          work_order_number: string;
          title: string;
          vendor_id: string | null;
          rfq_id: string | null;
          contract_id: string | null;
          amount: number | null;
          status: string;
          start_date: string | null;
          completion_date: string | null;
          description: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          work_order_number: string;
          title: string;
          vendor_id?: string | null;
          rfq_id?: string | null;
          contract_id?: string | null;
          amount?: number | null;
          status?: string;
          start_date?: string | null;
          completion_date?: string | null;
          description?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          work_order_number?: string;
          title?: string;
          vendor_id?: string | null;
          rfq_id?: string | null;
          contract_id?: string | null;
          amount?: number | null;
          status?: string;
          start_date?: string | null;
          completion_date?: string | null;
          description?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── contracts ─────────────────────────────────────────────────────────────
      contracts: {
        Row: {
          id: string;
          society_id: string;
          contract_number: string;
          title: string;
          vendor_id: string | null;
          rfq_id: string | null;
          value: number | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          auto_renew: boolean;
          description: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          contract_number: string;
          title: string;
          vendor_id?: string | null;
          rfq_id?: string | null;
          value?: number | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          auto_renew?: boolean;
          description?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          contract_number?: string;
          title?: string;
          vendor_id?: string | null;
          rfq_id?: string | null;
          value?: number | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          auto_renew?: boolean;
          description?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── finance_dues ──────────────────────────────────────────────────────────
      finance_dues: {
        Row: {
          id: string;
          society_id: string;
          member_id: string | null;
          unit_id: string | null;
          due_type: string;
          description: string | null;
          amount: number;
          due_date: string;
          status: string;
          period_from: string | null;
          period_to: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          member_id?: string | null;
          unit_id?: string | null;
          due_type?: string;
          description?: string | null;
          amount: number;
          due_date: string;
          status?: string;
          period_from?: string | null;
          period_to?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          member_id?: string | null;
          unit_id?: string | null;
          due_type?: string;
          description?: string | null;
          amount?: number;
          due_date?: string;
          status?: string;
          period_from?: string | null;
          period_to?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── finance_payments ──────────────────────────────────────────────────────
      finance_payments: {
        Row: {
          id: string;
          society_id: string;
          due_id: string | null;
          payment_method: string;
          reference_number: string | null;
          amount_paid: number;
          payment_date: string;
          notes: string | null;
          recorded_by: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          due_id?: string | null;
          payment_method?: string;
          reference_number?: string | null;
          amount_paid: number;
          payment_date: string;
          notes?: string | null;
          recorded_by?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      form_register_snapshots: {
        Row: {
          id: string;
          version: number;
          society_id: string;
          form_type: "FORM_I" | "FORM_J";
          row_count: number;
          data: Json;
          generated_by: string;
          generated_at: string;
        };
        Insert: {
          id?: string;
          version?: never;
          society_id: string;
          form_type: "FORM_I" | "FORM_J";
          row_count: number;
          data: Json;
          generated_by: string;
          generated_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };

    Views: {};

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
      user_has_society_access: {
        Args: { p_society_id: string };
        Returns: boolean;
      };
      record_payment: {
        Args: {
          p_society_id:     string;
          p_due_id:         string;
          p_amount_paid:    number;
          p_payment_method: string;
          p_payment_date:   string;
          p_reference_no:   string | null;
          p_notes:          string | null;
          p_recorded_by:    string;
        };
        Returns: string;
      };
      reset_demo_society: {
        Args: { p_society_id: string };
        Returns: void;
      };
      register_society_with_admin: {
        Args: {
          p_name: string;
          p_registration_number: string;
          p_society_type: string;
          p_address: string;
          p_city: string;
          p_state: string;
          p_pin_code: string;
          p_email: string;
          p_phone: string;
          p_website: string | null;
          p_registered_at: string;
          p_admin_user_id: string;
          p_created_by: string;
        };
        Returns: string;
      };
    };

    Enums: {};

    CompositeTypes: {};
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
