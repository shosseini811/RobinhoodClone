#!/bin/bash

# Robinhood Clone Kubernetes Deployment Script
# This script deploys the entire application stack to Kubernetes

set -e  # Exit on any error

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

# Check if kubectl is installed
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    print_success "kubectl is installed"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if cluster is accessible
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    print_success "Connected to Kubernetes cluster"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t robinhood-backend:latest ./backend
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t robinhood-frontend:latest ./frontend
    
    print_success "Docker images built successfully"
}

# Deploy to Kubernetes
deploy_k8s() {
    print_status "Deploying to Kubernetes..."
    
    # Create namespace and basic resources
    print_status "Creating namespace..."
    kubectl apply -f k8s/namespace.yaml
    
    # Apply ConfigMaps and Secrets
    print_status "Applying ConfigMaps and Secrets..."
    kubectl apply -f k8s/configmap.yaml
    
    # Deploy PostgreSQL
    print_status "Deploying PostgreSQL..."
    kubectl apply -f k8s/postgres.yaml
    
    # Deploy Redis
    print_status "Deploying Redis..."
    kubectl apply -f k8s/redis.yaml
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n robinhood-clone --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n robinhood-clone --timeout=300s
    
    # Deploy backend
    print_status "Deploying backend..."
    kubectl apply -f k8s/backend.yaml
    
    # Deploy frontend
    print_status "Deploying frontend..."
    kubectl apply -f k8s/frontend.yaml
    
    # Deploy ingress
    print_status "Deploying ingress..."
    kubectl apply -f k8s/ingress.yaml
    
    # Deploy monitoring
    print_status "Deploying monitoring..."
    kubectl apply -f k8s/monitoring.yaml
    
    print_success "Kubernetes deployment completed"
}

# Wait for deployments to be ready
wait_for_deployments() {
    print_status "Waiting for deployments to be ready..."
    
    kubectl wait --for=condition=available deployment/backend-deployment -n robinhood-clone --timeout=300s
    kubectl wait --for=condition=available deployment/frontend-deployment -n robinhood-clone --timeout=300s
    
    print_success "All deployments are ready"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo
    
    print_status "Pods:"
    kubectl get pods -n robinhood-clone
    echo
    
    print_status "Services:"
    kubectl get services -n robinhood-clone
    echo
    
    print_status "Ingress:"
    kubectl get ingress -n robinhood-clone
    echo
    
    print_status "HPA Status:"
    kubectl get hpa -n robinhood-clone
    echo
}

# Setup local development environment
setup_local_dev() {
    print_status "Setting up local development environment..."
    
    # Add entries to /etc/hosts for local development
    if ! grep -q "robinhood-clone.local" /etc/hosts; then
        print_status "Adding entries to /etc/hosts..."
        echo "127.0.0.1 robinhood-clone.local" | sudo tee -a /etc/hosts
        echo "127.0.0.1 api.robinhood-clone.local" | sudo tee -a /etc/hosts
        print_success "Added local domain entries"
    else
        print_warning "Local domain entries already exist"
    fi
    
    # Port forward for local access (if using minikube or kind)
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        print_status "Setting up minikube tunnel..."
        print_warning "Run 'minikube tunnel' in another terminal for external access"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up resources..."
    kubectl delete namespace robinhood-clone --ignore-not-found=true
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    case "$1" in
        "deploy")
            check_kubectl
            check_docker
            check_cluster
            build_images
            deploy_k8s
            wait_for_deployments
            show_status
            setup_local_dev
            print_success "Deployment completed successfully!"
            print_status "Access the application at: http://robinhood-clone.local"
            print_status "API available at: http://api.robinhood-clone.local/api"
            ;;
        "status")
            check_kubectl
            show_status
            ;;
        "cleanup")
            check_kubectl
            cleanup
            ;;
        "build")
            check_docker
            build_images
            ;;
        "logs")
            if [ -z "$2" ]; then
                print_error "Please specify a component: backend, frontend, postgres, redis"
                exit 1
            fi
            kubectl logs -f deployment/$2-deployment -n robinhood-clone
            ;;
        "shell")
            if [ -z "$2" ]; then
                print_error "Please specify a component: backend, frontend, postgres, redis"
                exit 1
            fi
            kubectl exec -it deployment/$2-deployment -n robinhood-clone -- /bin/bash
            ;;
        *)
            echo "Usage: $0 {deploy|status|cleanup|build|logs|shell}"
            echo
            echo "Commands:"
            echo "  deploy  - Build images and deploy to Kubernetes"
            echo "  status  - Show deployment status"
            echo "  cleanup - Remove all resources"
            echo "  build   - Build Docker images only"
            echo "  logs    - Show logs for a component (backend|frontend|postgres|redis)"
            echo "  shell   - Open shell in a component (backend|frontend|postgres|redis)"
            echo
            echo "Examples:"
            echo "  $0 deploy"
            echo "  $0 logs backend"
            echo "  $0 shell backend"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"