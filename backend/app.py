from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from datetime import datetime, timedelta
from time import sleep

app = Flask(__name__)
CORS(app)

# Finnhub API configuration
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY', 'demo')
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

# Sample watchlist data (in a real app, this would be in a database)
watchlist = ['GOOGL', 'MSFT']
# watchlist = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_price(symbol):
    """Get current stock price from Finnhub"""
    try:
        # Get current price
        quote_url = f'{FINNHUB_BASE_URL}/quote'
        quote_params = {
            'symbol': symbol.upper(),
            'token': FINNHUB_API_KEY
        }
        
        quote_response = requests.get(quote_url, params=quote_params)
        quote_data = quote_response.json()
        print(quote_data)
        if quote_data.get('c') is not None:  # 'c' is current price
            current_price = quote_data['c']
            change = quote_data['d']  # daily change
            change_percent = quote_data['dp']  # daily change percent
            
            return jsonify({
                'symbol': symbol.upper(),
                'price': float(current_price),
                'change': float(change),
                'change_percent': str(change_percent),
                'volume': 0,  # Volume not available in basic quote
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Stock not found or API limit reached'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/<query>', methods=['GET'])
def search_stocks(query):
    """Search for stocks by symbol or company name"""
    try:
        search_url = f'{FINNHUB_BASE_URL}/search'
        params = {
            'q': query,
            'token': FINNHUB_API_KEY
        }
        
        response = requests.get(search_url, params=params)
        data = response.json()
        
        if 'result' in data:
            results = []
            for match in data['result'][:10]:  # Limit to 10 results
                results.append({
                    'symbol': match['symbol'],
                    'name': match['description'],
                    'type': match['type'],
                    'region': 'US',  # Finnhub doesn't provide region in search
                    'currency': 'USD'  # Default to USD
                })
            return jsonify(results)
        else:
            return jsonify([])
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """Get user's watchlist"""
    print('Watchlist:', watchlist)
    return jsonify(watchlist) # This sends JSON to the client

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

# @app.route('/api/stock/<symbol>/chart', methods=['GET'])
# def get_stock_chart(symbol):
#     """Get stock chart data (daily candles)"""
#     try:
#         # Get data for last 30 days
#         from_timestamp = int((datetime.now() - timedelta(days=30)).timestamp())
#         to_timestamp = int(datetime.now().timestamp())
#         
#         candles_url = f'{FINNHUB_BASE_URL}/stock/candle'
#         params = {
#             'symbol': symbol.upper(),
#             'resolution': 'D',  # Daily resolution
#             'from': from_timestamp,
#             'to': to_timestamp,
#             'token': FINNHUB_API_KEY
#         }
#         
#         response = requests.get(candles_url, params=params)
#         data = response.json()
#         
#         if data.get('s') == 'ok':  # 's' is status
#             chart_data = []
#             
#             for i in range(len(data['t'])):
#                 chart_data.append({
#                     'date': datetime.fromtimestamp(data['t'][i]).strftime('%Y-%m-%d'),
#                     'open': float(data['o'][i]),
#                     'high': float(data['h'][i]),
#                     'low': float(data['l'][i]),
#                     'close': float(data['c'][i]),
#                     'volume': int(data['v'][i])
#                 })
#             
#             return jsonify({
#                 'symbol': symbol.upper(),
#                 'data': chart_data
#             })
#         else:
#             return jsonify({'error': 'Chart data not found or API limit reached'}), 404
#             
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

@app.route('/api/market/overview', methods=['GET'])
def get_market_overview():
    """Get overview of popular stocks"""
    popular_stocks = ['AAPL','TSLA']  # Only Apple stock to conserve API usage
    overview = []
    
    for symbol in popular_stocks:
        try:
            quote_url = f'{FINNHUB_BASE_URL}/quote'
            params = {
                'symbol': symbol,
                'token': FINNHUB_API_KEY
            }
            
            response = requests.get(quote_url, params=params)
            data = response.json()
            
            if data.get('c') is not None:  # 'c' is current price
                overview.append({
                    'symbol': symbol,
                    'price': float(data['c']),
                    'change': float(data['d']),
                    'change_percent': str(data['dp'])
                })
            
            # No need to wait since we're only fetching one stock
        except:
            continue  # Skip if API call fails
    
    return jsonify(overview)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)