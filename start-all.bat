@echo off
chcp 65001 >nul
title 社群名片服务启动脚本

echo ========================================
echo   社群名片 - 一键启动所有服务
echo ========================================
echo.

cd /d C:\code\shequn

REM 检查后端是否已在运行
set BACKEND_RUNNING=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do set BACKEND_RUNNING=1

if "%BACKEND_RUNNING%"=="0" (
    echo [1/2] 启动后端服务 (端口 3001)...
    start "shequn-backend" /min cmd /c "cd /d C:\code\shequn\backend && node dist/main.js > logs\out.log 2> logs\err.log"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/2] 后端服务已在运行，跳过
)

REM 检查代理是否已在运行
set PROXY_RUNNING=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":80 "') do set PROXY_RUNNING=1

if "%PROXY_RUNNING%"=="0" (
    echo [2/2] 启动反向代理 (端口 80)...
    start "shequn-proxy" /min cmd /c "cd /d C:\code\shequn && node proxy-server.js > logs\proxy.log 2>&1"
    timeout /t 2 /nobreak >nul
) else (
    echo [2/2] 反向代理已在运行，跳过
)

echo.
echo ========================================
echo   服务启动完成！
echo   管理端: http://121.43.141.147/admin
echo   移动端: http://121.43.141.147/mobile
echo ========================================
