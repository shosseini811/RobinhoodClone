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

const API_BASE_URL = 'http://localhost:5001/api';

const WatchlistScreen = ({ navigation }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWatchlist = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/watchlist`);
      setWatchlist(response.data);
      
      // Fetch prices for each stock in watchlist
      const prices = {};
      for (const symbol of response.data) {
        try {
          const priceResponse = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
          prices[symbol] = priceResponse.data;
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
        }
      }
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
          <Text style={styles.removeButtonText}>×</Text>
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
        <Text style={styles.emptyIcon}>⭐</Text>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  searchButton: {
    backgroundColor: '#00C851',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  stockItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#333',
  },
  stockPrice: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  stockChange: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  changeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changePercent: {
    fontSize: 14,
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#FF4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WatchlistScreen;