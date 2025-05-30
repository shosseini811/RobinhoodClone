import requests
import json
from datetime import datetime, timedelta
from time import sleep
from typing import Optional, Dict, List, Any
from models import db, StockCache, User, Watchlist
import redis
import os

class CacheService:
    """Service for handling Redis and database caching"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
    
    def get_from_redis(self, key: str) -> Optional[Dict]:
        """Get data from Redis cache"""
        if not self.redis_client:
            return None
        
        try:
            data = self.redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None
    
    def set_redis(self, key: str, data: Dict, ttl: int = 300) -> bool:
        """Set data in Redis cache with TTL"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.setex(key, ttl, json.dumps(data))
            return True
        except Exception as e:
            print(f"Redis set error: {e}")
            return False
    
    def get_from_db_cache(self, symbol: str) -> Optional[Dict]:
        """Get stock data from database cache"""
        try:
            stock_cache = StockCache.query.filter_by(symbol=symbol).first()
            
            if (stock_cache and 
                stock_cache.last_updated and 
                (datetime.utcnow() - stock_cache.last_updated).seconds < 300):  # 5 minutes
                return stock_cache.data
            
            return None
        except Exception as e:
            print(f"Database cache get error: {e}")
            return None
    
    def set_db_cache(self, symbol: str, data: Dict) -> bool:
        """Set stock data in database cache"""
        try:
            stock_cache = StockCache.query.filter_by(symbol=symbol).first()
            
            if stock_cache:
                stock_cache.data = data
                stock_cache.last_updated = datetime.utcnow()
            else:
                stock_cache = StockCache(symbol=symbol, data=data)
                db.session.add(stock_cache)
            
            db.session.commit()
            return True
        except Exception as e:
            print(f"Database cache set error: {e}")
            db.session.rollback()
            return False

class AlphaVantageService:
    """Service for Alpha Vantage API interactions"""
    
    def __init__(self, api_key: str, cache_service: CacheService):
        self.api_key = api_key
        self.base_url = 'https://www.alphavantage.co/query'
        self.cache_service = cache_service
        self.rate_limit_delay = 1  # seconds between API calls
    
    def _make_request(self, params: Dict, cache_key: str = None, ttl: int = 300) -> Dict:
        """Make API request with caching support"""
        # Check Redis cache first
        if cache_key:
            cached_data = self.cache_service.get_from_redis(cache_key)
            if cached_data:
                return cached_data
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Check for API errors
            if 'Error Message' in data:
                return {'error': data['Error Message']}
            
            if 'Note' in data:
                return {'error': 'API rate limit exceeded. Please try again later.'}
            
            # Cache successful responses
            if cache_key and 'error' not in data:
                self.cache_service.set_redis(cache_key, data, ttl)
            
            return data
            
        except requests.exceptions.Timeout:
            return {'error': 'API request timeout'}
        except requests.exceptions.RequestException as e:
            return {'error': f'API request failed: {str(e)}'}
        except json.JSONDecodeError:
            return {'error': 'Invalid API response format'}
        except Exception as e:
            return {'error': f'Unexpected error: {str(e)}'}
    
    def get_quote(self, symbol: str) -> Dict:
        """Get real-time stock quote"""
        symbol = symbol.upper()
        cache_key = f"quote_{symbol}"
        
        # Check database cache first for recent data
        cached_data = self.cache_service.get_from_db_cache(symbol)
        if cached_data:
            return {'success': True, 'data': cached_data}
        
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': self.api_key
        }
        
        data = self._make_request(params, cache_key, ttl=60)
        
        if 'error' in data:
            return {'success': False, 'error': data['error']}
        
        if 'Global Quote' not in data:
            return {'success': False, 'error': 'Invalid response format'}
        
        quote = data['Global Quote']
        
        try:
            result = {
                'symbol': quote['01. symbol'],
                'price': float(quote['05. price']),
                'change': float(quote['09. change']),
                'change_percent': quote['10. change percent'].replace('%', ''),
                'volume': int(quote['06. volume']),
                'timestamp': quote['07. latest trading day']
            }
            
            # Cache in database
            self.cache_service.set_db_cache(symbol, result)
            
            return {'success': True, 'data': result}
            
        except (KeyError, ValueError) as e:
            return {'success': False, 'error': f'Data parsing error: {str(e)}'}
    
    def search_symbols(self, query: str) -> Dict:
        """Search for stock symbols"""
        cache_key = f"search_{query.lower()}"
        
        params = {
            'function': 'SYMBOL_SEARCH',
            'keywords': query,
            'apikey': self.api_key
        }
        
        data = self._make_request(params, cache_key, ttl=3600)
        
        if 'error' in data:
            return {'success': False, 'error': data['error']}
        
        if 'bestMatches' not in data:
            return {'success': True, 'data': []}
        
        try:
            results = []
            for match in data['bestMatches'][:10]:  # Limit to 10 results
                results.append({
                    'symbol': match['1. symbol'],
                    'name': match['2. name'],
                    'type': match['3. type'],
                    'region': match['4. region'],
                    'currency': match['8. currency']
                })
            
            return {'success': True, 'data': results}
            
        except (KeyError, ValueError) as e:
            return {'success': False, 'error': f'Data parsing error: {str(e)}'}
    
    def get_daily_chart(self, symbol: str, compact: bool = True) -> Dict:
        """Get daily time series data"""
        symbol = symbol.upper()
        cache_key = f"chart_{symbol}_{'compact' if compact else 'full'}"
        
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'apikey': self.api_key,
            'outputsize': 'compact' if compact else 'full'
        }
        
        data = self._make_request(params, cache_key, ttl=1800)  # 30 minutes
        
        if 'error' in data:
            return {'success': False, 'error': data['error']}
        
        if 'Time Series (Daily)' not in data:
            return {'success': False, 'error': 'Chart data not available'}
        
        try:
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
            
            result = {
                'symbol': symbol,
                'data': chart_data[-30:] if compact else chart_data  # Last 30 days for compact
            }
            
            return {'success': True, 'data': result}
            
        except (KeyError, ValueError) as e:
            return {'success': False, 'error': f'Data parsing error: {str(e)}'}
    
    def get_market_overview(self, symbols: List[str]) -> Dict:
        """Get market overview for multiple symbols with intelligent caching"""
        cache_key = "market_overview"
        
        # Check Redis cache first
        cached_data = self.cache_service.get_from_redis(cache_key)
        if cached_data:
            return {'success': True, 'data': cached_data}
        
        overview = []
        
        for symbol in symbols:
            try:
                # Try database cache first
                cached_stock = self.cache_service.get_from_db_cache(symbol)
                if cached_stock:
                    overview.append(cached_stock)
                    continue
                
                # Fetch from API
                result = self.get_quote(symbol)
                if result['success']:
                    overview.append(result['data'])
                
                # Rate limiting
                sleep(self.rate_limit_delay)
                
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
                continue
        
        # Cache the overview for 5 minutes
        self.cache_service.set_redis(cache_key, overview, ttl=300)
        
        return {'success': True, 'data': overview}

class WatchlistService:
    """Service for watchlist operations"""
    
    @staticmethod
    def get_user_watchlist(user_id: int) -> Dict:
        """Get user's watchlist"""
        try:
            watchlist_items = Watchlist.query.filter_by(user_id=user_id).all()
            symbols = [item.symbol for item in watchlist_items]
            
            return {
                'success': True,
                'data': {
                    'watchlist': symbols,
                    'count': len(symbols)
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def add_to_watchlist(user_id: int, symbol: str, max_size: int = 50) -> Dict:
        """Add symbol to user's watchlist"""
        try:
            symbol = symbol.upper().strip()
            
            if not symbol:
                return {'success': False, 'error': 'Symbol is required'}
            
            # Check if already exists
            existing = Watchlist.query.filter_by(user_id=user_id, symbol=symbol).first()
            if existing:
                return {'success': False, 'error': 'Symbol already in watchlist'}
            
            # Check size limit
            current_count = Watchlist.query.filter_by(user_id=user_id).count()
            if current_count >= max_size:
                return {'success': False, 'error': f'Watchlist limit of {max_size} reached'}
            
            # Add to watchlist
            watchlist_item = Watchlist(user_id=user_id, symbol=symbol)
            db.session.add(watchlist_item)
            db.session.commit()
            
            return {
                'success': True,
                'data': {
                    'message': f'Added {symbol} to watchlist',
                    'symbol': symbol
                }
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def remove_from_watchlist(user_id: int, symbol: str) -> Dict:
        """Remove symbol from user's watchlist"""
        try:
            symbol = symbol.upper()
            
            watchlist_item = Watchlist.query.filter_by(
                user_id=user_id,
                symbol=symbol
            ).first()
            
            if not watchlist_item:
                return {'success': False, 'error': 'Symbol not in watchlist'}
            
            db.session.delete(watchlist_item)
            db.session.commit()
            
            return {
                'success': True,
                'data': {
                    'message': f'Removed {symbol} from watchlist',
                    'symbol': symbol
                }
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}

class UserService:
    """Service for user operations"""
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """Get user by ID"""
        try:
            return User.query.get(user_id)
        except Exception as e:
            print(f"Error getting user {user_id}: {e}")
            return None
    
    @staticmethod
    def get_user_by_username_or_email(identifier: str) -> Optional[User]:
        """Get user by username or email"""
        try:
            return User.query.filter(
                (User.username == identifier) | (User.email == identifier)
            ).first()
        except Exception as e:
            print(f"Error getting user {identifier}: {e}")
            return None
    
    @staticmethod
    def create_user(username: str, email: str, password_hash: str) -> Dict:
        """Create a new user"""
        try:
            # Check if user already exists
            if User.query.filter_by(username=username).first():
                return {'success': False, 'error': 'Username already exists'}
            
            if User.query.filter_by(email=email).first():
                return {'success': False, 'error': 'Email already exists'}
            
            # Create new user
            user = User(
                username=username,
                email=email,
                password_hash=password_hash
            )
            
            db.session.add(user)
            db.session.commit()
            
            return {'success': True, 'data': user}
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}

class HealthService:
    """Service for health checks"""
    
    @staticmethod
    def check_database() -> Dict:
        """Check database connectivity"""
        try:
            db.session.execute('SELECT 1')
            return {'status': 'connected', 'healthy': True}
        except Exception as e:
            return {'status': 'error', 'healthy': False, 'error': str(e)}
    
    @staticmethod
    def check_redis(redis_client) -> Dict:
        """Check Redis connectivity"""
        if not redis_client:
            return {'status': 'not available', 'healthy': True}
        
        try:
            redis_client.ping()
            return {'status': 'connected', 'healthy': True}
        except Exception as e:
            return {'status': 'connection failed', 'healthy': False, 'error': str(e)}
    
    @staticmethod
    def get_system_health(redis_client=None) -> Dict:
        """Get overall system health"""
        db_health = HealthService.check_database()
        redis_health = HealthService.check_redis(redis_client)
        
        overall_healthy = db_health['healthy'] and redis_health['healthy']
        
        return {
            'status': 'healthy' if overall_healthy else 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': db_health,
            'redis': redis_health,
            'environment': os.environ.get('FLASK_ENV', 'development')
        }