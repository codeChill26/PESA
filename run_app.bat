@echo off
chcp 65001 > nul
title PESA - English Speaking Practice Launcher (100% Client-Side PWA)
echo ===================================================
echo     PESA - English Speaking Practice for Family
echo     Khoi chay Frontend (Port 5173) - 100% Local-First
echo ===================================================

echo [1/2] Dang khoi chay Vite Frontend tai cong 5173...
start "PESA Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 2 /nobreak > nul

echo [2/2] Mo trinh duyet den giao dien luyen noi PESA...
start http://localhost:5173

echo.
echo ===================================================
echo   He thong PESA da san sang tai: http://localhost:5173
echo   (Nhan bat ky phim nao de dong cua so launcher nay)
echo ===================================================
pause > nul
