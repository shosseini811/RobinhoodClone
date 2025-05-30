import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';
const screenWidth = Dimensions.get('window').width;

const StockDetailScreen = ({ route }) => {
  const { symbol } = route.params;
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const fetchStockData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
      setStockData(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      Alert.alert('Error', 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}/chart`);
      const data = response.data.data;
      
      if (data && data.length > 0) {
        const labels = data.slice(-7).map(item => {
          const date = new Date(item.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        
        const prices = data.slice(-7).map(item => item.close);
        
        setChartData({
          labels,
          datasets: [{
            data: prices,
            strokeWidth: 2,
          }]
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/watchlist`);
      setIsInWatchlist(response.data.includes(symbol));
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const toggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        await axios.delete(`${API_BASE_URL}/watchlist/${symbol}`);
        setIsInWatchlist(false);
        Alert.alert('Removed', `${symbol} removed from watchlist`);
      } else {
        await axios.post(`${API_BASE_URL}/watchlist`, { symbol });
        setIsInWatchlist(true);
        Alert.alert('Added', `${symbol} added to watchlist`);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      Alert.alert('Error', 'Failed to update watchlist');
    }
  };

  useEffect(() => {
    fetchStockData();
    fetchChartData();
    checkWatchlistStatus();
  }, [symbol]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C851" />
        <Text style={styles.loadingText}>Loading stock details...</Text>
      </View>
    );
  }

  if (!stockData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load stock data</Text>
      </View>
    );
  }

  const changeColor = parseFloat(stockData.change) >= 0 ? '#00C851' : '#FF4444';
  const changePrefix = parseFloat(stockData.change) >= 0 ? '+' : '';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Stock Header */}
      <View style={styles.header}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{stockData.symbol}</Text>
          <Text style={styles.stockPrice}>${stockData.price.toFixed(2)}</Text>
          <View style={styles.changeContainer}>
            <Text style={[styles.changeText, { color: changeColor }]}>
              {changePrefix}{stockData.change.toFixed(2)}
            </Text>
            <Text style={[styles.changePercent, { color: changeColor }]}>
              ({changePrefix}{stockData.change_percent}%)
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.watchlistButton,
            isInWatchlist && styles.watchlistButtonActive
          ]}
          onPress={toggleWatchlist}
        >
          <Text style={[
            styles.watchlistButtonText,
            isInWatchlist && styles.watchlistButtonTextActive
          ]}>
            {isInWatchlist ? '⭐ In Watchlist' : '☆ Add to Watchlist'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>7-Day Price Chart</Text>
        {chartLoading ? (
          <View style={styles.chartLoadingContainer}>
            <ActivityIndicator size="large" color="#00C851" />
            <Text style={styles.loadingText}>Loading chart...</Text>
          </View>
        ) : chartData ? (
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 200, 81, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#00C851',
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <View style={styles.chartErrorContainer}>
            <Text style={styles.chartErrorText}>Chart data unavailable</Text>
          </View>
        )}
      </View>

      {/* Stock Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Stock Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Symbol</Text>
          <Text style={styles.detailValue}>{stockData.symbol}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Price</Text>
          <Text style={styles.detailValue}>${stockData.price.toFixed(2)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Change</Text>
          <Text style={[styles.detailValue, { color: changeColor }]}>
            {changePrefix}{stockData.change.toFixed(2)} ({changePrefix}{stockData.change_percent}%)
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Volume</Text>
          <Text style={styles.detailValue}>{stockData.volume.toLocaleString()}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated</Text>
          <Text style={styles.detailValue}>{stockData.timestamp}</Text>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#FF4444',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stockInfo: {
    marginBottom: 16,
  },
  stockSymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  stockPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  changePercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  watchlistButton: {
    backgroundColor: '#00C851',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  watchlistButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  watchlistButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  watchlistButtonTextActive: {
    color: '#666',
  },
  chartSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartLoadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartErrorContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartErrorText: {
    fontSize: 16,
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default StockDetailScreen;