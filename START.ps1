#!/usr/bin/env pwsh
<#
.SYNOPSIS
    OpenAssess Backend & Frontend Quick Start
    
.DESCRIPTION
    Verifies setup and guides you through running both backend and frontend
#>

Write-Host ""
Write-Host "================================================================"
Write-Host "OpenAssess - AI-Powered Assessment Platform"
Write-Host "================================================================"
Write-Host ""
Write-Host "Verifying setup..."
Write-Host ""

# Check backend
Write-Host "STEP 1: Verifying backend..."
Write-Host "================================================================"
try {
    $backendTest = python -c "from backend.main import app; print('OK')" 2>&1
    if ($backendTest -like "*OK*") {
        Write-Host "✓ Backend verified" -ForegroundColor Green
    } else {
        throw "Backend import failed"
    }
} catch {
    Write-Host "✗ Backend verification failed" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "STEP 2: Checking database connection..."
Write-Host "================================================================"
try {
    $dbTest = python backend\database.py 2>&1
    if ($dbTest -like "*successfully*") {
        Write-Host "✓ Database connected" -ForegroundColor Green
    } else {
        throw "Database connection failed"
    }
} catch {
    Write-Host "✗ Database connection failed" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is running and accessible" -ForegroundColor Yellow
    Write-Host "Database URL: postgresql://postgres:newpassword123@localhost:5432/OpenAssess" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "STEP 3: Backend and frontend are ready!" -ForegroundColor Green
Write-Host "================================================================"
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "  cd backend"
Write-Host "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "  cd frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================================"
Write-Host "Test Credentials for Payment:"
Write-Host "================================================================"
Write-Host "Credit/Debit Card: 1111 1111 1111 1111"
Write-Host "Expiry: 12/30"
Write-Host "CVV: 123"
Write-Host "UPI: test@upi"
Write-Host ""
Write-Host "================================================================"
Read-Host "Press Enter to exit"
