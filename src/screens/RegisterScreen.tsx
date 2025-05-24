import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    try {
      // Validate required fields
      const trimmedFullName = fullName.trim();
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedFullName || !trimmedEmail || !trimmedPassword) {
        alert('Please fill in all fields');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        alert('Please enter a valid email address');
        return;
      }

      // Password validation
      if (trimmedPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      const response = await authAPI.register({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password: trimmedPassword
      });

      if (response.success && response.data?.user) {
        // Navigate to UserDetails with the registered user data
        navigation.replace('UserDetails', {
          userData: response.data.user,
          isNewUser: true,
          isInitialSetup: true // Mark this as initial setup
        });
      } else {
        // Handle error from the response or show default message
        const errorMessage = response.data?.message || 'Registration failed';
        alert(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineMedium">
        Create Account
      </Text>
      
      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        mode="outlined"
        style={styles.input}
        disabled={loading}
      />
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        disabled={loading}
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry={!showPassword}
        disabled={loading}
        right={<TextInput.Icon 
          icon={showPassword ? 'eye-off' : 'eye'}
          onPress={() => setShowPassword(!showPassword)}
        />}
      />
      
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        style={styles.button}
        disabled={loading}
      >
        Register
      </Button>
      
      <View style={styles.loginContainer}>
        <Text>Already have an account? </Text>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          Login
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});

export default RegisterScreen;
