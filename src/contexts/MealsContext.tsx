import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { mealsAPI, checkAuthentication } from '../services/api';

interface APIResponse {
  success: boolean;
  message?: string;
  data?: {
    meal?: any;
  };
  error?: any;
}

interface Meal {
  _id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  image?: string;
  category?: string;
  isVegetarian?: boolean;
  ingredients?: string[];
  instructions?: string[];
}

interface MealsContextType {
  meals: Meal[];
  addMeal: (meal: Partial<Meal>) => Promise<{ success: boolean; error?: any }>;
  removeMeal: (mealId: string) => Promise<void>;
  getMealsByType: (type: 'breakfast' | 'lunch' | 'dinner') => Meal[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  loading: boolean;
  error: string | null;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

export const useMeals = () => {
  const context = useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
};

export const MealsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Watch for user authentication changes and app state
  useEffect(() => {
    // Clear meals state immediately when component mounts
    clearMealsState();
    
    const checkAuthAndLoadMeals = async () => {
      try {
        // Always start with a clean state
        clearMealsState();

        // Check if user is authenticated
        const savedUser = await AsyncStorage.getItem('user');
        if (!savedUser) {
          console.log('No user data found, keeping fresh state');
          return;
        }

        // Validate user data
        let userData;
        try {
          userData = JSON.parse(savedUser);
          if (!userData._id || !userData.token) {
            console.error('Invalid user data:', { hasId: !!userData._id, hasToken: !!userData.token });
            await AsyncStorage.clear(); // Clear invalid data
            return;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          await AsyncStorage.clear(); // Clear corrupted data
          return;
        }

        // Load meals for authenticated user
        const today = new Date().toISOString().split('T')[0];
        console.log('Loading meals for authenticated user:', userData._id, 'date:', today);
        await fetchMeals(today);
      } catch (error) {
        console.error('Error in auth check:', error);
        // Maintain fresh state on error
        setMeals([]);
        setDailyTotals({
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        });
      }
    };

    // Initial check
    checkAuthAndLoadMeals();

    // Set up AppState listener
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App became active, checking auth state...');
        checkAuthAndLoadMeals();
      }
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, []);

  const clearMealsState = useCallback(() => {
    setMeals([]);
    setDailyTotals({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
    setError(null);
  }, []);

  const fetchMeals = useCallback(async (date?: string) => {
    try {
      setLoading(true);
      setError(null);
      clearMealsState(); // Clear state before fetching

      // Get user data
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        console.log('No user data found');
        return;
      }

      // Parse and validate user data
      let userData;
      try {
        userData = JSON.parse(savedUser);
        if (!userData._id) {
          console.log('Invalid user data');
          return;
        }
        console.log('Fetching meals for user:', userData._id);

        const response = await mealsAPI.getMeals();
        if (response.success && response.data?.meals) {
          console.log('Setting meals for date:', date, 'count:', response.data.meals.length);
          setMeals(response.data.meals);
          updateDailyTotals();
        } else {
          console.error('Error fetching meals:', response.error);
          setError(response.error || 'Failed to fetch meals');
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        setError('Invalid user data');
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMeal = async (meal: Partial<Meal>) => {
    try {
      // First check if user is authenticated
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        console.error('Cannot add meal: User is not authenticated');
        return { success: false, error: 'User not authenticated' };
      }
      
      console.log('Adding meal:', meal);
      const response: APIResponse = await mealsAPI.createMeal(meal);
      
      if (response.success && (response.data?.meal || response.data)) {
        // Handle both response structures (data.meal or data directly)
        const mealData = response.data?.meal || response.data;
        // Create a complete meal object by combining the response with the original meal type
        const completeMeal = {
          ...mealData,
          mealType: meal.mealType // Preserve the original meal type
        };

        console.log('Saving meal with preserved type:', {
          id: completeMeal._id,
          name: completeMeal.name,
          mealType: completeMeal.mealType,
          date: completeMeal.date
        });

        setMeals(prevMeals => [...prevMeals, completeMeal]);
        // Update daily totals
        updateDailyTotals();
        return { success: true };
      } else {
        console.error('Failed to add meal:', response.message || response.error);
        return { success: false, error: response.message || response.error || 'Failed to add meal' };
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const removeMeal = async (mealId: string) => {
    try {
      if (!mealId) {
        console.error('Cannot remove meal: Invalid meal ID');
        return;
      }
      
      console.log('Removing meal with ID:', mealId);
      const response = await mealsAPI.deleteMeal(mealId);
      
      if (response.success) {
        console.log('Meal removed successfully:', mealId);
        setMeals(prevMeals => prevMeals.filter(meal => meal._id !== mealId));
        // Update daily totals
        updateDailyTotals();
      } else {
        console.error('Failed to remove meal:', response.error);
        // You could add a toast or alert here to notify the user
        alert(`Failed to remove meal: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing meal:', error);
      alert('An unexpected error occurred while removing the meal');
    }
  };

  const updateDailyTotals = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = meals.filter(meal => meal.date === today);

    const totals = todaysMeals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    setDailyTotals(totals);
  }, [meals]);

  // Update totals when meals change
  useEffect(() => {
    updateDailyTotals();
  }, [meals, updateDailyTotals]);

  const getMealsByType = useCallback((type: 'breakfast' | 'lunch' | 'dinner') => {
    const today = new Date().toISOString().split('T')[0];
    
    // Filter meals by type and date
    console.log('Available meals:', meals.length);
    console.log('All meals:', meals.map(meal => ({
      id: meal._id, 
      name: meal.name, 
      type: meal.mealType
    })));
    
    const filteredMeals = meals.filter(meal => {
      const mealType = meal.mealType;
      const isSameType = mealType?.toLowerCase() === type.toLowerCase();
      const isToday = meal.date === today;
      
      if (isSameType) {
        console.log(`Meal ${meal.name} type ${meal.mealType} matches ${type}`);
      } else {
        console.log(`Meal ${meal.name} type ${meal.mealType} does not match ${type}`);
      }
      
      return isSameType && isToday;
    });
    
    console.log(`Found ${filteredMeals.length} meals for ${type} on ${today}:`, 
      filteredMeals.map(meal => ({ id: meal._id, name: meal.name })));
      
    return filteredMeals;
  }, [meals]);

  const value = {
    meals,
    addMeal,
    removeMeal,
    getMealsByType,
    dailyTotals,
    loading,
    error
  };

  return (
    <MealsContext.Provider value={value}>
      {children}
    </MealsContext.Provider>
  );
};
