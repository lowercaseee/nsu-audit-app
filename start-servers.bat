@echo off
cd /d "%~dp0project 2"

echo Starting Backend...
start /b node src/app.js > backend.log 2>&1

timeout /t 3 /nobreak >nul

cd /d "%~dp0project 2\frontend"

echo Starting Frontend...
start /b npx vite --port 5173 > frontend.log 2>&1

timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo System running at: http://localhost:5173
echo Backend:   http://localhost:3000
echo ========================================

pause
