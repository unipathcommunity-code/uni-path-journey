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
      agent_referrals: {
        Row: {
          agent_id: string
          booking_id: string
          commission_amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          booking_id: string
          commission_amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          booking_id?: string
          commission_amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_referrals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tours: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          notes: string | null
          special_price: number | null
          tour_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          special_price?: number | null
          tour_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          special_price?: number | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tours_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tours_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          address: string | null
          agreement_accepted: boolean | null
          agreement_accepted_at: string | null
          bank_account: string | null
          bank_name: string | null
          commission_rate: number | null
          company_name: string
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          description: string | null
          director_name: string | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean | null
          license_url: string | null
          logo: string | null
          name: string
          phone: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          agreement_accepted?: boolean | null
          agreement_accepted_at?: string | null
          bank_account?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          company_name: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          license_url?: string | null
          logo?: string | null
          name: string
          phone: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          agreement_accepted?: boolean | null
          agreement_accepted_at?: string | null
          bank_account?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          company_name?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          description?: string | null
          director_name?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean | null
          license_url?: string | null
          logo?: string | null
          name?: string
          phone?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      booking_agent_assignments: {
        Row: {
          agent_id: string
          assigned_at: string
          assigned_by: string
          booking_id: string
          id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          assigned_at?: string
          assigned_by: string
          booking_id: string
          id?: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          assigned_at?: string
          assigned_by?: string
          booking_id?: string
          id?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_agent_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_agent_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_documents: {
        Row: {
          booking_id: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          notes: string | null
          uploaded_at: string
        }
        Insert: {
          booking_id: string
          document_type: string
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          uploaded_at?: string
        }
        Update: {
          booking_id?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_timeline: {
        Row: {
          booking_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          step: string
          title: string
        }
        Insert: {
          booking_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          step: string
          title: string
        }
        Update: {
          booking_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          step?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          branch_id: string | null
          created_at: string
          deposit_amount: number | null
          discount_amount: number | null
          driver_name: string | null
          driver_phone: string | null
          flight_info: string | null
          guide_name: string | null
          guide_phone: string | null
          hotel_info: string | null
          id: string
          manager_id: string | null
          manager_name: string | null
          manager_phone: string | null
          manager_photo: string | null
          notes: string | null
          payment_screenshot_url: string | null
          payment_status: string | null
          people_count: number
          pickup_location: string | null
          promo_code_id: string | null
          remaining_amount: number | null
          status: string | null
          total_price: number
          tour_id: string
          travel_date: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          discount_amount?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          flight_info?: string | null
          guide_name?: string | null
          guide_phone?: string | null
          hotel_info?: string | null
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_photo?: string | null
          notes?: string | null
          payment_screenshot_url?: string | null
          payment_status?: string | null
          people_count: number
          pickup_location?: string | null
          promo_code_id?: string | null
          remaining_amount?: number | null
          status?: string | null
          total_price: number
          tour_id: string
          travel_date: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          discount_amount?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          flight_info?: string | null
          guide_name?: string | null
          guide_phone?: string | null
          hotel_info?: string | null
          id?: string
          manager_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_photo?: string | null
          notes?: string | null
          payment_screenshot_url?: string | null
          payment_status?: string | null
          people_count?: number
          pickup_location?: string | null
          promo_code_id?: string | null
          remaining_amount?: number | null
          status?: string | null
          total_price?: number
          tour_id?: string
          travel_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          agent_id: string | null
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_billing_invoices: {
        Row: {
          amount_usd: number
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount_usd?: number
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount_usd?: number
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_billing_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tour_company_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_branches: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_main: boolean
          manager_user_id: string | null
          name: string
          notes: string | null
          phone: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_main?: boolean
          manager_user_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_main?: boolean
          manager_user_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_change_requests: {
        Row: {
          admin_notes: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          payload: Json | null
          request_type: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          payload?: Json | null
          request_type: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payload?: Json | null
          request_type?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_customers: {
        Row: {
          account_type: string
          avatar_url: string | null
          company_id: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_feature_overrides: {
        Row: {
          company_id: string
          created_at: string
          feature_key: string
          id: string
          is_enabled: boolean
          notes: string | null
          set_by: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          feature_key: string
          id?: string
          is_enabled?: boolean
          notes?: string | null
          set_by?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          notes?: string | null
          set_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_feature_overrides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_leads: {
        Row: {
          assigned_to: string | null
          branch_id: string | null
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string | null
          notes: string | null
          phone: string
          related_tour_id: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          branch_id?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          message?: string | null
          notes?: string | null
          phone: string
          related_tour_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string
          related_tour_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_posts: {
        Row: {
          author_id: string | null
          category: string | null
          company_id: string
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          gallery: string[] | null
          id: string
          is_published: boolean
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          company_id: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          gallery?: string[] | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          company_id?: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          gallery?: string[] | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_telegram_bots: {
        Row: {
          bot_token: string | null
          bot_username: string | null
          company_id: string
          configured_by: string | null
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          bot_token?: string | null
          bot_username?: string | null
          company_id: string
          configured_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          bot_token?: string | null
          bot_username?: string | null
          company_id?: string
          configured_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_telegram_bots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_tour_requests: {
        Row: {
          agent_id: string | null
          agent_response: string | null
          created_at: string
          destination_id: string | null
          destination_name: string
          duration_days: number
          end_date: string | null
          estimated_price: number | null
          excursions: string[] | null
          food_plan: string
          hotel_level: number
          id: string
          notes: string | null
          people_count: number
          start_date: string | null
          status: string
          transport_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          agent_response?: string | null
          created_at?: string
          destination_id?: string | null
          destination_name: string
          duration_days?: number
          end_date?: string | null
          estimated_price?: number | null
          excursions?: string[] | null
          food_plan?: string
          hotel_level?: number
          id?: string
          notes?: string | null
          people_count?: number
          start_date?: string | null
          status?: string
          transport_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          agent_response?: string | null
          created_at?: string
          destination_id?: string | null
          destination_name?: string
          duration_days?: number
          end_date?: string | null
          estimated_price?: number | null
          excursions?: string[] | null
          food_plan?: string
          hotel_level?: number
          id?: string
          notes?: string | null
          people_count?: number
          start_date?: string | null
          status?: string
          transport_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_tour_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_tour_requests_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          country: string
          created_at: string
          id: string
          image: string | null
          name: string
          region: string
          tour_count: number | null
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          image?: string | null
          name: string
          region: string
          tour_count?: number | null
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          region?: string
          tour_count?: number | null
        }
        Relationships: []
      }
      document_agent_access: {
        Row: {
          agent_id: string
          document_id: string
          granted_at: string
          granted_by: string
          id: string
          notes: string | null
          revoked_at: string | null
        }
        Insert: {
          agent_id: string
          document_id: string
          granted_at?: string
          granted_by: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
        }
        Update: {
          agent_id?: string
          document_id?: string
          granted_at?: string
          granted_by?: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_agent_access_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_agent_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "booking_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_toggles: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hotels: {
        Row: {
          address: string | null
          breakfast_included: boolean | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          description: string | null
          destination_id: string | null
          dinner_included: boolean | null
          email: string | null
          gallery: string[] | null
          has_air_conditioning: boolean | null
          has_gym: boolean | null
          has_parking: boolean | null
          has_pool: boolean | null
          has_restaurant: boolean | null
          has_spa: boolean | null
          has_wifi: boolean | null
          id: string
          image: string | null
          is_partner: boolean | null
          lunch_included: boolean | null
          name: string
          phone: string | null
          price_per_night: number | null
          room_count: number | null
          star_rating: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          breakfast_included?: boolean | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          description?: string | null
          destination_id?: string | null
          dinner_included?: boolean | null
          email?: string | null
          gallery?: string[] | null
          has_air_conditioning?: boolean | null
          has_gym?: boolean | null
          has_parking?: boolean | null
          has_pool?: boolean | null
          has_restaurant?: boolean | null
          has_spa?: boolean | null
          has_wifi?: boolean | null
          id?: string
          image?: string | null
          is_partner?: boolean | null
          lunch_included?: boolean | null
          name: string
          phone?: string | null
          price_per_night?: number | null
          room_count?: number | null
          star_rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          breakfast_included?: boolean | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          description?: string | null
          destination_id?: string | null
          dinner_included?: boolean | null
          email?: string | null
          gallery?: string[] | null
          has_air_conditioning?: boolean | null
          has_gym?: boolean | null
          has_parking?: boolean | null
          has_pool?: boolean | null
          has_restaurant?: boolean | null
          has_spa?: boolean | null
          has_wifi?: boolean | null
          id?: string
          image?: string | null
          is_partner?: boolean | null
          lunch_included?: boolean | null
          name?: string
          phone?: string | null
          price_per_night?: number | null
          room_count?: number | null
          star_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotels_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_analytics: {
        Row: {
          created_at: string
          id: string
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string | null
          time_spent_seconds: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_percent: number
          expires_at: string
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_percent?: number
          expires_at: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_percent?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          report_reason: string | null
          reported: boolean
          tour_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          report_reason?: string | null
          reported?: boolean
          tour_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          report_reason?: string | null
          reported?: boolean
          tour_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_impersonations: {
        Row: {
          company_id: string
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          super_admin_id: string
        }
        Insert: {
          company_id: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          super_admin_id: string
        }
        Update: {
          company_id?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          super_admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_impersonations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_companies: {
        Row: {
          about_html: string | null
          accent_color: string | null
          address: string | null
          approved_at: string | null
          approved_by: string | null
          banner_url: string | null
          city: string | null
          commission_rate: number | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          facebook: string | null
          favicon_url: string | null
          font_family: string | null
          id: string
          instagram: string | null
          is_active: boolean
          is_featured: boolean
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string | null
          rating: number | null
          review_count: number | null
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          status: string
          subscription_expires_at: string | null
          subscription_plan: string | null
          tagline: string | null
          telegram: string | null
          theme_config: Json | null
          total_bookings: number | null
          total_tours: number | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          about_html?: string | null
          accent_color?: string | null
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          rating?: number | null
          review_count?: number | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          tagline?: string | null
          telegram?: string | null
          theme_config?: Json | null
          total_bookings?: number | null
          total_tours?: number | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          about_html?: string | null
          accent_color?: string | null
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          rating?: number | null
          review_count?: number | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          tagline?: string | null
          telegram?: string | null
          theme_config?: Json | null
          total_bookings?: number | null
          total_tours?: number | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      tour_company_domains: {
        Row: {
          company_id: string
          created_at: string
          domain: string
          id: string
          is_primary: boolean
          is_subdomain: boolean
          is_verified: boolean
          ssl_status: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          domain: string
          id?: string
          is_primary?: boolean
          is_subdomain?: boolean
          is_verified?: boolean
          ssl_status?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          domain?: string
          id?: string
          is_primary?: boolean
          is_subdomain?: boolean
          is_verified?: boolean
          ssl_status?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_company_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_company_members: {
        Row: {
          branch_id: string | null
          company_id: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          permissions?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_company_subscriptions: {
        Row: {
          cancelled_at: string | null
          company_id: string
          created_at: string
          current_period_end: string | null
          id: string
          monthly_price_usd: number
          notes: string | null
          plan: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          monthly_price_usd?: number
          notes?: string | null
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          monthly_price_usd?: number
          notes?: string | null
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_hotels: {
        Row: {
          check_in_date: string | null
          check_out_date: string | null
          hotel_id: string
          id: string
          nights: number | null
          notes: string | null
          room_type: string | null
          tour_id: string
        }
        Insert: {
          check_in_date?: string | null
          check_out_date?: string | null
          hotel_id: string
          id?: string
          nights?: number | null
          notes?: string | null
          room_type?: string | null
          tour_id: string
        }
        Update: {
          check_in_date?: string | null
          check_out_date?: string | null
          hotel_id?: string
          id?: string
          nights?: number | null
          notes?: string | null
          room_type?: string | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_hotels_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_hotels_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_inclusions: {
        Row: {
          id: string
          included: boolean
          item: string
          tour_id: string
        }
        Insert: {
          id?: string
          included?: boolean
          item: string
          tour_id: string
        }
        Update: {
          id?: string
          included?: boolean
          item?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_inclusions_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_itineraries: {
        Row: {
          activities: string[] | null
          day: number
          description: string | null
          id: string
          title: string
          tour_id: string
        }
        Insert: {
          activities?: string[] | null
          day: number
          description?: string | null
          id?: string
          title: string
          tour_id: string
        }
        Update: {
          activities?: string[] | null
          day?: number
          description?: string | null
          id?: string
          title?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_itineraries_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_vehicles: {
        Row: {
          arrival_time: string | null
          departure_time: string | null
          dropoff_location: string | null
          id: string
          notes: string | null
          pickup_location: string | null
          tour_id: string
          vehicle_id: string
        }
        Insert: {
          arrival_time?: string | null
          departure_time?: string | null
          dropoff_location?: string | null
          id?: string
          notes?: string | null
          pickup_location?: string | null
          tour_id: string
          vehicle_id: string
        }
        Update: {
          arrival_time?: string | null
          departure_time?: string | null
          dropoff_location?: string | null
          id?: string
          notes?: string | null
          pickup_location?: string | null
          tour_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_vehicles_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          branch_id: string | null
          company_id: string | null
          country: string
          created_at: string
          description: string | null
          destination: string
          destination_id: string | null
          duration_days: number
          duration_nights: number
          featured: boolean | null
          gallery: string[] | null
          id: string
          image: string | null
          max_people: number | null
          operator_id: string | null
          original_price: number | null
          price: number
          rating: number | null
          review_count: number | null
          status: string | null
          title: string
          tour_type: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          company_id?: string | null
          country: string
          created_at?: string
          description?: string | null
          destination: string
          destination_id?: string | null
          duration_days: number
          duration_nights: number
          featured?: boolean | null
          gallery?: string[] | null
          id?: string
          image?: string | null
          max_people?: number | null
          operator_id?: string | null
          original_price?: number | null
          price: number
          rating?: number | null
          review_count?: number | null
          status?: string | null
          title: string
          tour_type?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string | null
          country?: string
          created_at?: string
          description?: string | null
          destination?: string
          destination_id?: string | null
          duration_days?: number
          duration_nights?: number
          featured?: boolean | null
          gallery?: string[] | null
          id?: string
          image?: string | null
          max_people?: number | null
          operator_id?: string | null
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          status?: string | null
          title?: string
          tour_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tour_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_at: string
          blocked_by: string
          id: string
          reason: string | null
          unblocked_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by: string
          id?: string
          reason?: string | null
          unblocked_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string
          id?: string
          reason?: string | null
          unblocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          capacity: number
          color: string | null
          created_at: string
          description: string | null
          driver_name: string | null
          driver_phone: string | null
          has_air_conditioning: boolean | null
          has_toilet: boolean | null
          has_tv: boolean | null
          has_wifi: boolean | null
          id: string
          image: string | null
          is_available: boolean | null
          model: string | null
          name: string
          plate_number: string | null
          price_per_day: number | null
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          brand?: string | null
          capacity: number
          color?: string | null
          created_at?: string
          description?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          has_air_conditioning?: boolean | null
          has_toilet?: boolean | null
          has_tv?: boolean | null
          has_wifi?: boolean | null
          id?: string
          image?: string | null
          is_available?: boolean | null
          model?: string | null
          name: string
          plate_number?: string | null
          price_per_day?: number | null
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          brand?: string | null
          capacity?: number
          color?: string | null
          created_at?: string
          description?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          has_air_conditioning?: boolean | null
          has_toilet?: boolean | null
          has_tv?: boolean | null
          has_wifi?: boolean | null
          id?: string
          image?: string | null
          is_available?: boolean | null
          model?: string | null
          name?: string
          plate_number?: string | null
          price_per_day?: number | null
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_current_user: { Args: never; Returns: undefined }
      get_branch_limit: { Args: { _plan: string }; Returns: number }
      get_company_plan: { Args: { _company_id: string }; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_owner: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "company_owner"
        | "company_staff"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "company_owner",
        "company_staff",
      ],
    },
  },
} as const
