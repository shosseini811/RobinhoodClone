import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);

  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search/${query}`);
      setSearchResults(response.data);
      console.log("response.data:", response.data);
      // React state update is asynchronous, so the state variable will not immediately reflect the updated value
      
      console.log("SearchResult:",searchResults);
    } catch (error) {
      console.error('Error searching stocks:', error);
      Alert.alert('Error', 'Failed to search stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol) => {
    try {
      await axios.post(`${API_BASE_URL}/watchlist`, { symbol });
      Alert.alert('Success', `${symbol} added to watchlist`);
      // Update local watchlist state
      setWatchlist([...watchlist, symbol]);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      Alert.alert('Error', 'Failed to add to watchlist');
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    // Debounce search
    setTimeout(() => {
      searchStocks(text);
    }, 500);
  };

  const renderSearchResult = ({ item }) => {
    const isInWatchlist = watchlist.includes(item.symbol);

    return (
      <View style={styles.resultItem}>
        <TouchableOpacity
          style={styles.stockInfo}
          onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
        >
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.stockName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.stockDetails}>
            {item.type} • {item.region} • {item.currency}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.watchlistButton,
            isInWatchlist && styles.watchlistButtonAdded
          ]}
          onPress={() => !isInWatchlist && addToWatchlist(item.symbol)}
          disabled={isInWatchlist}
        >
          <Text style={[
            styles.watchlistButtonText,
            isInWatchlist && styles.watchlistButtonTextAdded
          ]}>
            {isInWatchlist ? '✓' : '+'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks by symbol or company name..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C851" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!loading && searchQuery && searchResults.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try searching with a different symbol or company name
          </Text>
        </View>
      )}

      {!loading && !searchQuery && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🔍</Text>
          <Text style={styles.emptySubtext}>
            Search for stocks by symbol or company name
          </Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.symbol}
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
  searchContainer: {
    backgroundColor: '#fff', // Pure white background for search input area
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Light gray border to separate search area from results
  },
  searchInput: {
    backgroundColor: '#f8f9fa', // Light gray background for search input field
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Light gray border around search input
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666', // Medium gray text for empty state message
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  resultItem: {
    backgroundColor: '#fff', // Pure white background for each search result item
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
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
    marginRight: 12,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // Dark gray text for stock symbol
  },
  stockName: {
    fontSize: 14,
    color: '#666', // Medium gray text for company name
    marginTop: 4,
    lineHeight: 20,
  },
  stockDetails: {
    fontSize: 12,
    color: '#999', // Light gray text for additional stock details
    marginTop: 4,
  },
  watchlistButton: {
    backgroundColor: '#00C851', // Green background for add to watchlist button
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchlistButtonAdded: {
    backgroundColor: '#e0e0e0', // Light gray background when stock is already in watchlist
  },
  watchlistButtonText: {
    color: '#fff', // White text for watchlist button
    fontSize: 18,
    fontWeight: 'bold',
  },
  watchlistButtonTextAdded: {
    color: '#666', // Medium gray text when stock is already in watchlist
  },
});

export default SearchScreen;