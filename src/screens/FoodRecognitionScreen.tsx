import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Button, Text, Surface, Card, Title, Paragraph, Chip, Portal, Modal, List } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { GEMINI_API_CONFIG, USDA_API_CONFIG } from '../config/api';
import { useMeals } from '../contexts/MealsContext';

interface NutritionData {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_qty: number;
  serving_unit: string;
  image?: string;
  brand?: string;
  description?: string;
  foodId?: string;
  source?: string;
}

const FoodRecognitionScreen: React.FC = () => {
  const { addMeal, removeMeal } = useMeals();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [recognizedFood, setRecognizedFood] = useState('');
  const [foodImage, setFoodImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mealPlanModalVisible, setMealPlanModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<NutritionData | null>(null);

  const uploadImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant gallery access permission to use this feature");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      analyzeFoodImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera permission to use this feature");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      analyzeFoodImage(result.assets[0].uri);
    }
  };

  // Step 1: Use Gemini AI to identify the food in the image and verify it's actually food
  const recognizeFoodFromImage = async (imageUri: string) => {
    try {
      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // First, verify if the image contains food
      const verificationRequestBody = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            },
            { text: 'Does this image contain food? Answer with ONLY "yes" or "no". Be strict - only actual food items should be classified as food.' }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 10
        }
      };

      console.log('Verifying if image contains food...');
      const verificationResponse = await fetch(
        `${GEMINI_API_CONFIG.VISION_API_URL}?key=${GEMINI_API_CONFIG.API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verificationRequestBody)
        }
      );

      const verificationData = await verificationResponse.json();
      
      if (!verificationResponse.ok) {
        throw new Error(`API Error: ${verificationResponse.status} - ${verificationData.error?.message || 'Unknown error'}`);
      }

      if (!verificationData.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }

      const containsFood = verificationData.candidates[0].content.parts[0].text.trim().toLowerCase();
      console.log('Contains food?', containsFood);
      
      if (containsFood !== 'yes') {
        throw new Error('There is no food image.');
      }

      // If it contains food, proceed to identify the food
      const requestBody = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            },
            { text: 'Analyze this food image and provide ONLY the exact food name. Just return the name of the food, nothing else. For example, if it\'s an apple, just return "Apple".' }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 1,
          maxOutputTokens: 50
        }
      };

      console.log('Making request to Gemini Vision API for food identification...');
      const response = await fetch(
        `${GEMINI_API_CONFIG.VISION_API_URL}?key=${GEMINI_API_CONFIG.API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
      }

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }

      const foodName = data.candidates[0].content.parts[0].text.trim();
      console.log('Recognized food:', foodName);
      
      // Return the food name for the next step
      return foodName;
    } catch (error) {
      console.error('Error recognizing food:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to recognize food');
    }
  };

  // Step 2: Get nutrition information from USDA Food Data Central API
  const getNutritionInfo = async (foodName: string) => {
    try {
      // Search for the food in the USDA database
      const searchUrl = `${USDA_API_CONFIG.BASE_URL}/foods/search?api_key=${USDA_API_CONFIG.API_KEY}&query=${encodeURIComponent(foodName)}&dataType=Foundation,SR%20Legacy&pageSize=1`;
      
      console.log('Searching USDA database for:', foodName);
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchResponse.ok) {
        throw new Error(`USDA API Error: ${searchResponse.status}`);
      }
      
      if (!searchData.foods || searchData.foods.length === 0) {
        throw new Error(`No nutrition data found for ${foodName}`);
      }
      
      const foodItem = searchData.foods[0];
      console.log('Found food item:', foodItem.description);
      
      // Extract nutrition information per 100g
      const nutrients = foodItem.foodNutrients;
      const nutritionData: NutritionData = {
        food_name: foodItem.description,
        calories: getNutrientValue(nutrients, 'Energy') || 0,
        protein: getNutrientValue(nutrients, 'Protein') || 0,
        carbs: getNutrientValue(nutrients, 'Carbohydrate, by difference') || 0,
        fat: getNutrientValue(nutrients, 'Total lipid (fat)') || 0,
        fiber: getNutrientValue(nutrients, 'Fiber, total dietary') || 0,
        serving_qty: 100,
        serving_unit: 'g',
        description: foodItem.description,
        foodId: foodItem.fdcId,
        source: 'USDA Food Data Central'
      };
      
      return nutritionData;
    } catch (error) {
      console.error('Error getting nutrition info:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get nutrition info: ${error.message}`);
      }
      throw new Error('Failed to get nutrition info');
    }
  };

  // Helper function to extract nutrient values
  const getNutrientValue = (nutrients: any[], nutrientName: string) => {
    const nutrient = nutrients.find(n => n.nutrientName === nutrientName);
    return nutrient ? nutrient.value : 0;
  };

  const analyzeFoodImage = async (imageUri: string) => {
    setErrorMessage(null);
    setFoodImage(imageUri);
    try {
      setAnalyzing(true);
      setRecognizedFood('');
      setNutrition(null);
      
      // Step 1: Recognize food from image using Gemini AI
      // This will also verify if the image contains food
      const foodName = await recognizeFoodFromImage(imageUri);
      setRecognizedFood(foodName);
      
      // Step 2: Get nutrition information from USDA API
      // Only proceed if we have a valid food name
      const nutritionData = await getNutritionInfo(foodName);
      setNutrition(nutritionData);
      setAnalyzing(false);
      
    } catch (error) {
      console.error('Error analyzing food:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to analyze food';
      setErrorMessage(errorMsg);
      
      // Clear the recognized food and nutrition data if there's an error
      if (errorMsg === 'There is no food image.') {
        setRecognizedFood('');
        setNutrition(null);
      }
      
      setAnalyzing(false);
    }
  };

  const handleAddToMealPlan = async (type: 'breakfast' | 'lunch' | 'dinner') => {
    if (nutrition) {
      try {
        const meal = {
          name: nutrition.food_name,
          image: foodImage || '',
          category: 'scanned',
          isVegetarian: false, // Default value, could be enhanced with AI detection
          ingredients: [],
          instructions: [],
          calories: nutrition.calories,
          protein: Number(nutrition.protein),
          carbs: Number(nutrition.carbs),
          fat: Number(nutrition.fat),
          date: new Date().toISOString().split('T')[0],
          mealType: type  // Add the meal type to the meal object
        };
        
        console.log('Adding meal to plan:', { meal });
        const result = await addMeal(meal);
        
        if (result.success) {
          setMealPlanModalVisible(false);
          Alert.alert('Success', `Added ${nutrition.food_name} to ${type}`);
        } else {
          console.error('Error creating meal:', result.error);
          Alert.alert('Error', `Failed to add meal: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error adding meal to plan:', error);
        Alert.alert('Error', 'Failed to add meal to plan. Please try again.');
      }
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.surface}>
        {foodImage ? (
          <Image source={{ uri: foodImage }} style={styles.image} />
        ) : (
          <Text>No image captured</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={takePicture}
          style={styles.button}
          icon="camera"
        >
          Take Picture
        </Button>
        <Button
          mode="contained"
          onPress={uploadImage}
          style={[styles.button, { backgroundColor: '#4CAF50' }]}
          icon="image"
        >
          Upload Image
        </Button>
      </View>

      {recognizedFood ? (
        <Text style={styles.recognizedFood}>Recognized Food: {recognizedFood}</Text>
      ) : null}
      
      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : null}

      {analyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5f259f" />
          <Text style={styles.analyzing}>Getting nutrition information...</Text>
        </View>
      ) : (
        <Portal>
          <Modal
            visible={mealPlanModalVisible}
            onDismiss={() => setMealPlanModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Card>
              <Card.Title title="Add to Meal Plan" />
              <Card.Content>
                <List.Item
                  title="Add to Breakfast"
                  left={props => <List.Icon {...props} icon="food" />}
                  onPress={() => handleAddToMealPlan('breakfast')}
                />
                <List.Item
                  title="Add to Lunch"
                  left={props => <List.Icon {...props} icon="food" />}
                  onPress={() => handleAddToMealPlan('lunch')}
                />
                <List.Item
                  title="Add to Dinner"
                  left={props => <List.Icon {...props} icon="food" />}
                  onPress={() => handleAddToMealPlan('dinner')}
                />
              </Card.Content>
            </Card>
          </Modal>
        </Portal>
      )}
      
      {nutrition ? (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Title>Nutrition Information</Title>
            <Paragraph style={styles.prediction}>
              {nutrition.food_name}
            </Paragraph>
            
            <View style={styles.servingInfo}>
              <Text style={styles.servingText}>Nutrition values per {nutrition.serving_qty} {nutrition.serving_unit}</Text>
            </View>
            
            {nutrition.image && (
              <Image 
                source={{ uri: nutrition.image }} 
                style={styles.foodImage} 
              />
            )}
            
            {nutrition.source && (
              <Paragraph style={styles.source}>Source: {nutrition.source}</Paragraph>
            )}
            
            <View style={styles.nutritionContainer}>
              <Chip icon="fire" style={styles.chip}>{nutrition.calories} cal</Chip>
              <Chip icon="food-drumstick" style={styles.chip}>{nutrition.protein}g protein</Chip>
              <Chip icon="bread-slice" style={styles.chip}>{nutrition.carbs}g carbs</Chip>
              <Chip icon="oil" style={styles.chip}>{nutrition.fat}g fat</Chip>
              <Chip icon="sprout" style={styles.chip}>{nutrition.fiber}g fiber</Chip>
            </View>
            
            {nutrition.description && nutrition.description !== nutrition.food_name && (
              <Paragraph style={styles.description}>{nutrition.description}</Paragraph>
            )}
            
            {nutrition.foodId && (
              <Text style={styles.foodId}>Food ID: {nutrition.foodId}</Text>
            )}

            <View style={styles.actionButtonsContainer}>
              <Button
                mode="contained"
                onPress={() => setMealPlanModalVisible(true)}
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                icon="plus"
              >
                Add to Plan
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <Text style={styles.analyzing}>Take a picture of your food to analyze it</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  errorMessage: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 8,
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
  },
  foodImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  source: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  servingInfo: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#5f259f',
  },
  servingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  foodId: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  recognizedFood: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resultCard: {
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  prediction: {
    fontSize: 16,
    marginVertical: 12,
    color: '#1a1a1a',
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  chip: {
    margin: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  surface: {
    padding: 8,
    height: 300,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 16,
    width: '100%',
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#5f259f',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyzing: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  predictionContainer: {
    marginTop: 16,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  predictionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  confidenceText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
});

export default FoodRecognitionScreen;
