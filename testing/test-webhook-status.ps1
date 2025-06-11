# PayPal Webhook Status Test Script
# This script helps verify the webhook configuration

Write-Host "=== PayPal Webhook Configuration Test ===" -ForegroundColor Cyan

# Test 1: Webhook Endpoint Accessibility
Write-Host "`n1. Testing webhook endpoint accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://vlvamfplfqgmosokuxqm.supabase.co/functions/v1/webhook-handler" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"test": "ping"}' -ErrorAction Stop
    Write-Host "   ✓ Endpoint accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ Endpoint accessible (401 Unauthorized - Expected for test ping)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Endpoint error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 2: Configuration Summary
Write-Host "`n2. Configuration Summary:" -ForegroundColor Yellow
Write-Host "   Webhook URL: https://vlvamfplfqgmosokuxqm.supabase.co/functions/v1/webhook-handler" -ForegroundColor White
Write-Host "   Webhook ID: 9WJ79363RW477184E" -ForegroundColor White
Write-Host "   Events: BILLING.SUBSCRIPTION.* (ACTIVATED, CANCELLED, SUSPENDED, EXPIRED)" -ForegroundColor White

# Test 3: Next Steps
Write-Host "`n3. Next Steps for Testing:" -ForegroundColor Yellow
Write-Host "   □ Ensure PAYPAL_WEBHOOK_ID=9WJ79363RW477184E is set in Supabase Edge Functions" -ForegroundColor Cyan
Write-Host "   □ Create a test subscription using PayPal sandbox" -ForegroundColor Cyan
Write-Host "   □ Monitor Supabase Edge Function logs during subscription events" -ForegroundColor Cyan
Write-Host "   □ Verify database updates in user_subscriptions table" -ForegroundColor Cyan

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Ready for PayPal sandbox testing!" -ForegroundColor Green 