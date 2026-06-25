@echo off
title Akalytor AI Startup Controller

echo ===================================================
echo             AKALYTOR AI SYSTEM CONTROLLER          
echo ===================================================
echo.

echo [+] Launching Backend Server (FastAPI uvicorn)...
start "Akalytor Backend Server" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

echo [+] Launching Frontend Client (Vite React)...
start "Akalytor Frontend Client" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo [SUCCESS] Both servers are starting up in separate windows!
echo.
echo   - Backend Server Running: http://127.0.0.1:8000
echo   - Frontend Client Running: http://localhost:5173
echo.
echo   - Login Username: Akalya
echo   - Login Password: 90807
echo ===================================================
echo.
pause
