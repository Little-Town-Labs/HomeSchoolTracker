# Database Migration Instructions - PayPal Plan IDs

## Migration File: `20250609222500_update_paypal_plan_ids.sql`

This migration updates the `subscription_plans` table with verified PayPal Plan IDs from Task 004.

### Before Migration
- Table is currently empty (verified 2025-06-09)
- No placeholder data to replace

### Migration Contents
- Inserts 5 subscription plans with real PayPal Plan IDs
- Uses `ON CONFLICT` to handle potential existing data safely
- Includes proper descriptions with trial period information

### How to Apply

#### Option 1: Supabase CLI (Recommended)
```bash
# Navigate to project root
cd G:\Development Projects\HomeSchoolTracker

# Apply the migration
supabase db migrate up

# Verify the migration was applied
supabase db migrate list
```

#### Option 2: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Database > Migrations
3. Upload the migration file: `supabase/migrations/20250609222500_update_paypal_plan_ids.sql`
4. Apply the migration

### Verification Steps

#### 1. Check Data Insertion
```sql
SELECT name, price, currency, paypal_plan_id 
FROM subscription_plans 
ORDER BY price;
```

**Expected Results:**
```
name              | price  | currency | paypal_plan_id
------------------|--------|----------|---------------------------
Owner Admin       | 0.01   | USD      | P-71T62477MK683012GNBDV3XQ
Basic Monthly     | 9.99   | USD      | P-4E747738FG1460728NBDV3GY
Premium Monthly   | 19.99  | USD      | P-55V07943L28916132NBDV3OY
Basic Annual      | 99.99  | USD      | P-5K304811TB8538255NBDV3RI
Premium Annual    | 199.99 | USD      | P-3HC58203J4124233XNBDV3TQ
```

#### 2. Verify PayPal Plan ID Format
```sql
SELECT name, paypal_plan_id
FROM subscription_plans
WHERE paypal_plan_id NOT LIKE 'P-%';
```

**Expected Result:** No rows (all Plan IDs should start with 'P-')

#### 3. Count Total Plans
```sql
SELECT COUNT(*) as total_plans FROM subscription_plans;
```

**Expected Result:** 5 plans total

### Plan Details Summary

| Plan Name | Monthly Equivalent | Annual Savings | Trial Period |
|-----------|-------------------|----------------|--------------|
| Basic Monthly | $9.99/month | - | 30 days |
| Premium Monthly | $19.99/month | - | 30 days |
| Basic Annual | $8.33/month | ~$20/year | 30 days |
| Premium Annual | $16.67/month | ~$40/year | 30 days |
| Owner Admin | $0.01/year | N/A | None |

### Post-Migration Tasks
1. ✅ Verify all 5 plans inserted correctly
2. ⏳ Update application configuration to use new Plan IDs
3. ⏳ Test subscription flows with real PayPal Plan IDs
4. ⏳ Update frontend subscription selection UI

### Rollback (if needed)
If rollback is required:
```sql
DELETE FROM subscription_plans;
```

### Support
- Migration created by Task 005: Update Database with Real PayPal Plan IDs
- PayPal Plan IDs verified in Task 004: Extract and Document PayPal Plan IDs
- All Plan IDs confirmed active in PayPal Developer Dashboard as of 2025-06-09 