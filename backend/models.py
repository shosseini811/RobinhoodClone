from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    """User model for authentication and user management"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with watchlist
    watchlist_items = db.relationship('Watchlist', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Watchlist(db.Model):
    """Watchlist model to store user's favorite stocks"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure a user can't add the same stock twice
    __table_args__ = (db.UniqueConstraint('user_id', 'symbol', name='unique_user_symbol'),)
    
    def __repr__(self):
        return f'<Watchlist {self.symbol} for User {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'added_at': self.added_at.isoformat()
        }

class StockCache(db.Model):
    """Cache model to store frequently accessed stock data"""
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    change = db.Column(db.Float, nullable=False)
    change_percent = db.Column(db.String(20), nullable=False)
    volume = db.Column(db.BigInteger, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<StockCache {self.symbol}: ${self.price}>'
    
    def to_dict(self):
        return {
            'symbol': self.symbol,
            'price': self.price,
            'change': self.change,
            'change_percent': self.change_percent,
            'volume': self.volume,
            'last_updated': self.last_updated.isoformat()
        }
    
    def is_stale(self, max_age_minutes=5):
        """Check if cached data is older than max_age_minutes"""
        age = datetime.utcnow() - self.last_updated
        return age.total_seconds() > (max_age_minutes * 60)