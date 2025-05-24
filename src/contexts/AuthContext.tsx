import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: any;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const API_URL = 'http://192.168.167.135:3000/api'; // Using computer's IP for Expo Go

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', JSON.stringify(data));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to sign in');
      }

      // Store user data with the correct structure
      if (data.success && data.data) {
        const userData = {
          id: data.data.user.id,
          fullName: data.data.user.fullName,
          email: data.data.user.email,
          token: data.data.token
        };
        console.log('Storing user data with token:', userData.token ? 'Token exists' : 'No token');
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('Starting signup process for:', email);
    try {
      console.log('Making request to:', `${API_URL}/auth/signup`);
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName, name: fullName }),
      });

      console.log('Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Signup response data:', JSON.stringify(data));
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Signup failed with status ${response.status}`);
      }
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || `Signup failed with status ${response.status}`);
      }

      // Store user data with the correct structure
      if (data.success && data.data) {
        const userData = {
          id: data.data.user.id,
          fullName: data.data.user.fullName,
          email: data.data.user.email,
          token: data.data.token
        };
        console.log('Storing user data with token:', userData.token ? 'Token exists' : 'No token');
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
