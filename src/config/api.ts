export const BACKEND_API_CONFIG = {
  // Using local network IP address for physical device access
  BASE_URL: 'http://192.168.177.135:3000/api',
  // Log all API requests in development
  DEBUG: true,
  // Available endpoints
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/signup',
    PROFILE: '/users/profile',
    MEALS: '/meals'
  }
};

export const GEMINI_API_CONFIG = {
  API_KEY: 'AIzaSyAjQ7q6UFT52GST6lQNfvxQ0B00vac5zZs',
  VISION_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

export const USDA_API_CONFIG = {
  API_KEY: 'jwNGVrgjM8YgufH2wdUqEXAO4a7WjptQO1QiyvOJ',
  BASE_URL: 'https://api.nal.usda.gov/fdc/v1'
};

export const SPOONACULAR_API_CONFIG = {
  API_KEY: '0d5f0159ef254bbf9ecfd3d512aa67de',
  BASE_URL: 'https://api.spoonacular.com'
};

export const MEALDB_API_CONFIG = {
  BASE_URL: 'https://www.themealdb.com/api/json/v1/1'
};
