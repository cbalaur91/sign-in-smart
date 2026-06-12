export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          brokerage: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          credits: number;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          brokerage?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          credits?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          brokerage?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          credits?: number;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          agent_id: string;
          slug: string;
          property_address: string;
          city: string;
          state: string;
          zip: string;
          date: string;
          start_time: string;
          end_time: string;
          description: string | null;
          photos: string[];
          bedrooms: number | null;
          bathrooms: number | null;
          sqft: number | null;
          price: number | null;
          status: "draft" | "active" | "completed" | "pending_payment";
          follow_up_enabled: boolean;
          nudge_enabled: boolean;
          completed_at: string | null;
          report_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          slug: string;
          property_address: string;
          city: string;
          state: string;
          zip: string;
          date: string;
          start_time: string;
          end_time: string;
          description?: string | null;
          photos?: string[];
          bedrooms?: number | null;
          bathrooms?: number | null;
          sqft?: number | null;
          price?: number | null;
          status?: "draft" | "active" | "completed" | "pending_payment";
          follow_up_enabled?: boolean;
          nudge_enabled?: boolean;
          completed_at?: string | null;
          report_token?: string;
          created_at?: string;
        };
        Update: {
          agent_id?: string;
          slug?: string;
          property_address?: string;
          city?: string;
          state?: string;
          zip?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          description?: string | null;
          photos?: string[];
          bedrooms?: number | null;
          bathrooms?: number | null;
          sqft?: number | null;
          price?: number | null;
          status?: "draft" | "active" | "completed" | "pending_payment";
          follow_up_enabled?: boolean;
          nudge_enabled?: boolean;
          completed_at?: string | null;
          report_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      visitors: {
        Row: {
          id: string;
          event_id: string;
          full_name: string;
          email: string;
          phone: string;
          visitor_type: "buyer" | "neighbor" | "investor" | "other";
          notes: string | null;
          email_opt_out: boolean;
          signed_in_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          full_name: string;
          email: string;
          phone: string;
          visitor_type: "buyer" | "neighbor" | "investor" | "other";
          notes?: string | null;
          email_opt_out?: boolean;
          signed_in_at?: string;
        };
        Update: {
          event_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          visitor_type?: "buyer" | "neighbor" | "investor" | "other";
          notes?: string | null;
          email_opt_out?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "visitors_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_analytics: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          visitor_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          event_type: string;
          visitor_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          event_type?: string;
          visitor_id?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_analytics_visitor_id_fkey";
            columns: ["visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors";
            referencedColumns: ["id"];
          },
        ];
      };
      email_log: {
        Row: {
          id: string;
          event_id: string;
          visitor_id: string;
          email_type: "thank_you" | "nudge";
          status: "sent" | "failed";
          attempts: number;
          resend_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          visitor_id: string;
          email_type: "thank_you" | "nudge";
          status?: "sent" | "failed";
          attempts?: number;
          resend_id?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "sent" | "failed";
          attempts?: number;
          resend_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_log_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_log_visitor_id_fkey";
            columns: ["visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          agent_id: string;
          event_id: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          status: "pending" | "completed" | "expired" | "refunded";
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          event_id: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount_cents: number;
          status?: "pending" | "completed" | "expired" | "refunded";
          created_at?: string;
        };
        Update: {
          stripe_payment_intent_id?: string | null;
          status?: "pending" | "completed" | "expired" | "refunded";
        };
        Relationships: [
          {
            foreignKeyName: "payments_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      deduct_credit: {
        Args: { agent_uuid: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Visitor = Database["public"]["Tables"]["visitors"]["Row"];
export type EventAnalytic =
  Database["public"]["Tables"]["event_analytics"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type EmailLog = Database["public"]["Tables"]["email_log"]["Row"];
