@echo off
chcp 65001 >nul 2>&1
echo ══════════════════════════════════════════════
echo   Codex Router — Responses API Proxy
echo ══════════════════════════════════════════════
echo.
echo [INFO] The server loads .env file automatically.
echo [INFO] Make sure you have .env configured (copy .env.example).
echo.

node "%~dp0src\server.js"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server exited with error code %ERRORLEVEL%
    pause
)
