# SebahLync - Real Estate Marketplace

A modern, full-stack real estate marketplace built with React, TypeScript, and Supabase, featuring secure payment processing with Chapa, Telebirr, and Bibit payment gateways.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Payment gateway accounts (Chapa, Telebirr)

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.template .env
   # Edit .env with your Supabase credentials
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Payment Gateway Configuration](#payment-gateway-configuration)
- [Telebirr Integration](#telebirr-integration)
- [Project Structure](#project-structure)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Code Documentation](#code-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Chapa Payment Gateway
VITE_CHAPA_PUBLIC_KEY=your_chapa_public_key
VITE_CHAPA_SECRET_KEY=your_chapa_secret_key
VITE_CHAPA_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-chapa

# Telebirr Payment Gateway
VITE_TELEBIRR_FABRIC_APP_ID=your_telebirr_fabric_app_id
VITE_TELEBIRR_APP_SECRET=your_telebirr_app_secret
VITE_TELEBIRR_MERCHANT_ID=your_telebirr_merchant_id
VITE_TELEBIRR_SHORT_CODE=your_telebirr_short_code
VITE_TELEBIRR_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-telebirr

# Bibit Payment Gateway (Optional)
VITE_BIBIT_API_KEY=your_bibit_api_key
VITE_BIBIT_MERCHANT_ID=your_bibit_merchant_id
VITE_BIBIT_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-bibit
```

### Getting API Keys

**Chapa:**
1. Sign up at https://chapa.co
2. Get your Public Key and Secret Key from the API section

**Telebirr:**
1. Sign up as a merchant at https://telebirr.com
2. Contact Telebirr support for API access
3. Get your Fabric App ID, App Secret, and Merchant ID
4. **See [TELEBIRR_INTEGRATION_GUIDE.md](./TELEBIRR_INTEGRATION_GUIDE.md) for complete setup instructions**

**Bibit (Optional):**
1. Sign up at Bibit merchant portal
2. Get your API Key and Merchant ID

## 💾 Database Setup

### Step 1: Setup Transactions Table

Run the SQL migration in Supabase SQL Editor:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to: SQL Editor
4. Copy and paste: `database/SETUP_TRANSACTIONS_TABLE.sql`
5. Click: Run
6. Verify: You see success messages

This adds:
- `commission` JSONB column
- `payment_details` JSONB column
- `status` VARCHAR column
- Indexes for performance
- RLS policies

### Step 2: Verify Database

```sql
-- Run in Supabase SQL Editor
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY column_name;
```

## 🚀 Deployment

### Quick Deploy (Recommended)

**Option 1: Use the Deployment Script**
```powershell
.\deploy-webhooks.ps1
```

**Option 2: Manual Deployment**

#### Step 1: Login to Supabase
```powershell
npx supabase login
```

#### Step 2: List Your Projects
```powershell
npx supabase projects list
```
Copy the **project reference** from the output.

#### Step 3: Link to Your Project
```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
```

#### Step 4: Deploy Functions
```powershell
# Deploy Chapa webhook
npx supabase functions deploy payment-chapa

# Deploy Telebirr webhook
npx supabase functions deploy payment-telebirr

# Deploy Bibit webhook
npx supabase functions deploy payment-bibit
```

#### Step 5: Copy Function URLs

After deployment, you'll see output like:
```
Deployed Function: payment-chapa
URL: https://xyzabcd.supabase.co/functions/v1/payment-chapa
```

Copy these URLs and add them to your `.env` file.

### Step 6: Update Environment Variables

Add the webhook URLs to your `.env`:
```env
VITE_CHAPA_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-chapa
VITE_TELEBIRR_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-telebirr
VITE_BIBIT_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-bibit
```

### Step 7: Restart Application

```powershell
npm run dev
```

## 🔌 Payment Gateway Configuration

### Chapa Configuration

1. **Go to Chapa Dashboard**: https://chapa.co
2. **Login** to your merchant account
3. **Navigate**: Settings → Webhooks
4. **Add Webhook URL**: `https://your-project.supabase.co/functions/v1/payment-chapa`
5. **Enable Events**:
   - ✅ Transaction Successful
   - ✅ Transaction Failed
   - ✅ Transaction Cancelled
6. **Save** the configuration

### Telebirr Configuration

📚 **For detailed Telebirr integration guide, see: [TELEBIRR_INTEGRATION_GUIDE.md](./TELEBIRR_INTEGRATION_GUIDE.md)**

**Quick Setup**:
1. **Contact Telebirr Support**: business@telebirr.com
2. **Request**: Merchant dashboard access for webhook setup
3. **Get API Credentials**: Fabric App ID, App Secret, Merchant ID
4. **Configure Environment**: Add credentials to `.env` file
5. **Deploy Webhook**: Deploy `payment-telebirr` function
6. **Configure Webhook**: Add URL in Telebirr dashboard

### Bibit Configuration (Optional)

1. **Login** to Bibit merchant dashboard
2. **Navigate** to Webhook Settings
3. **Add Webhook URL**: `https://your-project.supabase.co/functions/v1/payment-bibit`
4. **Enable** webhook events
5. **Save** configuration

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common UI components
│   ├── ui/            # Base UI components
│   └── [feature]/     # Feature-specific components
├── contexts/           # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and configurations
├── pages/             # Page components
├── services/          # API and business logic layer
└── types/             # TypeScript type definitions
```

## 🎯 Features

- **User Authentication** - Secure signup/login with Supabase Auth
- **Property Listings** - Create, view, and manage property listings
- **File Uploads** - Images and documents with Supabase Storage
- **Transaction Management** - Secure payment and escrow system
- **Payment Processing** - Chapa, Telebirr, and Bibit integration
- **Admin Panel** - User and listing management
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Real-time Updates** - Supabase real-time subscriptions
- **Notifications** - In-app notification system

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Forms**: React Hook Form, Zod validation
- **State**: React Context API
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Notifications**: Sonner

## 📚 Code Documentation

### Custom Hooks

#### `useLoading`
Manages loading states with helper functions.
```typescript
const { loading, setLoading, startLoading, stopLoading } = useLoading();
```

#### `useError`
Handles error states with automatic toast notifications.
```typescript
const { error, setError, setErrorMessage, clearError } = useError();
```

#### `useAsyncOperation`
Combines loading, error, and data management for async operations.
```typescript
const { loading, error, data, execute } = useAsyncOperation<Listing[]>();
```

#### `usePagination`
Manages pagination state and navigation.
```typescript
const { pagination, nextPage, prevPage, goToPage } = usePagination();
```

### Service Layer

#### BaseService
Abstract base class providing common functionality for all services:
- `success<T>(data, message)` - Create success response
- `error(message, error)` - Create error response
- `handleError(error, context)` - Standardized error handling
- `executeQuery<T>(queryFn, context)` - Execute Supabase queries
- `validateRequiredFields(data, requiredFields)` - Validate fields
- `sanitizeData<T>(data)` - Clean data for database

#### AuthService
Handles authentication operations:
- `signUp(data)` - User registration
- `signIn(data)` - User login
- `signOut()` - User logout
- `updateProfile(userId, data)` - Update user profile
- `resetPassword(email)` - Password reset
- `verifyEmail(token)` - Email verification

#### ListingsService
Manages property listings:
- `getListings(filters, pagination)` - Get filtered listings
- `getListingById(id)` - Get single listing
- `getUserListings(userId)` - Get user's listings
- `createListing(data)` - Create new listing
- `updateListing(id, updates)` - Update listing
- `deleteListing(id)` - Delete listing

#### TransactionsService
Handles transaction and payment operations:
- `createTransaction(data)` - Create transaction
- `getTransaction(id)` - Get transaction
- `updateTransactionStatus(id, status)` - Update status
- `processPayment(transactionId, paymentData)` - Process payment

## 🧪 Testing

### Test Payment Flow

1. **Restart your application** to load new environment variables
2. **Go to Buy page** - Select a listing
3. **Click "Buy Now"** and select a payment method
4. **Make a test payment** (use small amount)
5. **Check logs**:
   ```powershell
   npx supabase functions logs payment-chapa --limit 10
   ```

### What to Verify

- ✅ Payment redirects to gateway
- ✅ Payment completes successfully
- ✅ Webhook is called (check logs)
- ✅ Transaction status updates to "payment_completed"
- ✅ Notifications are sent
- ✅ Transaction moves to "escrowed" status

### Monitoring

**Check Function Logs:**
```bash
npx supabase functions logs payment-chapa --follow
```

**Database Verification:**
- Transactions table has all required columns
- Commission structure correct
- Payment details storing correctly
- Status updates working

## 🐛 Troubleshooting

### Webhook not being called?
1. Check webhook URL is correct in gateway dashboard
2. Verify function is deployed: `npx supabase functions list`
3. Check function logs for errors
4. Verify CORS is enabled

### Transaction not updating?
1. Verify transaction exists in Supabase database
2. Check function logs for errors
3. Verify `payment_details` structure
4. Check transaction ID format

### Functions deploy failed?
1. Check you're logged in: `npx supabase projects list`
2. Verify project reference is correct
3. Check network connection
4. Review error messages carefully

### Environment Variables Issues?
```powershell
# Check environment variables
.\check-env-vars.ps1
```

### Database Issues?
1. Run verification SQL in Supabase SQL Editor
2. Check RLS policies are correct
3. Verify user permissions
4. Check indexes are created

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

## 🔒 Security

### Authentication
- JWT tokens managed by Supabase Auth
- Automatic token refresh
- Secure session management

### Authorization
- Row Level Security (RLS) policies in Supabase
- Permission checks in service layer
- Admin role verification

### Data Validation
- Input sanitization
- Type checking with TypeScript
- Server-side validation

### File Uploads
- File type validation
- Size limits
- Secure storage with Supabase

## 🚀 Production Deployment

1. **Build the project**: `npm run build`
2. **Deploy the `dist` folder** to your hosting service
3. **Update environment variables** in production
4. **Ensure Supabase project** is configured for production
5. **Configure webhooks** in payment gateways
6. **Monitor function logs** for errors

## 📊 Quick Checklist

### Database Setup
- [ ] Run `database/SETUP_TRANSACTIONS_TABLE.sql` in Supabase SQL Editor
- [ ] Verify columns created successfully
- [ ] Check indexes are created

### Function Deployment
- [ ] Install Supabase CLI: `npm install -g supabase` (if needed)
- [ ] Login: `npx supabase login`
- [ ] Deploy functions (follow deploy-webhooks.ps1)
- [ ] Copy function URLs from output

### Environment Setup
- [ ] Add webhook URLs to .env file
- [ ] Verify all credentials are set
- [ ] Run `.\check-env-vars.ps1` to verify

### Payment Gateway Configuration
- [ ] Configure Chapa webhook
- [ ] Configure Telebirr webhook
- [ ] (Optional) Configure Bibit webhook

### Testing
- [ ] Restart development server
- [ ] Make a test payment
- [ ] Verify webhook logs
- [ ] Check transaction in database
- [ ] Verify notifications created

## ⏱️ Time Estimate

- **Database Setup**: 5 minutes
- **Function Deployment**: 5 minutes
- **Configuration**: 10 minutes
- **Testing**: 5 minutes
- **Total**: ~25 minutes to production!

## 📞 Support

**Chapa Support:**
- Email: support@chapa.co
- Dashboard: https://chapa.co/dashboard
- Docs: https://developer.chapa.co

**Telebirr Support:**
- Email: business@telebirr.com

**Supabase Support:**
- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase

## 📄 License

MIT License - see LICENSE file for details

## 🎉 Next Steps

1. **Read**: This README thoroughly
2. **Run**: Database SQL migration in Supabase dashboard
3. **Deploy**: Functions using deployment script
4. **Configure**: Webhooks in payment gateways
5. **Test**: Make a payment
6. **Deploy**: To production!

---

**Ready to deploy? Start with the Database Setup section above!** 🚀
