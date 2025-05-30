# Robinhood Clone

A scalable, production-ready stock trading application built with React Native (frontend) and Python Flask (backend), featuring user authentication, real-time stock data, and cloud-native deployment capabilities.

## ✨ Features

- 🔐 **User Authentication**: Secure JWT-based registration and login
- 📈 **Market Overview**: Real-time prices and changes for popular stocks
- 🔍 **Stock Search**: Advanced search by symbol or company name
- ⭐ **Personal Watchlist**: Persistent, user-specific watchlists with database storage
- 📊 **Stock Details**: Detailed stock information with interactive charts
- 📱 **Mobile-First**: Cross-platform React Native app for iOS and Android
- ⚡ **High Performance**: Multi-layer caching with Redis and PostgreSQL
- 🚀 **Cloud-Native**: Kubernetes-ready with auto-scaling and monitoring
- 🔒 **Security**: Production-grade security with CORS, rate limiting, and input validation

## 🏗️ Architecture

### Backend (Scalable Microservices)
- **Python 3.9+** with Flask
- **PostgreSQL** - Primary database for user data and watchlists
- **Redis** - Caching layer for stock data and sessions
- **JWT Authentication** - Stateless, secure token-based auth
- **SQLAlchemy ORM** - Database abstraction and migrations
- **Multi-layer Caching** - Redis + Database caching strategy
- **Alpha Vantage API** - Real-time stock market data
- **Docker & Kubernetes** - Containerized deployment

### Frontend (React Native)
- **React Native** with Expo
- **React Navigation** - Navigation system
- **React Native Chart Kit** - Interactive charts
- **Axios** - HTTP client with authentication
- **AsyncStorage** - Local token storage

### Infrastructure
- **Kubernetes** - Container orchestration
- **Docker** - Containerization
- **Prometheus & Grafana** - Monitoring and alerting
- **NGINX** - Load balancing and reverse proxy
- **Horizontal Pod Autoscaler** - Auto-scaling based on CPU/memory

## 🚀 Quick Start

### Prerequisites

1. **Python 3.9+** installed on your system
2. **Node.js 16+** and **npm** installed
3. **PostgreSQL 13+** database server
4. **Redis 6+** (optional, but recommended for caching)
5. **Expo CLI** installed globally: `npm install -g @expo/cli`
6. **Alpha Vantage API Key** (free): Get it from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
7. **Docker** (optional, for containerized deployment)
8. **Kubernetes** (optional, for production deployment)

### 🗄️ Database Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create database and user**:
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database and user
   CREATE DATABASE robinhood_db;
   CREATE USER robinhood_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE robinhood_db TO robinhood_user;
   \q
   ```

3. **Install Redis** (optional but recommended):
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

### 🔧 Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

5. **Edit the `.env` file** with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://robinhood_user:your_password@localhost:5432/robinhood_db
   
   # API Keys
   ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
   
   # Security
   SECRET_KEY=your-super-secret-key
   JWT_SECRET_KEY=your-jwt-secret-key
   
   # Redis (optional)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

6. **Initialize the database**:
   ```bash
   python init_db.py
   ```

7. **Start the Flask server**:
   ```bash
   python app.py
   ```

   The backend will be running at `http://localhost:5001`

### 📱 Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update API endpoint** (if needed) in your frontend configuration to point to `http://localhost:5001`

4. **Start the Expo development server**:
   ```bash
   npm start
   ```

5. **Run on your device**:
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go app

## 🔗 API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info (🔒 Protected)

### Stock Data Endpoints
- `GET /api/health` - Health check and system status
- `GET /api/stock/<symbol>` - Get real-time stock quote
- `GET /api/search/<query>` - Search stocks by symbol or name
- `GET /api/stock/<symbol>/chart` - Get daily chart data
- `GET /api/market/overview` - Get popular stocks overview

### Watchlist Endpoints (🔒 Protected)
- `GET /api/watchlist` - Get user's personal watchlist
- `POST /api/watchlist` - Add stock to watchlist
- `DELETE /api/watchlist/<symbol>` - Remove stock from watchlist

### Authentication Usage

1. **Register a new user**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

2. **Login and get token**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "password": "password123"
     }'
   ```

3. **Use token for protected endpoints**:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5001/api/watchlist
   ```

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for Development)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Kubernetes (Production)

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to Kubernetes
./deploy.sh

# Check status
./deploy.sh status

# View logs
./deploy.sh logs backend

# Clean up
./deploy.sh cleanup
```

### Option 3: Manual Deployment

See detailed instructions in:
- [Backend README](backend/README.md)
- [Kubernetes Setup Guide](KUBERNETES_README.md)

## Project Structure

```
RobinhoodClone/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/
│   ├── App.js             # Main app component
│   ├── src/
│   │   └── screens/       # Screen components
│   │       ├── HomeScreen.js
│   │       ├── SearchScreen.js
│   │       ├── WatchlistScreen.js
│   │       └── StockDetailScreen.js
│   ├── package.json       # Node.js dependencies
│   └── ...
└── README.md
```

## Usage

1. **Market Overview**: View popular stocks on the home screen
2. **Search Stocks**: Use the search tab to find specific stocks
3. **Add to Watchlist**: Tap the "+" button next to any stock
4. **View Details**: Tap on any stock to see detailed information and charts
5. **Manage Watchlist**: View and remove stocks from your watchlist

## API Rate Limits

- Alpha Vantage free tier: 5 API requests per minute, 500 requests per day
- For production use, consider upgrading to a paid plan

## Troubleshooting

### Common Issues

1. **"API limit reached"**: You've exceeded Alpha Vantage rate limits. Wait a minute and try again.

2. **"Network Error"**: Make sure the backend server is running on `http://localhost:5000`

3. **Charts not loading**: This might be due to API rate limits or insufficient data

4. **Expo/React Native issues**: Make sure you have the latest version of Expo CLI

### Backend Issues

- Make sure your `.env` file contains a valid Alpha Vantage API key
- Check that all Python dependencies are installed
- Verify the Flask server is running on port 5000

### Frontend Issues

- Clear Expo cache: `expo start -c`
- Restart the Metro bundler
- Make sure all npm dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This is a demo application for educational purposes. It should not be used for actual trading or investment decisions. Always consult with financial professionals before making investment decisions.