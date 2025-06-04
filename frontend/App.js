import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import StockDetailScreen from './src/screens/StockDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Home and Stock Detail
// that will manage two screens.
function HomeStack() {
  return (
    <Stack.Navigator>
      {/* First screen in the stack */}
      <Stack.Screen  // defines one specific screen in the stack
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: 'Home Screen' }}// Sets the title in the header
      />
      {/* Second screen in the stack */}
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetailScreen} 
        options={({ route }) => {
          console.log('HomeStack route:', route);
          return { title: route.params.symbol };
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Watchlist and Stock Detail
function WatchlistStack() {
  return (
    <Stack.Navigator>
          {/* <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: 'papayawhip' } }}> */}
      <Stack.Screen 
        name="WatchlistMain" 
        component={WatchlistScreen} 
        options={{ title: 'Watchlist' }}
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetailScreen} 
        options={({ route }) => {
          console.log('WatchlistStack route:', route);
          return { title: route.params.symbol };
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Search and Stock Detail
function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SearchMain" 
        component={SearchScreen} 
        options={{ title: 'Search Stocks' }}
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetailScreen} 
        options={({ route }) => ({ title: route.params.symbol })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#00C851',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          options={{
            tabBarLabel: 'Market',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>📈</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchStack}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>🔍</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Watchlist" 
          component={WatchlistStack}
          options={{
            tabBarLabel: 'Watchlist',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>⭐</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Pure white background for the main container
    alignItems: 'center',
    justifyContent: 'center',
  },
});
