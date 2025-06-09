import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.243:5001/api';

const WatchlistScreen = ({ navigation }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWatchlist = async () => {
    try {
      // await means "wait for this to complete before moving to the next line"
      const response = await axios.get(`${API_BASE_URL}/watchlist`);
      setWatchlist(response.data);
      console.log('Response Data:', response.data);
      
      // Fetch prices for each stock in watchlist
      const prices = {};
      for (const symbol of response.data) {
        try {
          const priceResponse = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
          prices[symbol] = priceResponse.data;
          console.log(`Price for ${symbol}:`, prices[symbol]);
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
        }
      }
      console.log("Prices have been collected")
      setStockPrices(prices);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const removeFromWatchlist = async (symbol) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove ${symbol} from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/watchlist/${symbol}`);
              setWatchlist(watchlist.filter(item => item !== symbol));
              const newPrices = { ...stockPrices };
              delete newPrices[symbol];
              setStockPrices(newPrices);
            } catch (error) {
              console.error('Error removing from watchlist:', error);
              Alert.alert('Error', 'Failed to remove from watchlist');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWatchlist();
  };

  const renderWatchlistItem = ({ item }) => {
    const stockData = stockPrices[item];
    
    if (!stockData) {
      return (
        <View style={styles.stockItem}>
          <Text style={styles.stockSymbol}>{item}</Text>
          <ActivityIndicator size="small" color="#00C851" />
        </View>
      );
    }

    const changeColor = parseFloat(stockData.change) >= 0 ? '#00C851' : '#FF4444';
    const changePrefix = parseFloat(stockData.change) >= 0 ? '+' : '';

    return (
      <TouchableOpacity
        style={styles.stockItem}
        onPress={() => navigation.navigate('StockDetail', { symbol: item })}
      >
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{stockData.symbol}</Text>
          <Text style={styles.stockPrice}>${stockData.price.toFixed(2)}</Text>
          {/* <Text>Sohail Hosseini</Text>  */}
        </View>
        <View style={styles.stockChange}>
          <Text style={[styles.changeText, { color: changeColor }]}>
            {changePrefix}{stockData.change.toFixed(2)}
          </Text>
          <Text style={[styles.changePercent, { color: changeColor }]}>
            ({changePrefix}{stockData.change_percent}%)
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromWatchlist(item)}
        >
          <Text style={styles.removeButtonText}>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C851" />
        <Text style={styles.loadingText}>Loading watchlist...</Text>
      </View>
    );
  }

  if (watchlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>*</Text>
        <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add stocks to your watchlist to track their performance
        </Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.searchButtonText}>Search Stocks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Watchlist</Text>
        <Text style={styles.headerSubtitle}>
          {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={watchlist}
        renderItem={renderWatchlistItem}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light gray background for the main container
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // Light gray background matching main container
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666', // Medium gray text for loading message
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333', // Dark gray text for empty state title
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666', // Medium gray text for empty state subtitle
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  searchButton: {
    backgroundColor: '#00C851', // Green background for search button
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff', // White text for search button
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff', // Pure white background for header section
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Light gray border to separate header from content
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // Dark gray text for main title
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666', // Medium gray text for subtitle
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  stockItem: {
    backgroundColor: '#fff', // Pure white background for each watchlist item card
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', // Black shadow color for card depth effect
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // Dark gray text for stock symbol
  },
  stockPrice: {
    fontSize: 16,
    color: '#666', // Medium gray text for stock price
    marginTop: 4,
  },
  stockChange: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  changeText: {
    fontSize: 16,
    fontWeight: 'bold',
    // Color is dynamically set: #00C851 (green) for gains, #FF4444 (red) for losses
  },
  changePercent: {
    fontSize: 14,
    marginTop: 2,
    // Color is dynamically set: #00C851 (green) for gains, #FF4444 (red) for losses
  },
  removeButton: {
    backgroundColor: '#FF4444', // Red background for remove from watchlist button
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff', // White text for remove button
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WatchlistScreen;