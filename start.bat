@echo off
cd /d "%~dp0"

echo Starting Backend...
start "Backend" cmd /k "cd /d "%~dp0" && node server.js"

timeout /t 2 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo System running at: http://localhost:5173
echo ========================================
echo Close the black windows to stop
pause
