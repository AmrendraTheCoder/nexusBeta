@echo off
REM Cronos Nexus x402 - Windows Launcher
REM Usage: start.bat [option]
REM   Options:
REM     setup       Install all dependencies only
REM     frontend    Start frontend only
REM     backend     Start backend only
REM     engine      Start engine only
REM     mock        Start mock provider only
REM     all         Start all services (default)
REM     help        Show this help message

setlocal enabledelayedexpansion

REM Parse command line arguments
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=all

REM Show banner
echo.
echo =========================================
echo         🚀 Nexus x402 - Launcher
echo =========================================
echo.

REM Show help
if "%COMMAND%"=="help" (
    echo Usage: start.bat [option]
    echo.
    echo Options:
    echo   setup       Install all dependencies only
    echo   frontend    Start frontend only
    echo   backend     Start backend only
    echo   engine      Start engine only
    echo   mock        Start mock provider only
    echo   all         Start all services (default^)
    echo   help        Show this help message
    echo.
    echo Examples:
    echo   start.bat setup         Install dependencies
    echo   start.bat all           Start all services
    echo   start.bat frontend      Start only frontend
    goto :eof
)

REM Setup - Install dependencies
if "%COMMAND%"=="setup" (
    echo 📦 Installing dependencies...
    echo.
    
    REM Check for NIP-1 SDK
    if exist "sdk\nip1-sdk" (
        echo 🔨 Building NIP-1 SDK...
        cd sdk\nip1-sdk
        call npm install
        call npm run build
        cd ..\..
        echo ✅ SDK built successfully!
        echo.
    )
    
    REM Install root dependencies
    if exist "package.json" (
        echo 📦 Installing root dependencies...
        call npm install
        echo.
    )
    
    REM Install backend dependencies
    if exist "backend\package.json" (
        echo 📦 Installing backend dependencies...
        cd backend
        call npm install
        cd ..
        echo.
    )
    
    REM Install frontend dependencies
    if exist "frontend\package.json" (
        echo 📦 Installing frontend dependencies...
        cd frontend
        call npm install
        cd ..
        echo.
    )
    
    REM Install engine dependencies
    if exist "engine\package.json" (
        echo 📦 Installing engine dependencies...
        cd engine
        call npm install
        cd ..
        echo.
    )
    
    REM Install mock provider dependencies
    if exist "mock-provider\package.json" (
        echo 📦 Installing mock provider dependencies...
        cd mock-provider
        call npm install
        cd ..
        echo.
    )
    
    REM Install booking service dependencies
    if exist "booking-service\package.json" (
        echo 📦 Installing booking service dependencies...
        cd booking-service
        call npm install
        cd ..
        echo.
    )
    
    echo.
    echo ✅ Setup complete!
    echo.
    echo Next steps:
    echo 1. Configure .env files in each service directory
    echo 2. Run: start.bat all
    echo.
    goto :eof
)

REM Start services
if "%COMMAND%"=="frontend" (
    echo 🎨 Starting Frontend on http://localhost:5173
    cd frontend
    call npm run dev
    goto :eof
)

if "%COMMAND%"=="backend" (
    echo 🔌 Starting Backend on http://localhost:3001
    cd backend
    call npm run dev
    goto :eof
)

if "%COMMAND%"=="engine" (
    echo ⚙️  Starting Engine on http://localhost:8080
    cd engine
    call npm run dev
    goto :eof
)

if "%COMMAND%"=="mock" (
    echo 🎭 Starting Mock Provider on http://localhost:4000
    cd mock-provider
    call npm run dev
    goto :eof
)

if "%COMMAND%"=="all" (
    echo 🚀 Starting all services...
    echo.
    echo Services will start in new terminal windows:
    echo   - Backend:        http://localhost:3001
    echo   - Frontend:       http://localhost:5173
    echo   - Engine:         http://localhost:8080
    echo   - Mock Provider:  http://localhost:4000
    echo.
    echo 💡 Press Ctrl+C in each window to stop services
    echo.
    
    REM Start Backend
    start "Nexus Backend (Port 3001)" cmd /k "cd /d %CD%\backend && npm run dev"
    timeout /t 2 /nobreak >nul
    
    REM Start Frontend
    start "Nexus Frontend (Port 5173)" cmd /k "cd /d %CD%\frontend && npm run dev"
    timeout /t 2 /nobreak >nul
    
    REM Start Engine
    start "Nexus Engine (Port 8080)" cmd /k "cd /d %CD%\engine && npm run dev"
    timeout /t 2 /nobreak >nul
    
    REM Start Mock Provider
    start "Nexus Mock Provider (Port 4000)" cmd /k "cd /d %CD%\mock-provider && npm run dev"
    
    echo.
    echo ✅ All services started!
    echo.
    echo 📱 Open http://localhost:5173 in your browser
    echo 🔌 Backend API: http://localhost:3001
    echo ⚙️  Engine API: http://localhost:8080
    echo 🎭 Mock API: http://localhost:4000
    echo.
    goto :eof
)

REM Invalid command
echo ❌ Invalid command: %COMMAND%
echo Run 'start.bat help' for usage information
