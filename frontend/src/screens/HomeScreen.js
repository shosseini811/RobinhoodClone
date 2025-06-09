import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.243:5001/api';

const HomeScreen = ({ navigation }) => {
  const [stocks, setStocks] = useState([]); // This initializes a state variable with an empty array as the default value
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarketOverview = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/market/overview`);
      setStocks(response.data);
      console.log(response.data);
      // console.log(stocks);

    } catch (error) {
      console.error('Error fetching market overview:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('HomeScreen mounted, fetching stocks...');
    fetchMarketOverview();
  }, []); // Run this effect only once after the initial render

    // This useEffect runs whenever stocks change
    useEffect(() => {
      console.log('Stocks state updated!');
      console.log('Number of stocks:', stocks.length);
      
      if (stocks.length > 0) {
        console.log('First stock example:', stocks[0]);
        console.log('All stock symbols:', stocks.map(stock => stock.symbol));
      }
    }, [stocks]); // Dependency: runs when stocks changes

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarketOverview();
  };

  const renderStockItem = ({ item }) => {
    const changeColor = parseFloat(item.change) >= 0 ? '#00C851' : '#FF4444';
    const changePrefix = parseFloat(item.change) >= 0 ? '+' : '';

    return (
      <TouchableOpacity 
        style={styles.stockItem}
        onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
      >
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.stockPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.stockChange}> 
          <Text style={[styles.changeText, { color: changeColor }]}> 
            {changePrefix}{item.change.toFixed(2)} 
          </Text>
          <Text style={[styles.changePercent, { color: changeColor }]}> 
            ({changePrefix}{item.change_percent}%)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C851" />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market Overview</Text>
        <Text style={styles.headerSubtitle}>Popular Stocks</Text>
      </View>
      
      <FlatList
        data={stocks}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.symbol}
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
    backgroundColor: '#fff', // Pure white background for each stock item card
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
  },
  changeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changePercent: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default HomeScreen;