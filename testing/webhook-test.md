# PayPal Webhook Testing Guide

## Prerequisites
- PayPal Webhook ID configured in Supabase: `9WJ79363RW477184E`
- PayPal sandbox account with test credentials
- Access to Supabase dashboard for monitoring logs

## Testing Steps

### 1. Verify Environment Variable
Before testing, confirm the environment variable is set:
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Verify `PAYPAL_WEBHOOK_ID` is set to: `9WJ79363RW477184E`

### 2. Test Webhook Endpoint
You can test if the webhook endpoint is accessible:
```bash
curl -X POST https://vlvamfplfqgmosokuxqm.supabase.co/functions/v1/webhook-handler \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}'
```

Expected response: Should return an error about missing PayPal headers (this is normal for a test ping)

### 3. Create Test Subscription
1. Use your frontend to create a test subscription
2. Use PayPal sandbox test accounts
3. Complete the subscription process

### 4. Trigger Webhook Events
To test different webhook events:

#### Test Subscription Activation
1. Create a subscription and complete payment
2. Check webhook handler logs in Supabase
3. Verify subscription status in database is `active`

#### Test Subscription Cancellation
1. Go to PayPal sandbox dashboard
2. Find the test subscription
3. Cancel the subscription
4. Check webhook handler logs
5. Verify subscription status in database is `cancelled`

### 5. Monitor Webhook Logs
1. Go to Supabase Dashboard → Edge Functions
2. Select `webhook-handler` function
3. Check logs for:
   - Webhook signature verification messages
   - Subscription status updates
   - Any error messages

### 6. Verify Database Updates
Check the `user_subscriptions` table:
```sql
SELECT 
  id,
  user_id,
  paypal_subscription_id,
  status,
  current_period_end,
  updated_at
FROM user_subscriptions
WHERE paypal_subscription_id IS NOT NULL
ORDER BY updated_at DESC;
```

## Expected Log Messages

### Successful Webhook Processing
```
Function "webhook-handler" up and running!
Verifying PayPal webhook signature with headers: {...}
Webhook ID used for verification: 9WJ79363RW477184E
PayPal webhook signature verified successfully
Processing update for PayPal subscription I-xxx, Status: ACTIVE
Successfully updated DB status for PayPal ID I-xxx (User: xxx) to active
```

### Failed Webhook (Missing Environment Variable)
```
Missing required PayPal environment variables for webhook verification (WEBHOOK_ID, CLIENT_ID, SECRET)
Webhook signature verification failed!
```

## Troubleshooting

### Common Issues

1. **"Missing required PayPal environment variables"**
   - Solution: Ensure `PAYPAL_WEBHOOK_ID` is set in Supabase Edge Functions

2. **"Webhook signature verification failed"**
   - Solution: Verify webhook ID matches PayPal configuration

3. **"No subscription found in DB to update"**
   - Solution: Ensure subscription was created successfully before webhook event

### PayPal Sandbox Testing
- Use PayPal sandbox test accounts
- Ensure webhook is configured in PayPal sandbox (not production)
- Check PayPal sandbox webhook logs for delivery status

## Success Criteria
✅ Webhook endpoint responds to POST requests  
✅ PayPal signature verification passes  
✅ Subscription status updates correctly in database  
✅ All webhook events (ACTIVATED, CANCELLED, SUSPENDED, EXPIRED) are handled  
✅ Error handling works for invalid/missing data  