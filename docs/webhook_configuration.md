# PayPal Webhook Configuration

## Webhook Details
- **Webhook URL**: `https://vlvamfplfqgmosokuxqm.supabase.co/functions/v1/webhook-handler`
- **Webhook ID**: `9WJ79363RW477184E`
- **Status**: Configured
- **Date Configured**: 2024-01-XX

## Configured Events
The webhook is configured to listen for the following PayPal events:
- `BILLING.SUBSCRIPTION.ACTIVATED` - When a subscription becomes active
- `BILLING.SUBSCRIPTION.CANCELLED` - When a subscription is cancelled
- `BILLING.SUBSCRIPTION.SUSPENDED` - When a subscription is suspended
- `BILLING.SUBSCRIPTION.EXPIRED` - When a subscription expires

## Environment Variables
The following environment variable must be set in Supabase Edge Functions:
- `PAYPAL_WEBHOOK_ID`: `9WJ79363RW477184E`

## Webhook Handler
The webhook handler is implemented in `supabase/functions/webhook-handler/index.ts` and includes:
- PayPal signature verification
- Subscription status mapping
- Database updates for subscription lifecycle events
- Error handling and logging

## Testing
To test the webhook:
1. Create a test subscription in PayPal sandbox
2. Cancel or modify the subscription
3. Verify that the webhook events are received and processed
4. Check the `user_subscriptions` table for status updates

## Troubleshooting
If webhooks are not working:
1. Verify `PAYPAL_WEBHOOK_ID` is set correctly in Supabase
2. Check Edge Function logs for any errors
3. Ensure PayPal sandbox is sending events to the correct URL
4. Verify all PayPal environment variables are configured

## Security
- Webhook signature verification is enabled
- All webhook events are verified against PayPal's API before processing
- Sensitive data is not logged in production 