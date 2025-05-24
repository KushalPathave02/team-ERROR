import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Text, Avatar, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProfile } from '../contexts/ProfileContext';
import { authAPI, userAPI } from '../services/api';

// Navigation types
type RootStackParamList = {
  Profile: { updatedUserData?: UserData, timestamp?: number };
  UserDetails: { userData?: UserData };
  MainTabs: undefined;
  Login: undefined;
  Feedback: undefined;
  MyFeedback: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

type UserData = {
  fullName: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  activityLevel?: string;
  fitnessGoals?: string;
  profileImage?: string;
};

const ProfileScreen = ({ navigation, route }: Props) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { profilePicture, setProfilePicture } = useProfile();

  useEffect(() => {
    // Always reload when navigating to this screen
    loadUserData();
  }, [route.params?.timestamp]); // Reload when timestamp changes

  // Listen for focus events to refresh data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.updatedUserData) {
        setUserData(route.params.updatedUserData);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.updatedUserData]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('Fetching user profile...');
      const response = await userAPI.getUserProfile();
      console.log('Profile response:', response);
      
      if (response && response.data) {
        console.log('Setting user data:', response.data);
        setUserData(response.data);
      } else {
        console.error('Invalid profile response:', response);
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Profile load error:', error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfilePicture(result.assets[0].uri);
        // Update local state
        setUserData(userData ? {
          ...userData,
          profileImage: result.assets[0].uri,
        } : null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const calculateBMI = () => {
    if (userData?.weight && userData?.height) {
      const heightInMeters = userData.height / 100;
      const bmi = userData.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>No user data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleImagePick} style={styles.avatarWrapper}>
          {profilePicture ? (
            <Avatar.Image
              size={120}
              source={{ uri: profilePicture }}
            />
          ) : (
            <Avatar.Icon
              size={120}
              icon="account"
              color="#fff"
              style={{ backgroundColor: '#5f259f' }}
            />
          )}
          <View style={styles.plusIconOverlay}>
            <IconButton
              icon="plus"
              size={24}
              iconColor="#FFFFFF"
              style={styles.plusIcon}
            />
          </View>
        </TouchableOpacity>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('UserDetails', { userData })}
          style={styles.button}
        >
          Edit Profile
        </Button>
        <Button
          mode="outlined"
          onPress={async () => {
            try {
              await authAPI.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          }}
          style={[styles.button, styles.logoutButton]}
          textColor="#ff3b30"
        >
          Logout
        </Button>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Personal Information</Title>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{userData.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{userData.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>
              {userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not set'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{userData.age ? `${userData.age} years` : 'Not set'}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Health Metrics</Title>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Weight</Text>
            <Text style={styles.value}>{userData.weight ? `${userData.weight} kg` : 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Height</Text>
            <Text style={styles.value}>{userData.height ? `${userData.height} cm` : 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>BMI</Text>
            <Text style={styles.value}>{calculateBMI()}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Fitness Goals</Title>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Goal</Text>
            <Text style={styles.value}>{userData.goal || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Activity Level</Text>
            <Text style={styles.value}>{userData.activityLevel || 'Not set'}</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSection}>
        <Button
          mode="contained-tonal"
          onPress={() => navigation.navigate('Feedback')}
          style={[styles.button, styles.feedbackButton]}
          icon="message-text-outline"
        >
          Send Feedback
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('MyFeedback')}
          style={[styles.button, styles.viewFeedbackButton]}
          icon="history"
        >
          View My Feedback
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    position: 'relative',
  },
  plusIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00C853',
    borderRadius: 20,
    padding: 4,
  },
  plusIcon: {
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    padding: 20,
  },
  button: {
    marginTop: 8,
    elevation: 0,
    shadowColor: 'transparent',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 0,
    shadowColor: 'transparent',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#ff3b30',
  },
  feedbackButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 8,
  },
  viewFeedbackButton: {
    borderColor: '#4CAF50',
  },
  bottomSection: {
    paddingHorizontal: 16,
    marginTop: 'auto',
  },
});

export default ProfileScreen;
