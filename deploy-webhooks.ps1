# SebahLync Payment Webhook Deployment Script
# Run this script to deploy your payment webhooks to Supabase

Write-Host "🚀 SebahLync Webhook Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking for Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found. Installing via npx..." -ForegroundColor Red
    Write-Host "This will download the CLI on first use." -ForegroundColor Yellow
} else {
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Deployment Steps:" -ForegroundColor Cyan
Write-Host "1. Login to Supabase: npx supabase login"
Write-Host "2. Link to project: npx supabase link --project-ref YOUR_PROJECT_REF"
Write-Host "3. Deploy functions: npx supabase functions deploy payment-chapa"
Write-Host "                   npx supabase functions deploy payment-telebirr"
Write-Host "                   npx supabase functions deploy payment-bibit"
Write-Host ""
Write-Host "⚠️  You'll need:" -ForegroundColor Yellow
Write-Host "   - Supabase project reference (from dashboard)"
Write-Host "   - Login credentials"
Write-Host ""
Write-Host "Starting deployment process..." -ForegroundColor Green
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Logging into Supabase..." -ForegroundColor Cyan
npx supabase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed. Please try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Logged in successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Get project reference
Write-Host "Step 2: Getting project info..." -ForegroundColor Cyan
Write-Host "Listing your Supabase projects..." -ForegroundColor Yellow
npx supabase projects list

Write-Host ""
Write-Host "Enter your project reference: " -ForegroundColor Yellow -NoNewline
$projectRef = Read-Host

if ([string]::IsNullOrWhiteSpace($projectRef)) {
    Write-Host "❌ Project reference is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Linking to project..." -ForegroundColor Cyan
npx supabase link --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project linked successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy functions
Write-Host "Step 4: Deploying webhook functions..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Deploying payment-chapa..." -ForegroundColor Yellow
npx supabase functions deploy payment-chapa

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Failed to deploy payment-chapa" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deploying payment-telebirr..." -ForegroundColor Yellow
npx supabase functions deploy payment-telebirr

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Failed to deploy payment-telebirr" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deploying payment-bibit..." -ForegroundColor Yellow
npx supabase functions deploy payment-bibit

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Failed to deploy payment-bibit" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the function URLs from the output above"
Write-Host "2. Add them to your .env file:"
Write-Host "   VITE_CHAPA_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-chapa"
Write-Host "   VITE_TELEBIRR_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-telebirr"
Write-Host "   VITE_BIBIT_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/payment-bibit"
Write-Host ""
Write-Host "3. Configure webhook URLs in payment gateway dashboards"
Write-Host ""
Write-Host "🎉 Your webhook functions are deployed!" -ForegroundColor Green

