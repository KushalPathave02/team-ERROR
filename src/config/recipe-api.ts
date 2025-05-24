// TheMealDB API - Free to use, no key required for basic functionality
export const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Fallback static recipes in case API fails or rate limit is exceeded
export const staticRecipes = {
  breakfast: [
    {
      name: 'Vegetarian Omelette',
      calories: 280,
      protein: '14g',
      carbs: '8g',
      fat: '22g',
      ingredients: [
        '3 eggs',
        '1 cup mixed vegetables (bell peppers, onions, tomatoes)',
        'Salt and pepper to taste',
        '1 tbsp olive oil',
        'Fresh herbs (optional)'
      ],
      instructions: [
        '1. Chop vegetables finely',
        '2. Beat eggs with salt and pepper',
        '3. Cook vegetables until soft',
        '4. Add eggs and cook until set'
      ],
      prepTime: '10 mins',
      cookTime: '15 mins',
      servings: 1,
      vegetarian: true,
      vegan: false
    }
  ],
  lunch: [
    {
      name: 'Chickpea Curry',
      calories: 350,
      protein: '12g',
      carbs: '45g',
      fat: '14g',
      ingredients: [
        '1 can chickpeas',
        '1 onion',
        '2 tomatoes',
        'Indian spices',
        'Rice for serving'
      ],
      instructions: [
        '1. Sauté onions until golden',
        '2. Add spices and tomatoes',
        '3. Add chickpeas and simmer',
        '4. Serve with rice'
      ],
      prepTime: '15 mins',
      cookTime: '25 mins',
      servings: 2,
      vegetarian: true,
      vegan: true
    }
  ],
  dinner: [
    {
      name: 'Grilled Chicken Breast',
      calories: 450,
      protein: '35g',
      carbs: '25g',
      fat: '22g',
      ingredients: [
        '200g chicken breast',
        'Mixed herbs and spices',
        'Roasted vegetables',
        'Olive oil',
        'Garlic'
      ],
      instructions: [
        '1. Marinate chicken',
        '2. Preheat grill',
        '3. Grill chicken until done',
        '4. Serve with vegetables'
      ],
      prepTime: '20 mins',
      cookTime: '25 mins',
      servings: 1,
      vegetarian: false,
      vegan: false
    }
  ]
};
