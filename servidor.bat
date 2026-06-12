@echo off
title PedEasy - Servidor Local
echo ====================================
echo  Iniciando PedEasy - Servidor Local
echo ====================================
echo.

echo [1/2] Iniciando Backend (porta 3000)...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/2] Iniciando Frontend (porta 5173)...
start "Frontend" cmd /k "cd /d "%~dp0." && npm run dev"

echo.
echo ====================================
echo  Servidores iniciados!
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo ====================================
echo.
pause
