@echo off
chcp 65001 >nul
echo =========================================
echo       7 Days Study - One Click Start
echo =========================================
echo.
echo Starting local HTTP server...

cd dist

:: We will just start python server, as npx serve might prompt for installation interactively and hang
call python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found Python, starting with http.server...
    echo [INFO] Please open in browser: http://localhost:8000
    start http://localhost:8000
    python -m http.server 8000
    pause
    exit
)

:: Try npx if python is not available, but pass --yes to avoid prompts
call npx --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found Node.js, starting with npx serve...
    echo [INFO] Please open in browser: http://localhost:3000
    start http://localhost:3000
    call npx --yes serve . -p 3000
    pause
    exit
)

echo [ERROR] Node.js or Python is required but not found.
pause
