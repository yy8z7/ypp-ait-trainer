@echo off
chcp 65001 >nul
echo =========================================
echo       7 Days Study - One Click Start
echo =========================================
echo.
echo Starting local HTTP server with Node.js...

:: Try Node.js first
call node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found Node.js, starting backend server...
    echo [INFO] Please open in browser: http://localhost:3000
    start http://localhost:3000
    node server.js
    pause
    exit
)

echo [ERROR] Node.js is required to save data locally but not found.
pause
