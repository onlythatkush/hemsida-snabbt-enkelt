export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          label: string
          reference: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          label: string
          reference: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          label?: string
          reference?: string
        }
        Relationships: []
      }
      customer_change_requests: {
        Row: {
          answered_at: string | null
          category: string | null
          classifier: string | null
          confidence: number | null
          created_at: string
          directives: Json | null
          error: string | null
          extracted: Json | null
          from_email: string | null
          id: string
          intent: string | null
          intent_reason: string | null
          last_error: string | null
          matched_via: string | null
          message_id: string
          processed_at: string | null
          raw_text: string
          received_at: string
          reference: string
          retry_count: number
          revision: number | null
          routing: string | null
          status: string
          subject: string | null
        }
        Insert: {
          answered_at?: string | null
          category?: string | null
          classifier?: string | null
          confidence?: number | null
          created_at?: string
          directives?: Json | null
          error?: string | null
          extracted?: Json | null
          from_email?: string | null
          id?: string
          intent?: string | null
          intent_reason?: string | null
          last_error?: string | null
          matched_via?: string | null
          message_id: string
          processed_at?: string | null
          raw_text: string
          received_at?: string
          reference: string
          retry_count?: number
          revision?: number | null
          routing?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          answered_at?: string | null
          category?: string | null
          classifier?: string | null
          confidence?: number | null
          created_at?: string
          directives?: Json | null
          error?: string | null
          extracted?: Json | null
          from_email?: string | null
          id?: string
          intent?: string | null
          intent_reason?: string | null
          last_error?: string | null
          matched_via?: string | null
          message_id?: string
          processed_at?: string | null
          raw_text?: string
          received_at?: string
          reference?: string
          retry_count?: number
          revision?: number | null
          routing?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      design_versions: {
        Row: {
          change_request_id: string | null
          created_at: string
          design_family: string | null
          design_spec: Json
          design_version: number | null
          id: string
          preview_url: string | null
          qa_report: Json | null
          qa_score: number | null
          qa_status: string | null
          reference: string
          revision: number
          source: string
        }
        Insert: {
          change_request_id?: string | null
          created_at?: string
          design_family?: string | null
          design_spec: Json
          design_version?: number | null
          id?: string
          preview_url?: string | null
          qa_report?: Json | null
          qa_score?: number | null
          qa_status?: string | null
          reference: string
          revision: number
          source?: string
        }
        Update: {
          change_request_id?: string | null
          created_at?: string
          design_family?: string | null
          design_spec?: Json
          design_version?: number | null
          id?: string
          preview_url?: string | null
          qa_report?: Json | null
          qa_score?: number | null
          qa_status?: string | null
          reference?: string
          revision?: number
          source?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      preview_email_log: {
        Row: {
          change_request_id: string | null
          company: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          kind: string
          metadata: Json | null
          preview_url: string | null
          provider: string
          provider_message_id: string | null
          recipient: string
          reference: string
          revision: number | null
          sender: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          change_request_id?: string | null
          company?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          kind?: string
          metadata?: Json | null
          preview_url?: string | null
          provider: string
          provider_message_id?: string | null
          recipient: string
          reference: string
          revision?: number | null
          sender?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          change_request_id?: string | null
          company?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          kind?: string
          metadata?: Json | null
          preview_url?: string | null
          provider?: string
          provider_message_id?: string | null
          recipient?: string
          reference?: string
          revision?: number | null
          sender?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_applications: {
        Row: {
          address: string | null
          approved_revision: number | null
          colors: string | null
          company: string
          created_at: string
          customer_approved_at: string | null
          description: string
          design_family: string | null
          design_locked: boolean
          design_revision: number | null
          design_spec: Json | null
          email: string
          extra_requests: string | null
          file_names: string[]
          id: string
          name: string
          phone: string
          preview_token: string | null
          preview_url: string | null
          qa_accepted_at: string | null
          qa_report: Json | null
          qa_score: number | null
          qa_status: string | null
          reference: string
          review_note: string | null
          social_links: string | null
          status: string
          updated_at: string
          wants_support: boolean
          website_type: string
        }
        Insert: {
          address?: string | null
          approved_revision?: number | null
          colors?: string | null
          company: string
          created_at?: string
          customer_approved_at?: string | null
          description: string
          design_family?: string | null
          design_locked?: boolean
          design_revision?: number | null
          design_spec?: Json | null
          email: string
          extra_requests?: string | null
          file_names?: string[]
          id?: string
          name: string
          phone: string
          preview_token?: string | null
          preview_url?: string | null
          qa_accepted_at?: string | null
          qa_report?: Json | null
          qa_score?: number | null
          qa_status?: string | null
          reference: string
          review_note?: string | null
          social_links?: string | null
          status?: string
          updated_at?: string
          wants_support?: boolean
          website_type: string
        }
        Update: {
          address?: string | null
          approved_revision?: number | null
          colors?: string | null
          company?: string
          created_at?: string
          customer_approved_at?: string | null
          description?: string
          design_family?: string | null
          design_locked?: boolean
          design_revision?: number | null
          design_spec?: Json | null
          email?: string
          extra_requests?: string | null
          file_names?: string[]
          id?: string
          name?: string
          phone?: string
          preview_token?: string | null
          preview_url?: string | null
          qa_accepted_at?: string | null
          qa_report?: Json | null
          qa_score?: number | null
          qa_status?: string | null
          reference?: string
          review_note?: string | null
          social_links?: string | null
          status?: string
          updated_at?: string
          wants_support?: boolean
          website_type?: string
        }
        Relationships: []
      }
      revision_jobs: {
        Row: {
          change_request_id: string | null
          created_at: string
          detail: Json | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          kind: string
          last_error: string | null
          reference: string
          retry_count: number
          revision: number | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          change_request_id?: string | null
          created_at?: string
          detail?: Json | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          kind?: string
          last_error?: string | null
          reference: string
          retry_count?: number
          revision?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          change_request_id?: string | null
          created_at?: string
          detail?: Json | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          kind?: string
          last_error?: string | null
          reference?: string
          retry_count?: number
          revision?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
