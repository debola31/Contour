-- ============================================================
-- Inventory Module Tables
-- Created: 2026-01-14
-- ============================================================

BEGIN;

-- ============================================================
-- 1. INVENTORY ITEMS TABLE
-- Core inventory item records with primary unit tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."inventory_items"
(
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "company_id" uuid NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "sku" text,
    "primary_unit" text NOT NULL,
    "quantity" numeric NOT NULL DEFAULT 0,
    "cost_per_unit" numeric(12,4),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY (id),
    CONSTRAINT "inventory_items_quantity_non_negative" CHECK (quantity >= 0),
    CONSTRAINT "inventory_items_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Indexes for inventory_items
CREATE INDEX IF NOT EXISTS "inventory_items_company_id_name_idx" ON "public"."inventory_items" (company_id, name);
CREATE INDEX IF NOT EXISTS "inventory_items_company_id_sku_idx" ON "public"."inventory_items" (company_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS "inventory_items_company_id_idx" ON "public"."inventory_items" (company_id);

-- ============================================================
-- 2. INVENTORY UNIT CONVERSIONS TABLE
-- Secondary units with conversion factors to primary unit
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."inventory_unit_conversions"
(
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "inventory_item_id" uuid NOT NULL,
    "from_unit" text NOT NULL,
    "to_primary_factor" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "inventory_unit_conversions_pkey" PRIMARY KEY (id),
    CONSTRAINT "inventory_unit_conversions_item_unit_unique" UNIQUE (inventory_item_id, from_unit),
    CONSTRAINT "inventory_unit_conversions_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT "inventory_unit_conversions_factor_positive" CHECK (to_primary_factor > 0)
);

-- Index for unit conversions
CREATE INDEX IF NOT EXISTS "inventory_unit_conversions_item_id_idx" ON "public"."inventory_unit_conversions" (inventory_item_id);

-- ============================================================
-- 3. INVENTORY TRANSACTIONS TABLE
-- Full audit trail of all inventory changes
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."inventory_transactions"
(
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "company_id" uuid NOT NULL,
    "inventory_item_id" uuid,
    "item_name" text NOT NULL,
    "type" text NOT NULL,
    "quantity" numeric NOT NULL,
    "unit" text NOT NULL,
    "converted_quantity" numeric NOT NULL,
    "job_id" uuid,
    "job_operation_id" uuid,
    "operator_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "created_by" uuid,
    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY (id),
    CONSTRAINT "inventory_transactions_type_check" CHECK (type = ANY (ARRAY['addition'::text, 'depletion'::text, 'adjustment'::text])),
    CONSTRAINT "inventory_transactions_quantity_positive" CHECK (quantity >= 0),
    CONSTRAINT "inventory_transactions_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT "inventory_transactions_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL,
    CONSTRAINT "inventory_transactions_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    CONSTRAINT "inventory_transactions_job_operation_id_fkey" FOREIGN KEY (job_operation_id) REFERENCES job_operations(id) ON DELETE SET NULL
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS "inventory_transactions_item_id_created_at_idx" ON "public"."inventory_transactions" (inventory_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS "inventory_transactions_company_id_created_at_idx" ON "public"."inventory_transactions" (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS "inventory_transactions_job_id_idx" ON "public"."inventory_transactions" (job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS "inventory_transactions_job_operation_id_idx" ON "public"."inventory_transactions" (job_operation_id) WHERE job_operation_id IS NOT NULL;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."inventory_unit_conversions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."inventory_transactions" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES FOR INVENTORY_ITEMS
-- ============================================================
DROP POLICY IF EXISTS "Users can view inventory_items" ON "public"."inventory_items";
CREATE POLICY "Users can view inventory_items"
    ON "public"."inventory_items"
    FOR SELECT
    USING ((company_id IN (SELECT get_user_company_ids())));

DROP POLICY IF EXISTS "Users can insert inventory_items" ON "public"."inventory_items";
CREATE POLICY "Users can insert inventory_items"
    ON "public"."inventory_items"
    FOR INSERT
    WITH CHECK ((company_id IN (SELECT get_user_company_ids())));

DROP POLICY IF EXISTS "Users can update inventory_items" ON "public"."inventory_items";
CREATE POLICY "Users can update inventory_items"
    ON "public"."inventory_items"
    FOR UPDATE
    USING ((company_id IN (SELECT get_user_company_ids())));

DROP POLICY IF EXISTS "Users can delete inventory_items" ON "public"."inventory_items";
CREATE POLICY "Users can delete inventory_items"
    ON "public"."inventory_items"
    FOR DELETE
    USING ((company_id IN (SELECT get_user_company_ids())));

-- ============================================================
-- 6. RLS POLICIES FOR INVENTORY_UNIT_CONVERSIONS
-- ============================================================
DROP POLICY IF EXISTS "Users can view inventory_unit_conversions" ON "public"."inventory_unit_conversions";
CREATE POLICY "Users can view inventory_unit_conversions"
    ON "public"."inventory_unit_conversions"
    FOR SELECT
    USING ((inventory_item_id IN (
        SELECT id FROM inventory_items WHERE company_id IN (SELECT get_user_company_ids())
    )));

DROP POLICY IF EXISTS "Users can insert inventory_unit_conversions" ON "public"."inventory_unit_conversions";
CREATE POLICY "Users can insert inventory_unit_conversions"
    ON "public"."inventory_unit_conversions"
    FOR INSERT
    WITH CHECK ((inventory_item_id IN (
        SELECT id FROM inventory_items WHERE company_id IN (SELECT get_user_company_ids())
    )));

DROP POLICY IF EXISTS "Users can update inventory_unit_conversions" ON "public"."inventory_unit_conversions";
CREATE POLICY "Users can update inventory_unit_conversions"
    ON "public"."inventory_unit_conversions"
    FOR UPDATE
    USING ((inventory_item_id IN (
        SELECT id FROM inventory_items WHERE company_id IN (SELECT get_user_company_ids())
    )));

DROP POLICY IF EXISTS "Users can delete inventory_unit_conversions" ON "public"."inventory_unit_conversions";
CREATE POLICY "Users can delete inventory_unit_conversions"
    ON "public"."inventory_unit_conversions"
    FOR DELETE
    USING ((inventory_item_id IN (
        SELECT id FROM inventory_items WHERE company_id IN (SELECT get_user_company_ids())
    )));

-- ============================================================
-- 7. RLS POLICIES FOR INVENTORY_TRANSACTIONS
-- ============================================================
DROP POLICY IF EXISTS "Users can view inventory_transactions" ON "public"."inventory_transactions";
CREATE POLICY "Users can view inventory_transactions"
    ON "public"."inventory_transactions"
    FOR SELECT
    USING ((company_id IN (SELECT get_user_company_ids())));

DROP POLICY IF EXISTS "Users can insert inventory_transactions" ON "public"."inventory_transactions";
CREATE POLICY "Users can insert inventory_transactions"
    ON "public"."inventory_transactions"
    FOR INSERT
    WITH CHECK ((company_id IN (SELECT get_user_company_ids())));

-- Transactions are immutable - no update or delete policies

-- ============================================================
-- 8. TRIGGER FOR UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_inventory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_items_updated_at ON "public"."inventory_items";
CREATE TRIGGER inventory_items_updated_at
    BEFORE UPDATE ON "public"."inventory_items"
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_items_updated_at();

-- ============================================================
-- 9. COMMENTS
-- ============================================================
COMMENT ON TABLE "public"."inventory_items" IS 'Core inventory item records with primary unit tracking. Stores materials, supplies, and other trackable items.';
COMMENT ON COLUMN "public"."inventory_items"."primary_unit" IS 'Base unit of measure (e.g., lbs, kg, pcs)';
COMMENT ON COLUMN "public"."inventory_items"."quantity" IS 'Current quantity in primary unit, must be >= 0';

COMMENT ON TABLE "public"."inventory_unit_conversions" IS 'Secondary units with conversion factors to primary unit. Enables flexible inventory tracking (FR-1).';
COMMENT ON COLUMN "public"."inventory_unit_conversions"."to_primary_factor" IS 'Multiply quantity in from_unit by this factor to get quantity in primary unit';

COMMENT ON TABLE "public"."inventory_transactions" IS 'Full audit trail of all inventory changes (FR-13). Transactions are immutable.';
COMMENT ON COLUMN "public"."inventory_transactions"."item_name" IS 'Snapshot of item name at transaction time for audit trail (preserved if item deleted)';
COMMENT ON COLUMN "public"."inventory_transactions"."type" IS 'addition (stock in), depletion (stock out), adjustment (correction)';
COMMENT ON COLUMN "public"."inventory_transactions"."converted_quantity" IS 'Quantity converted to primary unit';

COMMIT;
