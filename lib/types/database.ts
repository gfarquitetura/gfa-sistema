// ============================================================
// Database types — kept in sync with Supabase schema manually.
// Extend this file as new tables are added.
// ============================================================

export type Role = 'admin' | 'financial' | 'manager' | 'readonly'

// RAG source citation attached to assistant messages
export type MessageSource = {
  source:     string
  section:    string | null
  similarity: number
  content?:   string   // original chunk text (stored for click-to-expand)
}

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: number
          user_id: string | null
          user_email: string | null
          action: string
          entity: string
          entity_id: string | null
          metadata: Record<string, unknown> | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          user_email?: string | null
          action: string
          entity: string
          entity_id?: string | null
          metadata?: Record<string, unknown> | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Record<string, never> // immutable
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          name: string
          trade_name: string | null
          document_type: 'cpf' | 'cnpj'
          document_number: string
          email: string | null
          phone: string | null
          cep: string | null
          logradouro: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string | null
          estado: string | null
          notes: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          trade_name?: string | null
          document_type: 'cpf' | 'cnpj'
          document_number: string
          email?: string | null
          phone?: string | null
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
          notes?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          name?: string
          trade_name?: string | null
          document_type?: 'cpf' | 'cnpj'
          document_number?: string
          email?: string | null
          phone?: string | null
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
          notes?: string | null
          is_active?: boolean
          updated_by?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          profile_id: string
          member_role: 'responsible' | 'collaborator'
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          profile_id: string
          member_role?: 'responsible' | 'collaborator'
          joined_at?: string
        }
        Update: {
          member_role?: 'responsible' | 'collaborator'
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          client_id: string
          status: 'proposal' | 'active' | 'paused' | 'completed' | 'cancelled'
          contract_value: number
          start_date: string | null
          end_date: string | null
          deadline: string | null
          notes: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          name: string
          description?: string | null
          client_id: string
          status?: 'proposal' | 'active' | 'paused' | 'completed' | 'cancelled'
          contract_value?: number
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          client_id?: string
          status?: 'proposal' | 'active' | 'paused' | 'completed' | 'cancelled'
          contract_value?: number
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          notes?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          project_id: string | null
          category_id: string | null
          description: string
          notes: string | null
          amount: number
          expense_date: string
          receipt_url: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          category_id?: string | null
          description: string
          notes?: string | null
          amount: number
          expense_date?: string
          receipt_url?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          project_id?: string | null
          category_id?: string | null
          description?: string
          notes?: string | null
          amount?: number
          expense_date?: string
          receipt_url?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          id:               string
          profile_id:       string
          project_id:       string | null
          entry_date:       string
          minutes:          number
          description:      string
          notes:            string | null
          status:           'draft' | 'submitted' | 'approved' | 'rejected'
          rejection_reason: string | null
          submitted_at:     string | null
          reviewed_by:      string | null
          reviewed_at:      string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          profile_id:        string
          project_id?:       string | null
          entry_date:        string
          minutes:           number
          description:       string
          notes?:            string | null
          status?:           'draft' | 'submitted' | 'approved' | 'rejected'
          rejection_reason?: string | null
          submitted_at?:     string | null
          reviewed_by?:      string | null
          reviewed_at?:      string | null
        }
        Update: {
          project_id?:       string | null
          entry_date?:       string
          minutes?:          number
          description?:      string
          notes?:            string | null
          status?:           'draft' | 'submitted' | 'approved' | 'rejected'
          rejection_reason?: string | null
          submitted_at?:     string | null
          reviewed_by?:      string | null
          reviewed_at?:      string | null
        }
        Relationships: []
      }
      ai_documents: {
        Row: {
          id:          number
          content:     string
          embedding:   number[]
          source:      string
          section:     string | null
          page_number: number | null
          created_at:  string
        }
        Insert: {
          content:     string
          embedding:   number[]
          source:      string
          section?:    string | null
          page_number?: number | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      conversations: {
        Row: {
          id:                  string
          profile_id:          string
          title:               string
          ai_conversation_id:  string | null
          created_at:          string
          updated_at:          string
        }
        Insert: {
          id?:                 string
          profile_id:          string
          title?:              string
          ai_conversation_id?: string | null
          created_at?:         string
          updated_at?:         string
        }
        Update: {
          title?:              string
          ai_conversation_id?: string | null
          updated_at?:         string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          id:              string
          conversation_id: string
          role:            'user' | 'assistant'
          content:         string
          sources:         MessageSource[] | null
          created_at:      string
        }
        Insert: {
          id?:             string
          conversation_id: string
          role:            'user' | 'assistant'
          content:         string
          sources?:        MessageSource[] | null
          created_at?:     string
        }
        Update: Record<string, never>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: Role
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role: Role
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          role?: Role
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          query_text?:     string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          content:    string
          source:     string
          section:    string | null
          similarity: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience aliases
export type Profile       = Database['public']['Tables']['profiles']['Row']
export type AuditLog      = Database['public']['Tables']['audit_logs']['Row']
export type Client        = Database['public']['Tables']['clients']['Row']
export type Project       = Database['public']['Tables']['projects']['Row']
export type ProjectMember    = Database['public']['Tables']['project_members']['Row']
export type ProjectStatus    = Project['status']
export type Expense              = Database['public']['Tables']['expenses']['Row']
export type ExpenseCategory      = Database['public']['Tables']['expense_categories']['Row']
export type TimesheetEntry       = Database['public']['Tables']['timesheet_entries']['Row']
export type TimesheetEntryStatus = TimesheetEntry['status']
export type AiDocument           = Database['public']['Tables']['ai_documents']['Row']
export type Conversation         = Database['public']['Tables']['conversations']['Row']
export type ConversationMessage  = Database['public']['Tables']['conversation_messages']['Row']
