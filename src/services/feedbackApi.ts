import { BACKEND_API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEEDBACK_ENDPOINT = '/feedback';

export interface FeedbackData {
  content: string;
  type: 'suggestion' | 'question' | 'bug' | 'feature' | 'other';
}

export const feedbackAPI = {
  async submitFeedback(feedback: FeedbackData) {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        throw new Error('User not authenticated');
      }

      const { token } = JSON.parse(savedUser);
      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${FEEDBACK_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedback)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  async getUserFeedback() {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        throw new Error('User not authenticated');
      }

      const { token } = JSON.parse(savedUser);
      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${FEEDBACK_ENDPOINT}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get feedback');
      }

      return data;
    } catch (error) {
      console.error('Error getting feedback:', error);
      throw error;
    }
  },

  async deleteFeedback(feedbackId: string) {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        throw new Error('User not authenticated');
      }

      const { token } = JSON.parse(savedUser);
      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${FEEDBACK_ENDPOINT}/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete feedback');
      }

      return data;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }
};
