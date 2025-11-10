-- Complete Transactions Table Setup for Payment System
-- This ensures your transactions table has all required columns
-- Copy and paste this into Supabase SQL Editor

-- =============================================================================
-- STEP 1: Verify and Add Missing Columns
-- =============================================================================

-- Add commission column (stores amount and rate)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'commission'
    ) THEN
        ALTER TABLE transactions ADD COLUMN commission JSONB DEFAULT '{"amount": 0, "rate": 0.02}';
        RAISE NOTICE 'Added commission column';
    ELSE
        RAISE NOTICE 'Commission column already exists';
    END IF;
END $$;

-- Add payment_details column (stores gateway data)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'payment_details'
    ) THEN
        ALTER TABLE transactions ADD COLUMN payment_details JSONB DEFAULT '{}';
        RAISE NOTICE 'Added payment_details column';
    ELSE
        RAISE NOTICE 'Payment_details column already exists';
    END IF;
END $$;

-- Add status column (transaction status)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'status'
    ) THEN
        ALTER TABLE transactions ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    ELSE
        RAISE NOTICE 'Status column already exists';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Update Payment Method Enum (Remove 'amole')
-- =============================================================================

-- Check current enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'payment_method'
);

-- Note: If 'amole' exists, you may need to remove it manually
-- This is usually handled by Supabase automatically

-- =============================================================================
-- STEP 3: Create Indexes for Performance
-- =============================================================================

-- Index on status (most queried column)
CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON transactions(status);

-- Index on payment_method
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method 
ON transactions(payment_method);

-- Index on buyer_id
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id 
ON transactions(buyer_id);

-- Index on seller_id
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id 
ON transactions(seller_id);

-- Index on listing_id
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id 
ON transactions(listing_id);

-- Index on created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions(created_at DESC);

-- Index on updated_at
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at 
ON transactions(updated_at DESC);

-- GIN indexes for JSONB columns (for faster JSON queries)
CREATE INDEX IF NOT EXISTS idx_transactions_payment_details_gin 
ON transactions USING GIN (payment_details);

CREATE INDEX IF NOT EXISTS idx_transactions_commission_gin 
ON transactions USING GIN (commission);

-- =============================================================================
-- STEP 4: Enable RLS (Row Level Security)
-- =============================================================================

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON transactions;
DROP POLICY IF EXISTS "System can update transactions" ON transactions;

-- Policy: Users can view transactions they're part of
CREATE POLICY "Users can view their own transactions" ON transactions 
FOR SELECT 
USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Policy: Authenticated users can create transactions
CREATE POLICY "Authenticated users can create transactions" ON transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- Policy: Allow webhook functions to update transactions
-- This allows Edge Functions to update transaction status
CREATE POLICY "System can update transactions" ON transactions 
FOR UPDATE 
USING (true);

-- =============================================================================
-- STEP 5: Verify Setup
-- =============================================================================

-- Show table structure
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'transactions'
ORDER BY indexname;

-- Show policies
SELECT 
    schemaname, tablename, policyname, 
    permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;

-- Success message
SELECT '✅ Transactions table setup complete!' as message;
SELECT '   - Commission column: ✅' as info;
SELECT '   - Payment details column: ✅' as info;
SELECT '   - Status column: ✅' as info;
SELECT '   - Indexes: ✅' as info;
SELECT '   - RLS policies: ✅' as info;

