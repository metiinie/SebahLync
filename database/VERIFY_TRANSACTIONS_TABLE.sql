-- Verification Query for Transactions Table
-- Run this to check what columns exist in your transactions table

-- Show all columns in the transactions table
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'commission'
    ) THEN '✅ commission column exists' ELSE '❌ commission column missing' END as commission_check;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'payment_details'
    ) THEN '✅ payment_details column exists' ELSE '❌ payment_details column missing' END as payment_details_check;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'status'
    ) THEN '✅ status column exists' ELSE '❌ status column missing' END as status_check;

-- Summary
SELECT 
    COUNT(*) FILTER (WHERE column_name IN ('commission', 'payment_details', 'status')) as required_columns_count,
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name IN ('commission', 'payment_details', 'status')) = 3 
        THEN '✅ All required columns exist!'
        ELSE '⚠️ Some columns are missing'
    END as summary
FROM information_schema.columns 
WHERE table_name = 'transactions';
