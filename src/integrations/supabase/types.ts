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
      abastecimentos: {
        Row: {
          corrida_id: string | null
          criado_em: string
          id: string
          km: number
          motorista_id: string
          url_nota: string | null
          valor: number
          veiculo_id: string
        }
        Insert: {
          corrida_id?: string | null
          criado_em?: string
          id?: string
          km: number
          motorista_id: string
          url_nota?: string | null
          valor: number
          veiculo_id: string
        }
        Update: {
          corrida_id?: string | null
          criado_em?: string
          id?: string
          km?: number
          motorista_id?: string
          url_nota?: string | null
          valor?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abastecimentos_corrida_id_fkey"
            columns: ["corrida_id"]
            isOneToOne: false
            referencedRelation: "corridas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abastecimentos_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abastecimentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          criado_em: string
          id: string
          itens: Json
          motorista_id: string
          observacao: string | null
          veiculo_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          itens?: Json
          motorista_id: string
          observacao?: string | null
          veiculo_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          itens?: Json
          motorista_id?: string
          observacao?: string | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      corridas: {
        Row: {
          admin_dirigindo: boolean | null
          criado_em: string
          destino: string | null
          fim_lat: number | null
          fim_lng: number | null
          finalizada_em: string | null
          id: string
          inicio_lat: number | null
          inicio_lng: number | null
          km_fim: number | null
          km_inicio: number
          motorista_id: string
          observacoes: string | null
          observacoes_final: string | null
          status: string
          veiculo_id: string
        }
        Insert: {
          admin_dirigindo?: boolean | null
          criado_em?: string
          destino?: string | null
          fim_lat?: number | null
          fim_lng?: number | null
          finalizada_em?: string | null
          id?: string
          inicio_lat?: number | null
          inicio_lng?: number | null
          km_fim?: number | null
          km_inicio: number
          motorista_id: string
          observacoes?: string | null
          observacoes_final?: string | null
          status?: string
          veiculo_id: string
        }
        Update: {
          admin_dirigindo?: boolean | null
          criado_em?: string
          destino?: string | null
          fim_lat?: number | null
          fim_lng?: number | null
          finalizada_em?: string | null
          id?: string
          inicio_lat?: number | null
          inicio_lng?: number | null
          km_fim?: number | null
          km_inicio?: number
          motorista_id?: string
          observacoes?: string | null
          observacoes_final?: string | null
          status?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corridas_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corridas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          corrida_id: string
          criado_em: string
          id: string
          motorista_id: string
          posicao: string
          tipo: string
          url: string
        }
        Insert: {
          corrida_id: string
          criado_em?: string
          id?: string
          motorista_id: string
          posicao: string
          tipo: string
          url: string
        }
        Update: {
          corrida_id?: string
          criado_em?: string
          id?: string
          motorista_id?: string
          posicao?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_corrida_id_fkey"
            columns: ["corrida_id"]
            isOneToOne: false
            referencedRelation: "corridas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      localizacoes: {
        Row: {
          corrida_id: string
          criado_em: string
          id: string
          lat: number
          lng: number
          motorista_id: string
          velocidade: number | null
        }
        Insert: {
          corrida_id: string
          criado_em?: string
          id?: string
          lat: number
          lng: number
          motorista_id: string
          velocidade?: number | null
        }
        Update: {
          corrida_id?: string
          criado_em?: string
          id?: string
          lat?: number
          lng?: number
          motorista_id?: string
          velocidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "localizacoes_corrida_id_fkey"
            columns: ["corrida_id"]
            isOneToOne: false
            referencedRelation: "corridas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "localizacoes_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          criado_em: string
          email: string
          id: string
          nome: string
          pode_dirigir: boolean
          tipo: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          email: string
          id: string
          nome: string
          pode_dirigir?: boolean
          tipo?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          pode_dirigir?: boolean
          tipo?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          criado_em: string
          id: string
          km_atual: number
          nome: string
          placa: string
          status: string
        }
        Insert: {
          criado_em?: string
          id?: string
          km_atual?: number
          nome: string
          placa: string
          status?: string
        }
        Update: {
          criado_em?: string
          id?: string
          km_atual?: number
          nome?: string
          placa?: string
          status?: string
        }
        Relationships: []
      }
      zona_azul: {
        Row: {
          corrida_id: string | null
          criado_em: string
          id: string
          localizacao: string | null
          motorista_id: string
          valor: number
        }
        Insert: {
          corrida_id?: string | null
          criado_em?: string
          id?: string
          localizacao?: string | null
          motorista_id: string
          valor: number
        }
        Update: {
          corrida_id?: string | null
          criado_em?: string
          id?: string
          localizacao?: string | null
          motorista_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "zona_azul_corrida_id_fkey"
            columns: ["corrida_id"]
            isOneToOne: false
            referencedRelation: "corridas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zona_azul_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
