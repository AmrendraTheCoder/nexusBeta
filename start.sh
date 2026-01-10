#!/bin/bash

# Cronos Nexus x402 - Setup & Run Script
# Usage: ./start.sh [option]
#   Options:
#     --setup       Install all dependencies only
#     --frontend    Start frontend only
#     --backend     Start backend only
#     --engine      Start engine only
#     --mock        Start mock provider only
#     --all         Start all services (default)
#     --help        Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════╗"
    echo "║        🚀 Nexus x402 - Launcher          ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Show help
show_help() {
    echo -e "${YELLOW}Usage:${NC} ./start.sh [option]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --setup       Install all dependencies only"
    echo "  --frontend    Start frontend only"
    echo "  --backend     Start backend only"
    echo "  --engine      Start engine only"
    echo "  --mock        Start mock provider only"
    echo "  --all         Start all services (default)"
    echo "  --help        Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./start.sh              # Setup + start all services"
    echo "  ./start.sh --setup      # Install deps only"
    echo "  ./start.sh --frontend   # Start frontend only"
    echo ""
}

# Install dependencies in a directory
install_deps() {
    local dir=$1
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo -e "${BLUE}📦 Installing dependencies in ${dir}...${NC}"
        cd "$dir"
        npm install --silent
        cd "$SCRIPT_DIR"
    else
        echo -e "${YELLOW}⚠️  Skipping $dir (not found or no package.json)${NC}"
    fi
}

# Setup function
run_setup() {
    echo -e "${GREEN}🔧 Setting up Nexus x402...${NC}"
    echo ""

    # 1. Install Root Deps
    if [ -f "package.json" ]; then
        echo -e "${BLUE}📦 Installing root dependencies...${NC}"
        npm install --silent
    fi

    # 2. Build NIP-1 SDK
    if [ -d "sdk/nip1-sdk" ]; then
        echo -e "${BLUE}🔨 Building NIP-1 SDK...${NC}"
        cd sdk/nip1-sdk
        npm install --silent
        npm run build --silent
        cd "$SCRIPT_DIR"
        echo -e "${GREEN}✅ SDK built successfully!${NC}"
    fi

    # 3. Install Sub-project Deps
    install_deps "frontend"
    install_deps "engine"
    install_deps "contracts"
    install_deps "backend"
    install_deps "mock-provider"
    install_deps "signer"

    echo ""
    echo -e "${GREEN}✅ All dependencies installed!${NC}"
    echo ""
}

# Start frontend
start_frontend() {
    echo -e "${CYAN}🌐 Starting Frontend...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
}

# Start backend
start_backend() {
    echo -e "${CYAN}🖥️  Starting Backend...${NC}"
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
}

# Start engine
start_engine() {
    echo -e "${CYAN}⚙️  Starting Engine...${NC}"
    cd engine
    npm run dev &
    ENGINE_PID=$!
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ Engine started (PID: $ENGINE_PID)${NC}"
}

# Start mock provider
start_mock() {
    echo -e "${CYAN}🎭 Starting Mock Provider...${NC}"
    cd mock-provider
    npm run dev &
    MOCK_PID=$!
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ Mock Provider started (PID: $MOCK_PID)${NC}"
}

# Start all services
start_all() {
    echo -e "${GREEN}🚀 Starting all services...${NC}"
    echo ""
    
    start_backend
    sleep 2
    start_engine
    sleep 1
    start_mock
    sleep 1
    start_frontend
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ All services started!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}📍 Access Points:${NC}"
    echo -e "   Frontend:  ${CYAN}http://localhost:5173${NC}"
    echo -e "   Backend:   ${CYAN}http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"
    echo ""
    
    # Wait for all background processes
    wait
}

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    pkill -P $$ 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main logic
print_banner

case "${1:-}" in
    --help|-h)
        show_help
        ;;
    --setup)
        run_setup
        ;;
    --frontend)
        start_frontend
        wait
        ;;
    --backend)
        start_backend
        wait
        ;;
    --engine)
        start_engine
        wait
        ;;
    --mock)
        start_mock
        wait
        ;;
    --all|"")
        run_setup
        start_all
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
