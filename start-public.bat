@echo off
chcp 65001 >nul
echo ========================================
echo   群像·星火 - 实时对戏公网启动器
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请确保已安装 Node.js 并将其添加到 PATH。
    pause
    exit /b 1
)

REM 检查 SSH
where ssh >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 SSH，请确保已安装 OpenSSH。
    pause
    exit /b 1
)

echo [1/3] 启动后端服务...
start "后端服务" cmd /c "cd backend && node server.js"

echo [2/3] 等待后端启动...
timeout /t 3 /nobreak >nul

echo [3/3] 启动公网隧道...
echo.
echo ========================================
echo  正在通过 serveo.net 暴露公网链接...
echo  请稍等，链接生成后会显示在下面。
echo ========================================
echo.

ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:3001 serveo.net
