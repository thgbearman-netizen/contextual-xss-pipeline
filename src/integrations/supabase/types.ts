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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      callbacks: {
        Row: {
          callback_type: string
          confidence: string
          delay_seconds: number | null
          id: string
          injection_id: string
          raw_data: Json | null
          received_at: string
          source_ip: string | null
          user_agent: string | null
        }
        Insert: {
          callback_type: string
          confidence?: string
          delay_seconds?: number | null
          id?: string
          injection_id: string
          raw_data?: Json | null
          received_at?: string
          source_ip?: string | null
          user_agent?: string | null
        }
        Update: {
          callback_type?: string
          confidence?: string
          delay_seconds?: number | null
          id?: string
          injection_id?: string
          raw_data?: Json | null
          received_at?: string
          source_ip?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "callbacks_injection_id_fkey"
            columns: ["injection_id"]
            isOneToOne: false
            referencedRelation: "injections"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoints: {
        Row: {
          auth_required: boolean | null
          cms: string | null
          created_at: string
          endpoint: string
          id: string
          input_class: string | null
          method: string
          params: Json | null
          risk_level: string
          status: string
          target_id: string
        }
        Insert: {
          auth_required?: boolean | null
          cms?: string | null
          created_at?: string
          endpoint: string
          id?: string
          input_class?: string | null
          method?: string
          params?: Json | null
          risk_level?: string
          status?: string
          target_id: string
        }
        Update: {
          auth_required?: boolean | null
          cms?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          input_class?: string | null
          method?: string
          params?: Json | null
          risk_level?: string
          status?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endpoints_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          callback_id: string | null
          created_at: string
          description: string | null
          endpoint_id: string
          evidence: Json | null
          id: string
          severity: string
          status: string
          title: string
        }
        Insert: {
          callback_id?: string | null
          created_at?: string
          description?: string | null
          endpoint_id: string
          evidence?: Json | null
          id?: string
          severity: string
          status?: string
          title: string
        }
        Update: {
          callback_id?: string | null
          created_at?: string
          description?: string | null
          endpoint_id?: string
          evidence?: Json | null
          id?: string
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_callback_id_fkey"
            columns: ["callback_id"]
            isOneToOne: false
            referencedRelation: "callbacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "findings_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      injections: {
        Row: {
          context_type: string | null
          created_at: string
          endpoint_id: string
          id: string
          injected_at: string | null
          param: string
          status: string
          token: string
        }
        Insert: {
          context_type?: string | null
          created_at?: string
          endpoint_id: string
          id?: string
          injected_at?: string | null
          param: string
          status?: string
          token: string
        }
        Update: {
          context_type?: string | null
          created_at?: string
          endpoint_id?: string
          id?: string
          injected_at?: string | null
          param?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "injections_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          target_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          target_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
        ]
      }
      targets: {
        Row: {
          cms_detected: string | null
          created_at: string
          domain: string
          id: string
          status: string
          tech_stack: Json | null
          updated_at: string
        }
        Insert: {
          cms_detected?: string | null
          created_at?: string
          domain: string
          id?: string
          status?: string
          tech_stack?: Json | null
          updated_at?: string
        }
        Update: {
          cms_detected?: string | null
          created_at?: string
          domain?: string
          id?: string
          status?: string
          tech_stack?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
