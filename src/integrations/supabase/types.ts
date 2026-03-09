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
      accounts: {
        Row: {
          amount: number
          bank_account_id: string | null
          billing_slip_url: string | null
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          installment_number: number | null
          notes: string | null
          paid_at: string | null
          parent_id: string | null
          payment_receipt_url: string | null
          status: string
          supplier_id: string | null
          supplier_name: string | null
          total_installments: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          billing_slip_url?: string | null
          category: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          installment_number?: number | null
          notes?: string | null
          paid_at?: string | null
          parent_id?: string | null
          payment_receipt_url?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_installments?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          billing_slip_url?: string | null
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installment_number?: number | null
          notes?: string | null
          paid_at?: string | null
          parent_id?: string | null
          payment_receipt_url?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_installments?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          agency: string | null
          bank_name: string | null
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          name: string
          type: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          agency?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_absences: {
        Row: {
          absence_type: string
          certificate_url: string | null
          cid_code: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          absence_type?: string
          certificate_url?: string | null
          cid_code?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          absence_type?: string
          certificate_url?: string | null
          cid_code?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          benefit_type: string
          created_at: string
          daily_cost: number
          employee_id: string
          id: string
          month_reference: string
          total_value: number
          user_id: string
          working_days: number
        }
        Insert: {
          benefit_type: string
          created_at?: string
          daily_cost?: number
          employee_id: string
          id?: string
          month_reference: string
          total_value?: number
          user_id: string
          working_days?: number
        }
        Update: {
          benefit_type?: string
          created_at?: string
          daily_cost?: number
          employee_id?: string
          id?: string
          month_reference?: string
          total_value?: number
          user_id?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          doc_type: string
          employee_id: string
          file_url: string
          id: string
          notes: string | null
          reference_month: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          employee_id: string
          file_url: string
          id?: string
          notes?: string | null
          reference_month: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          employee_id?: string
          file_url?: string
          id?: string
          notes?: string | null
          reference_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_exams: {
        Row: {
          created_at: string
          employee_id: string
          exam_date: string
          exam_type: string
          file_url: string | null
          id: string
          next_exam_date: string | null
          notes: string | null
          result: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          exam_date: string
          exam_type: string
          file_url?: string | null
          id?: string
          next_exam_date?: string | null
          notes?: string | null
          result?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          exam_date?: string
          exam_type?: string
          file_url?: string | null
          id?: string
          next_exam_date?: string | null
          notes?: string | null
          result?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_exams_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_vacations: {
        Row: {
          created_at: string
          days: number
          employee_id: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          receipt_url: string | null
          status: string
          user_id: string
          vacation_end: string | null
          vacation_start: string | null
        }
        Insert: {
          created_at?: string
          days?: number
          employee_id: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          receipt_url?: string | null
          status?: string
          user_id: string
          vacation_end?: string | null
          vacation_start?: string | null
        }
        Update: {
          created_at?: string
          days?: number
          employee_id?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          receipt_url?: string | null
          status?: string
          user_id?: string
          vacation_end?: string | null
          vacation_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          admission_date: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          position: string | null
          rg: string | null
          salary: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          admission_date?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          rg?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          admission_date?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          rg?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_id: string
          amount: number
          bank_account_id: string | null
          created_at: string
          id: string
          notes: string | null
          paid_at: string
          payment_method: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          bank_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at: string
          payment_method: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipt_numbers: {
        Row: {
          created_at: string
          id: string
          last_number: number
          updated_at: string
          user_id: string
          year_month: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_number?: number
          updated_at?: string
          user_id: string
          year_month: string
        }
        Update: {
          created_at?: string
          id?: string
          last_number?: number
          updated_at?: string
          user_id?: string
          year_month?: string
        }
        Relationships: []
      }
      receipt_settings: {
        Row: {
          city: string | null
          company_address: string | null
          company_document: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          footer_text: string | null
          header_text: string | null
          id: string
          logo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          company_address?: string | null
          company_document?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          company_address?: string | null
          company_document?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          account_id: string | null
          amount: number
          amount_written: string
          created_at: string
          id: string
          issue_date: string
          receipt_number: string
          receiver_document: string | null
          receiver_name: string
          reference: string
          sequence_number: number
          user_id: string
          year_month: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          amount_written: string
          created_at?: string
          id?: string
          issue_date?: string
          receipt_number: string
          receiver_document?: string | null
          receiver_name: string
          reference: string
          sequence_number: number
          user_id: string
          year_month: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          amount_written?: string
          created_at?: string
          id?: string
          issue_date?: string
          receipt_number?: string
          receiver_document?: string | null
          receiver_name?: string
          reference?: string
          sequence_number?: number
          user_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          type: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: string
          user_id?: string
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
