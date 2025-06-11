# PayPal Subscription Plans - ID Mapping Document

Generated on: 2025-06-09  
Product ID: PROD-29P97229J9149373J  
Status: All plans are ACTIVE  

## Plan Mappings for Database Updates

### Public Subscription Plans

| Internal Plan Name | PayPal Plan ID | Display Name | Price | Billing Cycle | Trial Period | Auto-Bill |
|-------------------|----------------|--------------|-------|---------------|--------------|-----------|
| basic_monthly | P-4E747738FG1460728NBDV3GY | HomeSchoolTracker Basic Monthly | $9.99 | Monthly | 30 days free | Yes |
| premium_monthly | P-55V07943L28916132NBDV3OY | HomeSchoolTracker Premium Monthly | $19.99 | Monthly | 30 days free | Yes |
| basic_annual | P-5K304811TB8538255NBDV3RI | HomeSchoolTracker Basic Annual | $99.99 | Yearly | 30 days free | Yes |
| premium_annual | P-3HC58203J4124233XNBDV3TQ | HomeSchoolTracker Premium Annual | $199.99 | Yearly | 30 days free | Yes |

### Administrative Plan

| Internal Plan Name | PayPal Plan ID | Display Name | Price | Billing Cycle | Trial Period | Auto-Bill | Notes |
|-------------------|----------------|--------------|-------|---------------|--------------|-----------|--------|
| owner_admin | P-71T62477MK683012GNBDV3XQ | HomeSchoolTracker Owner/Admin Plan | $0.01 | Yearly | None | No | Unlisted, for netgleb@gmail.com |

## Database Update SQL (subscription_plans table)

```sql
-- Update PayPal Plan IDs in subscription_plans table
UPDATE subscription_plans SET paypal_plan_id = 'P-4E747738FG1460728NBDV3GY' WHERE plan_name = 'basic_monthly';
UPDATE subscription_plans SET paypal_plan_id = 'P-55V07943L28916132NBDV3OY' WHERE plan_name = 'premium_monthly';
UPDATE subscription_plans SET paypal_plan_id = 'P-5K304811TB8538255NBDV3RI' WHERE plan_name = 'basic_annual';
UPDATE subscription_plans SET paypal_plan_id = 'P-3HC58203J4124233XNBDV3TQ' WHERE plan_name = 'premium_annual';
UPDATE subscription_plans SET paypal_plan_id = 'P-71T62477MK683012GNBDV3XQ' WHERE plan_name = 'owner_admin';
```

## Application Configuration

### Environment Variables / Constants
```javascript
// PayPal Plan IDs for frontend configuration
const PAYPAL_PLAN_IDS = {
  BASIC_MONTHLY: 'P-4E747738FG1460728NBDV3GY',
  PREMIUM_MONTHLY: 'P-55V07943L28916132NBDV3OY',
  BASIC_ANNUAL: 'P-5K304811TB8538255NBDV3RI',
  PREMIUM_ANNUAL: 'P-3HC58203J4124233XNBDV3TQ',
  OWNER_ADMIN: 'P-71T62477MK683012GNBDV3XQ'
};
```

## Plan Details Summary

### Trial Configuration
- **Public Plans**: All include 30-day free trial period
- **Admin Plan**: No trial period

### Pricing Structure
- **Basic Monthly**: $9.99/month (equivalent to $119.88/year)
- **Premium Monthly**: $19.99/month (equivalent to $239.88/year)  
- **Basic Annual**: $99.99/year (saves ~$20 vs monthly)
- **Premium Annual**: $199.99/year (saves ~$40 vs monthly)
- **Owner/Admin**: $0.01/year (PayPal minimum, effectively free)

### Payment Preferences
- **Public Plans**: Auto-bill outstanding amounts, 3 payment failure threshold
- **Admin Plan**: No auto-bill, 0 payment failure threshold

## Verification Status
✅ All Plan IDs verified active in PayPal Developer Dashboard  
✅ All pricing and billing cycles confirmed  
✅ Trial periods configured correctly  
✅ Owner/Admin plan set as unlisted  
✅ Product ID consistent across all plans  

## Next Steps
1. Update database with Plan IDs using provided SQL
2. Configure application constants with Plan IDs
3. Test subscription flows with each Plan ID
4. Update frontend subscription selection UI 