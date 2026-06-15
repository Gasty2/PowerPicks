export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      market_resolution_sources: {
        Row: {
          automation_level: string;
          competition_id: string;
          created_at: string;
          id: string;
          label: string;
          requires_admin_review: boolean;
          settlement_use: string;
          source_role: string;
          url: string;
        };
        Insert: {
          automation_level: string;
          competition_id: string;
          created_at?: string;
          id?: string;
          label: string;
          requires_admin_review?: boolean;
          settlement_use: string;
          source_role: string;
          url: string;
        };
        Update: {
          automation_level?: string;
          competition_id?: string;
          created_at?: string;
          id?: string;
          label?: string;
          requires_admin_review?: boolean;
          settlement_use?: string;
          source_role?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_resolution_sources_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "official_competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      official_competitions: {
        Row: {
          competition_type: string;
          created_at: string;
          division: string | null;
          end_date: string | null;
          equipment: string;
          federation: string;
          id: string;
          live_source_url: string | null;
          location_city: string | null;
          location_country: string;
          location_region: string | null;
          metadata: Json;
          name: string;
          official_source_url: string;
          parent_federation: string | null;
          results_source_url: string | null;
          slug: string;
          source_confidence: string;
          source_notes: string | null;
          start_date: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          competition_type?: string;
          created_at?: string;
          division?: string | null;
          end_date?: string | null;
          equipment?: string;
          federation: string;
          id?: string;
          live_source_url?: string | null;
          location_city?: string | null;
          location_country: string;
          location_region?: string | null;
          metadata?: Json;
          name: string;
          official_source_url: string;
          parent_federation?: string | null;
          results_source_url?: string | null;
          slug: string;
          source_confidence?: string;
          source_notes?: string | null;
          start_date: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          competition_type?: string;
          created_at?: string;
          division?: string | null;
          end_date?: string | null;
          equipment?: string;
          federation?: string;
          id?: string;
          live_source_url?: string | null;
          location_city?: string | null;
          location_country?: string;
          location_region?: string | null;
          metadata?: Json;
          name?: string;
          official_source_url?: string;
          parent_federation?: string | null;
          results_source_url?: string | null;
          slug?: string;
          source_confidence?: string;
          source_notes?: string | null;
          start_date?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      official_source_links: {
        Row: {
          automated_ingestion_allowed: boolean;
          competition_id: string;
          created_at: string;
          extraction_policy: string;
          id: string;
          label: string;
          last_checked_at: string | null;
          notes: string | null;
          source_kind: string;
          source_slug: string;
          url: string;
        };
        Insert: {
          automated_ingestion_allowed?: boolean;
          competition_id: string;
          created_at?: string;
          extraction_policy?: string;
          id?: string;
          label: string;
          last_checked_at?: string | null;
          notes?: string | null;
          source_kind: string;
          source_slug: string;
          url: string;
        };
        Update: {
          automated_ingestion_allowed?: boolean;
          competition_id?: string;
          created_at?: string;
          extraction_policy?: string;
          id?: string;
          label?: string;
          last_checked_at?: string | null;
          notes?: string | null;
          source_kind?: string;
          source_slug?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "official_source_links_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "official_competitions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
