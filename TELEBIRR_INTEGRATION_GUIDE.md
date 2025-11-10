# Telebirr Payment Integration Guide

Complete guide for integrating Telebirr payment gateway into SebahLync real estate marketplace.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Telebirr Credentials](#getting-telebirr-credentials)
- [Environment Configuration](#environment-configuration)
- [API Integration](#api-integration)
- [Webhook Setup](#webhook-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## 🎯 Overview

Telebirr is Ethiopia's leading mobile payment platform. This guide will help you integrate Telebirr payment processing into your SebahLync application.

### Features
- ✅ Payment initialization via Telebirr API
- ✅ Webhook support for payment notifications
- ✅ Payment verification
- ✅ Transaction status tracking
- ✅ Secure payment processing

## 📝 Prerequisites

Before starting, ensure you have:

1. **Telebirr Merchant Account**
   - Active Telebirr merchant account
   - Business registration documents
   - Bank account for payouts

2. **Development Environment**
   - Node.js 18+ installed
   - Supabase account and project
   - Access to Supabase Edge Functions

3. **Credentials Required**
   - Fabric App ID (App Key)
   - App Secret
   - Merchant ID
   - Short Code (Optional)

## 🔑 Getting Telebirr Credentials

### Step 1: Register as Merchant

1. **Visit Telebirr Business Portal**
   - Go to: https://telebirr.com
   - Click "Business" or "Merchant" section
   - Register your business account

2. **Submit Business Documents**
   - Business license
   - Tax identification number
   - Bank account details
   - Business owner identification

3. **Wait for Approval**
   - Approval process: 3-7 business days
   - You'll receive email confirmation once approved

### Step 2: Access Merchant Dashboard

1. **Contact Telebirr Support**
   - Email: business@telebirr.com
   - Phone: Check Telebirr website for support number
   - Request: "Merchant dashboard access for API integration"

2. **Provide Business Information**
   - Business name
   - Merchant account number
   - Contact person details
   - Integration purpose

3. **Receive Dashboard Access**
   - Login credentials sent via email
   - Dashboard URL: https://business.telebirr.com (or provided URL)

### Step 3: Get API Credentials

1. **Login to Merchant Dashboard**
   - Use provided credentials
   - Navigate to: **Settings** → **API Settings** or **Developer** → **API Keys**

2. **Generate API Credentials**
   - **Fabric App ID**: Also known as App Key or X-APP-Key
   - **App Secret**: Secret key for API authentication
   - **Merchant ID**: Your unique merchant identifier
   - **Short Code**: Your Telebirr short code (usually 5-6 digits)

3. **Save Credentials Securely**
   - Never commit credentials to version control
   - Store in environment variables
   - Keep backup in secure location

## ⚙️ Environment Configuration

### Step 1: Add Environment Variables

Add the following to your `.env` file:

```env
# Telebirr Payment Gateway Configuration
VITE_TELEBIRR_FABRIC_APP_ID=your_fabric_app_id_here
VITE_TELEBIRR_APP_SECRET=your_app_secret_here
VITE_TELEBIRR_MERCHANT_ID=your_merchant_id_here
VITE_TELEBIRR_SHORT_CODE=your_short_code_here
VITE_TELEBIRR_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-telebirr
```

### Step 2: Configure Supabase Edge Function

The webhook function requires these environment variables in Supabase:

1. **Go to Supabase Dashboard**
   - Navigate to: **Edge Functions** → **payment-telebirr** → **Settings**

2. **Add Secrets** (if needed):
   ```bash
   supabase secrets set TELEBIRR_APP_SECRET=your_app_secret
   supabase secrets set TELEBIRR_MERCHANT_ID=your_merchant_id
   ```

3. **Verify Configuration**
   - Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   - These are automatically available in Edge Functions

## 🔌 API Integration

### Telebirr API Endpoints

**Base URL**: `https://app.telebirr.com/api/api`

**Endpoints**:
- **Create Payment**: `POST /payment/v1.0.0/create-payment`
- **Query Payment**: `GET /payment/v1.0.0/query-payment/{orderId}`
- **Cancel Payment**: `POST /payment/v1.0.0/cancel-payment`

### Payment Flow

```
1. User selects Telebirr payment method
2. Frontend calls PaymentService.initializeTelebirrPayment()
3. Backend creates payment request with Telebirr API
4. User redirected to Telebirr checkout page
5. User completes payment on Telebirr
6. Telebirr sends webhook to Supabase Edge Function
7. Edge function updates transaction status
8. User redirected back to success page
```

### Code Implementation

The integration is already implemented in `src/services/payment.ts`:

```typescript
// Initialize Telebirr payment
const paymentResult = await PaymentService.initializePayment(
  'telebirr',
  transactionId,
  listingId,
  amount,
  currency,
  buyerEmail,
  buyerPhone,
  buyerName
);

if (paymentResult.success && paymentResult.checkoutUrl) {
  // Redirect to Telebirr checkout
  window.location.href = paymentResult.checkoutUrl;
}
```

### Payment Request Structure

```typescript
{
  outTradeNo: string;        // Unique order ID (e.g., "SBL_transactionId_timestamp")
  subject: string;            // Payment description
  totalAmount: string;        // Amount as string
  shortCode: string;          // Merchant short code
  notifyUrl: string;          // Webhook URL
  returnUrl: string;          // Return URL after payment
  receiveName: string;        // Buyer name
  appId: string;              // Fabric App ID
  timeoutExpress: string;     // Payment timeout (e.g., "30m")
  account: string;            // Merchant ID
}
```

### API Headers

```typescript
{
  'Content-Type': 'application/json',
  'X-APP-Key': 'your_fabric_app_id',      // Required: Fabric App ID
  'Authorization': 'Bearer your_app_secret' // App Secret as Bearer token
}
```

### Response Structure

**Success Response**:
```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "toPayUrl": "https://telebirr.com/checkout/...",
    "orderId": "SBL_123_1234567890"
  }
}
```

**Error Response**:
```json
{
  "code": "400",
  "message": "Invalid request",
  "data": null
}
```

## 🔗 Webhook Setup

### Step 1: Deploy Webhook Function

1. **Deploy Supabase Edge Function**
   ```bash
   npx supabase functions deploy payment-telebirr
   ```

2. **Get Webhook URL**
   After deployment, you'll get a URL like:
   ```
   https://your-project.supabase.co/functions/v1/payment-telebirr
   ```

3. **Copy Webhook URL**
   Save this URL for Telebirr dashboard configuration

### Step 2: Configure Webhook in Telebirr Dashboard

1. **Login to Telebirr Merchant Dashboard**
   - Navigate to: **Settings** → **Webhooks** or **Payment Settings** → **Notifications**

2. **Add Webhook URL**
   - Click **"Add Webhook"** or **"New Webhook"**
   - Enter your webhook URL:
     ```
     https://your-project.supabase.co/functions/v1/payment-telebirr
     ```

3. **Enable Events**
   - ✅ Payment Success
   - ✅ Payment Failed
   - ✅ Payment Status Updates

4. **Save Configuration**
   - Click **"Save"** or **"Update"**
   - Telebirr will test the webhook URL

### Step 3: Verify Webhook

1. **Test Webhook**
   - Make a test payment
   - Check Supabase function logs:
     ```bash
     npx supabase functions logs payment-telebirr --follow
     ```

2. **Verify Transaction Update**
   - Check transaction status in database
   - Verify webhook data is stored in `payment_details`

### Webhook Payload Structure

**Success Payment**:
```json
{
  "outTradeNo": "SBL_transactionId_timestamp",
  "transactionId": "telebirr_transaction_id",
  "status": "SUCCESS",
  "amount": 1000.00,
  "currency": "ETB",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Failed Payment**:
```json
{
  "outTradeNo": "SBL_transactionId_timestamp",
  "transactionId": "telebirr_transaction_id",
  "status": "FAILED",
  "amount": 1000.00,
  "currency": "ETB",
  "timestamp": "2024-01-01T00:00:00Z",
  "errorMessage": "Payment failed reason"
}
```

## 🧪 Testing

### Test Environment

Telebirr provides a sandbox environment for testing:

1. **Sandbox Credentials**
   - Contact Telebirr support for sandbox credentials
   - Use test merchant account
   - Test with small amounts

2. **Test Phone Numbers**
   - Use Telebirr-provided test phone numbers
   - Test payment scenarios (success, failure, cancellation)

### Testing Checklist

- [ ] Payment initialization works
- [ ] User redirected to Telebirr checkout
- [ ] Payment completes successfully
- [ ] Webhook received and processed
- [ ] Transaction status updated
- [ ] Notifications sent to buyer/seller
- [ ] Payment verification works
- [ ] Error handling works correctly

### Test Payment Flow

1. **Create Test Transaction**
   ```typescript
   const transaction = await TransactionsService.createTransaction({
     listing_id: 'test-listing-id',
     buyer_id: 'test-buyer-id',
     seller_id: 'test-seller-id',
     amount: 100,
     currency: 'ETB',
     payment_method: 'telebirr',
     status: 'pending'
   });
   ```

2. **Initialize Payment**
   ```typescript
   const result = await PaymentService.initializeTelebirrPayment(
     transaction.id,
     'listing-id',
     100,
     'ETB',
     '+251912345678',
     'Test User'
   );
   ```

3. **Complete Payment**
   - Use test phone number
   - Complete payment on Telebirr
   - Verify webhook received

4. **Verify Transaction**
   ```typescript
   const status = await PaymentService.getPaymentStatus(transaction.id);
   console.log('Transaction status:', status);
   ```

### Monitoring

**Check Function Logs**:
```bash
npx supabase functions logs payment-telebirr --limit 50
```

**Check Database**:
```sql
SELECT 
    id,
    status,
    payment_details->>'order_id' as order_id,
    payment_details->>'gateway' as gateway,
    payment_details->>'webhook_response' as webhook_data
FROM transactions
WHERE payment_method = 'telebirr'
ORDER BY created_at DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Payment Initialization Fails

**Error**: `Failed to initialize payment: 401 Unauthorized`

**Solutions**:
- Verify `VITE_TELEBIRR_FABRIC_APP_ID` is correct
- Check `VITE_TELEBIRR_APP_SECRET` is valid
- Ensure credentials are not expired
- Verify API endpoint URL is correct

#### 2. Webhook Not Received

**Error**: No webhook data in transaction

**Solutions**:
- Verify webhook URL is correct in Telebirr dashboard
- Check webhook URL is accessible (not localhost)
- Ensure webhook events are enabled
- Check Supabase function logs for errors
- Verify CORS is enabled in Edge Function

#### 3. Transaction Status Not Updating

**Error**: Transaction stuck in "pending" status

**Solutions**:
- Check webhook function is deployed
- Verify webhook is being called (check logs)
- Check transaction exists in database
- Verify `payment_details->order_id` matches webhook `outTradeNo`
- Check for errors in webhook function

#### 4. CORS Errors

**Error**: CORS policy blocked the request

**Solutions**:
- Ensure Edge Function handles OPTIONS requests
- Check CORS headers in function response
- Verify webhook URL allows cross-origin requests

#### 5. Invalid Signature/Authentication

**Error**: Authentication failed

**Solutions**:
- Verify App Secret is correct
- Check Authorization header format
- Ensure X-APP-Key header is set
- Verify credentials are for correct environment (sandbox vs production)

### Debugging Steps

1. **Check Environment Variables**
   ```bash
   # Verify environment variables are set
   echo $VITE_TELEBIRR_FABRIC_APP_ID
   echo $VITE_TELEBIRR_APP_SECRET
   ```

2. **Test API Connection**
   ```bash
   curl -X POST https://app.telebirr.com/api/api/payment/v1.0.0/create-payment \
     -H "Content-Type: application/json" \
     -H "X-APP-Key: your_fabric_app_id" \
     -H "Authorization: Bearer your_app_secret" \
     -d '{
       "outTradeNo": "TEST_123",
       "subject": "Test Payment",
       "totalAmount": "100",
       "shortCode": "your_short_code",
       "notifyUrl": "https://your-webhook-url.com",
       "returnUrl": "https://your-return-url.com",
       "receiveName": "Test User",
       "appId": "your_fabric_app_id",
       "timeoutExpress": "30m",
       "account": "your_merchant_id"
     }'
   ```

3. **Check Webhook Function**
   ```bash
   # Test webhook function locally
   npx supabase functions serve payment-telebirr
   
   # In another terminal, test webhook
   curl -X POST http://localhost:54321/functions/v1/payment-telebirr \
     -H "Content-Type: application/json" \
     -d '{
       "outTradeNo": "TEST_123",
       "status": "SUCCESS",
       "amount": 100
     }'
   ```

4. **Verify Database**
   ```sql
   -- Check transaction exists
   SELECT * FROM transactions WHERE id = 'transaction-id';
   
   -- Check payment_details structure
   SELECT payment_details FROM transactions WHERE payment_method = 'telebirr';
   ```

## 📚 API Reference

### Initialize Payment

**Endpoint**: `POST /payment/v1.0.0/create-payment`

**Headers**:
```
Content-Type: application/json
X-APP-Key: {fabric_app_id}
Authorization: Bearer {app_secret}
```

**Request Body**:
```json
{
  "outTradeNo": "SBL_123_1234567890",
  "subject": "SebahLync Payment - transaction-id",
  "totalAmount": "1000",
  "shortCode": "608986",
  "notifyUrl": "https://your-project.supabase.co/functions/v1/payment-telebirr",
  "returnUrl": "https://your-app.com/payment/success?transaction=transaction-id",
  "receiveName": "Buyer Name",
  "appId": "your_fabric_app_id",
  "timeoutExpress": "30m",
  "account": "your_merchant_id"
}
```

**Response**:
```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "toPayUrl": "https://telebirr.com/checkout/abc123",
    "orderId": "SBL_123_1234567890"
  }
}
```

### Query Payment

**Endpoint**: `GET /payment/v1.0.0/query-payment/{orderId}`

**Headers**:
```
Authorization: Bearer {app_secret}
```

**Response**:
```json
{
  "code": "200",
  "message": "Success",
  "data": {
    "orderId": "SBL_123_1234567890",
    "status": "SUCCESS",
    "totalAmount": "1000",
    "paidAmount": "1000",
    "paidTime": "2024-01-01T00:00:00Z"
  }
}
```

### Payment Statuses

- `SUCCESS` - Payment completed successfully
- `FAILED` - Payment failed
- `PENDING` - Payment in progress
- `CANCELLED` - Payment cancelled by user
- `EXPIRED` - Payment timeout

## 🔒 Security Best Practices

1. **Never Expose Secrets**
   - Store credentials in environment variables
   - Never commit `.env` file to version control
   - Use Supabase secrets for Edge Functions

2. **Validate Webhook Data**
   - Verify webhook signature (if provided by Telebirr)
   - Validate order ID matches transaction
   - Check amount matches expected value

3. **HTTPS Only**
   - Always use HTTPS for webhook URLs
   - Never use HTTP in production
   - Verify SSL certificates

4. **Error Handling**
   - Log all errors for debugging
   - Don't expose sensitive information in error messages
   - Implement retry logic for failed webhooks

5. **Rate Limiting**
   - Implement rate limiting on payment endpoints
   - Monitor for suspicious activity
   - Set up alerts for unusual patterns

## 📊 Payment Flow Diagram

```
┌─────────────┐
│   User      │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Select Telebirr
       │ 2. Click Pay
       │
       ▼
┌─────────────────┐
│ Payment Service │
│  (Frontend)     │
└──────┬──────────┘
       │
       │ 3. Create Transaction
       │ 4. Initialize Payment
       │
       ▼
┌─────────────────┐
│  Telebirr API   │
│  (External)     │
└──────┬──────────┘
       │
       │ 5. Return checkout URL
       │
       ▼
┌─────────────┐
│   User      │
│  (Telebirr) │
└──────┬──────┘
       │
       │ 6. Complete Payment
       │
       ▼
┌─────────────────┐
│  Telebirr API   │
│  (External)     │
└──────┬──────────┘
       │
       │ 7. Send Webhook
       │
       ▼
┌─────────────────────┐
│ Supabase Edge       │
│ Function (Webhook)  │
└──────┬──────────────┘
       │
       │ 8. Update Transaction
       │ 9. Create Notifications
       │
       ▼
┌─────────────────┐
│   Database      │
│   (Supabase)    │
└─────────────────┘
```

## 🎯 Integration Checklist

### Setup Phase
- [ ] Register Telebirr merchant account
- [ ] Get API credentials (Fabric App ID, App Secret, Merchant ID)
- [ ] Configure environment variables
- [ ] Deploy webhook function to Supabase
- [ ] Configure webhook URL in Telebirr dashboard

### Development Phase
- [ ] Test payment initialization
- [ ] Test payment completion
- [ ] Test webhook reception
- [ ] Test transaction status updates
- [ ] Test error handling

### Production Phase
- [ ] Switch to production credentials
- [ ] Update webhook URL to production
- [ ] Test with real payments
- [ ] Monitor function logs
- [ ] Set up error alerts

## 📞 Support

### Telebirr Support
- **Email**: business@telebirr.com
- **Phone**: Check Telebirr website
- **Documentation**: Contact Telebirr for API documentation
- **Dashboard**: https://business.telebirr.com

### SebahLync Support
- **Issues**: Check project GitHub issues
- **Documentation**: See README.md
- **Logs**: Check Supabase function logs

## 📝 Additional Notes

### Payment Limits
- Minimum payment: Check with Telebirr
- Maximum payment: Check with Telebirr
- Daily limits: Set in Telebirr dashboard

### Currency Support
- Primary: ETB (Ethiopian Birr)
- Other currencies: Check with Telebirr

### Transaction Fees
- Telebirr charges transaction fees
- Fees are deducted from payment amount
- Check Telebirr pricing for details

### Settlement
- Payments are settled to merchant account
- Settlement period: Check with Telebirr (usually 1-3 days)
- Minimum settlement amount: Check with Telebirr

## ✅ Quick Start Summary

1. **Get Credentials**: Register and get API credentials from Telebirr
2. **Configure Environment**: Add credentials to `.env` file
3. **Deploy Webhook**: Deploy `payment-telebirr` function to Supabase
4. **Configure Webhook**: Add webhook URL in Telebirr dashboard
5. **Test**: Make a test payment and verify flow
6. **Go Live**: Switch to production credentials and launch

## 🚀 Next Steps

After integration:
1. Monitor payment success rate
2. Set up error alerts
3. Optimize payment flow based on user feedback
4. Implement payment retry logic
5. Add payment analytics

---

**Ready to integrate? Start with getting your Telebirr credentials!** 🎉

For more information, refer to the main [README.md](./README.md) file.

