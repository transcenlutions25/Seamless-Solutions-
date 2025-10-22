#!/bin/bash
# Seamless Solutions - Production Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env"

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_requirements() {
    print_status "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your production values before continuing."
            exit 1
        else
            print_error ".env.example file not found"
            exit 1
        fi
    fi
    
    print_status "All requirements met ✓"
}

pull_latest() {
    print_status "Pulling latest changes from repository..."
    git pull origin main || print_warning "Could not pull latest changes (may not be in a git repo)"
}

build_images() {
    print_status "Building Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
}

stop_services() {
    print_status "Stopping existing services..."
    docker-compose -f $COMPOSE_FILE down || true
}

start_services() {
    print_status "Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
}

check_health() {
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    # Check if services are running
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        print_status "Services are running ✓"
    else
        print_error "Some services failed to start"
        docker-compose -f $COMPOSE_FILE logs --tail=50
        exit 1
    fi
}

show_status() {
    print_status "Current service status:"
    docker-compose -f $COMPOSE_FILE ps
}

cleanup_old_images() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
}

# Main deployment flow
main() {
    echo "======================================"
    echo "  Seamless Solutions Deployment"
    echo "======================================"
    echo ""
    
    check_requirements
    
    # Ask for confirmation
    read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    pull_latest
    stop_services
    build_images
    start_services
    check_health
    cleanup_old_images
    show_status
    
    echo ""
    print_status "🚀 Deployment completed successfully!"
    print_status "Application is now running at:"
    print_status "  - Web: http://localhost:3000"
    print_status "  - API: http://localhost:3001"
    print_status "  - Database: localhost:5432"
    print_status "  - Redis: localhost:6379"
    echo ""
    print_status "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
    print_status "To stop services: docker-compose -f $COMPOSE_FILE down"
}

# Handle script arguments
case "${1:-}" in
    start)
        start_services
        check_health
        show_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        check_health
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        docker-compose -f $COMPOSE_FILE logs -f ${2:-}
        ;;
    build)
        build_images
        ;;
    *)
        main
        ;;
esac