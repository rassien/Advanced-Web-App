@echo off
echo Starting Calisan-Sube Atama Development Server...
echo.

echo [1/2] Starting Backend Server (Node.js/Express)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server (React)...  
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Development Servers Starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to open browser...
pause > nul

start http://localhost:3000

echo.
echo Development servers are running!
echo Close this window to stop servers.
pause