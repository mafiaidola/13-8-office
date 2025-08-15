# Medical Management System - Makefile
# Convenient commands for managing the application

.PHONY: help validate setup build start stop restart logs status clean

# Default target
help:
	@echo "Medical Management System - Available Commands"
	@echo "=============================================="
	@echo ""
	@echo "Setup:"
	@echo "  make setup      - Initial setup (copy .env, validate)"
	@echo "  make validate   - Validate deployment configuration"
	@echo ""
	@echo "Development:"
	@echo "  make build      - Build all Docker images"
	@echo "  make start      - Start development environment"
	@echo "  make stop       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo ""
	@echo "Monitoring:"
	@echo "  make logs       - View application logs"
	@echo "  make status     - Show service status"
	@echo ""
	@echo "Production:"
	@echo "  make prod-start - Start production environment"
	@echo "  make prod-stop  - Stop production environment"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean      - Clean up containers and volumes"
	@echo "  make reset      - Complete reset (WARNING: destroys data)"
	@echo ""

# Setup and validation
setup:
	@echo "🏥 Setting up Medical Management System..."
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		echo "⚠️  Please edit .env file with your configuration"; \
	else \
		echo "✅ .env file already exists"; \
	fi
	@./validate-deployment.sh

validate:
	@./validate-deployment.sh

# Development commands
build:
	@echo "🔨 Building Docker images..."
	@docker compose -f docker-compose.dev.yml build

start:
	@echo "🚀 Starting development environment..."
	@docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:8001"
	@echo "📚 API Docs: http://localhost:8001/docs"
	@echo "🗄️  Database: mongodb://localhost:27017"

stop:
	@echo "🛑 Stopping services..."
	@docker compose -f docker-compose.dev.yml down

restart:
	@echo "🔄 Restarting services..."
	@docker compose -f docker-compose.dev.yml restart

# Production commands
prod-start:
	@echo "🚀 Starting production environment..."
	@docker compose -f docker-compose.yml up -d
	@echo ""
	@echo "✅ Production services started!"
	@echo "🌐 Application: http://localhost"
	@echo "🔧 Backend API: http://localhost:8001"

prod-stop:
	@echo "🛑 Stopping production services..."
	@docker compose -f docker-compose.yml down

# Monitoring
logs:
	@echo "📊 Viewing application logs..."
	@docker compose -f docker-compose.dev.yml logs -f

status:
	@echo "📋 Service Status:"
	@docker compose -f docker-compose.dev.yml ps

# Maintenance
clean:
	@echo "🧹 Cleaning up containers and images..."
	@docker compose -f docker-compose.dev.yml down
	@docker compose -f docker-compose.yml down
	@docker system prune -f

reset:
	@echo "⚠️  WARNING: This will destroy all data!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🗑️  Performing complete reset..."; \
		docker compose -f docker-compose.dev.yml down -v; \
		docker compose -f docker-compose.yml down -v; \
		docker system prune -af; \
		echo "✅ Reset complete!"; \
	else \
		echo "❌ Reset cancelled."; \
	fi

# Quick development workflow
dev: setup build start
	@echo "🎉 Development environment ready!"

# Quick production deployment
prod: setup prod-start
	@echo "🎉 Production environment ready!"