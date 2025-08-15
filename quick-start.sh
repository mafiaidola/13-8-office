#!/bin/bash

# Medical Management System - Quick Start Script
# This script provides a guided setup for first-time deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Welcome message
clear
print_header "🏥 Medical Management System"
echo -e "${CYAN}Welcome to the comprehensive medical and pharmaceutical management system!${NC}"
echo ""
echo "This system includes:"
echo "• User Management with role-based access"
echo "• Clinic Registration and Management"
echo "• Financial System Integration"
echo "• Visit Tracking for Medical Representatives"
echo "• Product and Inventory Management"
echo "• Analytics and Reporting"
echo "• Multi-language Support (Arabic/English)"
echo ""

# Check if already set up
if [ -f ".env" ] && docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    print_warning "System appears to be already running!"
    echo ""
    echo "Current services:"
    docker compose -f docker-compose.dev.yml ps
    echo ""
    echo "Access your application:"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8001"
    echo "📚 API Documentation: http://localhost:8001/docs"
    echo ""
    read -p "Do you want to restart the services? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Restarting services..."
        ./deploy.sh development restart
    fi
    exit 0
fi

# Step 1: Prerequisites check
print_step "1/5 Checking prerequisites..."
if ! ./validate-deployment.sh > /dev/null 2>&1; then
    print_error "Prerequisites check failed. Running detailed validation..."
    ./validate-deployment.sh
    exit 1
fi
print_success "All prerequisites met!"

# Step 2: Environment setup
print_step "2/5 Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Environment file created from template"
else
    print_success "Environment file already exists"
fi

# Step 3: Configuration
print_step "3/5 Configuration setup..."
echo ""
echo "Current configuration options:"
echo "1. Development (quick start, default passwords)"
echo "2. Custom (configure your own settings)"
echo ""
read -p "Choose configuration (1/2) [1]: " config_choice
config_choice=${config_choice:-1}

if [ "$config_choice" = "2" ]; then
    print_step "Opening .env file for editing..."
    echo "Please edit the .env file with your preferred settings."
    echo "Key settings to consider:"
    echo "• MONGO_ROOT_PASSWORD (database password)"
    echo "• JWT_SECRET (security key)"
    echo "• REACT_APP_BACKEND_URL (for production deployment)"
    echo ""
    read -p "Press Enter after you've finished editing .env..."
fi

# Step 4: Build and start
print_step "4/5 Building and starting services..."
echo "This may take a few minutes on first run..."
echo ""

if ./deploy.sh development build; then
    print_success "Images built successfully!"
else
    print_error "Build failed. Please check the logs above."
    exit 1
fi

if ./deploy.sh development up; then
    print_success "Services started successfully!"
else
    print_error "Failed to start services. Please check the logs."
    exit 1
fi

# Step 5: Verification
print_step "5/5 Verifying deployment..."
sleep 10  # Give services time to start

# Check if services are responding
print_status "Checking service health..."

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_success "✓ Frontend is responding"
else
    print_warning "⚠ Frontend may still be starting..."
fi

# Check backend
if curl -s http://localhost:8001/api/health > /dev/null; then
    print_success "✓ Backend API is responding"
else
    print_warning "⚠ Backend API may still be starting..."
fi

# Final success message
echo ""
print_header "🎉 Deployment Complete!"
echo ""
echo -e "${GREEN}Your Medical Management System is now running!${NC}"
echo ""
echo "📱 Access your application:"
echo -e "   Frontend:          ${CYAN}http://localhost:3000${NC}"
echo -e "   Backend API:       ${CYAN}http://localhost:8001${NC}"
echo -e "   API Documentation: ${CYAN}http://localhost:8001/docs${NC}"
echo -e "   Database:          ${CYAN}mongodb://localhost:27017${NC}"
echo ""
echo "🔧 Management commands:"
echo "   View logs:         ./deploy.sh development logs"
echo "   Stop services:     ./deploy.sh development down"
echo "   Restart services:  ./deploy.sh development restart"
echo "   Service status:    ./deploy.sh development status"
echo ""
echo "📖 For more information, see README_DEPLOYMENT.md"
echo ""
print_success "Setup completed successfully! 🚀"

# Optional: Open browser
if command -v xdg-open &> /dev/null; then
    read -p "Open the application in your browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:3000
    fi
elif command -v open &> /dev/null; then
    read -p "Open the application in your browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:3000
    fi
fi