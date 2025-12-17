@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================
echo Backend Setup - AI Workflow Automation
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo.

REM Check if pnpm is installed, if not install it
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing pnpm globally...
    npm install -g pnpm
)

echo ✅ pnpm version:
pnpm --version
echo.

REM Check if .env exists
if not exist ".env" (
    echo ⚙️ Creating .env file from template...
    if exist ".env.example" (
        copy .env.example .env
        echo ✅ .env file created. Please update with your configuration.
    ) else (
        echo ❌ .env.example not found. Please create .env manually.
    )
)

echo.
echo 📥 Installing dependencies...
call pnpm install

echo.
echo ✅ Backend setup complete!
echo.
echo 🎯 Next steps:
echo   1. Update .env with your configuration (especially MongoDB URI)
echo   2. Start MongoDB: docker run -d -p 27017:27017 --name mongodb mongo:latest
echo   3. Run: pnpm run dev
echo.
echo The server will be available at http://localhost:5000
echo.
pause
