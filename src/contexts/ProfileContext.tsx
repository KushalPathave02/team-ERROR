import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  fullName: string;
  email: string;
  gender?: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  activityLevel?: string;
  profileImage?: string;
}

const defaultValue: ProfileContextType = {
  profile: null,
  updateProfile: async () => {},
  fetchProfile: async () => {},
  loading: false,
  profilePicture: undefined,
  setProfilePicture: () => {}
};

interface ProfileContextType {
  profile: Profile | null;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  fetchProfile: () => Promise<void>;
  loading: boolean;
  profilePicture?: string;
  setProfilePicture: (url: string) => void;
}

const ProfileContext = createContext<ProfileContextType>(defaultValue);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);

  const API_URL = 'http://localhost:5000/api';

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      updateProfile,
      fetchProfile,
      loading,
      profilePicture,
      setProfilePicture,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};
