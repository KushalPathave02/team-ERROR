import React from 'react';
import { View, Platform, AppRegistry, TouchableOpacity } from 'react-native';

import { MealsProvider } from './src/contexts/MealsContext';
import { ProfileProvider, useProfile } from './src/contexts/ProfileContext';
import { Avatar } from 'react-native-paper';
import { ActivityIndicator, Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import MealScreen from './src/screens/MealScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import FoodRecognitionScreen from './src/screens/FoodRecognitionScreen';
import UserDetailsScreen from './src/screens/UserDetailsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { FeedbackScreen } from './src/screens/FeedbackScreen';
import { MyFeedbackScreen } from './src/screens/MyFeedbackScreen';

import { AuthProvider } from './src/contexts/AuthContext';

// Ignore specific warnings
LogBox.ignoreLogs([
  'SurfaceRegistryBinding::startSurface failed',
]);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// PhonePe theme colors with added level3 property
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#5f259f', // PhonePe primary purple
    accent: '#5f259f',
    background: '#ffffff', // Light background
    surface: '#ffffff',
    error: '#d32f2f',
    text: '#333333', // Dark text on light background
    disabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#5f259f',
    // Add missing level3 property
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level3: 'rgba(0, 0, 0, 0.08)' // Define level3 with a default value
    }
  },
  dark: false, // PhonePe uses a light theme
};

const MainTabs = () => {
  const { profilePicture } = useProfile();
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        tabBarActiveTintColor: '#5f259f',
        tabBarInactiveTintColor: '#666666',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#5f259f',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#eeeeee',
          borderTopWidth: 1,
          elevation: 8,
          shadowOpacity: 0.1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: 'NutriTrack',  
          tabBarLabel: 'Home',       
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FoodRecognition"
        component={FoodRecognitionScreen}
        options={{
          headerTitle: 'Food Scan',
          tabBarLabel: 'Food Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealScreen}
        options={{
          headerTitle: 'Meals',
          tabBarLabel: 'Meals',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppContent = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#5f259f',
          },
          headerShadowVisible: false,
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#ffffff',
          },
        }}
        initialRouteName="Login"
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FoodRecognition"
          component={FoodRecognitionScreen}
          options={{
            title: 'Food Recognition',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="UserDetails"
          component={UserDetailsScreen}
          options={{
            title: 'Complete Your Profile',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{
            title: 'Send Feedback',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="MyFeedback"
          component={MyFeedbackScreen}
          options={{
            title: 'My Feedback',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Enable screens for better navigation performance
enableScreens(true);

export default function App() {
  LogBox.ignoreLogs(['Warning: ...']); // Ignore specific logs
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProfileProvider>
            <MealsProvider>
              <AppContent />
            </MealsProvider>
          </ProfileProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
