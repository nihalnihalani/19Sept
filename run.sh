#!/bin/bash

# Alchemy Studio Intelligent Run Script
# Handles environment setup, port management, and application startup

# Constants (following clean code principles)
readonly DEFAULT_PORT=3000
readonly BUILD_DIR=".next"
readonly ENV_FILE=".env"
readonly ENV_EXAMPLE=".env.example"
readonly PACKAGE_JSON="package.json"
readonly SCRIPT_NAME="$(basename "$0")"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Global variables
OVERRIDE_SYSTEM_ENV=false
PORT=""

# Print colored output
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Setup environment file if missing
setup_environment() {
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_EXAMPLE" ]]; then
            print_info "Creating $ENV_FILE from $ENV_EXAMPLE..."
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            print_warning "Please edit $ENV_FILE with your actual API key"
            return 1
        else
            print_error "Missing both $ENV_FILE and $ENV_EXAMPLE files"
            print_info "Creating basic $ENV_FILE template..."
            cat > "$ENV_FILE" << EOF
GEMINI_API_KEY=your_api_key_here
FRONTEND_PORT=$DEFAULT_PORT
EOF
            print_warning "Please edit $ENV_FILE with your actual API key"
            return 1
        fi
    fi
    return 0
}

# Load environment variables from .env file
load_environment_variables() {
    if [[ -f "$ENV_FILE" ]]; then
        print_info "Loading environment variables from $ENV_FILE..."
        # Source the file in a subshell to avoid polluting current environment
        set -a
        source "$ENV_FILE"
        set +a
        return 0
    else
        print_error "Environment file $ENV_FILE not found"
        return 1
    fi
}

# Check for system environment override (must be called BEFORE loading .env)
check_system_env_override() {
    local env_api_key
    local system_api_key="$GEMINI_API_KEY"
    
    if [[ -f "$ENV_FILE" ]]; then
        env_api_key=$(grep "^GEMINI_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)
        
        if [[ -n "$system_api_key" && -n "$env_api_key" && "$system_api_key" != "$env_api_key" ]]; then
            print_warning "System GEMINI_API_KEY detected (differs from $ENV_FILE file)"
            print_info "Will use $ENV_FILE file value instead of system value"
            OVERRIDE_SYSTEM_ENV=true
        fi
    fi
}

# Get port from environment or use default
get_port_from_env() {
    if [[ -n "$FRONTEND_PORT" ]]; then
        PORT="$FRONTEND_PORT"
    else
        PORT="$DEFAULT_PORT"
    fi
    
    # Validate port is a number
    if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [[ "$PORT" -lt 1 ]] || [[ "$PORT" -gt 65535 ]]; then
        print_warning "Invalid port '$PORT', using default port $DEFAULT_PORT"
        PORT="$DEFAULT_PORT"
    fi
    
    print_info "Using port: $PORT"
}

# Kill processes using the specified port
kill_port_processes() {
    local port="$1"
    local pids
    
    # Find processes using the port
    pids=$(lsof -ti tcp:"$port" 2>/dev/null)
    
    if [[ -n "$pids" ]]; then
        print_warning "Port $port is in use by processes: $pids"
        echo -n "Kill these processes? [y/N]: "
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo "$pids" | xargs kill -9 2>/dev/null
            print_success "Killed processes using port $port"
            sleep 1
        else
            print_error "Cannot start application - port $port is in use"
            return 1
        fi
    fi
    return 0
}

# Check if build is needed and build if necessary
check_and_build() {
    local should_build=false
    
    # Check if .next directory exists
    if [[ ! -d "$BUILD_DIR" ]]; then
        print_info "Build directory $BUILD_DIR not found"
        should_build=true
    # Check if package.json is newer than .next directory
    elif [[ "$PACKAGE_JSON" -nt "$BUILD_DIR" ]]; then
        print_info "Dependencies may have changed"
        should_build=true
    fi
    
    if [[ "$should_build" == true ]]; then
        print_info "Building application..."
        if npm run build; then
            print_success "Build completed successfully"
        else
            print_error "Build failed - continuing with development mode"
        fi
    else
        print_success "Build is up to date"
    fi
}

# Start the application with proper environment handling
start_application() {
    print_info "Starting Alchemy Studio on port $PORT..."
    
    if [[ "$OVERRIDE_SYSTEM_ENV" == true ]]; then
        print_info "🔧 Starting with $ENV_FILE file taking precedence over system environment..."
        env -u GEMINI_API_KEY npm run dev -- -p "$PORT"
    else
        print_info "🚀 Starting application..."
        npm run dev -- -p "$PORT"
    fi
}

# Validate prerequisites
check_prerequisites() {
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Check if package.json exists
    if [[ ! -f "$PACKAGE_JSON" ]]; then
        print_error "package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        print_warning "node_modules not found. Running npm install..."
        if npm install; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
    fi
}

# Main execution function
main() {
    echo "🎨 Alchemy Studio - Intelligent Run Script"
    echo "=========================================="
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    if ! setup_environment; then
        print_error "Please configure your environment file and run again"
        exit 1
    fi
    
    # Check for system environment overrides (BEFORE loading .env)
    check_system_env_override
    
    # Load environment variables
    if ! load_environment_variables; then
        exit 1
    fi
    
    # Get port configuration
    get_port_from_env
    
    # Handle port conflicts
    if ! kill_port_processes "$PORT"; then
        exit 1
    fi
    
    # Check and build if necessary
    check_and_build
    
    # Start the application
    start_application
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi