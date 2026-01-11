#!/bin/bash

# Cronos Nexus x402 - One-Click Setup Script with SDK

echo "🚀 Starting Nexus x402 Setup..."
echo ""

# Function to check if .env file exists, if not copy from .env.example
setup_env() {
    local dir=$1
    if [ -d "$dir" ]; then
        if [ ! -f "$dir/.env" ] && [ -f "$dir/.env.example" ]; then
            echo "📝 Creating .env file in $dir..."
            cp "$dir/.env.example" "$dir/.env"
            echo "   ⚠️  Please update $dir/.env with your configuration"
        fi
    fi
}

# Function to install dependencies in a directory
install_deps() {
    local dir=$1
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo "📦 Installing dependencies in $dir..."
        cd "$dir"
        npm install
        cd - > /dev/null
    else
        echo "⚠️  Skipping $dir (not found or no package.json)"
    fi
}

# 1. Install Project Root Deps (if any)
if [ -f "package.json" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# 2. Build and Install NIP-1 SDK FIRST
echo "🔨 Building NIP-1 SDK..."
if [ -d "sdk/nip1-sdk" ]; then
    cd sdk/nip1-sdk
    npm install
    npm run build
    cd - > /dev/null
    echo "✅ SDK built successfully!"
else
    echo "⚠️  SDK directory not found"
fi

# 3. Setup .env files for all services
echo ""
echo "🔧 Setting up environment files..."
setup_env "backend"
setup_env "frontend"
setup_env "engine"
setup_env "mock-provider"
setup_env "signer"

# 4. Install Sub-project Deps
install_deps "frontend"
install_deps "engine"
install_deps "contracts"
install_deps "backend"
install_deps "mock-provider"
install_deps "signer"

echo ""
echo "✅ All dependencies installed!"
echo "✅ NIP-1 SDK ready!"
echo ""
echo "⚠️  IMPORTANT: Before running, please:"
echo "   1. Update backend/.env with your MongoDB URI and private key"
echo "   2. Update engine/.env with your private key (same as backend)"
echo "   3. Ensure all contract addresses are correct (already configured for Cronos zkEVM Testnet)"
echo ""
echo "👉 To start the entire app:"
echo "   npm start"
echo ""
echo "👉 Or start individual services:"
echo "   npm run dev:backend"
echo "   npm run dev:frontend"
echo "   npm run dev:engine"
echo "   npm run dev:mock"
echo ""
echo "👉 To test NIP-1 SDK integration:"
echo "   cd engine && tsx src/server.ts test-nexuspay-sdk.json"
