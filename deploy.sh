#!/bin/bash

# Medical Management System - Deployment Script
# This script builds and deploys the application using Docker Compose

set -e

echo "🏥 Medical Management System - Deployment Script"
echo "================================================"

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example"
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before running again."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT=${1:-development}
ACTION=${2:-up}

print_status "Environment: $ENVIRONMENT"
print_status "Action: $ACTION"

# Set the appropriate docker-compose file
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    COMPOSE_FILE="docker-compose.dev.yml"
fi

print_status "Using compose file: $COMPOSE_FILE"

# Execute the action
case $ACTION in
    "build")
        print_status "Building images..."
        docker compose -f $COMPOSE_FILE build --no-cache
        print_success "Build completed!"
        ;;
    "up")
        print_status "Starting services..."
        docker-compose -f $COMPOSE_FILE up -d
        print_success "Services started!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend API: http://localhost:8001"
        print_status "Database: mongodb://localhost:27017"
        ;;
    "down")
        print_status "Stopping services..."
        docker-compose -f $COMPOSE_FILE down
        print_success "Services stopped!"
        ;;
    "restart")
        print_status "Restarting services..."
        docker compose -f $COMPOSE_FILE down
        docker compose -f $COMPOSE_FILE up -d
        print_success "Services restarted!"
        ;;
    "logs")
        print_status "Showing logs..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    "status")
        print_status "Service status:"
        docker compose -f $COMPOSE_FILE ps
        ;;
    "cleanup")
        print_warning "This will remove all containers, volumes, and images!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose -f $COMPOSE_FILE down -v
            docker system prune -f
            print_success "Cleanup completed!"
        else
            print_status "Cleanup cancelled."
        fi
        ;;
    *)
        echo "Usage: $0 [environment] [action]"
        echo "Environment: development (default) | production"
        echo "Actions:"
        echo "  build    - Build all images"
        echo "  up       - Start all services (default)"
        echo "  down     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show logs"
        echo "  status   - Show service status"
        echo "  cleanup  - Remove everything (USE WITH CAUTION)"
        echo ""
        echo "Examples:"
        echo "  $0                           # Start in development mode"
        echo "  $0 production up             # Start in production mode"
        echo "  $0 development build         # Build development images"
        echo "  $0 production logs           # Show production logs"
        exit 1
        ;;
esac