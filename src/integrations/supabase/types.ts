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
      agendamentos: {
        Row: {
          aluno_id: string
          created_at: string
          data_hora: string
          duracao_minutos: number
          id: string
          observacoes: string | null
          paciente_id: string
          procedimento: string | null
          status: Database["public"]["Enums"]["agendamento_status"]
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_hora: string
          duracao_minutos?: number
          id?: string
          observacoes?: string | null
          paciente_id: string
          procedimento?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_hora?: string
          duracao_minutos?: number
          id?: string
          observacoes?: string | null
          paciente_id?: string
          procedimento?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          cpf: string
          created_at: string
          criado_por: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          criado_por: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          criado_por?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
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
      prontuarios: {
        Row: {
          agendamento_id: string | null
          aluno_id: string
          anamnese: string | null
          created_at: string
          data_atendimento: string
          diagnostico: string | null
          exame_clinico: string | null
          id: string
          motivo_rejeicao: string | null
          observacoes: string | null
          paciente_id: string
          prescricoes: string | null
          procedimentos_realizados: string | null
          queixa_principal: string | null
          status: Database["public"]["Enums"]["prontuario_status"]
          updated_at: string
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          agendamento_id?: string | null
          aluno_id: string
          anamnese?: string | null
          created_at?: string
          data_atendimento?: string
          diagnostico?: string | null
          exame_clinico?: string | null
          id?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          paciente_id: string
          prescricoes?: string | null
          procedimentos_realizados?: string | null
          queixa_principal?: string | null
          status?: Database["public"]["Enums"]["prontuario_status"]
          updated_at?: string
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          agendamento_id?: string | null
          aluno_id?: string
          anamnese?: string | null
          created_at?: string
          data_atendimento?: string
          diagnostico?: string | null
          exame_clinico?: string | null
          id?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          paciente_id?: string
          prescricoes?: string | null
          procedimentos_realizados?: string | null
          queixa_principal?: string | null
          status?: Database["public"]["Enums"]["prontuario_status"]
          updated_at?: string
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: []
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
      agendamento_status: "agendado" | "realizado" | "cancelado" | "faltou"
      app_role: "aluno" | "professor_admin"
      prontuario_status:
        | "rascunho"
        | "aguardando_validacao"
        | "validado"
        | "rejeitado"
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
      agendamento_status: ["agendado", "realizado", "cancelado", "faltou"],
      app_role: ["aluno", "professor_admin"],
      prontuario_status: [
        "rascunho",
        "aguardando_validacao",
        "validado",
        "rejeitado",
      ],
    },
  },
} as const
