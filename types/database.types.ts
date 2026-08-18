export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_value: Json | null
          note: string | null
          old_value: Json | null
          organization_id: string
          outlet_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          organization_id: string
          outlet_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          organization_id?: string
          outlet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          preferred_language: Database["public"]["Enums"]["app_language"]
          updated_at: string
          whatsapp_number: string | null
          whatsapp_opt_in: boolean
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["app_language"]
          updated_at?: string
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["app_language"]
          updated_at?: string
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      day_closes: {
        Row: {
          business_date: string
          counted_cash: number | null
          created_at: string
          created_by: string | null
          expected_by_method: Json | null
          expected_cash: number
          finalized_at: string | null
          finalized_by: string | null
          id: string
          note: string | null
          opened_by: string | null
          organization_id: string
          outlet_id: string
          status: Database["public"]["Enums"]["day_close_status"]
          updated_at: string
          variance: number | null
        }
        Insert: {
          business_date: string
          counted_cash?: number | null
          created_at?: string
          created_by?: string | null
          expected_by_method?: Json | null
          expected_cash?: number
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          note?: string | null
          opened_by?: string | null
          organization_id: string
          outlet_id: string
          status?: Database["public"]["Enums"]["day_close_status"]
          updated_at?: string
          variance?: number | null
        }
        Update: {
          business_date?: string
          counted_cash?: number | null
          created_at?: string
          created_by?: string | null
          expected_by_method?: Json | null
          expected_cash?: number
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          note?: string | null
          opened_by?: string | null
          organization_id?: string
          outlet_id?: string
          status?: Database["public"]["Enums"]["day_close_status"]
          updated_at?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "day_closes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_closes_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_closes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_closes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_closes_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          organization_id: string
          outlet_id: string | null
          receipt_path: string | null
          spent_at: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          organization_id: string
          outlet_id?: string | null
          receipt_path?: string | null
          spent_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          organization_id?: string
          outlet_id?: string | null
          receipt_path?: string | null
          spent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          landed_unit_cost: number
          note: string | null
          organization_id: string
          outlet_id: string
          plant_id: string
          purchase_item_id: string | null
          qty_received: number
          qty_remaining: number
          received_at: string
          size_id: string
          source_batch_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          landed_unit_cost: number
          note?: string | null
          organization_id: string
          outlet_id: string
          plant_id: string
          purchase_item_id?: string | null
          qty_received: number
          qty_remaining: number
          received_at?: string
          size_id: string
          source_batch_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          landed_unit_cost?: number
          note?: string | null
          organization_id?: string
          outlet_id?: string
          plant_id?: string
          purchase_item_id?: string | null
          qty_received?: number
          qty_remaining?: number
          received_at?: string
          size_id?: string
          source_batch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_purchase_item_id_fkey"
            columns: ["purchase_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "plant_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_source_batch_id_fkey"
            columns: ["source_batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          below_min_override_role: Database["public"]["Enums"]["user_role"]
          cost_allocation_method: Database["public"]["Enums"]["cost_allocation_method"]
          inventory_costing: string
          min_margin_pct: number
          organization_id: string
          price_rounding_step: number
          target_margin_pct: number
          updated_at: string
        }
        Insert: {
          below_min_override_role?: Database["public"]["Enums"]["user_role"]
          cost_allocation_method?: Database["public"]["Enums"]["cost_allocation_method"]
          inventory_costing?: string
          min_margin_pct?: number
          organization_id: string
          price_rounding_step?: number
          target_margin_pct?: number
          updated_at?: string
        }
        Update: {
          below_min_override_role?: Database["public"]["Enums"]["user_role"]
          cost_allocation_method?: Database["public"]["Enums"]["cost_allocation_method"]
          inventory_costing?: string
          min_margin_pct?: number
          organization_id?: string
          price_rounding_step?: number
          target_margin_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          default_language: Database["public"]["Enums"]["app_language"]
          gst_enabled: boolean
          gstin: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          default_language?: Database["public"]["Enums"]["app_language"]
          gst_enabled?: boolean
          gstin?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          default_language?: Database["public"]["Enums"]["app_language"]
          gst_enabled?: boolean
          gstin?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      outlets: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outlets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          organization_id: string
          outlet_id: string | null
          paid_at: string
          purchase_id: string | null
          reference: string | null
          sale_id: string | null
          supplier_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          organization_id: string
          outlet_id?: string | null
          paid_at?: string
          purchase_id?: string | null
          reference?: string | null
          sale_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          direction?: Database["public"]["Enums"]["payment_direction"]
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          organization_id?: string
          outlet_id?: string | null
          paid_at?: string
          purchase_id?: string | null
          reference?: string | null
          sale_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_categories: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          name_en: string
          name_hi: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name_en: string
          name_hi?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name_en?: string
          name_hi?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_images: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          id: string
          is_primary: boolean
          organization_id: string
          plant_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          organization_id: string
          plant_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          organization_id?: string
          plant_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_images_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_images_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_losses: {
        Row: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          loss_date: string
          note: string | null
          organization_id: string
          outlet_id: string
          plant_id: string
          quantity: number
          reason: Database["public"]["Enums"]["loss_reason"]
          size_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          loss_date?: string
          note?: string | null
          organization_id: string
          outlet_id: string
          plant_id: string
          quantity: number
          reason: Database["public"]["Enums"]["loss_reason"]
          size_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          loss_date?: string
          note?: string | null
          organization_id?: string
          outlet_id?: string
          plant_id?: string
          quantity?: number
          reason?: Database["public"]["Enums"]["loss_reason"]
          size_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_losses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_losses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_losses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_losses_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_losses_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "plant_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_prices: {
        Row: {
          created_at: string
          id: string
          min_price: number | null
          organization_id: string
          plant_id: string
          recommended_price: number | null
          retail_price: number | null
          size_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          min_price?: number | null
          organization_id: string
          plant_id: string
          recommended_price?: number | null
          retail_price?: number | null
          size_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          min_price?: number | null
          organization_id?: string
          plant_id?: string
          recommended_price?: number | null
          retail_price?: number | null
          size_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_prices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_prices_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_prices_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "plant_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_prices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_sizes: {
        Row: {
          active: boolean
          bag_size: string | null
          created_at: string
          height_ft: number | null
          id: string
          label: string
          organization_id: string
          plant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bag_size?: string | null
          created_at?: string
          height_ft?: number | null
          id?: string
          label: string
          organization_id: string
          plant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bag_size?: string | null
          created_at?: string
          height_ft?: number | null
          id?: string
          label?: string
          organization_id?: string
          plant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_sizes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_sizes_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          active: boolean
          care_en: string | null
          care_hi: string | null
          category_id: string | null
          common_name_en: string
          common_name_hi: string | null
          created_at: string
          created_by: string | null
          description_en: string | null
          description_hi: string | null
          id: string
          local_name: string | null
          organization_id: string
          placement: Database["public"]["Enums"]["placement"] | null
          public_slug: string
          scientific_name: string | null
          sku: string | null
          sunlight: Database["public"]["Enums"]["sunlight_requirement"] | null
          unit: string
          updated_at: string
          variety: string | null
          water: Database["public"]["Enums"]["water_requirement"] | null
        }
        Insert: {
          active?: boolean
          care_en?: string | null
          care_hi?: string | null
          category_id?: string | null
          common_name_en: string
          common_name_hi?: string | null
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_hi?: string | null
          id?: string
          local_name?: string | null
          organization_id: string
          placement?: Database["public"]["Enums"]["placement"] | null
          public_slug?: string
          scientific_name?: string | null
          sku?: string | null
          sunlight?: Database["public"]["Enums"]["sunlight_requirement"] | null
          unit?: string
          updated_at?: string
          variety?: string | null
          water?: Database["public"]["Enums"]["water_requirement"] | null
        }
        Update: {
          active?: boolean
          care_en?: string | null
          care_hi?: string | null
          category_id?: string | null
          common_name_en?: string
          common_name_hi?: string | null
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_hi?: string | null
          id?: string
          local_name?: string | null
          organization_id?: string
          placement?: Database["public"]["Enums"]["placement"] | null
          public_slug?: string
          scientific_name?: string | null
          sku?: string | null
          sunlight?: Database["public"]["Enums"]["sunlight_requirement"] | null
          unit?: string
          updated_at?: string
          variety?: string | null
          water?: Database["public"]["Enums"]["water_requirement"] | null
        }
        Relationships: [
          {
            foreignKeyName: "plants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "plant_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          full_name: string
          id: string
          mobile: string | null
          organization_id: string
          preferred_language: Database["public"]["Enums"]["app_language"]
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          full_name: string
          id: string
          mobile?: string | null
          organization_id: string
          preferred_language?: Database["public"]["Enums"]["app_language"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          organization_id?: string
          preferred_language?: Database["public"]["Enums"]["app_language"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_expenses: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          organization_id: string
          outlet_id: string
          purchase_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          label: string
          organization_id: string
          outlet_id: string
          purchase_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          organization_id?: string
          outlet_id?: string
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_expenses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_expenses_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          allocated_expense: number
          created_at: string
          id: string
          landed_line_total: number | null
          landed_unit_cost: number | null
          line_amount: number
          organization_id: string
          outlet_id: string
          plant_id: string
          purchase_id: string
          quantity: number
          size_id: string
          unit_cost: number
        }
        Insert: {
          allocated_expense?: number
          created_at?: string
          id?: string
          landed_line_total?: number | null
          landed_unit_cost?: number | null
          line_amount: number
          organization_id: string
          outlet_id: string
          plant_id: string
          purchase_id: string
          quantity: number
          size_id: string
          unit_cost: number
        }
        Update: {
          allocated_expense?: number
          created_at?: string
          id?: string
          landed_line_total?: number | null
          landed_unit_cost?: number | null
          line_amount?: number
          organization_id?: string
          outlet_id?: string
          plant_id?: string
          purchase_id?: string
          quantity?: number
          size_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "plant_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string | null
          expenses_total: number
          id: string
          items_subtotal: number
          landed_total: number
          notes: string | null
          organization_id: string
          outlet_id: string
          purchase_date: string
          source_location: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          supplier_id: string | null
          supplier_invoice_no: string | null
          truck_number: string | null
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expenses_total?: number
          id?: string
          items_subtotal?: number
          landed_total?: number
          notes?: string | null
          organization_id: string
          outlet_id: string
          purchase_date?: string
          source_location?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          supplier_invoice_no?: string | null
          truck_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expenses_total?: number
          id?: string
          items_subtotal?: number
          landed_total?: number
          notes?: string | null
          organization_id?: string
          outlet_id?: string
          purchase_date?: string
          source_location?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          supplier_invoice_no?: string | null
          truck_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          outlet_id: string
          quantity: number
          restock: boolean
          return_id: string
          sale_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          outlet_id: string
          quantity: number
          restock?: boolean
          return_id: string
          sale_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          outlet_id?: string
          quantity?: number
          restock?: boolean
          return_id?: string
          sale_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          organization_id: string
          outlet_id: string
          reason: string | null
          refund_amount: number
          return_type: Database["public"]["Enums"]["return_type"]
          sale_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          organization_id: string
          outlet_id: string
          reason?: string | null
          refund_amount?: number
          return_type: Database["public"]["Enums"]["return_type"]
          sale_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          organization_id?: string
          outlet_id?: string
          reason?: string | null
          refund_amount?: number
          return_type?: Database["public"]["Enums"]["return_type"]
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          below_min: boolean
          cost_total: number
          created_at: string
          discount: number
          id: string
          line_total: number
          organization_id: string
          outlet_id: string
          override_by: string | null
          plant_id: string
          plant_name_snapshot: string
          profit_total: number
          quantity: number
          sale_id: string
          size_id: string
          size_label_snapshot: string | null
          unit_price: number
        }
        Insert: {
          below_min?: boolean
          cost_total?: number
          created_at?: string
          discount?: number
          id?: string
          line_total: number
          organization_id: string
          outlet_id: string
          override_by?: string | null
          plant_id: string
          plant_name_snapshot: string
          profit_total?: number
          quantity: number
          sale_id: string
          size_id: string
          size_label_snapshot?: string | null
          unit_price: number
        }
        Update: {
          below_min?: boolean
          cost_total?: number
          created_at?: string
          discount?: number
          id?: string
          line_total?: number
          organization_id?: string
          outlet_id?: string
          override_by?: string | null
          plant_id?: string
          plant_name_snapshot?: string
          profit_total?: number
          quantity?: number
          sale_id?: string
          size_id?: string
          size_label_snapshot?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "plant_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount_total: number
          id: string
          invoice_language: Database["public"]["Enums"]["invoice_language"]
          invoice_no: string | null
          invoice_token: string
          items_subtotal: number
          notes: string | null
          organization_id: string
          outlet_id: string
          outstanding: number
          sale_date: string
          sold_by: string | null
          status: Database["public"]["Enums"]["sale_status"]
          tax_total: number
          total: number
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_total?: number
          id?: string
          invoice_language?: Database["public"]["Enums"]["invoice_language"]
          invoice_no?: string | null
          invoice_token?: string
          items_subtotal?: number
          notes?: string | null
          organization_id: string
          outlet_id: string
          outstanding?: number
          sale_date?: string
          sold_by?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          tax_total?: number
          total?: number
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_total?: number
          id?: string
          invoice_language?: Database["public"]["Enums"]["invoice_language"]
          invoice_no?: string | null
          invoice_token?: string
          items_subtotal?: number
          notes?: string | null
          organization_id?: string
          outlet_id?: string
          outstanding?: number
          sale_date?: string
          sold_by?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          tax_total?: number
          total?: number
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          note: string | null
          organization_id: string
          outlet_id: string
          plant_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          size_id: string
          unit_cost: number | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          note?: string | null
          organization_id: string
          outlet_id: string
          plant_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          size_id: string
          unit_cost?: number | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          note?: string | null
          organization_id?: string
          outlet_id?: string
          plant_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          size_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "plant_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          plant_id: string
          quantity: number
          size_id: string
          transfer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          plant_id: string
          quantity: number
          size_id: string
          transfer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          plant_id?: string
          quantity?: number
          size_id?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "plant_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          from_outlet_id: string
          id: string
          note: string | null
          organization_id: string
          status: string
          to_outlet_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_outlet_id: string
          id?: string
          note?: string | null
          organization_id: string
          status?: string
          to_outlet_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_outlet_id?: string
          id?: string
          note?: string | null
          organization_id?: string
          status?: string
          to_outlet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_from_outlet_id_fkey"
            columns: ["from_outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_outlet_id_fkey"
            columns: ["to_outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          gstin: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          gstin?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          gstin?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_outlets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          outlet_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          outlet_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          outlet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_outlets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_outlets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_outlets_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_outlets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          error_message: string | null
          id: string
          message_type: Database["public"]["Enums"]["whatsapp_message_type"]
          organization_id: string
          provider_message_id: string | null
          recipient: string | null
          sale_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["whatsapp_message_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          message_type: Database["public"]["Enums"]["whatsapp_message_type"]
          organization_id: string
          provider_message_id?: string | null
          recipient?: string | null
          sale_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["whatsapp_message_type"]
          organization_id?: string
          provider_message_id?: string | null
          recipient?: string | null
          sale_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_org_id: { Args: never; Returns: string }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      finalize_purchase: { Args: { p_purchase_id: string }; Returns: undefined }
      get_outlet_stock: {
        Args: { p_outlet: string }
        Returns: {
          plant_id: string
          qty_available: number
          size_id: string
          size_label: string
        }[]
      }
      get_public_invoice: { Args: { p_token: string }; Returns: Json }
      get_public_plant: { Args: { p_slug: string }; Returns: Json }
      is_member_of_outlet: { Args: { target_outlet: string }; Returns: boolean }
      is_org_admin: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      set_my_language: {
        Args: { p_lang: Database["public"]["Enums"]["app_language"] }
        Returns: undefined
      }
    }
    Enums: {
      app_language: "en" | "hi"
      cost_allocation_method:
        | "purchase_value"
        | "quantity"
        | "weight"
        | "volume"
        | "manual"
      day_close_status: "open" | "finalized"
      expense_category:
        | "labour"
        | "rent"
        | "electricity"
        | "water"
        | "fertilizer"
        | "pesticides"
        | "fuel"
        | "maintenance"
        | "marketing"
        | "miscellaneous"
      invoice_language: "en" | "hi" | "bilingual"
      loss_reason:
        | "died"
        | "damage"
        | "pest_disease"
        | "transport_damage"
        | "unknown"
        | "other"
      payment_direction: "customer_in" | "supplier_out"
      payment_method:
        | "cash"
        | "upi"
        | "card"
        | "bank_transfer"
        | "cheque"
        | "other"
      placement: "indoor" | "outdoor" | "both"
      purchase_status: "draft" | "finalized" | "voided"
      return_type: "refund" | "replacement"
      sale_status: "draft" | "completed" | "voided"
      stock_movement_type:
        | "purchase"
        | "sale"
        | "transfer_out"
        | "transfer_in"
        | "mortality"
        | "damage"
        | "adjustment"
        | "return_in"
      sunlight_requirement: "full_sun" | "partial_shade" | "full_shade"
      user_role: "owner" | "admin" | "outlet_manager" | "staff"
      water_requirement: "low" | "medium" | "high"
      whatsapp_message_status:
        | "deep_link_opened"
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
      whatsapp_message_type:
        | "invoice"
        | "payment_receipt"
        | "payment_reminder"
        | "order_confirmation"
        | "enquiry"
        | "marketing"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_language: ["en", "hi"],
      cost_allocation_method: [
        "purchase_value",
        "quantity",
        "weight",
        "volume",
        "manual",
      ],
      day_close_status: ["open", "finalized"],
      expense_category: [
        "labour",
        "rent",
        "electricity",
        "water",
        "fertilizer",
        "pesticides",
        "fuel",
        "maintenance",
        "marketing",
        "miscellaneous",
      ],
      invoice_language: ["en", "hi", "bilingual"],
      loss_reason: [
        "died",
        "damage",
        "pest_disease",
        "transport_damage",
        "unknown",
        "other",
      ],
      payment_direction: ["customer_in", "supplier_out"],
      payment_method: [
        "cash",
        "upi",
        "card",
        "bank_transfer",
        "cheque",
        "other",
      ],
      placement: ["indoor", "outdoor", "both"],
      purchase_status: ["draft", "finalized", "voided"],
      return_type: ["refund", "replacement"],
      sale_status: ["draft", "completed", "voided"],
      stock_movement_type: [
        "purchase",
        "sale",
        "transfer_out",
        "transfer_in",
        "mortality",
        "damage",
        "adjustment",
        "return_in",
      ],
      sunlight_requirement: ["full_sun", "partial_shade", "full_shade"],
      user_role: ["owner", "admin", "outlet_manager", "staff"],
      water_requirement: ["low", "medium", "high"],
      whatsapp_message_status: [
        "deep_link_opened",
        "queued",
        "sent",
        "delivered",
        "read",
        "failed",
      ],
      whatsapp_message_type: [
        "invoice",
        "payment_receipt",
        "payment_reminder",
        "order_confirmation",
        "enquiry",
        "marketing",
      ],
    },
  },
} as const

