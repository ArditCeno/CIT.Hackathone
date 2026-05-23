@echo off
echo ==============================================
echo        GuardianAI -- FIBANK Demo
echo ==============================================
echo.
echo [1/3] Starting Fraud ML API (port 8000)...
start "GuardianAI ML API" cmd /k "cd /d "%~dp0" && python fraud_api.py"
timeout /t 2 /nobreak >nul

echo [2/3] Starting Auth + Dashboard API (port 8001)...
start "GuardianAI Main API" cmd /k "cd /d "%~dp0" && python main.py"
timeout /t 2 /nobreak >nul

echo [3/3] Starting React Frontend (port 5173)...
start "GuardianAI Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo All services starting. Open http://localhost:5173 in your browser.
echo.
echo Demo accounts:
echo   admin  / admin123 / PIN: 0000   (Admin view)
echo   arjola / user123  / PIN: 1234   (User view)
echo   erjon  / user123  / PIN: 1357   (High-risk user)
echo.
pause
