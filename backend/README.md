# Robinhood Clone Backend

A scalable Flask-based REST API backend for the Robinhood Clone application, featuring user authentication, real-time stock data, watchlist management, and comprehensive caching.

## 🏗️ Architecture Overview

This backend implements a clean, scalable architecture with:

- **Flask** - Web framework
- **PostgreSQL** - Primary database for user data and watchlists
- **Redis** - Caching layer for stock data and session management
- **JWT** - Stateless authentication
- **Alpha Vantage API** - Real-time stock market data
- **SQLAlchemy** - ORM for database operations
- **Flask-Migrate** - Database migrations

## 📁 Project Structure

```
backend/
├── app.py              # Main Flask application
├── config.py           # Configuration classes
├── models.py           # Database models
├── services.py         # Business logic and service layer
├── init_db.py          # Database initialization script
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
├── Dockerfile          # Docker configuration
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis 6+ (optional, but recommended)
- Alpha Vantage API key (free at https://www.alphavantage.co/)

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd RobinhoodClone/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
vim .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/robinhood_db

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key

# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb robinhood_db

# Initialize database and create tables
python init_db.py
```

### 4. Run the Application

```bash
# Development mode
python app.py

# Production mode with Gunicorn
gunicorn --bind 0.0.0.0:5001 --workers 4 app:app
```

The API will be available at `http://localhost:5001`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for stateless authentication.

### Register a new user
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Use the token
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5001/api/auth/me
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info (protected)

### Stock Data
- `GET /api/stock/{symbol}` - Get real-time stock quote
- `GET /api/search/{query}` - Search stocks by symbol/name
- `GET /api/stock/{symbol}/chart` - Get daily chart data
- `GET /api/market/overview` - Get market overview

### Watchlist (Protected)
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add stock to watchlist
- `DELETE /api/watchlist/{symbol}` - Remove stock from watchlist

### System
- `GET /api/health` - Health check endpoint

## 🗄️ Database Models

### User
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Watchlist
```python
class Watchlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### StockCache
```python
class StockCache(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), unique=True, nullable=False)
    data = db.Column(db.JSON, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
```

## 🚀 Caching Strategy

The application implements a multi-layer caching strategy:

1. **Redis Cache** (L1) - Fast in-memory cache for frequently accessed data
2. **Database Cache** (L2) - Persistent cache in PostgreSQL for stock data
3. **API Rate Limiting** - Intelligent API calls to respect Alpha Vantage limits

### Cache TTL (Time To Live)
- Stock quotes: 1 minute
- Search results: 1 hour
- Chart data: 30 minutes
- Market overview: 5 minutes

## 🔧 Configuration

The application supports multiple environments through configuration classes:

- `DevelopmentConfig` - Local development
- `TestingConfig` - Unit testing
- `ProductionConfig` - Production deployment

### Key Configuration Options

```python
# Database
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

# Redis
REDIS_URL = os.environ.get('REDIS_URL')

# JWT
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

# Application
MAX_WATCHLIST_SIZE = 50
```

## 🐳 Docker Support

The backend includes a Dockerfile for containerized deployment:

```bash
# Build image
docker build -t robinhood-backend .

# Run container
docker run -p 5001:5001 \
  -e DATABASE_URL=postgresql://... \
  -e ALPHA_VANTAGE_API_KEY=... \
  robinhood-backend
```

## 🔍 Monitoring and Health Checks

### Health Check Endpoint
```bash
curl http://localhost:5001/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "redis": "connected",
  "environment": "development"
}
```

### Kubernetes Health Checks
The health endpoint is designed for Kubernetes liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 5001
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 🧪 Testing

### Sample User (Development Only)
The `init_db.py` script creates a sample user for testing:

- **Username:** `demo`
- **Email:** `demo@robinhoodclone.com`
- **Password:** `demo123`

### API Testing
```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Test stock data
curl http://localhost:5001/api/stock/AAPL

# Test search
curl http://localhost:5001/api/search/apple
```

## 🚀 Production Deployment

### Environment Variables for Production
```env
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/robinhood_db
REDIS_URL=redis://prod-redis:6379/0
SECRET_KEY=production-secret-key
JWT_SECRET_KEY=production-jwt-secret
ALPHA_VANTAGE_API_KEY=your-production-api-key
```

### Gunicorn Configuration
```bash
gunicorn --bind 0.0.0.0:5001 \
  --workers 4 \
  --worker-class gevent \
  --worker-connections 1000 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --timeout 30 \
  --keep-alive 2 \
  app:app
```

## 🔒 Security Features

- **JWT Authentication** - Stateless, secure token-based auth
- **Password Hashing** - Werkzeug PBKDF2 password hashing
- **CORS Protection** - Configurable cross-origin resource sharing
- **Input Validation** - Request data validation and sanitization
- **Rate Limiting** - API rate limiting to prevent abuse
- **SQL Injection Protection** - SQLAlchemy ORM prevents SQL injection

## 📈 Performance Optimizations

- **Connection Pooling** - SQLAlchemy connection pooling
- **Redis Caching** - Multi-layer caching strategy
- **Database Indexing** - Optimized database indexes
- **Lazy Loading** - Efficient data loading patterns
- **API Rate Limiting** - Intelligent API usage

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL is running
   pg_ctl status
   
   # Verify connection string
   psql $DATABASE_URL
   ```

2. **Redis Connection Error**
   ```bash
   # Check Redis is running
   redis-cli ping
   
   # Should return: PONG
   ```

3. **Alpha Vantage API Errors**
   - Verify API key is valid
   - Check rate limits (5 calls/minute for free tier)
   - Monitor API response for error messages

4. **JWT Token Issues**
   - Ensure JWT_SECRET_KEY is set
   - Check token expiration
   - Verify Authorization header format: `Bearer <token>`

### Logging

The application logs important events and errors:

```python
# Enable debug logging
export FLASK_ENV=development
export LOG_LEVEL=DEBUG
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Documentation

- [Kubernetes Setup Guide](../KUBERNETES_README.md)
- [Docker Compose Setup](../docker-compose.yml)
- [Frontend Documentation](../frontend/README.md)
- [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)