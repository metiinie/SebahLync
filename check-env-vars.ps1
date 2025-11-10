# Check Environment Variables Script
# This script helps verify your environment is properly configured

Write-Host "Checking SebahLync Environment Variables" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env"
$missingVars = @()
$foundVars = @()

# Check if .env file exists
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    
    # Create .env file
    @"
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Chapa Payment Gateway
VITE_CHAPA_PUBLIC_KEY=your_chapa_public_key
VITE_CHAPA_SECRET_KEY=your_chapa_secret_key
VITE_CHAPA_WEBHOOK_URL=your_chapa_webhook_url

# Telebirr Payment Gateway
VITE_TELEBIRR_APP_KEY=your_telebirr_app_key
VITE_TELEBIRR_APP_SECRET=your_telebirr_app_secret
VITE_TELEBIRR_MERCHANT_ID=your_telebirr_merchant_id
VITE_TELEBIRR_WEBHOOK_URL=your_telebirr_webhook_url

# Bibit Payment Gateway (Optional)
VITE_BIBIT_API_KEY=your_bibit_api_key
VITE_BIBIT_MERCHANT_ID=your_bibit_merchant_id
VITE_BIBIT_WEBHOOK_URL=your_bibit_webhook_url
"@ | Out-File -FilePath $envFile -Encoding UTF8
    
    Write-Host "SUCCESS: Created .env file. Please add your credentials." -ForegroundColor Green
    Write-Host ""
    exit
}

# Load .env file
$envContent = Get-Content $envFile

# Required variables
$requiredVars = @(
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_CHAPA_PUBLIC_KEY",
    "VITE_CHAPA_SECRET_KEY"
)

# Payment gateway variables
$gatewayVars = @(
    "VITE_CHAPA_WEBHOOK_URL",
    "VITE_TELEBIRR_APP_KEY",
    "VITE_TELEBIRR_APP_SECRET",
    "VITE_TELEBIRR_MERCHANT_ID",
    "VITE_TELEBIRR_WEBHOOK_URL"
)

Write-Host "Checking Required Variables:" -ForegroundColor Yellow
Write-Host ""

foreach ($var in $requiredVars) {
    $found = $false
    foreach ($line in $envContent) {
        if ($line -match "^$var=(.+)$") {
            $value = $matches[1].Trim()
            if ($value -and $value -notmatch "your_.*_key" -and $value -ne "") {
                $foundVars += "$var=✅ Set"
                $found = $true
                break
            }
        }
    }
    if (-not $found) {
        $missingVars += $var
        Write-Host "  [X] $var is missing or not set" -ForegroundColor Red
    } else {
        Write-Host "  [OK] $var is set" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Checking Payment Gateway Variables:" -ForegroundColor Yellow
Write-Host ""

foreach ($var in $gatewayVars) {
    $found = $false
    foreach ($line in $envContent) {
        if ($line -match "^$var=(.+)$") {
            $value = $matches[1].Trim()
            if ($value -and $value -notmatch "your_.*_key" -and $value -ne "") {
                $found = $true
                Write-Host "  [OK] $var is set" -ForegroundColor Green
                break
            }
        }
    }
    if (-not $found) {
        Write-Host "  [!] $var is not set" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan

if ($missingVars.Count -eq 0) {
    Write-Host "SUCCESS: All required variables are set!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Missing $($missingVars.Count) required variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow

if ($missingVars.Count -gt 0) {
    Write-Host "1. Add missing variables to .env file" -ForegroundColor White
    Write-Host "2. Restart your development server" -ForegroundColor White
    Write-Host "3. Check ENVIRONMENT_VARIABLES.md for details" -ForegroundColor White
} else {
    Write-Host "1. Deploy webhook functions to Supabase" -ForegroundColor White
    Write-Host "2. Configure webhook URLs in payment gateways" -ForegroundColor White
    Write-Host "3. Start testing payments!" -ForegroundColor White
}

Write-Host ""

