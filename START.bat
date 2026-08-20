@echo off
REM OpenAssess Backend & Frontend Quick Start

echo.
echo ================================================================
echo OpenAssess - AI-Powered Assessment Platform
echo ================================================================
echo.
echo Starting the OpenAssess application...
echo.
echo STEP 1: Verifying backend...
echo ================================================================
cd /d "%~dp0"
python -c "from backend.main import app; print('✓ Backend verified')" 2>nul
if %errorlevel% neq 0 (
    echo ✗ Backend verification failed
    pause
    exit /b 1
)

echo.
echo STEP 2: Checking database connection...
echo ================================================================
cd backend
python database.py 2>nul | findstr "successfully" >nul
if %errorlevel% neq 0 (
    echo ✗ Database connection failed
    echo Please ensure PostgreSQL is running and accessible
    echo Database URL: postgresql://postgres:newpassword123@localhost:5432/OpenAssess
    pause
    exit /b 1
)
echo ✓ Database connected
cd ..

echo.
echo STEP 3: Backend and frontend are ready!
echo ================================================================
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo ================================================================
echo Test Credentials for Payment:
echo ================================================================
echo Credit/Debit Card: 1111 1111 1111 1111
echo Expiry: 12/30
echo CVV: 123
echo UPI: test@upi
echo.
echo ================================================================
pause
