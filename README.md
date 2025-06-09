# Robinhood Clone - Stock Visualization App

A simple stock visualization app built with React Native (frontend) and Python Flask (backend), using Alpha Vantage API for real-time stock data.

## Features

- 📈 **Market Overview**: View popular stocks with real-time prices and changes
- 🔍 **Stock Search**: Search for stocks by symbol or company name
- ⭐ **Watchlist**: Add/remove stocks to/from your personal watchlist
- 📊 **Stock Details**: View detailed stock information with 7-day price charts
- 📱 **Mobile-First**: Built with React Native for iOS and Android

## Demo Video

Watch the app in action! Click to play the demo video:

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/9793ee3e-c752-422f-8a4a-03cb97c2d1ba" type="video/mp4">
  Your browser does not support the video tag.
</video>


## Tech Stack

### Backend
- Python 3.x
- Flask (Web framework)
- Flask-CORS (Cross-origin requests)
- Requests (HTTP library)
- Alpha Vantage API (Stock data)

### Frontend
- React Native
- Expo
- React Navigation (Navigation)
- React Native Chart Kit (Charts)
- Axios (HTTP client)

## Setup Instructions

### Prerequisites

1. **Python 3.x** installed on your system
2. **Node.js** and **npm** installed
3. **Expo CLI** installed globally: `npm install -g @expo/cli`
4. **Alpha Vantage API Key** (free): Get it from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory:
   ```bash
   cp .env.example .env
   ```

5. Edit the `.env` file and add your Alpha Vantage API key:
   ```
   ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
   ```

6. Start the Flask server:
   ```bash
   python app.py
   ```

   The backend will be running at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Run on your device:
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go app

## API Endpoints

### Backend API

- `GET /api/health` - Health check
- `GET /api/stock/<symbol>` - Get stock quote
- `GET /api/search/<query>` - Search stocks
- `GET /api/stock/<symbol>/chart` - Get stock chart data
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add stock to watchlist
- `DELETE /api/watchlist/<symbol>` - Remove stock from watchlist
- `GET /api/market/overview` - Get popular stocks overview

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

2. **"Network Error"**: Make sure the backend server is running on `http://localhost:5001`

3. **Charts not loading**: This might be due to API rate limits or insufficient data

4. **Expo/React Native issues**: Make sure you have the latest version of Expo CLI

### Backend Issues

- Make sure your `.env` file contains a valid Alpha Vantage API key
- Check that all Python dependencies are installed
- Verify the Flask server is running on port 5001

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