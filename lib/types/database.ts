// ============================================================
// Database types — kept in sync with Supabase schema manually.
// Extend this file as new tables are added.
// ============================================================

export type Role = 'admin' | 'financial' | 'manager' | 'readonly'

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
          id?: string
          full_name?: string
          email?: string
          role?: Role
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience aliases
export type Profile       = Database['public']['Tables']['profiles']['Row']
export type AuditLog      = Database['public']['Tables']['audit_logs']['Row']
export type Client        = Database['public']['Tables']['clients']['Row']
export type Project       = Database['public']['Tables']['projects']['Row']
export type ProjectMember = Database['public']['Tables']['project_members']['Row']
export type ProjectStatus = Project['status']
