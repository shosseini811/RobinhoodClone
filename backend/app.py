from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import redis
import requests
import os
import json
from datetime import datetime, timedelta
from time import sleep
from config import Config, DevelopmentConfig, ProductionConfig
from models import db, User, Watchlist, StockCache

# Initialize Flask app
app = Flask(__name__)

# Load configuration based on environment
env = os.environ.get('FLASK_ENV', 'development')
if env == 'production':
    app.config.from_object(ProductionConfig)
elif env == 'testing':
    from config import TestingConfig
    app.config.from_object(TestingConfig)
else:
    app.config.from_object(DevelopmentConfig)

# Initialize extensions
CORS(app)
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# Initialize Redis for caching (if available)
try:
    redis_client = redis.Redis(
        host=os.environ.get('REDIS_HOST', 'localhost'),
        port=int(os.environ.get('REDIS_PORT', 6379)),
        password=os.environ.get('REDIS_PASSWORD'),
        decode_responses=True
    )
    redis_client.ping()
    print("✅ Connected to Redis")
except:
    redis_client = None
    print("⚠️ Redis not available, using in-memory caching")

# Alpha Vantage API configuration
ALPHA_VANTAGE_API_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY', 'demo')
ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

# Create tables
with app.app_context():
    db.create_all()
    print("✅ Database tables created")

# Helper Functions
def get_from_cache(key):
    """Get data from Redis cache or return None"""
    if redis_client:
        try:
            data = redis_client.get(key)
            return json.loads(data) if data else None
        except:
            return None
    return None

def set_cache(key, data, ttl=300):
    """Set data in Redis cache with TTL (default 5 minutes)"""
    if redis_client:
        try:
            redis_client.setex(key, ttl, json.dumps(data))
        except:
            pass

def make_api_request(params, cache_key=None, ttl=300):
    """Make API request with caching support"""
    # Check cache first
    if cache_key:
        cached_data = get_from_cache(cache_key)
        if cached_data:
            return cached_data
    
    try:
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=10)
        data = response.json()
        
        # Cache successful responses
        if cache_key and 'Error Message' not in data and 'Note' not in data:
            set_cache(cache_key, data, ttl)
        
        return data
    except Exception as e:
        print(f"API request failed: {e}")
        return {'error': 'API request failed'}

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health Check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Kubernetes"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        
        # Test Redis connection
        redis_status = 'connected' if redis_client else 'not available'
        if redis_client:
            try:
                redis_client.ping()
            except:
                redis_status = 'connection failed'
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'redis': redis_status,
            'environment': os.environ.get('FLASK_ENV', 'development')
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Stock Data Routes
@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_price(symbol):
    """Get current stock price with caching"""
    try:
        symbol = symbol.upper()
        cache_key = f"stock_quote_{symbol}"
        
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': ALPHA_VANTAGE_API_KEY
        }
        
        data = make_api_request(params, cache_key, ttl=60)  # Cache for 1 minute
        
        if 'Global Quote' in data:
            quote = data['Global Quote']
            result = {
                'symbol': quote['01. symbol'],
                'price': float(quote['05. price']),
                'change': float(quote['09. change']),
                'change_percent': quote['10. change percent'].replace('%', ''),
                'volume': int(quote['06. volume']),
                'timestamp': quote['07. latest trading day']
            }
            
            # Update database cache
            stock_cache = StockCache.query.filter_by(symbol=symbol).first()
            if stock_cache:
                stock_cache.data = result
                stock_cache.last_updated = datetime.utcnow()
            else:
                stock_cache = StockCache(symbol=symbol, data=result)
                db.session.add(stock_cache)
            
            db.session.commit()
            return jsonify(result)
        else:
            return jsonify({'error': 'Stock not found or API limit reached'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/<query>', methods=['GET'])
def search_stocks(query):
    """Search for stocks by symbol or company name"""
    try:
        cache_key = f"search_{query.lower()}"
        
        params = {
            'function': 'SYMBOL_SEARCH',
            'keywords': query,
            'apikey': ALPHA_VANTAGE_API_KEY
        }
        
        data = make_api_request(params, cache_key, ttl=3600)  # Cache for 1 hour
        
        if 'bestMatches' in data:
            results = []
            for match in data['bestMatches'][:10]:  # Limit to 10 results
                results.append({
                    'symbol': match['1. symbol'],
                    'name': match['2. name'],
                    'type': match['3. type'],
                    'region': match['4. region'],
                    'currency': match['8. currency']
                })
            return jsonify(results)
        else:
            return jsonify([])
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<symbol>/chart', methods=['GET'])
def get_stock_chart(symbol):
    """Get stock chart data with caching"""
    try:
        symbol = symbol.upper()
        cache_key = f"chart_{symbol}"
        
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'apikey': ALPHA_VANTAGE_API_KEY,
            'outputsize': 'compact'
        }
        
        data = make_api_request(params, cache_key, ttl=1800)  # Cache for 30 minutes
        
        if 'Time Series (Daily)' in data:
            time_series = data['Time Series (Daily)']
            chart_data = []
            
            for date, values in sorted(time_series.items()):
                chart_data.append({
                    'date': date,
                    'open': float(values['1. open']),
                    'high': float(values['2. high']),
                    'low': float(values['3. low']),
                    'close': float(values['4. close']),
                    'volume': int(values['5. volume'])
                })
            
            return jsonify({
                'symbol': symbol,
                'data': chart_data[-30:]  # Last 30 days
            })
        else:
            return jsonify({'error': 'Chart data not found or API limit reached'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Watchlist Routes (Protected)
@app.route('/api/watchlist', methods=['GET'])
@jwt_required()
def get_watchlist():
    """Get user's watchlist"""
    try:
        user_id = get_jwt_identity()
        watchlist_items = Watchlist.query.filter_by(user_id=user_id).all()
        
        symbols = [item.symbol for item in watchlist_items]
        return jsonify({
            'watchlist': symbols,
            'count': len(symbols)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/watchlist', methods=['POST'])
@jwt_required()
def add_to_watchlist():
    """Add stock to watchlist"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        symbol = data.get('symbol', '').upper().strip()
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        # Check if already in watchlist
        existing = Watchlist.query.filter_by(user_id=user_id, symbol=symbol).first()
        if existing:
            return jsonify({'error': 'Symbol already in watchlist'}), 400
        
        # Check watchlist size limit
        current_count = Watchlist.query.filter_by(user_id=user_id).count()
        max_size = app.config.get('MAX_WATCHLIST_SIZE', 50)
        
        if current_count >= max_size:
            return jsonify({'error': f'Watchlist limit of {max_size} reached'}), 400
        
        # Add to watchlist
        watchlist_item = Watchlist(user_id=user_id, symbol=symbol)
        db.session.add(watchlist_item)
        db.session.commit()
        
        return jsonify({
            'message': f'Added {symbol} to watchlist',
            'symbol': symbol
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/watchlist/<symbol>', methods=['DELETE'])
@jwt_required()
def remove_from_watchlist(symbol):
    """Remove stock from watchlist"""
    try:
        user_id = get_jwt_identity()
        symbol = symbol.upper()
        
        watchlist_item = Watchlist.query.filter_by(
            user_id=user_id, 
            symbol=symbol
        ).first()
        
        if not watchlist_item:
            return jsonify({'error': 'Symbol not in watchlist'}), 404
        
        db.session.delete(watchlist_item)
        db.session.commit()
        
        return jsonify({
            'message': f'Removed {symbol} from watchlist',
            'symbol': symbol
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/market/overview', methods=['GET'])
def get_market_overview():
    """Get overview of popular stocks with intelligent caching"""
    try:
        cache_key = "market_overview"
        cached_data = get_from_cache(cache_key)
        
        if cached_data:
            return jsonify(cached_data)
        
        popular_stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX']
        overview = []
        
        for symbol in popular_stocks:
            try:
                # Try to get from database cache first
                stock_cache = StockCache.query.filter_by(symbol=symbol).first()
                
                if (stock_cache and 
                    stock_cache.last_updated and 
                    (datetime.utcnow() - stock_cache.last_updated).seconds < 300):  # 5 minutes
                    
                    overview.append(stock_cache.data)
                    continue
                
                # Fetch from API if not in cache or expired
                params = {
                    'function': 'GLOBAL_QUOTE',
                    'symbol': symbol,
                    'apikey': ALPHA_VANTAGE_API_KEY
                }
                
                data = make_api_request(params)
                
                if 'Global Quote' in data:
                    quote = data['Global Quote']
                    stock_data = {
                        'symbol': quote['01. symbol'],
                        'price': float(quote['05. price']),
                        'change': float(quote['09. change']),
                        'change_percent': quote['10. change percent'].replace('%', '')
                    }
                    overview.append(stock_data)
                    
                    # Update database cache
                    if stock_cache:
                        stock_cache.data = stock_data
                        stock_cache.last_updated = datetime.utcnow()
                    else:
                        stock_cache = StockCache(symbol=symbol, data=stock_data)
                        db.session.add(stock_cache)
                
                # Rate limiting - wait between API calls
                sleep(1)
                
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
                continue
        
        db.session.commit()
        
        # Cache the result for 5 minutes
        set_cache(cache_key, overview, ttl=300)
        
        return jsonify(overview)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)