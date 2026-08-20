@echo off
echo =======================================================
echo 🚀 Starting OpenAssess FastAPI Backend
echo =======================================================
echo.
echo ⛔⛔⛔ IMPORTANT: DO NOT use http://0.0.0.0:8000 in your browser! ⛔⛔⛔
echo ⛔⛔⛔ This URL will NOT work! Use localhost instead! ⛔⛔⛔
echo.
echo ✅ CORRECT URLs:
echo    - Local: http://localhost:8000
echo    - Network: http://YOUR_IP_ADDRESS:8000
echo.
echo =======================================================
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
