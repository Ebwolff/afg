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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      atendimentos: {
        Row: {
          atendido_at: string | null
          atendido_por: string | null
          cliente_contato: string
          cliente_nome: string
          created_at: string
          data_finalizacao: string | null
          descricao: string | null
          digitador_id: string | null
          id: string
          observacoes: string | null
          solicitado_por: string | null
          status: string
          tipo_solicitacao: string
          vendedor_id: string | null
        }
        Insert: {
          atendido_at?: string | null
          atendido_por?: string | null
          cliente_contato: string
          cliente_nome: string
          created_at?: string
          data_finalizacao?: string | null
          descricao?: string | null
          digitador_id?: string | null
          id?: string
          observacoes?: string | null
          solicitado_por?: string | null
          status?: string
          tipo_solicitacao: string
          vendedor_id?: string | null
        }
        Update: {
          atendido_at?: string | null
          atendido_por?: string | null
          cliente_contato?: string
          cliente_nome?: string
          created_at?: string
          data_finalizacao?: string | null
          descricao?: string | null
          digitador_id?: string | null
          id?: string
          observacoes?: string | null
          solicitado_por?: string | null
          status?: string
          tipo_solicitacao?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_atendido_por_fkey"
            columns: ["atendido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_digitador_id_fkey"
            columns: ["digitador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cpf: string
          created_at: string
          created_by: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          local: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string
          comissao_percentual: number | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
          valor_base: number | null
        }
        Insert: {
          ativo?: boolean
          categoria: string
          comissao_percentual?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          valor_base?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string
          comissao_percentual?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          valor_base?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          atendido_por: string | null
          cliente_id: string | null
          concluido_at: string | null
          created_at: string
          descricao: string | null
          id: string
          status: string
          tipo_servico: string
          valor: number | null
        }
        Insert: {
          atendido_por?: string | null
          cliente_id?: string | null
          concluido_at?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo_servico: string
          valor?: number | null
        }
        Update: {
          atendido_por?: string | null
          cliente_id?: string | null
          concluido_at?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo_servico?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_atendido_por_fkey"
            columns: ["atendido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacoes_consorcio: {
        Row: {
          atendimento_id: string | null
          cliente_nome: string
          created_at: string
          created_by: string | null
          id: string
          observacoes: string | null
          prazo_meses: number
          taxa_administracao: number | null
          tipo_bem: string
          valor_carta: number
          valor_parcela: number
        }
        Insert: {
          atendimento_id?: string | null
          cliente_nome: string
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          prazo_meses: number
          taxa_administracao?: number | null
          tipo_bem: string
          valor_carta: number
          valor_parcela: number
        }
        Update: {
          atendimento_id?: string | null
          cliente_nome?: string
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          prazo_meses?: number
          taxa_administracao?: number | null
          tipo_bem?: string
          valor_carta?: number
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_consorcio_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          anexo_url: string | null
          categoria: string | null
          conta_bancaria: string | null
          created_by: string | null
          data: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string
          documento: string | null
          fornecedor_cliente: string | null
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          parcela_numero: number | null
          parcela_total: number | null
          servico_id: string | null
          status: string
          tipo: string
          valor: number
        }
        Insert: {
          anexo_url?: string | null
          categoria?: string | null
          conta_bancaria?: string | null
          created_by?: string | null
          data?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao: string
          documento?: string | null
          fornecedor_cliente?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          parcela_numero?: number | null
          parcela_total?: number | null
          servico_id?: string | null
          status?: string
          tipo: string
          valor: number
        }
        Update: {
          anexo_url?: string | null
          categoria?: string | null
          conta_bancaria?: string | null
          created_by?: string | null
          data?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          documento?: string | null
          fornecedor_cliente?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          parcela_numero?: number | null
          parcela_total?: number | null
          servico_id?: string | null
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "digitador" | "gerente"
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
    Enums: {
      app_role: ["admin", "vendedor", "digitador", "gerente"],
    },
  },
} as const
