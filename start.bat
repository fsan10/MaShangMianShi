@echo off
chcp 65001 >nul
title 马上面试 - 一键启动

echo ========================================
echo    马上面试 - 面试题库系统 一键启动
echo ========================================
echo.

echo [1/4] 检查 Docker 服务...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker 未启动，请先启动 Docker Desktop
    pause
    exit /b 1
)
echo [OK] Docker 已就绪

echo.
echo [2/4] 启动 PostgreSQL 和 Redis...
docker-compose up -d postgres redis
if %errorlevel% neq 0 (
    echo [错误] 数据库启动失败
    pause
    exit /b 1
)
echo [OK] 数据库已启动

echo.
echo [3/4] 启动后端 (FastAPI)...
start "后端 - FastAPI" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"
echo [OK] 后端启动中... http://localhost:8000

echo.
echo [4/4] 启动前端 (React)...
start "前端 - React" cmd /k "cd /d %~dp0frontend && npm run dev"
echo [OK] 前端启动中... http://localhost:5173

echo.
echo ========================================
echo  启动完成！
echo.
echo  前端页面:  http://localhost:5173
echo  后端 API:  http://localhost:8000
echo  API 文档:  http://localhost:8000/api/docs
echo.
echo  关闭此窗口不会停止服务
echo  如需停止，请运行 stop.bat
echo ========================================
echo.
pause
