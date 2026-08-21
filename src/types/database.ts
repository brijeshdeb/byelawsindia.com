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
          default_approval_workflow_id: string | null;
          notification_preferences: Json;
          configuration_completed_at: string | null;
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
          default_approval_workflow_id?: string | null;
          notification_preferences?: Json;
          configuration_completed_at?: string | null;
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
          default_approval_workflow_id?: string | null;
          notification_preferences?: Json;
          configuration_completed_at?: string | null;
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
          father_spouse_name: string | null;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          pan: string | null;
          identity_type: string | null;
          identity_number_masked: string | null;
          identity_number_hash: string | null;
          correspondence_address: string | null;
          permanent_address: string | null;
          address: string | null;
          ownership_type: string | null;
          ownership_document_number: string | null;
          ownership_date: string | null;
          share_certificate_number: string | null;
          shares_held: number | null;
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
          father_spouse_name?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          pan?: string | null;
          identity_type?: string | null;
          identity_number_masked?: string | null;
          identity_number_hash?: string | null;
          correspondence_address?: string | null;
          permanent_address?: string | null;
          address?: string | null;
          ownership_type?: string | null;
          ownership_document_number?: string | null;
          ownership_date?: string | null;
          share_certificate_number?: string | null;
          shares_held?: number | null;
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
          father_spouse_name?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          pan?: string | null;
          identity_type?: string | null;
          identity_number_masked?: string | null;
          identity_number_hash?: string | null;
          correspondence_address?: string | null;
          permanent_address?: string | null;
          address?: string | null;
          ownership_type?: string | null;
          ownership_document_number?: string | null;
          ownership_date?: string | null;
          share_certificate_number?: string | null;
          shares_held?: number | null;
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

      joint_members: {
        Row: { id:string;society_id:string;member_id:string;full_name:string;father_spouse_name:string|null;relationship:string|null;date_of_birth:string|null;email:string|null;phone:string|null;pan:string|null;identity_type:string|null;identity_number_masked:string|null;identity_number_hash:string|null;ownership_share:number|null;position:number;status:string;effective_from:string;effective_until:string|null;created_by:string|null;created_at:string;updated_at:string };
        Insert: { id?:string;society_id:string;member_id:string;full_name:string;father_spouse_name?:string|null;relationship?:string|null;date_of_birth?:string|null;email?:string|null;phone?:string|null;pan?:string|null;identity_type?:string|null;identity_number_masked?:string|null;identity_number_hash?:string|null;ownership_share?:number|null;position?:number;status?:string;effective_from?:string;effective_until?:string|null;created_by?:string|null;created_at?:string;updated_at?:string };
        Update: { full_name?:string;father_spouse_name?:string|null;relationship?:string|null;date_of_birth?:string|null;email?:string|null;phone?:string|null;pan?:string|null;identity_type?:string|null;identity_number_masked?:string|null;identity_number_hash?:string|null;ownership_share?:number|null;position?:number;status?:string;effective_from?:string;effective_until?:string|null;updated_at?:string };
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
          document_number: string;
          status: string;
          version: number;
          expires_on: string | null;
          wing_id: string | null;
          replaces_document_id: string | null;
          rejection_reason: string | null;
          classification: string;
          checksum_sha256: string | null;
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
          document_number?: string;
          status?: string;
          version?: number;
          expires_on?: string | null;
          wing_id?: string | null;
          replaces_document_id?: string | null;
          rejection_reason?: string | null;
          classification?: string;
          checksum_sha256?: string | null;
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
          document_number?: string;
          status?: string;
          version?: number;
          expires_on?: string | null;
          wing_id?: string | null;
          replaces_document_id?: string | null;
          rejection_reason?: string | null;
          classification?: string;
          checksum_sha256?: string | null;
        };
        Relationships: [];
      };

      document_access_logs: {
        Row:{id:string;society_id:string;document_id:string;actor_user_id:string;access_type:"PREVIEW"|"DOWNLOAD";accessed_at:string;metadata:Json};
        Insert:{id?:string;society_id:string;document_id:string;actor_user_id:string;access_type:"PREVIEW"|"DOWNLOAD";accessed_at?:string;metadata?:Json};
        Update:never;Relationships:[];
      };

      // ── member_applications ───────────────────────────────────────────────────
      member_applications: {
        Row: {
          id: string;
          society_id: string;
          application_number: string;
          applicant_name: string;
          father_spouse_name: string | null;
          applicant_email: string | null;
          applicant_phone: string | null;
          date_of_birth: string | null;
          pan: string | null;
          identity_type: string | null;
          identity_number_masked: string | null;
          identity_number_hash: string | null;
          correspondence_address: string | null;
          permanent_address: string | null;
          ownership_type: string | null;
          ownership_document_number: string | null;
          ownership_date: string | null;
          share_certificate_number: string | null;
          shares_held: number | null;
          joint_member_details: Json;
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
          father_spouse_name?: string | null;
          applicant_email?: string | null;
          applicant_phone?: string | null;
          date_of_birth?: string | null;
          pan?: string | null;
          identity_type?: string | null;
          identity_number_masked?: string | null;
          identity_number_hash?: string | null;
          correspondence_address?: string | null;
          permanent_address?: string | null;
          ownership_type?: string | null;
          ownership_document_number?: string | null;
          ownership_date?: string | null;
          share_certificate_number?: string | null;
          shares_held?: number | null;
          joint_member_details?: Json;
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
          father_spouse_name?: string | null;
          applicant_email?: string | null;
          applicant_phone?: string | null;
          date_of_birth?: string | null;
          pan?: string | null;
          identity_type?: string | null;
          identity_number_masked?: string | null;
          identity_number_hash?: string | null;
          correspondence_address?: string | null;
          permanent_address?: string | null;
          ownership_type?: string | null;
          ownership_document_number?: string | null;
          ownership_date?: string | null;
          share_certificate_number?: string | null;
          shares_held?: number | null;
          joint_member_details?: Json;
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
          service_areas: string[];
          branch_availability: string | null;
          is_preferred: boolean;
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
          service_areas?: string[];
          branch_availability?: string | null;
          is_preferred?: boolean;
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
          service_areas?: string[];
          branch_availability?: string | null;
          is_preferred?: boolean;
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
          waived_amount: number;
          waiver_reason: string | null;
          waived_at: string | null;
          waived_by: string | null;
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
          waived_amount?: number;
          waiver_reason?: string | null;
          waived_at?: string | null;
          waived_by?: string | null;
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
          waived_amount?: number;
          waiver_reason?: string | null;
          waived_at?: string | null;
          waived_by?: string | null;
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
          idempotency_key: string | null;
          receipt_number: string;
          status: string;
          reconciliation_status: string;
          reconciled_at: string | null;
          reconciled_by: string | null;
          reconciliation_notes: string | null;
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
          idempotency_key?: string | null;
          receipt_number?: string;
          status?: string;
          reconciliation_status?: string;
          reconciled_at?: string | null;
          reconciled_by?: string | null;
          reconciliation_notes?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      finance_refunds: {
        Row: { id: string; society_id: string; payment_id: string; refund_number: string; amount: number; refund_method: string; reference_number: string | null; reason: string; status: string; processed_by: string | null; processed_at: string; metadata: Json };
        Insert: { id?: string; society_id: string; payment_id: string; refund_number?: string; amount: number; refund_method: string; reference_number?: string | null; reason: string; status?: string; processed_by?: string | null; processed_at?: string; metadata?: Json };
        Update: never;
        Relationships: [];
      };

      finance_adjustment_requests: {
        Row: { id:string; society_id:string; adjustment_type:"REFUND"|"WAIVER"; payment_id:string|null; due_id:string|null; amount:number; payment_method:string|null; reference_number:string|null; reason:string; status:"PENDING"|"APPROVED"|"REJECTED"|"CANCELLED"; requested_by:string; requested_at:string; reviewed_by:string|null; reviewed_at:string|null; review_notes:string|null; resulting_refund_id:string|null; created_at:string; updated_at:string };
        Insert: never;
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

      master_data_items: {
        Row: { id: string; society_id: string | null; category: string; code: string; label: string; description: string | null; sort_order: number; is_active: boolean; metadata: Json; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; society_id?: string | null; category: string; code: string; label: string; description?: string | null; sort_order?: number; is_active?: boolean; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; society_id?: string | null; category?: string; code?: string; label?: string; description?: string | null; sort_order?: number; is_active?: boolean; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };

      content_templates: {
        Row: { id: string; society_id: string | null; template_key: string; name: string; category: string; version: number; status: string; subject_template: string | null; body_template: string; variables: Json; output_format: string; is_default: boolean; effective_from: string | null; effective_until: string | null; metadata: Json; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; society_id?: string | null; template_key: string; name: string; category: string; version?: number; status?: string; subject_template?: string | null; body_template: string; variables?: Json; output_format?: string; is_default?: boolean; effective_from?: string | null; effective_until?: string | null; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; society_id?: string | null; template_key?: string; name?: string; category?: string; version?: number; status?: string; subject_template?: string | null; body_template?: string; variables?: Json; output_format?: string; is_default?: boolean; effective_from?: string | null; effective_until?: string | null; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };

      generated_documents: {
        Row: { id: string; society_id: string; template_id: string | null; document_number: string; title: string; entity_type: string | null; entity_id: string | null; subject_rendered: string | null; body_rendered: string; input_data: Json; output_format: string; storage_path: string | null; checksum_sha256: string | null; status: string; generated_by: string | null; generated_at: string; metadata: Json };
        Insert: { id?: string; society_id: string; template_id?: string | null; document_number: string; title: string; entity_type?: string | null; entity_id?: string | null; subject_rendered?: string | null; body_rendered: string; input_data?: Json; output_format?: string; storage_path?: string | null; checksum_sha256?: string | null; status?: string; generated_by?: string | null; generated_at?: string; metadata?: Json };
        Update: { id?: string; society_id?: string; template_id?: string | null; document_number?: string; title?: string; entity_type?: string | null; entity_id?: string | null; subject_rendered?: string | null; body_rendered?: string; input_data?: Json; output_format?: string; storage_path?: string | null; checksum_sha256?: string | null; status?: string; generated_by?: string | null; generated_at?: string; metadata?: Json };
        Relationships: [];
      };

      service_requests: {
        Row: { id: string; society_id: string; request_number: string; request_type: string; title: string; description: string | null; member_id: string | null; unit_id: string | null; wing_id: string | null; priority: string; status: string; assigned_to: string | null; due_at: string | null; completed_at: string | null; resolution: string | null; form_data: Json; metadata: Json; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; society_id: string; request_number: string; request_type: string; title: string; description?: string | null; member_id?: string | null; unit_id?: string | null; wing_id?: string | null; priority?: string; status?: string; assigned_to?: string | null; due_at?: string | null; completed_at?: string | null; resolution?: string | null; form_data?: Json; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; society_id?: string; request_number?: string; request_type?: string; title?: string; description?: string | null; member_id?: string | null; unit_id?: string | null; wing_id?: string | null; priority?: string; status?: string; assigned_to?: string | null; due_at?: string | null; completed_at?: string | null; resolution?: string | null; form_data?: Json; metadata?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };

      service_request_status_history: {
        Row:{id:string;society_id:string;request_id:string;from_status:string|null;to_status:string;resolution:string|null;changed_by:string|null;changed_at:string;metadata:Json};
        Insert:never;
        Update:never;
        Relationships:[];
      };

      notifications: {
        Row: { id: string; society_id: string | null; user_id: string; notification_type: string; title: string; message: string; entity_type: string | null; entity_id: string | null; action_url: string | null; read_at: string | null; created_at: string; metadata: Json };
        Insert: { id?: string; society_id?: string | null; user_id: string; notification_type: string; title: string; message: string; entity_type?: string | null; entity_id?: string | null; action_url?: string | null; read_at?: string | null; created_at?: string; metadata?: Json };
        Update: { read_at?: string | null; metadata?: Json };
        Relationships: [];
      };

      approval_workflows: {
        Row: { id: string; society_id: string | null; workflow_key: string; name: string; entity_type: string; description: string | null; version: number; is_active: boolean; conditions: Json; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; society_id?: string | null; workflow_key: string; name: string; entity_type: string; description?: string | null; version?: number; is_active?: boolean; conditions?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; society_id?: string | null; workflow_key?: string; name?: string; entity_type?: string; description?: string | null; version?: number; is_active?: boolean; conditions?: Json; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };

      approval_workflow_steps: {
        Row: { id: string; workflow_id: string; step_order: number; name: string; permission_code: string; min_approvals: number; rejection_ends_workflow: boolean; sla_hours: number | null; conditions: Json; created_at: string };
        Insert: { id?: string; workflow_id: string; step_order: number; name: string; permission_code: string; min_approvals?: number; rejection_ends_workflow?: boolean; sla_hours?: number | null; conditions?: Json; created_at?: string };
        Update: { id?: string; workflow_id?: string; step_order?: number; name?: string; permission_code?: string; min_approvals?: number; rejection_ends_workflow?: boolean; sla_hours?: number | null; conditions?: Json; created_at?: string };
        Relationships: [];
      };

      approval_instances: {
        Row: { id: string; society_id: string; workflow_id: string; entity_type: string; entity_id: string; status: string; current_step_order: number; submitted_by: string | null; submitted_at: string; completed_at: string | null; metadata: Json };
        Insert: { id?: string; society_id: string; workflow_id: string; entity_type: string; entity_id: string; status?: string; current_step_order?: number; submitted_by?: string | null; submitted_at?: string; completed_at?: string | null; metadata?: Json };
        Update: { id?: string; society_id?: string; workflow_id?: string; entity_type?: string; entity_id?: string; status?: string; current_step_order?: number; submitted_by?: string | null; submitted_at?: string; completed_at?: string | null; metadata?: Json };
        Relationships: [];
      };

      approval_decisions: {
        Row: { id: string; instance_id: string; workflow_step_id: string; decision: string; comments: string | null; decided_by: string; decided_at: string; metadata: Json };
        Insert: { id?: string; instance_id: string; workflow_step_id: string; decision: string; comments?: string | null; decided_by: string; decided_at?: string; metadata?: Json };
        Update: never;
        Relationships: [];
      };

      application_checklist_items: {
        Row: { id:string; society_id:string; application_id:string; item_code:string; label:string; is_required:boolean; status:string; document_id:string|null; remarks:string|null; verified_by:string|null; verified_at:string|null; sort_order:number; created_at:string; updated_at:string };
        Insert: { id?:string; society_id:string; application_id:string; item_code:string; label:string; is_required?:boolean; status?:string; document_id?:string|null; remarks?:string|null; verified_by?:string|null; verified_at?:string|null; sort_order?:number; created_at?:string; updated_at?:string };
        Update: { status?:string; document_id?:string|null; remarks?:string|null; verified_by?:string|null; verified_at?:string|null; sort_order?:number; updated_at?:string };
        Relationships: [];
      };

      application_status_history: {
        Row: { id:string; society_id:string; application_id:string; from_status:string|null; to_status:string; comments:string|null; changed_by:string|null; changed_at:string; metadata:Json };
        Insert: { id?:string; society_id:string; application_id:string; from_status?:string|null; to_status:string; comments?:string|null; changed_by?:string|null; changed_at?:string; metadata?:Json };
        Update: never;
        Relationships: [];
      };

      nominations: {
        Row: { id:string; society_id:string; member_id:string; unit_id:string|null; nomination_number:string; status:string; effective_from:string|null; revoked_at:string|null; notes:string|null; created_by:string|null; created_at:string; updated_at:string };
        Insert: { id?:string; society_id:string; member_id:string; unit_id?:string|null; nomination_number:string; status?:string; effective_from?:string|null; revoked_at?:string|null; notes?:string|null; created_by?:string|null; created_at?:string; updated_at?:string };
        Update: { status?:string; effective_from?:string|null; revoked_at?:string|null; notes?:string|null; updated_at?:string };
        Relationships: [];
      };

      nominees: {
        Row: { id:string; nomination_id:string; full_name:string; relationship:string|null; date_of_birth:string|null; address:string|null; phone:string|null; email:string|null; share_percentage:number; is_minor:boolean; guardian_name:string|null; sort_order:number; created_at:string };
        Insert: { id?:string; nomination_id:string; full_name:string; relationship?:string|null; date_of_birth?:string|null; address?:string|null; phone?:string|null; email?:string|null; share_percentage:number; is_minor?:boolean; guardian_name?:string|null; sort_order?:number; created_at?:string };
        Update: { full_name?:string; relationship?:string|null; date_of_birth?:string|null; address?:string|null; phone?:string|null; email?:string|null; share_percentage?:number; is_minor?:boolean; guardian_name?:string|null; sort_order?:number };
        Relationships: [];
      };

      associate_memberships: {
        Row: { id:string; society_id:string; primary_member_id:string; unit_id:string|null; application_number:string; applicant_name:string; applicant_email:string|null; applicant_phone:string|null; relationship:string|null; consent_received:boolean; entrance_fee_amount:number; fee_paid_at:string|null; status:string; approved_member_id:string|null; notes:string|null; created_by:string|null; created_at:string; updated_at:string };
        Insert: { id?:string; society_id:string; primary_member_id:string; unit_id?:string|null; application_number:string; applicant_name:string; applicant_email?:string|null; applicant_phone?:string|null; relationship?:string|null; consent_received?:boolean; entrance_fee_amount?:number; fee_paid_at?:string|null; status?:string; approved_member_id?:string|null; notes?:string|null; created_by?:string|null; created_at?:string; updated_at?:string };
        Update: { status?:string; consent_received?:boolean; entrance_fee_amount?:number; fee_paid_at?:string|null; approved_member_id?:string|null; notes?:string|null; updated_at?:string };
        Relationships: [];
      };
      vendor_users: {
        Row:{id:string;society_id:string;vendor_id:string;user_id:string;is_primary:boolean;is_active:boolean;created_by:string|null;created_at:string};
        Insert:{id?:string;society_id:string;vendor_id:string;user_id:string;is_primary?:boolean;is_active?:boolean;created_by?:string|null;created_at?:string};
        Update:{is_primary?:boolean;is_active?:boolean};Relationships:[];
      };
      vendor_documents: {
        Row:{id:string;society_id:string;vendor_id:string;document_type:string;title:string;document_number:string|null;issued_on:string|null;expires_on:string|null;storage_path:string|null;file_name:string|null;mime_type:string|null;file_size_bytes:number|null;status:string;verified_by:string|null;verified_at:string|null;rejection_reason:string|null;version:number;replaces_document_id:string|null;uploaded_by:string|null;created_at:string;metadata:Json};
        Insert:{id?:string;society_id:string;vendor_id:string;document_type:string;title:string;document_number?:string|null;issued_on?:string|null;expires_on?:string|null;storage_path?:string|null;file_name?:string|null;mime_type?:string|null;file_size_bytes?:number|null;status?:string;verified_by?:string|null;verified_at?:string|null;rejection_reason?:string|null;version?:number;replaces_document_id?:string|null;uploaded_by?:string|null;created_at?:string;metadata?:Json};
        Update:{status?:string;verified_by?:string|null;verified_at?:string|null;rejection_reason?:string|null;expires_on?:string|null;metadata?:Json};Relationships:[];
      };
      rfq_invitations: {
        Row:{id:string;society_id:string;rfq_id:string;vendor_id:string;status:string;invited_at:string;viewed_at:string|null;responded_at:string|null;decline_reason:string|null;invited_by:string|null;reminder_count:number;last_reminded_at:string|null;metadata:Json};
        Insert:{id?:string;society_id:string;rfq_id:string;vendor_id:string;status?:string;invited_at?:string;viewed_at?:string|null;responded_at?:string|null;decline_reason?:string|null;invited_by?:string|null;reminder_count?:number;last_reminded_at?:string|null;metadata?:Json};
        Update:{status?:string;viewed_at?:string|null;responded_at?:string|null;decline_reason?:string|null;reminder_count?:number;last_reminded_at?:string|null;metadata?:Json};Relationships:[];
      };
      quotations: {
        Row:{id:string;society_id:string;rfq_id:string;vendor_id:string;invitation_id:string|null;quotation_number:string;revision:number;status:string;currency:string;subtotal:number;tax_amount:number;total_amount:number;validity_days:number|null;delivery_days:number|null;payment_terms:string|null;warranty_terms:string|null;terms:string|null;submitted_at:string|null;submitted_by:string|null;created_at:string;updated_at:string;metadata:Json};
        Insert:{id?:string;society_id:string;rfq_id:string;vendor_id:string;invitation_id?:string|null;quotation_number:string;revision?:number;status?:string;currency?:string;subtotal?:number;tax_amount?:number;total_amount?:number;validity_days?:number|null;delivery_days?:number|null;payment_terms?:string|null;warranty_terms?:string|null;terms?:string|null;submitted_at?:string|null;submitted_by?:string|null;created_at?:string;updated_at?:string;metadata?:Json};
        Update:{status?:string;subtotal?:number;tax_amount?:number;total_amount?:number;validity_days?:number|null;delivery_days?:number|null;payment_terms?:string|null;warranty_terms?:string|null;terms?:string|null;submitted_at?:string|null;submitted_by?:string|null;updated_at?:string;metadata?:Json};Relationships:[];
      };
      quotation_items: {
        Row:{id:string;quotation_id:string;line_number:number;description:string;quantity:number;unit:string;unit_rate:number;line_total:number;tax_rate:number;notes:string|null};
        Insert:{id?:string;quotation_id:string;line_number:number;description:string;quantity?:number;unit?:string;unit_rate:number;tax_rate?:number;notes?:string|null};
        Update:{line_number?:number;description?:string;quantity?:number;unit?:string;unit_rate?:number;tax_rate?:number;notes?:string|null};Relationships:[];
      };
      quotation_evaluations: {
        Row:{id:string;society_id:string;quotation_id:string;evaluator_id:string;technical_score:number;commercial_score:number;experience_score:number;total_score:number;recommendation:string|null;remarks:string|null;evaluated_at:string};
        Insert:{id?:string;society_id:string;quotation_id:string;evaluator_id:string;technical_score:number;commercial_score:number;experience_score?:number;total_score:number;recommendation?:string|null;remarks?:string|null;evaluated_at?:string};
        Update:{technical_score?:number;commercial_score?:number;experience_score?:number;total_score?:number;recommendation?:string|null;remarks?:string|null;evaluated_at?:string};Relationships:[];
      };
      vendor_selections: {
        Row:{id:string;society_id:string;rfq_id:string;quotation_id:string;vendor_id:string;status:string;justification:string;recommended_by:string|null;recommended_at:string;decided_by:string|null;decided_at:string|null;decision_comments:string|null};
        Insert:{id?:string;society_id:string;rfq_id:string;quotation_id:string;vendor_id:string;status?:string;justification:string;recommended_by?:string|null;recommended_at?:string;decided_by?:string|null;decided_at?:string|null;decision_comments?:string|null};
        Update:{status?:string;justification?:string;decided_by?:string|null;decided_at?:string|null;decision_comments?:string|null};Relationships:[];
      };
      vendor_performance_reviews: {
        Row:{id:string;society_id:string;vendor_id:string;contract_id:string|null;work_order_id:string|null;quality_score:number;timeliness_score:number;safety_score:number;communication_score:number;value_score:number;overall_score:number;comments:string|null;reviewed_by:string|null;reviewed_at:string};
        Insert:{id?:string;society_id:string;vendor_id:string;contract_id?:string|null;work_order_id?:string|null;quality_score:number;timeliness_score:number;safety_score:number;communication_score:number;value_score:number;overall_score:number;comments?:string|null;reviewed_by?:string|null;reviewed_at?:string};
        Update:{quality_score?:number;timeliness_score?:number;safety_score?:number;communication_score?:number;value_score?:number;overall_score?:number;comments?:string|null};Relationships:[];
      };
      contract_renewals: {
        Row:{id:string;society_id:string;contract_id:string;vendor_id:string;renewal_number:string;status:string;current_end_date:string;proposed_start_date:string|null;proposed_end_date:string|null;proposed_value:number|null;vendor_comments:string|null;society_comments:string|null;response_due_at:string|null;intimation_sent_at:string|null;submitted_at:string|null;decided_at:string|null;created_by:string|null;decided_by:string|null;created_at:string;updated_at:string};
        Insert:{id?:string;society_id:string;contract_id:string;vendor_id:string;renewal_number:string;status?:string;current_end_date:string;proposed_start_date?:string|null;proposed_end_date?:string|null;proposed_value?:number|null;vendor_comments?:string|null;society_comments?:string|null;response_due_at?:string|null;intimation_sent_at?:string|null;submitted_at?:string|null;decided_at?:string|null;created_by?:string|null;decided_by?:string|null;created_at?:string;updated_at?:string};
        Update:{status?:string;proposed_start_date?:string|null;proposed_end_date?:string|null;proposed_value?:number|null;vendor_comments?:string|null;society_comments?:string|null;response_due_at?:string|null;intimation_sent_at?:string|null;submitted_at?:string|null;decided_at?:string|null;decided_by?:string|null;updated_at?:string};Relationships:[];
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
      reconcile_payment: {
        Args: { p_society_id: string; p_payment_id: string; p_status: string; p_notes: string; p_actor_user_id: string };
        Returns: void;
      };
      refund_payment: {
        Args: { p_society_id: string; p_payment_id: string; p_amount: number; p_refund_method: string; p_reference_number: string; p_reason: string; p_actor_user_id: string };
        Returns: string;
      };
      record_payment_v2: {
        Args: { p_society_id: string; p_due_id: string; p_amount_paid: number; p_payment_method: string; p_payment_date: string; p_reference_no: string | null; p_notes: string | null; p_recorded_by: string; p_idempotency_key?: string | null };
        Returns: string;
      };
      reconcile_payment_v2: {
        Args: { p_society_id: string; p_payment_id: string; p_status: string; p_notes: string; p_actor_user_id: string };
        Returns: void;
      };
      refund_payment_v2: {
        Args: { p_society_id: string; p_payment_id: string; p_amount: number; p_refund_method: string; p_reference_number: string; p_reason: string; p_actor_user_id: string };
        Returns: string;
      };
      request_finance_adjustment: {
        Args: { p_society_id:string; p_adjustment_type:string; p_payment_id:string|null; p_due_id:string|null; p_amount:number; p_payment_method:string|null; p_reference_number:string; p_reason:string; p_actor_user_id:string };
        Returns: string;
      };
      decide_finance_adjustment: {
        Args: { p_society_id:string; p_request_id:string; p_decision:string; p_notes:string; p_actor_user_id:string };
        Returns: string;
      };
      initialize_member_application: { Args:{ p_application_id:string; p_actor_user_id:string }; Returns:string };
      review_application_checklist_item: { Args:{ p_item_id:string; p_status:string; p_remarks:string; p_actor_user_id:string }; Returns:void };
      decide_member_application: { Args:{ p_application_id:string; p_decision:string; p_comments:string; p_actor_user_id:string }; Returns:string };
      resubmit_member_application: { Args:{ p_application_id:string; p_comments:string; p_actor_user_id:string }; Returns:void };
      attach_application_document: { Args:{ p_checklist_item_id:string; p_storage_path:string; p_file_name:string; p_file_size_bytes:number; p_mime_type:string; p_checksum_sha256:string; p_actor_user_id:string }; Returns:string };
      is_vendor_user:{Args:{p_society_id:string};Returns:boolean};
      can_access_vendor:{Args:{p_society_id:string;p_vendor_id:string};Returns:boolean};
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
      register_society_with_admin_v2: {
        Args: {
          p_name:string; p_registration_number:string; p_society_type:string;
          p_address:string; p_city:string; p_state:string; p_pin_code:string;
          p_email:string; p_phone:string; p_website:string|null; p_pan:string|null;
          p_gstin:string|null; p_registered_at:string; p_admin_user_id:string;
          p_created_by:string; p_officers:Json;
        };
        Returns:string;
      };
      update_society_configuration: {
        Args: {
          p_society_id:string; p_name:string; p_address:string; p_city:string;
          p_state:string; p_pin_code:string; p_email:string; p_phone:string;
          p_website:string; p_pan:string; p_gstin:string; p_logo_path:string;
          p_letterhead_path:string; p_application_pattern:string;
          p_contract_pattern:string; p_rfq_pattern:string; p_work_order_pattern:string;
          p_timezone:string; p_max_upload_size_bytes:number;
          p_contract_reminder_days:number[]; p_notification_preferences:Json;
          p_actor_user_id:string;
        };
        Returns:void;
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
