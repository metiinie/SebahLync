# Supabase Edge Functions - Payment Webhooks

## Overview

This directory contains Supabase Edge Functions for handling payment webhooks from Chapa, Telebirr, and Bibit payment gateways.

## Functions

### 1. `payment-chapa`
Handles webhook callbacks from Chapa payment gateway.

**Endpoint**: `/payment-chapa`

**Example URL**: `https://your-project.supabase.co/functions/v1/payment-chapa`

### 2. `payment-telebirr`
Handles webhook callbacks from Telebirr payment gateway.

**Endpoint**: `/payment-telebirr`

**Example URL**: `https://your-project.supabase.co/functions/v1/payment-telebirr`

### 3. `payment-bibit`
Handles webhook callbacks from Bibit payment gateway.

**Endpoint**: `/payment-bibit`

**Example URL**: `https://your-project.supabase.co/functions/v1/payment-bibit`

## Features

- ✅ CORS support for preflight requests
- ✅ Automatic transaction status updates
- ✅ Webhook data logging for debugging
- ✅ Notification creation for buyers and sellers
- ✅ Error handling and logging
- ✅ Secure Supabase service role authentication

## Deployment

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Deploy Functions

Deploy all payment webhook functions:
```bash
supabase functions deploy payment-chapa
supabase functions deploy payment-telebirr
supabase functions deploy payment-bibit
```

Or deploy all at once:
```bash
supabase functions deploy payment-chapa payment-telebirr payment-bibit
```

### Environment Variables

Set the webhook URLs in your frontend environment:

```env
# Add to your .env file
VITE_CHAPA_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-chapa
VITE_TELEBIRR_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-telebirr
VITE_BIBIT_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-bibit
```

## Configuration in Payment Gateways

### Chapa Configuration

1. Log in to Chapa Dashboard: https://chapa.co
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-project.supabase.co/functions/v1/payment-chapa`
4. Enable payment success events
5. Save configuration

### Telebirr Configuration

1. Contact Telebirr support for merchant dashboard access
2. Configure webhook URL: `https://your-project.supabase.co/functions/v1/payment-telebirr`
3. Enable payment notifications
4. Test webhook

### Bibit Configuration

1. Log in to Bibit merchant dashboard
2. Configure webhook URL: `https://your-project.supabase.co/functions/v1/payment-bibit`
3. Enable webhook events
4. Save configuration

## Testing

### Local Testing

Start Supabase locally:
```bash
supabase start
```

Test functions locally:
```bash
supabase functions serve payment-chapa
```

### Test with HTTP Request

```bash
curl -X POST http://localhost:54321/functions/v1/payment-chapa \
  -H "Content-Type: application/json" \
  -d '{
    "event": "transaction.successful",
    "data": {
      "tx_ref": "SBL_transaction_id_timestamp",
      "status": "successful"
    }
  }'
```

## Webhook Data Format

### Chapa Webhook
```json
{
  "event": "transaction.successful",
  "data": {
    "tx_ref": "SBL_123_timestamp",
    "status": "successful",
    "amount": 1000,
    "currency": "ETB"
  }
}
```

### Telebirr Webhook
```json
{
  "outTradeNo": "SBL_123_timestamp",
  "status": "SUCCESS",
  "amount": 1000,
  "currency": "ETB"
}
```

### Bibit Webhook
```json
{
  "reference": "SBL_123_timestamp",
  "status": "success",
  "amount": {
    "value": 1000,
    "currency": "ETB"
  }
}
```

## Security

- Uses Supabase Service Role Key for database access
- Validates webhook data before processing
- Logs all webhook events for audit
- Handles errors gracefully
- CORS protection enabled

## Monitoring

Check function logs:
```bash
supabase functions logs payment-chapa
supabase functions logs payment-telebirr
supabase functions logs payment-bibit
```

## Troubleshooting

### Webhook not being called
1. Verify webhook URL is configured in payment gateway
2. Check Supabase function logs for errors
3. Verify CORS headers are correct
4. Test webhook with a simple POST request

### Transaction not updating
1. Check transaction exists in database
2. Verify payment_details structure
3. Check function logs for errors
4. Verify Supabase service role key is set

### Notifications not being sent
1. Verify notifications table exists
2. Check user IDs are correct
3. Review notification channels configuration

## Support

For issues or questions, check:
- Supabase Docs: https://supabase.com/docs
- Deno Edge Functions: https://deno.com/deploy/docs
- Chapa API Docs: https://developer.chapa.co
- Telebirr API Docs: Contact Telebirr support

