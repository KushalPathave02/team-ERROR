import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_API_CONFIG } from '../config/api';

const getHeaders = async () => {
  // Get token from the user object in AsyncStorage
  const savedUser = await AsyncStorage.getItem('user');
  let token = null;
  
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser);
      token = userData.token;
      console.log('Found token in user data:', !!token);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  } else {
    console.log('No user data found in AsyncStorage');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (BACKEND_API_CONFIG.DEBUG) {
    console.log('Auth headers:', { hasToken: !!token, token: token ? `${token.substring(0, 10)}...` : null });
  }
  
  return headers;
};

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (BACKEND_API_CONFIG.DEBUG) {
    console.log('API Response:', {
      status: response.status,
      ok: response.ok,
      data: data,
      hasToken: !!(await AsyncStorage.getItem('userToken')),
      hasUserId: !!(await AsyncStorage.getItem('userId'))
    });
  }
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return {
    success: true,
    data: data
  };
};

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

interface UserDetails {
  fullName: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  age: number;
  goal: string;
  activityLevel: string;
  dietaryPreferences?: string[];
  healthConditions?: string[];
}

interface Meal {
  _id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date?: string;
  mealType?: string;
  userId: string; 
  image?: string;
  category?: string;
  isVegetarian?: boolean;
  ingredients?: string[];
  instructions?: string[];
}

export const authAPI = {
  async login(email: string, password: string) {
    try {
      console.log('Login attempt:', { email });

      // Clear ALL existing data to ensure fresh state
      await AsyncStorage.clear();
      console.log('Cleared AsyncStorage for fresh login');

      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();
      console.log('Login response status:', response.status);

      if (!response.ok || !responseData.success) {
        console.error('Login failed:', responseData.message);
        throw new Error(responseData.message || `Login failed with status ${response.status}`);
      }

      const userData = responseData.data;

      // Strict validation of required user data
      if (!userData?.user?._id || !userData?.token) {
        console.error('Invalid server response:', { hasId: !!userData?.user?._id, hasToken: !!userData?.token });
        throw new Error('Invalid server response: missing user ID or token');
      }

      // Store minimal but complete user data
      const userToStore = JSON.stringify({
        _id: userData.user._id,
        fullName: userData.user.fullName,
        email: userData.user.email,
        token: userData.token
      });
      
      await AsyncStorage.setItem('user', userToStore);
      console.log('Stored fresh user data for:', userData.user._id);

      return { success: true, data: userData };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unknown error occurred');
      }
    }
  },

  register: async (registrationData: { fullName: string; email: string; password: string }) => {
    try {
      // Clear any existing auth data
      await AsyncStorage.multiRemove(['userId', 'userToken']);

      if (BACKEND_API_CONFIG.DEBUG) {
        console.log('Sending registration request to:', `${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.REGISTER}`);
        console.log('Registration data:', { ...registrationData, password: '***' });
      }

      // Set a longer timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        signal: controller.signal
      });

      clearTimeout(timeoutId); // Clear the timeout

      const responseData = await response.json();

      if (BACKEND_API_CONFIG.DEBUG) {
        console.log('Raw registration response:', JSON.stringify(responseData, null, 2));
      }

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || responseData.error || `Registration failed with status ${response.status}`);
      }

      const userData = responseData.data;

      // Validate required data exists
      if (!userData?.user?.id || !userData?.token) {
        throw new Error('Invalid server response: missing user ID or token');
      }

      // Store user data in AsyncStorage
      const userToStore = JSON.stringify({
        id: userData.user.id,
        fullName: userData.user.fullName,
        email: userData.user.email,
        token: userData.token
      });
      
      await AsyncStorage.setItem('user', userToStore);

      return { success: true, data: userData };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Registration request timed out');
        return {
          success: false,
          message: 'Registration request timed out. Please try again.'
        };
      }
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.error('Network error during registration:', error);
        return {
          success: false,
          message: 'Network connection error. Please check your internet connection.'
        };
      }
      
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  updateProfile: async (profileData: any) => {
    const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  getProfile: async () => {
    const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}/users/profile`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  logout: async () => {
    try {
      // Clear all storage
      await AsyncStorage.clear();
      // Clear any in-memory state
      console.log('Successfully logged out and cleared all data');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },
};

export const userAPI = {
  async getUserProfile() {
    try {
      if (BACKEND_API_CONFIG.DEBUG) {
        console.log('Fetching user profile from:', `${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.PROFILE}`);
        const headers = await getHeaders();
        console.log('Request headers:', headers);
      }

      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.PROFILE}`, {
        method: 'GET',
        headers: await getHeaders(),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('getUserProfile error:', error);
      throw error;
    }
  },

  async updateUserDetails(details: UserDetails) {
    try {
      if (BACKEND_API_CONFIG.DEBUG) {
        console.log('Updating user details:', details);
      }

      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.PROFILE}`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(details),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('updateUserDetails error:', error);
      throw error;
    }
  },
};

export const mealsAPI = {
  async createMeal(mealData: any) {
    try {
      // Get user ID from stored data
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        console.error('No user data found');
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      const userData = JSON.parse(savedUser);
      
      // Ensure all required fields are present
      if (!mealData.name) {
        console.error('Missing required field: name');
        return {
          success: false,
          error: 'Meal name is required'
        };
      }

      // Get headers with auth token
      const headers = await getHeaders();
      
      // Get the correct user ID (could be _id or id depending on where it's stored)
      const userId = userData._id || userData.id;
      if (!userId) {
        console.error('No valid user ID found');
        return {
          success: false,
          error: 'Invalid user data'
        };
      }
      
      // Add userId to headers for backend validation
      headers['X-User-ID'] = userId;

      // Create meal data with user ID
      const dataToSend = {
        ...mealData,
        userId: userId,
        name: mealData.name.trim(),
        mealType: (mealData.mealType || 'breakfast').toLowerCase(),
        // Convert any string values to numbers
        calories: typeof mealData.calories === 'string' ? Number(mealData.calories) : (mealData.calories || 0),
        protein: typeof mealData.protein === 'string' ? Number(mealData.protein) : (mealData.protein || 0),
        carbs: typeof mealData.carbs === 'string' ? Number(mealData.carbs) : (mealData.carbs || 0),
        fat: typeof mealData.fat === 'string' ? Number(mealData.fat) : (mealData.fat || 0),
        // Ensure date is in ISO format
        date: mealData.date || new Date().toISOString().split('T')[0]
      };

      console.log('Creating meal for user:', userId, 'with data:', {
        name: dataToSend.name,
        mealType: dataToSend.mealType,
        userId: dataToSend.userId
      });

      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.MEALS}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(dataToSend)
      });

      let data;
      try {
        data = await response.json();
        console.log('Create meal response:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        return {
          success: false,
          error: 'Invalid response from server'
        };
      }

      if (!response.ok) {
        console.error('Server returned error:', data);
        return {
          success: false,
          error: data.message || `Failed to create meal: ${response.status}`
        };
      }

      if (!data.success) {
        console.error('API returned success: false:', data);
        return {
          success: false,
          error: data.message || 'Failed to create meal'
        };
      }

      // Return the response data
      return data;
    } catch (error) {
      console.error('Error creating meal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async updateMeal(mealId: string, mealData: any) {
    try {
      // Keep the exact meal type as selected by the user
      const dataToSend = {
        ...mealData,
        mealType: mealData.mealType || ''
      };

      console.log('Updating meal with data:', dataToSend);
      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.MEALS}/${mealId}`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      console.log('Update meal response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to update meal: ${response.status}`);
      }

      // Return the response data as is
      return data;
    } catch (error) {
      console.error('Error updating meal:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async updateMealType(mealId: string, mealType: string): Promise<any> {
    try {
      console.log(`Making PATCH request to update meal ${mealId} type to ${mealType}`);
      const response = await fetch(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.MEALS}/${mealId}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({
          mealType: mealType.toLowerCase()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update meal type. Status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to update meal type: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Update meal type response:', data);
      return data;
    } catch (error) {
      console.error('Error updating meal type:', error);
      throw error;
    }
  },

  async getMeals(date?: string) {
    try {
      // Get user ID from stored data with strict validation
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        console.log('No user data found, returning empty meals list');
        return {
          success: true,
          data: { meals: [] }
        };
      }

      let userData;
      try {
        userData = JSON.parse(savedUser);
        if (!userData._id || !userData.token) {
          console.error('Invalid user data:', { hasId: !!userData._id, hasToken: !!userData.token });
          throw new Error('Missing required user data');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        await AsyncStorage.clear(); // Clear corrupted data
        return {
          success: false,
          error: 'Invalid user session',
          data: { meals: [] }
        };
      }
      
      // Build URL with userId as a required parameter
      const url = new URL(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.MEALS}`);
      url.searchParams.append('userId', userData._id);
      if (date) {
        url.searchParams.append('date', date);
      }
      
      // Get headers with auth token
      const headers = await getHeaders();
      headers['X-User-ID'] = userData._id; // Required for backend validation

      console.log('Fetching meals for user:', userData._id);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Server error fetching meals:', error);
        return {
          success: false,
          error: 'Failed to fetch meals',
          data: { meals: [] }
        };
      }

      const responseData = await response.json();

      // Strict filtering of meals by user ID
      if (responseData.data?.meals) {
        const filteredMeals = responseData.data.meals.filter(meal => {
          if (!meal?._id || !meal?.userId) {
            console.log('Skipping invalid meal:', meal?._id);
            return false;
          }
          if (meal.userId !== userData._id) {
            console.warn('Found meal belonging to different user:', { mealId: meal._id, userId: meal.userId });
            return false;
          }
          return true;
        });

        console.log(`Filtered ${responseData.data.meals.length} meals to ${filteredMeals.length} for user:`, userData._id);
        responseData.data.meals = filteredMeals;
      } else {
        responseData.data = { meals: [] };
      }

      return responseData;
    } catch (error) {
      console.error('Error fetching meals:', error);
      return {
        success: false,
        error: error.message,
        data: { meals: [] }
      };
    }
  },

  async deleteMeal(mealId: string) {
    try {
      console.log('Deleting meal with ID:', mealId);
      
      // Get user ID from stored data
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        console.error('No user data found');
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      const userData = JSON.parse(savedUser);
      
      // Get the correct user ID (could be _id or id depending on where it's stored)
      const userId = userData._id || userData.id;
      if (!userId) {
        console.error('No valid user ID found for deletion');
        return {
          success: false,
          error: 'Invalid user data'
        };
      }
      
      // Check if mealId is valid
      if (!mealId) {
        console.error('Invalid meal ID: empty or undefined');
        return {
          success: false,
          error: 'Invalid meal ID'
        };
      }
      
      // Get headers with auth token
      const headers = await getHeaders();
      // Add userId to headers for backend validation
      headers['X-User-ID'] = userId;
      
      // Add userId to URL for double validation
      const url = new URL(`${BACKEND_API_CONFIG.BASE_URL}${BACKEND_API_CONFIG.ENDPOINTS.MEALS}/${mealId}`);
      url.searchParams.append('userId', userId);
      
      console.log('Deleting meal for user:', userId, 'at URL:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: headers
      });

      // Parse the response data
      let data;
      try {
        data = await response.json();
        console.log('Delete meal response:', data);
      } catch (parseError) {
        console.error('Error parsing delete response:', parseError);
        return {
          success: false,
          error: 'Invalid response from server'
        };
      }

      // Check if the request was successful
      if (!response.ok || !data.success) {
        const errorMessage = data.message || `Failed to delete meal: ${response.status}`;
        console.error('Server returned error:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Return success response
      return {
        success: true,
        message: data.message || 'Meal deleted successfully',
        id: data.data?.id
      };
    } catch (error) {
      console.error('Error deleting meal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Create a helper function to directly check if user is authenticated
export const checkAuthentication = async () => {
  try {
    const savedUser = await AsyncStorage.getItem('user');
    if (!savedUser) {
      console.log('No user data found in AsyncStorage');
      return false;
    }
    
    const userData = JSON.parse(savedUser);
    if (!userData.token) {
      console.log('No token found in user data');
      return false;
    }
    
    console.log('User is authenticated with token');
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
