-- =============================================================================
-- Plantory — Migration 0001: extensions & enums
-- Defines the fixed vocabularies (Postgres enums) used across the whole schema.
-- Money convention: numeric(12,2) rupees everywhere (see CLAUDE.md §2).
-- =============================================================================

-- pgcrypto: gen_random_uuid() is in core, but we also use gen_random_bytes()
-- for unguessable public tokens (invoice links, plant QR slugs).
create extension if not exists pgcrypto;

-- Roles a user can hold within an organization.
create type public.user_role as enum ('owner', 'admin', 'outlet_manager', 'staff');

-- Supported content/UI/customer languages.
create type public.app_language as enum ('en', 'hi');

-- Invoice rendering language (adds bilingual on top of app languages).
create type public.invoice_language as enum ('en', 'hi', 'bilingual');

-- Every inventory change is one of these movement types (CLAUDE.md §4).
create type public.stock_movement_type as enum (
  'purchase', 'sale', 'transfer_out', 'transfer_in',
  'mortality', 'damage', 'adjustment', 'return_in'
);

-- Lifecycle of a purchase and a sale (financial docs are voided, never deleted).
create type public.purchase_status as enum ('draft', 'finalized', 'voided');
create type public.sale_status as enum ('draft', 'completed', 'voided');

-- Manual payment recording (V1: no gateway).
create type public.payment_method as enum (
  'cash', 'upi', 'card', 'bank_transfer', 'cheque', 'other'
);

-- A payment is either received from a customer or paid to a supplier.
create type public.payment_direction as enum ('customer_in', 'supplier_out');

-- Reasons a plant leaves stock as a loss.
create type public.loss_reason as enum (
  'died', 'damage', 'pest_disease', 'transport_damage', 'unknown', 'other'
);

-- Returns are either refunded or replaced.
create type public.return_type as enum ('refund', 'replacement');

-- Operating expense categories (purchase-related expenses live on the purchase).
create type public.expense_category as enum (
  'labour', 'rent', 'electricity', 'water', 'fertilizer', 'pesticides',
  'fuel', 'maintenance', 'marketing', 'miscellaneous'
);

-- How purchase-related expenses are allocated into landed cost (V1 default: value).
create type public.cost_allocation_method as enum (
  'purchase_value', 'quantity', 'weight', 'volume', 'manual'
);

-- WhatsApp message tracking (schema ready for future Cloud API; V1 uses deep links).
create type public.whatsapp_message_type as enum (
  'invoice', 'payment_receipt', 'payment_reminder',
  'order_confirmation', 'enquiry', 'marketing'
);
create type public.whatsapp_message_status as enum (
  'deep_link_opened', 'queued', 'sent', 'delivered', 'read', 'failed'
);

-- Day-close (cash reconciliation) lifecycle.
create type public.day_close_status as enum ('open', 'finalized');
