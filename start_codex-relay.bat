@echo off
title Codex Relay - DeepSeek Proxy
chcp 65001 >nul

echo ========================================
echo   Codex Relay 启动脚本
echo   中转地址: http://127.0.0.1:4446
echo ========================================
echo.

:: ==================== 配置区域 ====================
:: 【重要】将等号后面的内容替换为你的真实 DeepSeek API Key
set DEEPSEEK_API_KEY=sk-QW0hvbia2nvzjjJMKLp0ALOrhC0DIcONabEFYbEZVzKUDD21

set CODEX_RELAY_PORT=4446
set CODEX_RELAY_UPSTREAM=https://api.zaixianshauti.top/v1
:: ==================================================

:: 验证 API Key 配置
set "KEY_VALID=0"

:: 检查是否还是默认占位符
if "%DEEPSEEK_API_KEY%"=="sk-你的真实key粘贴在这里" goto show_error

:: 检查是否为空
if "%DEEPSEEK_API_KEY%"=="" goto show_error

:: 检查是否以 sk- 开头（仅做基本格式检查）
echo %DEEPSEEK_API_KEY% | findstr /b "sk-" >nul
if %errorlevel% neq 0 goto show_error

:: 通过所有检查
goto start_relay

:show_error
echo [错误] API Key 未正确配置！
echo.
echo 请按以下步骤操作：
echo 1. 用记事本打开本脚本文件
echo 2. 找到 set DEEPSEEK_API_KEY= 这一行
echo 3. 将等号后面的内容替换为你的真实 DeepSeek API Key
echo 4. 保存文件后重新运行
echo.
echo 获取 API Key: https://platform.deepseek.com/api_keys
echo.
pause
exit /b 1

:start_relay
:: 检查 Python 环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查并安装 codex-relay
python -c "import codex_relay" >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] codex-relay 未安装，正在安装...
    pip install codex-relay
    if %errorlevel% neq 0 (
        echo [错误] 安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

:: 启动 relay
echo [信息] 正在启动 relay...
echo   - 上游服务: %CODEX_RELAY_UPSTREAM%
echo   - 监听端口: %CODEX_RELAY_PORT%
echo   - API Key 前缀: %DEEPSEEK_API_KEY:~0,15%...
echo   - 按 Ctrl+C 可停止服务
echo.

set CODEX_RELAY_UPSTREAM=%CODEX_RELAY_UPSTREAM%
set CODEX_RELAY_API_KEY=%DEEPSEEK_API_KEY%
set CODEX_RELAY_PORT=%CODEX_RELAY_PORT%

codex-relay

pause