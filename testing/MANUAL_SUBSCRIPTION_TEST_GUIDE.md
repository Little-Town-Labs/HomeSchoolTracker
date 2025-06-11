# Manual Subscription Testing Guide

**Task 8**: Test Subscription Creation Flow  
**Environment**: Development (localhost:5173)  
**PayPal**: Sandbox Mode  

## 🚀 READY TO TEST
- ✅ Development server running on localhost:5173
- ✅ Database configured with PayPal Plan IDs
- ✅ 5 subscription plans available for testing

## 📋 Phase 1: Environment Verification

### Step 1: Access Subscription Page
1. Open browser and navigate to: `http://localhost:5173/subscribe`
2. **Expected**: You should see "Choose Your Plan" page with subscription cards
3. **Check**: 5 subscription plan cards should be visible:
   - Basic Monthly ($9.99/month)
   - Premium Monthly ($19.99/month)  
   - Basic Annual ($99.99/year)
   - Premium Annual ($199.99/year)
   - Owner Admin ($0.01/year)

### Step 2: Verify PayPal Button Loading
1. Look at each subscription card
2. **Expected**: Each card should show a PayPal Subscribe button (blue PayPal style)
3. **Check Console**: Open browser dev tools (F12) and check for any errors
4. **If Configuration Error**: PayPal buttons show "PayPal Configuration Required" - check environment variables

### Step 3: Check PayPal Script Loading
1. In browser dev tools, go to Network tab
2. Refresh the page
3. **Expected**: You should see PayPal script requests being loaded
4. **Check**: No red errors in network tab related to PayPal

## 📋 Phase 2: Subscription Testing

### Test 1: Basic Monthly Plan ($9.99)

#### Step 1: Initiate Subscription
1. Click the PayPal Subscribe button for "Basic Monthly" plan
2. **Expected**: PayPal popup/redirect should appear
3. **Note**: You'll need PayPal sandbox test account credentials

#### Step 2: Complete PayPal Flow
1. Use PayPal sandbox buyer account to complete payment
2. **Expected**: Successful subscription confirmation
3. **Return**: Should redirect back to your application

#### Step 3: Verify Database Record
1. Check the console for any success/error messages
2. **Database Check**: Open browser dev tools console and run:
   ```javascript
   // Check for new subscription in database
   console.log('Checking subscription creation...');
   ```

### Test 2: Premium Monthly Plan ($19.99)
- Repeat the same process for Premium Monthly plan
- **Focus**: Verify higher pricing is reflected in PayPal

### Test 3: Basic Annual Plan ($99.99)
- Test annual billing cycle
- **Focus**: Verify annual discount is shown correctly

### Test 4: Premium Annual Plan ($199.99)
- Test highest tier plan
- **Focus**: Complete end-to-end flow verification

## 📋 Phase 3: Error Scenario Testing

### Test 5: Cancelled Checkout
1. Click Subscribe button for any plan
2. **Action**: Cancel the PayPal flow (close popup or click cancel)
3. **Expected**: Should return to subscription page with appropriate message
4. **Verify**: No partial subscription records created

### Test 6: Error Handling
1. Test with various error scenarios
2. **Check**: Error messages are user-friendly
3. **Verify**: Application remains stable

## 🔍 What to Look For

### ✅ Success Indicators
- PayPal buttons load without configuration errors
- PayPal sandbox flow completes successfully
- Console shows subscription verification messages
- No JavaScript errors in browser console
- Subscription records appear in database

### ❌ Failure Indicators
- "PayPal Configuration Required" error
- JavaScript errors in console
- PayPal script loading failures
- Failed subscription creation
- Missing database records

## 🛠️ Troubleshooting

### Common Issues

#### 1. Configuration Error
**Symptom**: "PayPal Configuration Required" message
**Solution**: Check environment variables:
- Ensure VITE_PAYPAL_CLIENT_ID is set in .env.local file
- Verify the client ID is for PayPal sandbox

#### 2. PayPal Script Loading Error
**Symptom**: Red network errors for PayPal scripts
**Solution**: Check internet connection and PayPal service status

#### 3. Database Connection Issues
**Symptom**: Subscription verification fails
**Solution**: Check Supabase connection and Edge Functions

## 📊 Test Results Recording

### After Each Test:
1. Record success/failure status
2. Note any error messages
3. Capture console logs if errors occur
4. Update the test documentation

### Database Verification Queries
```sql
-- Check subscription plans
SELECT id, name, price, paypal_plan_id FROM subscription_plans;

-- Check user subscriptions (after creating test subscriptions)
SELECT * FROM user_subscriptions ORDER BY created_at DESC LIMIT 5;
```

## 🎯 Success Criteria
- [ ] All 4 public plans create subscriptions successfully
- [ ] PayPal sandbox shows active subscriptions
- [ ] Local database contains subscription records
- [ ] Trial periods are correctly configured
- [ ] Error scenarios handled gracefully
- [ ] No console errors during normal flow

---

**Next**: Start with Phase 1 verification, then proceed through each test systematically.

**Note**: This is manual testing since the AI cannot directly interact with the browser. Execute each step carefully and document results in the testing/subscription-flow-test.md file. 