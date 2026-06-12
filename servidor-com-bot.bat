@echo off
title PedEasy - Servidor + Bot
echo ========================================
echo  Iniciando PedEasy - Servidor + Bot
echo ========================================
echo.

echo [1/3] Iniciando Backend (porta 3000)...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/3] Iniciando Frontend (porta 5173)...
start "Frontend" cmd /k "cd /d "%~dp0." && npm run dev"

echo [3/3] Iniciando WhatsApp Bot (porta 3001)...
start "WhatsApp Bot" cmd /k "cd /d "%~dp0whatsapp-bot" && npm run dev"

echo.
echo ========================================
echo  Tudo iniciado!
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo  Bot:      http://localhost:3001
echo ========================================
echo.
pause
