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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          checked_in_at: string | null
          created_at: string
          face_verified: boolean | null
          gps_verified: boolean | null
          id: string
          lesson_id: string
          organization_id: string
          status: string
          student_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          face_verified?: boolean | null
          gps_verified?: boolean | null
          id?: string
          lesson_id: string
          organization_id?: string
          status?: string
          student_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          face_verified?: boolean | null
          gps_verified?: boolean | null
          id?: string
          lesson_id?: string
          organization_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
        }
        Relationships: []
      }
      branch_assignments: {
        Row: {
          assigned_at: string
          branch_id: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          branch_id: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          branch_id?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_assignments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          geofence_radius_m: number
          id: string
          is_active: boolean
          is_main: boolean
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          is_active?: boolean
          is_main?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          is_active?: boolean
          is_main?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          description: string | null
          grade: string | null
          id: string
          issued_at: string
          issued_by: string
          metadata: Json
          organization_id: string
          public_token: string
          score: number | null
          student_id: string
          subject: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          issued_at?: string
          issued_by: string
          metadata?: Json
          organization_id: string
          public_token?: string
          score?: number | null
          student_id: string
          subject?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          issued_at?: string
          issued_by?: string
          metadata?: Json
          organization_id?: string
          public_token?: string
          score?: number | null
          student_id?: string
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          organization_id: string
          student_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          organization_id?: string
          student_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          organization_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          branch_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          created_at: string
          description: string | null
          due_date: string
          id: string
          lesson_id: string
          max_score: number | null
          organization_id: string
          status: string
          teacher_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          lesson_id: string
          max_score?: number | null
          organization_id?: string
          status?: string
          teacher_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          lesson_id?: string
          max_score?: number | null
          organization_id?: string
          status?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          content: string | null
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          homework_id: string
          id: string
          organization_id: string
          score: number | null
          status: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          homework_id: string
          id?: string
          organization_id?: string
          score?: number | null
          status?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          homework_id?: string
          id?: string
          organization_id?: string
          score?: number | null
          status?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          branch_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          group_id: string | null
          id: string
          invoice_number: string
          issued_at: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_calls: {
        Row: {
          caller_name: string | null
          caller_user_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          lead_id: string
          next_followup_at: string | null
          notes: string | null
          outcome: string
        }
        Insert: {
          caller_name?: string | null
          caller_user_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id: string
          next_followup_at?: string | null
          notes?: string | null
          outcome?: string
        }
        Update: {
          caller_name?: string | null
          caller_user_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string
          next_followup_at?: string | null
          notes?: string | null
          outcome?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          conversion_value: number | null
          created_at: string
          created_org_id: string | null
          expected_students: number | null
          id: string
          last_contacted_at: string | null
          lost_reason: string | null
          message: string | null
          next_action_at: string | null
          notes: string | null
          org_name: string
          org_type: string
          priority: string
          source: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          conversion_value?: number | null
          created_at?: string
          created_org_id?: string | null
          expected_students?: number | null
          id?: string
          last_contacted_at?: string | null
          lost_reason?: string | null
          message?: string | null
          next_action_at?: string | null
          notes?: string | null
          org_name: string
          org_type?: string
          priority?: string
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          conversion_value?: number | null
          created_at?: string
          created_org_id?: string | null
          expected_students?: number | null
          id?: string
          last_contacted_at?: string | null
          lost_reason?: string | null
          message?: string | null
          next_action_at?: string | null
          notes?: string | null
          org_name?: string
          org_type?: string
          priority?: string
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_org_id_fkey"
            columns: ["created_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_topics: {
        Row: {
          covered_at: string | null
          created_at: string
          description: string | null
          group_id: string | null
          id: string
          organization_id: string
          planned_date: string | null
          position: number
          resource_id: string | null
          source: string
          status: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          covered_at?: string | null
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          organization_id: string
          planned_date?: string | null
          position?: number
          resource_id?: string | null
          source?: string
          status?: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          covered_at?: string | null
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          organization_id?: string
          planned_date?: string | null
          position?: number
          resource_id?: string | null
          source?: string
          status?: string
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          branch_id: string | null
          created_at: string
          ends_at: string
          id: string
          organization_id: string
          room_id: string | null
          starts_at: string
          status: string
          subject_id: string
          teacher_id: string
          teacher_notes: string | null
          title: string
          topic: string | null
          topic_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          organization_id?: string
          room_id?: string | null
          starts_at: string
          status?: string
          subject_id: string
          teacher_id: string
          teacher_notes?: string | null
          title: string
          topic?: string | null
          topic_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          organization_id?: string
          room_id?: string | null
          starts_at?: string
          status?: string
          subject_id?: string
          teacher_id?: string
          teacher_notes?: string | null
          title?: string
          topic?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          is_enabled: boolean
          kind: string
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          kind: string
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          kind?: string
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_alarm: boolean
          is_read: boolean
          lesson_id: string | null
          message: string
          organization_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_alarm?: boolean
          is_read?: boolean
          lesson_id?: string | null
          message: string
          organization_id?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_alarm?: boolean
          is_read?: boolean
          lesson_id?: string | null
          message?: string
          organization_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_coins: {
        Row: {
          amount: number
          created_at: string
          id: string
          organization_id: string
          reason: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          organization_id?: string
          reason: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          organization_id?: string
          reason?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          accent_color: string
          billing_tier: string
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          domain: string | null
          features: Json
          id: string
          logo_url: string | null
          max_students: number | null
          monthly_price: number | null
          name: string
          notes: string | null
          org_type: string
          plan_id: string | null
          primary_color: string
          slug: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          billing_tier?: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          domain?: string | null
          features?: Json
          id?: string
          logo_url?: string | null
          max_students?: number | null
          monthly_price?: number | null
          name: string
          notes?: string | null
          org_type?: string
          plan_id?: string | null
          primary_color?: string
          slug: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          billing_tier?: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          domain?: string | null
          features?: Json
          id?: string
          logo_url?: string | null
          max_students?: number | null
          monthly_price?: number | null
          name?: string
          notes?: string | null
          org_type?: string
          plan_id?: string | null
          primary_color?: string
          slug?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_students: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string
          parent_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          branch_id: string | null
          created_at: string
          currency: string
          description: string
          due_date: string | null
          id: string
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          received_by: string | null
          status: string
          student_charge_id: string | null
          student_id: string
          subject_id: string | null
        }
        Insert: {
          amount: number
          branch_id?: string | null
          created_at?: string
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          received_by?: string | null
          status?: string
          student_charge_id?: string | null
          student_id: string
          subject_id?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          received_by?: string | null
          status?: string
          student_charge_id?: string | null
          student_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string
          primary_branch_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          primary_branch_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          primary_branch_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_branch_id_fkey"
            columns: ["primary_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          branch_id: string | null
          capacity: number
          checkin_active: boolean
          created_at: string
          floor: string | null
          id: string
          name: string
          organization_id: string
          qr_code: string | null
        }
        Insert: {
          branch_id?: string | null
          capacity?: number
          checkin_active?: boolean
          created_at?: string
          floor?: string | null
          id?: string
          name: string
          organization_id?: string
          qr_code?: string | null
        }
        Update: {
          branch_id?: string | null
          capacity?: number
          checkin_active?: boolean
          created_at?: string
          floor?: string | null
          id?: string
          name?: string
          organization_id?: string
          qr_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          base_amount: number
          bonus_amount: number
          created_at: string
          currency: string
          deductions: number
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          period_month: string
          staff_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          base_amount?: number
          bonus_amount?: number
          created_at?: string
          currency?: string
          deductions?: number
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          period_month: string
          staff_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          base_amount?: number
          bonus_amount?: number
          created_at?: string
          currency?: string
          deductions?: number
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          period_month?: string
          staff_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          kind: string
          metadata: Json
          organization_id: string
          reason: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          organization_id: string
          reason?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          organization_id?: string
          reason?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_charges: {
        Row: {
          adjustment_reason: string | null
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          group_id: string | null
          id: string
          lesson_id: string | null
          notes: string | null
          organization_id: string
          original_amount: number | null
          paid_amount: number
          period_month: string | null
          status: string
          student_id: string
          subject_id: string | null
          tuition_plan_id: string | null
          updated_at: string
          waive_reason: string | null
          waived_at: string | null
          waived_by: string | null
        }
        Insert: {
          adjustment_reason?: string | null
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          group_id?: string | null
          id?: string
          lesson_id?: string | null
          notes?: string | null
          organization_id: string
          original_amount?: number | null
          paid_amount?: number
          period_month?: string | null
          status?: string
          student_id: string
          subject_id?: string | null
          tuition_plan_id?: string | null
          updated_at?: string
          waive_reason?: string | null
          waived_at?: string | null
          waived_by?: string | null
        }
        Update: {
          adjustment_reason?: string | null
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          group_id?: string | null
          id?: string
          lesson_id?: string | null
          notes?: string | null
          organization_id?: string
          original_amount?: number | null
          paid_amount?: number
          period_month?: string | null
          status?: string
          student_id?: string
          subject_id?: string | null
          tuition_plan_id?: string | null
          updated_at?: string
          waive_reason?: string | null
          waived_at?: string | null
          waived_by?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          highlight: boolean
          id: string
          is_active: boolean
          max_students: number
          max_teachers: number
          monthly_price: number
          name: string
          org_type: string
          paddle_monthly_product_id: string | null
          paddle_yearly_product_id: string | null
          sort_order: number
          tier: string
          updated_at: string
          yearly_price: number | null
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          highlight?: boolean
          id?: string
          is_active?: boolean
          max_students?: number
          max_teachers?: number
          monthly_price?: number
          name: string
          org_type?: string
          paddle_monthly_product_id?: string | null
          paddle_yearly_product_id?: string | null
          sort_order?: number
          tier?: string
          updated_at?: string
          yearly_price?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          highlight?: boolean
          id?: string
          is_active?: boolean
          max_students?: number
          max_teachers?: number
          monthly_price?: number
          name?: string
          org_type?: string
          paddle_monthly_product_id?: string | null
          paddle_yearly_product_id?: string | null
          sort_order?: number
          tier?: string
          updated_at?: string
          yearly_price?: number | null
        }
        Relationships: []
      }
      teacher_contracts: {
        Row: {
          base_amount: number | null
          bonus_rules: Json | null
          contract_type: string
          created_at: string
          created_by: string | null
          currency: string
          ends_on: string | null
          group_id: string | null
          id: string
          is_active: boolean
          monthly_amount: number | null
          notes: string | null
          organization_id: string
          per_lesson_amount: number | null
          percentage: number | null
          starts_on: string
          subject_id: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          base_amount?: number | null
          bonus_rules?: Json | null
          contract_type: string
          created_at?: string
          created_by?: string | null
          currency?: string
          ends_on?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          monthly_amount?: number | null
          notes?: string | null
          organization_id: string
          per_lesson_amount?: number | null
          percentage?: number | null
          starts_on?: string
          subject_id?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          base_amount?: number | null
          bonus_rules?: Json | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          ends_on?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          monthly_amount?: number | null
          notes?: string | null
          organization_id?: string
          per_lesson_amount?: number | null
          percentage?: number | null
          starts_on?: string
          subject_id?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_payouts: {
        Row: {
          breakdown: Json | null
          computed_amount: number
          contract_id: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          paid_by: string | null
          period_month: string
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          breakdown?: Json | null
          computed_amount?: number
          contract_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          paid_by?: string | null
          period_month: string
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          breakdown?: Json | null
          computed_amount?: number
          contract_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          paid_by?: string | null
          period_month?: string
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_resources: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          organization_id: string
          page_count: number | null
          subject_id: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          organization_id: string
          page_count?: number | null
          subject_id?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          organization_id?: string
          page_count?: number | null
          subject_id?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_chats: {
        Row: {
          bound_at: string
          chat_id: number
          id: string
          language_code: string | null
          notifications_enabled: boolean
          organization_id: string
          user_id: string
          username: string | null
        }
        Insert: {
          bound_at?: string
          chat_id: number
          id?: string
          language_code?: string | null
          notifications_enabled?: boolean
          organization_id?: string
          user_id: string
          username?: string | null
        }
        Update: {
          bound_at?: string
          chat_id?: number
          id?: string
          language_code?: string | null
          notifications_enabled?: boolean
          organization_id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          organization_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          organization_id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          organization_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          from_user_id: number | null
          handled: boolean
          raw_update: Json
          text: string | null
          update_id: number
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          from_user_id?: number | null
          handled?: boolean
          raw_update: Json
          text?: string | null
          update_id: number
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          from_user_id?: number | null
          handled?: boolean
          raw_update?: Json
          text?: string | null
          update_id?: number
          username?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          answers: Json
          id: string
          organization_id: string
          score: number
          started_at: string
          student_id: string
          submitted_at: string | null
          test_id: string
          total_points: number
        }
        Insert: {
          answers?: Json
          id?: string
          organization_id: string
          score?: number
          started_at?: string
          student_id: string
          submitted_at?: string | null
          test_id: string
          total_points?: number
        }
        Update: {
          answers?: Json
          id?: string
          organization_id?: string
          score?: number
          started_at?: string
          student_id?: string
          submitted_at?: string | null
          test_id?: string
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_key: string
          explanation: string | null
          id: string
          options: Json
          points: number
          position: number
          question_text: string
          test_id: string
        }
        Insert: {
          correct_key: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          position?: number
          question_text: string
          test_id: string
        }
        Update: {
          correct_key?: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          position?: number
          question_text?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          group_id: string | null
          id: string
          organization_id: string
          resource_id: string | null
          status: string
          subject_id: string | null
          teacher_id: string
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          group_id?: string | null
          id?: string
          organization_id: string
          resource_id?: string | null
          status?: string
          subject_id?: string | null
          teacher_id: string
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          group_id?: string | null
          id?: string
          organization_id?: string
          resource_id?: string | null
          status?: string
          subject_id?: string | null
          teacher_id?: string
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: []
      }
      tuition_plans: {
        Row: {
          amount: number
          billing_mode: string
          created_at: string
          currency: string
          group_id: string | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_mode?: string
          created_at?: string
          currency?: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_mode?: string
          created_at?: string
          currency?: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          organization_id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_blocks: {
        Row: {
          block_type: string
          created_at: string
          id: string
          is_visible: boolean
          payload: Json
          position: number
          updated_at: string
          website_id: string
        }
        Insert: {
          block_type: string
          created_at?: string
          id?: string
          is_visible?: boolean
          payload?: Json
          position?: number
          updated_at?: string
          website_id: string
        }
        Update: {
          block_type?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          payload?: Json
          position?: number
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_blocks_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_pages: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          page_type: string
          payload: Json
          show_in_nav: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
          website_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          page_type?: string
          payload?: Json
          show_in_nav?: boolean
          slug: string
          sort_order?: number
          title?: string
          updated_at?: string
          website_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          page_type?: string
          payload?: Json
          show_in_nav?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          accent_color: string | null
          created_at: string
          custom_domain: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          organization_id: string
          primary_color: string | null
          slug: string
          tagline: string | null
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          organization_id: string
          primary_color?: string | null
          slug: string
          tagline?: string | null
          theme?: string
          title?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          organization_id?: string
          primary_color?: string | null
          slug?: string
          tagline?: string | null
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_student_charge: {
        Args: {
          _action: string
          _charge_id: string
          _new_amount: number
          _reason: string
        }
        Returns: boolean
      }
      apply_payment_to_charge: {
        Args: { _amount: number; _charge_id: string }
        Returns: undefined
      }
      claim_signup_for_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      current_user_has_feature: { Args: { _feature: string }; Returns: boolean }
      delete_organization: { Args: { _org_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      org_has_feature: {
        Args: { _feature: string; _org_id: string }
        Returns: boolean
      }
      org_id_by_site_slug: { Args: { _slug: string }; Returns: string }
      remove_user_from_org: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      render_template: { Args: { _tpl: string; _vars: Json }; Returns: string }
      site_branding_by_slug: {
        Args: { _slug: string }
        Returns: {
          accent_color: string
          is_published: boolean
          org_id: string
          org_logo_url: string
          org_name: string
          primary_color: string
          site_tagline: string
          site_title: string
        }[]
      }
      site_page_by_slug: {
        Args: { _page_slug: string; _slug: string }
        Returns: {
          page_id: string
          page_slug: string
          page_title: string
          page_type: string
          payload: Json
        }[]
      }
      site_pages_by_slug: {
        Args: { _slug: string }
        Returns: {
          page_id: string
          page_slug: string
          page_title: string
          page_type: string
          show_in_nav: boolean
          sort_order: number
        }[]
      }
      user_branches: { Args: { _user_id: string }; Returns: string[] }
      user_in_branch: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      user_org_id: { Args: { _user_id: string }; Returns: string }
      user_organization: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin"
        | "teacher"
        | "student"
        | "parent"
        | "superadmin"
        | "accountant"
        | "owner"
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
        "teacher",
        "student",
        "parent",
        "superadmin",
        "accountant",
        "owner",
      ],
    },
  },
} as const
