@echo off
REM Cronos Nexus x402 - Windows Setup Script

echo ========================================
echo    NEXUS x402 - Windows Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Building NIP-1 SDK...
cd sdk\nip1-sdk
call npm install
call npm run build
cd ..\..
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build SDK
    pause
    exit /b 1
)

echo.
echo [3/5] Setting up environment files...

REM Setup backend .env
if not exist backend\.env (
    if exist backend\.env.example (
        copy backend\.env.example backend\.env >nul
        echo Created backend\.env
    )
)

REM Setup frontend .env
if not exist frontend\.env (
    if exist frontend\.env.example (
        copy frontend\.env.example frontend\.env >nul
        echo Created frontend\.env
    )
)

REM Setup engine .env
if not exist engine\.env (
    if exist engine\.env.example (
        copy engine\.env.example engine\.env >nul
        echo Created engine\.env
    )
)

REM Setup mock-provider .env
if not exist mock-provider\.env (
    if exist mock-provider\.env.example (
        copy mock-provider\.env.example mock-provider\.env >nul
        echo Created mock-provider\.env
    )
)

echo.
echo [4/5] Installing service dependencies...

echo Installing backend...
cd backend
call npm install
cd ..

echo Installing frontend...
cd frontend
call npm install
cd ..

echo Installing engine...
cd engine
call npm install
cd ..

echo Installing mock-provider...
cd mock-provider
call npm install
cd ..

echo Installing contracts...
if exist contracts (
    cd contracts
    call npm install
    cd ..
)

echo Installing signer...
if exist signer (
    cd signer
    call npm install
    cd ..
)

echo.
echo [5/5] Setup complete!
echo.
echo ========================================
echo    SETUP COMPLETE!
echo ========================================
echo.
echo IMPORTANT: Before running, update these files:
echo   1. backend\.env - Add your MongoDB URI and private key
echo   2. engine\.env - Add your private key (same as backend)
echo.
echo Read SETUP_GUIDE.txt for detailed instructions
echo.
echo To start all services:
echo   npm start
echo.
pause
