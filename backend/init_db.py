#!/usr/bin/env python3
"""
Database initialization script for Robinhood Clone
This script creates the database tables and sets up initial data
"""

import os
import sys
from flask import Flask
from flask_migrate import Migrate, init, migrate, upgrade
from config import DevelopmentConfig, ProductionConfig, TestingConfig
from models import db, User, Watchlist, StockCache
from werkzeug.security import generate_password_hash

def create_app(config_name='development'):
    """Create Flask application with specified configuration"""
    app = Flask(__name__)
    
    # Load configuration
    if config_name == 'production':
        app.config.from_object(ProductionConfig)
    elif config_name == 'testing':
        app.config.from_object(TestingConfig)
    else:
        app.config.from_object(DevelopmentConfig)
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    return app, migrate

def init_database(app):
    """Initialize database tables"""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully")

def create_sample_user(app):
    """Create a sample user for testing"""
    with app.app_context():
        # Check if sample user already exists
        existing_user = User.query.filter_by(username='demo').first()
        if existing_user:
            print("Sample user already exists")
            return
        
        # Create sample user
        sample_user = User(
            username='demo',
            email='demo@robinhoodclone.com',
            password_hash=generate_password_hash('demo123')
        )
        
        db.session.add(sample_user)
        db.session.commit()
        
        print("✅ Sample user created:")
        print("   Username: demo")
        print("   Email: demo@robinhoodclone.com")
        print("   Password: demo123")
        
        # Add sample watchlist items
        sample_stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']
        for symbol in sample_stocks:
            watchlist_item = Watchlist(user_id=sample_user.id, symbol=symbol)
            db.session.add(watchlist_item)
        
        db.session.commit()
        print(f"✅ Added {len(sample_stocks)} stocks to sample user's watchlist")

def setup_migrations(app, migrate_instance):
    """Set up Flask-Migrate"""
    with app.app_context():
        migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
        
        if not os.path.exists(migrations_dir):
            print("Initializing Flask-Migrate...")
            init()
            print("✅ Flask-Migrate initialized")
            
            print("Creating initial migration...")
            migrate(message='Initial migration')
            print("✅ Initial migration created")
        else:
            print("Migrations directory already exists")
        
        print("Applying migrations...")
        upgrade()
        print("✅ Migrations applied")

def check_database_connection(app):
    """Check if database connection is working"""
    with app.app_context():
        try:
            # Test database connection
            db.session.execute('SELECT 1')
            print("✅ Database connection successful")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False

def main():
    """Main initialization function"""
    print("🚀 Initializing Robinhood Clone Database...")
    print("=" * 50)
    
    # Get environment
    env = os.environ.get('FLASK_ENV', 'development')
    print(f"Environment: {env}")
    
    # Create app
    app, migrate_instance = create_app(env)
    
    # Check database connection
    if not check_database_connection(app):
        print("❌ Cannot proceed without database connection")
        sys.exit(1)
    
    try:
        # Initialize database
        init_database(app)
        
        # Set up migrations (only in development)
        if env == 'development':
            setup_migrations(app, migrate_instance)
        
        # Create sample user (only in development)
        if env == 'development':
            create_sample_user(app)
        
        print("\n" + "=" * 50)
        print("✅ Database initialization completed successfully!")
        print("\n📋 Next steps:")
        print("1. Start the Flask application: python app.py")
        print("2. Test the API endpoints")
        if env == 'development':
            print("3. Login with demo user (username: demo, password: demo123)")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()