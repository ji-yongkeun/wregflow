@echo off
REM WRegFlow Local Development Script

color 0A
cls

echo ================================
echo WRegFlow Local Development Start
echo ================================
echo.

echo Step 1: Starting Backend...
start "WRegFlow Backend" cmd /k "cd /d C:\wk_pgm\wregflow\backend && .\venv\Scripts\activate && python main.py"

timeout /t 3

echo Step 2: Starting Frontend...
start "WRegFlow Frontend" cmd /k "cd /d C:\wk_pgm\wregflow\frontend && npm run dev"

timeout /t 2

cls
echo ================================
echo ? Services Started!
echo ================================
echo.
echo URLs:
echo - Backend: http://localhost:8001
echo - Frontend: http://localhost:8090
echo.
pause