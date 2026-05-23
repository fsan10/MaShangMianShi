@echo off
chcp 65001 >nul
title 马上面试 - 停止服务

echo ========================================
echo    马上面试 - 停止所有服务
echo ========================================
echo.

echo [1/2] 停止后端和前端进程...
taskkill /fi "WINDOWTITLE eq 后端 - FastAPI*" >nul 2>&1
taskkill /fi "WINDOWTITLE eq 前端 - React*" >nul 2>&1
echo [OK] 进程已停止

echo.
echo [2/2] 停止 Docker 容器...
docker-compose down
echo [OK] 容器已停止

echo.
echo 所有服务已停止
pause
