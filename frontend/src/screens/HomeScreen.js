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

const API_BASE_URL = 'http://localhost:5001/api';

const HomeScreen = ({ navigation }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarketOverview = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/market/overview`);
      setStocks(response.data);
    } catch (error) {
      console.error('Error fetching market overview:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketOverview();
  }, []);

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