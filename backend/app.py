from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from datetime import datetime
from time import sleep

app = Flask(__name__)
CORS(app)

# Alpha Vantage API configuration
ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY', 'demo')
ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

# Sample watchlist data (in a real app, this would be in a database)
watchlist = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_price(symbol):
    """Get current stock price from Alpha Vantage"""
    try:
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol.upper(),
            'apikey': ALPHA_VANTAGE_API_KEY
        }
        
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params)
        data = response.json()
        
        if 'Global Quote' in data:
            quote = data['Global Quote']
            return jsonify({
                'symbol': quote['01. symbol'],
                'price': float(quote['05. price']),
                'change': float(quote['09. change']),
                'change_percent': quote['10. change percent'].replace('%', ''),
                'volume': int(quote['06. volume']),
                'timestamp': quote['07. latest trading day']
            })
        else:
            return jsonify({'error': 'Stock not found or API limit reached'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/<query>', methods=['GET'])
def search_stocks(query):
    """Search for stocks by symbol or company name"""
    try:
        params = {
            'function': 'SYMBOL_SEARCH',
            'keywords': query,
            'apikey': ALPHA_VANTAGE_API_KEY
        }
        
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params)
        data = response.json()
        
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

@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """Get user's watchlist"""
    return jsonify(watchlist)

@app.route('/api/watchlist', methods=['POST'])
def add_to_watchlist():
    """Add stock to watchlist"""
    data = request.json
    symbol = data.get('symbol', '').upper()
    
    if symbol and symbol not in watchlist:
        watchlist.append(symbol)
        return jsonify({'message': f'Added {symbol} to watchlist', 'watchlist': watchlist})
    
    return jsonify({'error': 'Symbol already in watchlist or invalid'}), 400

@app.route('/api/watchlist/<symbol>', methods=['DELETE'])
def remove_from_watchlist(symbol):
    """Remove stock from watchlist"""
    symbol = symbol.upper()
    if symbol in watchlist:
        watchlist.remove(symbol)
        return jsonify({'message': f'Removed {symbol} from watchlist', 'watchlist': watchlist})
    
    return jsonify({'error': 'Symbol not in watchlist'}), 404

@app.route('/api/stock/<symbol>/chart', methods=['GET'])
def get_stock_chart(symbol):
    """Get stock chart data (daily time series)"""
    try:
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol.upper(),
            'apikey': ALPHA_VANTAGE_API_KEY,
            'outputsize': 'compact'  # Last 100 data points
        }
        
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params)
        data = response.json()
        
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
                'symbol': symbol.upper(),
                'data': chart_data[-30:]  # Last 30 days
            })
        else:
            return jsonify({'error': 'Chart data not found or API limit reached'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market/overview', methods=['GET'])
def get_market_overview():
    """Get overview of popular stocks"""
    popular_stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX']
    overview = []
    
    for symbol in popular_stocks:
        try:
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': ALPHA_VANTAGE_API_KEY
            }
            
            response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params)
            data = response.json()
            
            if 'Global Quote' in data:
                quote = data['Global Quote']
                overview.append({
                    'symbol': quote['01. symbol'],
                    'price': float(quote['05. price']),
                    'change': float(quote['09. change']),
                    'change_percent': quote['10. change percent'].replace('%', '')
                })
            
            # Wait 12 seconds between API calls to respect rate limits (5 calls per minute)
            sleep(12)
        except:
            continue  # Skip if API call fails
    
    return jsonify(overview)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)