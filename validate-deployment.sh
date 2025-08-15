#!/bin/bash

# Medical Management System - Deployment Validation Script
# This script validates the deployment setup without building images

set -e

echo "🏥 Medical Management System - Deployment Validation"
echo "==================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
else
    print_error "Docker is not installed"
    exit 1
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    print_success "Docker Compose is available: $COMPOSE_VERSION"
else
    print_error "Docker Compose is not available"
    exit 1
fi

# Check if Docker daemon is running
if docker info &> /dev/null; then
    print_success "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    exit 1
fi

# Check deployment files
print_status "Checking deployment files..."

REQUIRED_FILES=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "nginx/nginx.conf"
    "deploy.sh"
    ".env.example"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file is missing"
        exit 1
    fi
done

# Check if .env file exists
if [ -f ".env" ]; then
    print_success "✓ .env file exists"
else
    print_warning "✗ .env file not found (will be created from .env.example)"
fi

# Validate compose files
print_status "Validating Docker Compose files..."

if docker compose -f docker-compose.dev.yml config &> /dev/null; then
    print_success "✓ docker-compose.dev.yml is valid"
else
    print_error "✗ docker-compose.dev.yml has syntax errors"
    exit 1
fi

if docker compose -f docker-compose.yml config &> /dev/null; then
    print_success "✓ docker-compose.yml is valid"
else
    print_error "✗ docker-compose.yml has syntax errors"
    exit 1
fi

# Check backend requirements
print_status "Checking backend requirements..."
if [ -f "backend/requirements.txt" ]; then
    PYTHON_DEPS=$(wc -l < backend/requirements.txt)
    print_success "✓ Backend has $PYTHON_DEPS Python dependencies"
else
    print_error "✗ backend/requirements.txt not found"
    exit 1
fi

# Check frontend dependencies
print_status "Checking frontend dependencies..."
if [ -f "frontend/package.json" ]; then
    if command -v jq &> /dev/null; then
        DEPS_COUNT=$(jq '.dependencies | length' frontend/package.json 2>/dev/null || echo "unknown")
        print_success "✓ Frontend has $DEPS_COUNT npm dependencies"
    else
        print_success "✓ Frontend package.json exists"
    fi
else
    print_error "✗ frontend/package.json not found"
    exit 1
fi

# Check ports availability
print_status "Checking port availability..."

PORTS=(3000 8001 27017 80)
for port in "${PORTS[@]}"; do
    if ! lsof -i:$port &> /dev/null; then
        print_success "✓ Port $port is available"
    else
        print_warning "⚠ Port $port is already in use"
    fi
done

# Check system resources
print_status "Checking system resources..."

# Check available memory
if command -v free &> /dev/null; then
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEMORY_GB" -ge 4 ]; then
        print_success "✓ Available memory: ${MEMORY_GB}GB (recommended: 4GB+)"
    else
        print_warning "⚠ Available memory: ${MEMORY_GB}GB (recommended: 4GB+)"
    fi
fi

# Check available disk space
DISK_SPACE=$(df -h . | awk 'NR==2{print $4}')
print_success "✓ Available disk space: $DISK_SPACE"

# Summary
print_status "Validation Summary:"
echo "==================="
print_success "✓ All required files are present"
print_success "✓ Docker and Docker Compose are ready"
print_success "✓ Compose files are valid"
print_success "✓ System meets basic requirements"

echo ""
print_status "Next steps:"
echo "1. Ensure .env file is configured: cp .env.example .env"
echo "2. Edit .env with your settings"
echo "3. Run deployment: ./deploy.sh development up"
echo ""
print_success "Deployment setup is ready! 🚀"