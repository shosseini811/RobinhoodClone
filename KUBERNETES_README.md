# Robinhood Clone - Kubernetes Scalability Setup

This guide explains how to deploy and scale your Robinhood clone application using Kubernetes. This setup provides enterprise-grade scalability, high availability, and monitoring capabilities.

## 🏗️ Architecture Overview

The Kubernetes setup includes:

- **Frontend**: React Native Web application (2-8 replicas with auto-scaling)
- **Backend**: Python Flask API (2-10 replicas with auto-scaling)
- **Database**: PostgreSQL with persistent storage
- **Cache**: Redis for session management and API caching
- **Load Balancer**: NGINX Ingress Controller
- **Monitoring**: Prometheus metrics and Grafana dashboards
- **Security**: Network policies, RBAC, and TLS encryption

## 📋 Prerequisites

### Required Tools
1. **Docker** - For building container images
2. **kubectl** - Kubernetes command-line tool
3. **Kubernetes Cluster** - One of the following:
   - **Minikube** (local development)
   - **Kind** (local development)
   - **Docker Desktop** (local development)
   - **EKS/GKE/AKS** (production)

### Installation Commands

```bash
# Install Docker (macOS)
brew install docker

# Install kubectl
brew install kubectl

# Install Minikube (for local development)
brew install minikube

# Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Enable ingress addon
minikube addons enable ingress
```

## 🚀 Quick Start

### 1. Deploy Everything

```bash
# Make the script executable (already done)
chmod +x deploy.sh

# Deploy the entire application
./deploy.sh deploy
```

This command will:
- Build Docker images for frontend and backend
- Create Kubernetes namespace and resources
- Deploy PostgreSQL and Redis
- Deploy backend and frontend with auto-scaling
- Set up ingress and monitoring
- Configure local domain names

### 2. Access the Application

After deployment:
- **Frontend**: http://robinhood-clone.local
- **API**: http://api.robinhood-clone.local/api
- **Alternative**: http://robinhood-clone.local/api

### 3. Monitor the Deployment

```bash
# Check deployment status
./deploy.sh status

# View logs
./deploy.sh logs backend
./deploy.sh logs frontend

# Open shell in a container
./deploy.sh shell backend
```

## 📁 Kubernetes Configuration Files

### Core Infrastructure
- `k8s/namespace.yaml` - Namespace, resource quotas, and limits
- `k8s/configmap.yaml` - Configuration and secrets
- `k8s/postgres.yaml` - PostgreSQL database with persistent storage
- `k8s/redis.yaml` - Redis cache

### Application Services
- `k8s/backend.yaml` - Flask API with auto-scaling (2-10 replicas)
- `k8s/frontend.yaml` - React Native Web with auto-scaling (2-8 replicas)
- `k8s/ingress.yaml` - Load balancer and external access

### Monitoring & Operations
- `k8s/monitoring.yaml` - Prometheus metrics, Grafana dashboards, alerts
- `deploy.sh` - Deployment automation script

## 🔧 Configuration

### Environment Variables

Update `k8s/configmap.yaml` to configure:

```yaml
# Database settings
POSTGRES_HOST: postgres-service
POSTGRES_PORT: "5432"
POSTGRES_DB: robinhood_db

# Redis settings
REDIS_HOST: redis-service
REDIS_PORT: "6379"

# API settings
ALPHA_VANTAGE_API_KEY: your-api-key-here
FLASK_ENV: production
```

### Secrets

Update the base64 encoded secrets in `k8s/configmap.yaml`:

```bash
# Encode your secrets
echo -n "your-secret" | base64

# Example secrets to update:
# - POSTGRES_USER
# - POSTGRES_PASSWORD
# - SECRET_KEY
# - JWT_SECRET_KEY
# - ALPHA_VANTAGE_API_KEY
```

## 📊 Scaling Features

### Horizontal Pod Autoscaling (HPA)

Both frontend and backend automatically scale based on:
- **CPU Usage**: Scales up when > 70% CPU
- **Memory Usage**: Scales up when > 80% memory
- **Custom Metrics**: Can be extended for request rate, queue length, etc.

```bash
# View current scaling status
kubectl get hpa -n robinhood-clone

# Manually scale (for testing)
kubectl scale deployment backend-deployment --replicas=5 -n robinhood-clone
```

### Vertical Pod Autoscaling (VPA)

To enable VPA for automatic resource adjustment:

```bash
# Install VPA (if not already installed)
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/latest/download/vpa-release.yaml
```

### Load Testing

Test auto-scaling with load:

```bash
# Install Apache Bench
brew install httpie

# Generate load
for i in {1..1000}; do
  http GET http://robinhood-clone.local/api/stocks/search q==AAPL &
done

# Watch pods scale
watch kubectl get pods -n robinhood-clone
```

## 🔍 Monitoring & Observability

### Prometheus Metrics

The setup includes monitoring for:
- **Application Metrics**: Request rate, response time, error rate
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Business Metrics**: Active users, API calls, cache hit rate

### Grafana Dashboards

Access Grafana (if installed):
```bash
# Port forward to Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Access at http://localhost:3000
```

### Alerts

Configured alerts for:
- High CPU/Memory usage
- Pod restart loops
- Database connectivity issues
- API response time degradation

## 🛡️ Security Features

### Network Policies
- Restricts pod-to-pod communication
- Allows only necessary traffic
- Blocks external access to databases

### RBAC (Role-Based Access Control)
- Least privilege access
- Service account isolation
- Namespace-based permissions

### TLS/SSL
- Encrypted communication
- Certificate management
- Secure ingress

## 🔧 Troubleshooting

### Common Issues

1. **Pods not starting**:
   ```bash
   kubectl describe pod <pod-name> -n robinhood-clone
   kubectl logs <pod-name> -n robinhood-clone
   ```

2. **Database connection issues**:
   ```bash
   kubectl exec -it deployment/postgres-deployment -n robinhood-clone -- psql -U robinhood_user -d robinhood_db
   ```

3. **Ingress not working**:
   ```bash
   kubectl describe ingress robinhood-ingress -n robinhood-clone
   
   # For Minikube
   minikube tunnel
   ```

4. **Auto-scaling not working**:
   ```bash
   kubectl describe hpa -n robinhood-clone
   kubectl top pods -n robinhood-clone
   ```

### Useful Commands

```bash
# Get all resources
kubectl get all -n robinhood-clone

# Check resource usage
kubectl top pods -n robinhood-clone
kubectl top nodes

# View events
kubectl get events -n robinhood-clone --sort-by='.lastTimestamp'

# Debug networking
kubectl exec -it deployment/backend-deployment -n robinhood-clone -- nslookup postgres-service
```

## 🚀 Production Deployment

### Cloud Provider Setup

#### AWS EKS
```bash
# Install eksctl
brew install eksctl

# Create cluster
eksctl create cluster --name robinhood-clone --region us-west-2 --nodes 3

# Deploy
./deploy.sh deploy
```

#### Google GKE
```bash
# Create cluster
gcloud container clusters create robinhood-clone --num-nodes=3 --zone=us-central1-a

# Get credentials
gcloud container clusters get-credentials robinhood-clone --zone=us-central1-a

# Deploy
./deploy.sh deploy
```

### Production Considerations

1. **Resource Limits**: Adjust CPU/memory limits based on load testing
2. **Persistent Storage**: Use cloud provider storage classes
3. **Backup Strategy**: Implement database backups
4. **SSL Certificates**: Use Let's Encrypt or cloud provider certificates
5. **Monitoring**: Set up external monitoring and alerting
6. **CI/CD**: Integrate with GitHub Actions or similar

## 📈 Performance Optimization

### Database Optimization
- Connection pooling
- Read replicas
- Query optimization
- Indexing strategy

### Caching Strategy
- Redis for session data
- Application-level caching
- CDN for static assets
- API response caching

### Resource Optimization
- Right-sizing containers
- Node affinity rules
- Pod disruption budgets
- Quality of Service classes

## 🧹 Cleanup

```bash
# Remove all resources
./deploy.sh cleanup

# Stop Minikube (if using)
minikube stop
minikube delete
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

## 🤝 Contributing

To contribute to the Kubernetes setup:
1. Test changes in a local environment
2. Update documentation
3. Ensure security best practices
4. Add monitoring for new features

---

**Note**: This setup is designed for learning and development. For production use, consider additional security hardening, backup strategies, and compliance requirements.