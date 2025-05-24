import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Button, Title, Text, HelperText } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';

// API URL for error messages
const API_URL = 'http://192.168.167.135:3000';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const SignupScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  const { signUp } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate inputs
      if (!name || !email || !password || !confirmPassword) {
        setError('All fields are required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Invalid email format');
        return;
      }

      // Register user
      console.log('Attempting signup with:', { email, name });
      await signUp(email, password, name); // name is used as fullName
      console.log('Signup successful');
      navigation.replace('MainTabs');
    } catch (error: any) {
      console.error('Signup error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Full error:', error.toString());
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        setError(`Network error: Could not connect to ${API_URL}. Make sure your phone and computer are on the same network.`);
      } else {
        setError(error.message || `Error: ${error.toString()}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Sign Up</Title>
      

      <TextInput
        label="Full Name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}

      />

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"

      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry={secureTextEntry}

        right={
          <TextInput.Icon
            icon={secureTextEntry ? 'eye' : 'eye-off'}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          />
        }
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry={secureConfirmTextEntry}

        right={
          <TextInput.Icon
            icon={secureConfirmTextEntry ? 'eye' : 'eye-off'}
            onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
          />
        }
      />
      
      {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleSignup}
        style={styles.button}
        loading={loading}
        disabled={loading}
        contentStyle={{ height: 48 }}
      >
        Sign Up
      </Button>
      
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.linkContainer}
      >
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 24,
    marginBottom: 32,
    textAlign: 'center',
    color: '#000000',
    fontWeight: 'normal',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  button: {
    marginTop: 24,
    paddingVertical: 4,
    borderRadius: 4,
  },
  linkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  link: {
    color: '#6200ee',
    fontSize: 14,
  },
});

export default SignupScreen;
