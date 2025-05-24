import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, SegmentedButtons, Text, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';

type RootStackParamList = {
  Profile: { updatedUserData?: any, timestamp?: number };
  UserDetails: { 
    userData?: any;
    isNewUser?: boolean;
    isInitialSetup?: boolean;
  };
  MainTabs: { screen?: string; params?: any };
  Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'UserDetails'>;

const UserDetailsScreen = ({ navigation, route }: Props) => {
  const existingData = route.params?.userData || {};
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(existingData.fullName || '');
  const [email, setEmail] = useState(existingData.email || '');
  const [gender, setGender] = useState(existingData.gender || 'male');
  const [weight, setWeight] = useState(existingData.weight?.toString() || '');
  const [height, setHeight] = useState(existingData.height?.toString() || '');
  const [age, setAge] = useState(existingData.age?.toString() || '');
  const [goal, setGoal] = useState(existingData.goal || '');
  const [activityLevel, setActivityLevel] = useState(existingData.activityLevel || '');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(existingData.dietaryPreferences || []);
  const [healthConditions, setHealthConditions] = useState<string[]>(existingData.healthConditions || []);

  const handleSubmit = async () => {
    console.log('Checking token...');
    const token = await AsyncStorage.getItem('userToken');
    console.log('Current token:', token);
    try {
      if (!fullName || !email) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);

      // Combine all user data
      const userData = {
        fullName,
        email,
        gender,
        weight: parseFloat(weight) || 0,
        height: parseFloat(height) || 0,
        age: parseInt(age) || 0,
        goal,
        activityLevel,
        dietaryPreferences,
        healthConditions,
      };

      // Save to database
      const response = await userAPI.updateUserDetails(userData);

      if (response.success) {
        // Update local storage with new data
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        if (route.params?.isInitialSetup) {
          // After initial registration, clear token and go to login
          await AsyncStorage.removeItem('userToken');
          Alert.alert('Success', 'Profile created successfully! Please login to continue.', [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }]
                });
              }
            }
          ]);
        } else {
          // For normal profile edits, stay in the app
          navigation.navigate('Profile', { 
            updatedUserData: userData,
            timestamp: new Date().getTime() // Force refresh
          });
          Alert.alert('Success', 'Profile updated successfully!');
        }
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Edit Profile</Title>

      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        mode="flat"
      />

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="flat"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Gender</Text>
      <SegmentedButtons
        value={gender}
        onValueChange={setGender}
        buttons={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' },
        ]}
        style={styles.segmentedButton}
      />
      
      <TextInput
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        style={styles.input}
        mode="flat"
      />

      <TextInput
        label="Height (cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        style={styles.input}
        mode="flat"
      />

      <TextInput
        label="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        style={styles.input}
        mode="flat"
      />

      <TextInput
        label="Your Goal (e.g., Lose weight, Build muscle)"
        value={goal}
        onChangeText={setGoal}
        style={styles.input}
        mode="flat"
      />

      <TextInput
        label="Activity Level (e.g., Sedentary, Moderate, Active)"
        value={activityLevel}
        onChangeText={setActivityLevel}
        style={styles.input}
        mode="flat"
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
    elevation: 2,
    borderRadius: 8,
    backgroundColor: '#6200ee',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  segmentedButton: {
    marginBottom: 12,
  },
});

export default UserDetailsScreen;
