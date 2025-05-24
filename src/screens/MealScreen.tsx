import React, { useState, useEffect } from 'react';
import { useMeals } from '../contexts/MealsContext';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Card, Title, Text, Chip, Button, Portal, Modal, Divider, Searchbar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPOONACULAR_API_CONFIG, MEALDB_API_CONFIG } from '../config/api';

// Neutral color for nutrition information
const NEUTRAL_COLOR = '#6B7280';

// Define interfaces
interface Meal {
  _id: string;
  id: string;
  name: string;
  image: string;
  category: string;
  isVegetarian: boolean;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: Date;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
}

interface Category {
  id: string;
  name: string;
}

const MealScreen = () => {
  const { addMeal } = useMeals();
  // State variables
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietFilter, setDietFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [mealTypeModalVisible, setMealTypeModalVisible] = useState<boolean>(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch meal categories from TheMealDB
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${MEALDB_API_CONFIG.BASE_URL}/categories.php`);
      const data = await response.json();
      
      if (data.categories) {
        const mappedCategories = data.categories.map((category: any) => ({
          id: category.idCategory,
          name: category.strCategory
        }));
        
        // Add "All" category at the beginning
        setCategories([{ id: 'all', name: 'All' }, ...mappedCategories]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set default categories if API fails
      setCategories([
        { id: 'all', name: 'All' },
        { id: 'breakfast', name: 'Breakfast' },
        { id: 'lunch', name: 'Lunch' },
        { id: 'dinner', name: 'Dinner' },
        { id: 'dessert', name: 'Dessert' }
      ]);
    }
  };

  // Fetch meals from TheMealDB
  const fetchMeals = async (category: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '';
      
      if (category === 'All') {
        // Get random meals for "All" category
        const randomMealsPromises = Array(10).fill(0).map(() => 
          fetch(`${MEALDB_API_CONFIG.BASE_URL}/random.php`)
            .then(res => res.json())
            .then(data => data.meals?.[0])
        );
        
        const randomMeals = await Promise.all(randomMealsPromises);
        processMeals(randomMeals.filter(Boolean));
      } else if (category === 'Breakfast' || category === 'Lunch' || category === 'Dinner') {
        // For meal times, use search by name since TheMealDB doesn't have these categories
        const mealTimeSearchTerms = {
          'Breakfast': ['breakfast', 'morning', 'pancake', 'egg', 'omelette', 'toast'],
          'Lunch': ['sandwich', 'salad', 'soup', 'wrap'],
          'Dinner': ['steak', 'chicken', 'fish', 'pasta', 'curry']
        };
        
        // Get a random search term for the category
        const searchTerms = mealTimeSearchTerms[category as keyof typeof mealTimeSearchTerms];
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        // Search by name
        url = `${MEALDB_API_CONFIG.BASE_URL}/search.php?s=${randomTerm}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.meals) {
          throw new Error('No meals found for this category');
        }
        
        processMeals(data.meals.slice(0, 10));
      } else {
        // Get meals by category
        url = `${MEALDB_API_CONFIG.BASE_URL}/filter.php?c=${category}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.meals) {
          throw new Error('No meals found for this category');
        }
        
        // Fetch detailed information for each meal
        const mealDetailsPromises = data.meals.slice(0, 10).map((meal: any) => 
          fetch(`${MEALDB_API_CONFIG.BASE_URL}/lookup.php?i=${meal.idMeal}`)
            .then(res => res.json())
            .then(data => data.meals?.[0])
        );
        
        const mealDetails = await Promise.all(mealDetailsPromises);
        processMeals(mealDetails.filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
      setError('Failed to load meals. Please try again.');
      setMeals([]);
      setFilteredMeals([]);
    } finally {
      setLoading(false);
    }
  };

  const getIngredients = (meal: any): string[] => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(`${measure?.trim() || ''} ${ingredient.trim()}`);
      }
    }
    return ingredients;
  };

  // Process meals data
  const processMeals = (mealsData: any[]) => {
    const nonVegKeywords = ['chicken', 'beef', 'pork', 'meat', 'fish', 'lamb', 'bacon', 'ham'];
    
    const processedMeals = mealsData.map(meal => ({
      _id: meal.idMeal,
      id: meal.idMeal,
      name: meal.strMeal,
      image: meal.strMealThumb,
      category: meal.strCategory || 'Uncategorized',
      isVegetarian: false, // This could be enhanced with AI or additional API data
      ingredients: getIngredients(meal),
      instructions: meal.strInstructions?.split('\r\n').filter(Boolean) || [],
      calories: Math.floor(Math.random() * 800) + 200, // Mock data
      protein: Number((Math.floor(Math.random() * 30) + 10).toString()),    // Mock data
      carbs: Number((Math.floor(Math.random() * 50) + 20).toString()),     // Mock data
      fat: Number((Math.floor(Math.random() * 20) + 5).toString()),        // Mock data
      date: new Date(),
      mealType: undefined
    }));

    setMeals(processedMeals);
    setFilteredMeals(processedMeals);
  };

  // Apply filters (diet and search)
  const applyFilters = (mealsToFilter = meals) => {
    let filtered = [...mealsToFilter];
    
    // Apply diet filter
    if (dietFilter !== 'all') {
      filtered = filtered.filter(meal => 
        dietFilter === 'vegetarian' ? meal.isVegetarian : !meal.isVegetarian
      );
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(query) ||
        meal.ingredients.some(ing => ing.toLowerCase().includes(query))
      );
    }
    
    setFilteredMeals(filtered);
  };

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchMeals(category);
  };

  // Handle diet filter change
  const handleDietChange = (value: string) => {
    setDietFilter(value);
    applyFilters();
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters();
  };

  // Handle meal selection
  const handleMealPress = (meal: Meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  const handleAddToMeal = () => {
    if (!selectedMeal) return;
    setMealTypeModalVisible(true);
  };

  const handleMealTypeSelect = async (selectedType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!selectedMeal) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const mealToAdd = {
        ...selectedMeal,
        date: today,
        protein: Number(selectedMeal.protein),
        carbs: Number(selectedMeal.carbs),
        fat: Number(selectedMeal.fat),
        mealType: selectedType
      };

      console.log('Adding meal:', {
      name: mealToAdd.name,
      type: selectedType,
      date: mealToAdd.date,
      calories: mealToAdd.calories,
      mealType: mealToAdd.mealType
    });
      const result = await addMeal(mealToAdd);
      
      if (result.success) {
        console.log('Successfully added meal to', selectedType);
        setMealTypeModalVisible(false);
        setModalVisible(false);
        setSelectedMeal(null);
        setSelectedMealType(null);
      } else {
        console.error('Error adding meal:', result.error);
        alert(`Failed to add meal: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Failed to add meal. Please try again.');
    }
  };

  // Initial data load
  useEffect(() => {
    fetchCategories();
    fetchMeals('All');
  }, []);

  // Update filtered meals when filters change
  useEffect(() => {
    applyFilters();
  }, [dietFilter, searchQuery]);

  // Render meal card
  const renderMealCard = ({ item }: { item: Meal }) => (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={() => handleMealPress(item)}
    >
      <Card style={styles.card}>
        <Card.Cover source={{ uri: item.image }} style={styles.cardImage} />
        <Card.Content>
          <Title style={styles.cardTitle}>{item.name}</Title>
          <View style={styles.labelContainer}>
            <Text 
              style={item.isVegetarian ? styles.vegLabel : styles.nonVegLabel}
            >
              {item.isVegetarian ? "Veg" : "Non-Veg"}
            </Text>
            <Text style={styles.categoryTag}>{item.category}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Portal>
        <Modal
          visible={mealTypeModalVisible}
          onDismiss={() => setMealTypeModalVisible(false)}
          contentContainerStyle={styles.mealTypeModalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Meal Type</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setMealTypeModalVisible(false)}
              style={styles.closeButton}
            />
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>Choose when you'd like to have this meal</Text>
            <Button
              mode="outlined"
              style={[styles.mealTypeButton, selectedMealType === 'breakfast' && styles.selectedMealTypeButton]}
              onPress={() => handleMealTypeSelect('breakfast')}
              labelStyle={selectedMealType === 'breakfast' ? styles.selectedMealTypeText : styles.mealTypeText}
            >
              Breakfast
            </Button>
            <Button
              mode="outlined"
              style={[styles.mealTypeButton, selectedMealType === 'lunch' && styles.selectedMealTypeButton]}
              onPress={() => handleMealTypeSelect('lunch')}
              labelStyle={selectedMealType === 'lunch' ? styles.selectedMealTypeText : styles.mealTypeText}
            >
              Lunch
            </Button>
            <Button
              mode="outlined"
              style={[styles.mealTypeButton, selectedMealType === 'dinner' && styles.selectedMealTypeButton]}
              onPress={() => handleMealTypeSelect('dinner')}
              labelStyle={selectedMealType === 'dinner' ? styles.selectedMealTypeText : styles.mealTypeText}
            >
              Dinner
            </Button>
          </View>
        </Modal>
      </Portal>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search meals or ingredients"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchBarInput}
        />
        <IconButton
          icon="filter-variant"
          size={24}
          style={styles.filterIcon}
          onPress={() => setFilterModalVisible(true)}
        />
      </View>
      
      {/* Meal type buttons */}
      <View style={styles.mealTypeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Button
            mode="outlined"
            onPress={() => handleCategoryChange('Breakfast')}
            style={[styles.mealTypeButtonAlt, selectedCategory === 'Breakfast' && styles.selectedMealType]}
          >
            Breakfast
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleCategoryChange('Lunch')}
            style={[styles.mealTypeButtonAlt, selectedCategory === 'Lunch' && styles.selectedMealType]}
          >
            Lunch
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleCategoryChange('Dinner')}
            style={[styles.mealTypeButtonAlt, selectedCategory === 'Dinner' && styles.selectedMealType]}
          >
            Dinner
          </Button>
        </ScrollView>
      </View>
      
      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Meal list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5f259f" />
          <Text style={styles.loadingText}>Loading meals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMeals}
          renderItem={renderMealCard}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.mealList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No meals found. Try a different filter or category.
            </Text>
          }
        />
      )}
      
      {/* Filter modal */}
      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={styles.filterModalContent}
        >
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter Meals</Text>
            <IconButton
              icon="close"
              size={28}
              onPress={() => setFilterModalVisible(false)}
              style={styles.closeButton}
            />
          </View>
          
          <Text style={styles.filterSectionTitle}>Dietary Preference</Text>
          <View style={styles.filterButtonGroup}>
            <Button
              mode={dietFilter === 'all' ? 'contained' : 'outlined'}
              onPress={() => handleDietChange('all')}
              style={styles.filterDietButton}
              contentStyle={styles.filterButtonContent}
              labelStyle={[styles.filterButtonLabel, dietFilter === 'all' ? {color: 'white'} : null]}
            >
              All
            </Button>
            <Button
              mode={dietFilter === 'vegetarian' ? 'contained' : 'outlined'}
              onPress={() => handleDietChange('vegetarian')}
              style={styles.filterDietButton}
              contentStyle={styles.filterButtonContent}
              labelStyle={[styles.filterButtonLabel, dietFilter === 'vegetarian' ? {color: 'white'} : null]}
            >
              Veg
            </Button>
            <Button
              mode={dietFilter === 'non-vegetarian' ? 'contained' : 'outlined'}
              onPress={() => handleDietChange('non-vegetarian')}
              style={styles.filterDietButton}
              contentStyle={styles.filterButtonContent}
              labelStyle={[styles.filterButtonLabel, dietFilter === 'non-vegetarian' ? {color: 'white'} : null]}
            >
              Non-Veg
            </Button>
          </View>
          
          <Text style={styles.filterSectionTitle}>Meal Categories</Text>
          <View style={styles.filterCategoryGrid}>
            {categories.map(category => (
              <Button
                key={category.id}
                mode={selectedCategory === category.name ? "contained" : "outlined"}
                onPress={() => {
                  handleCategoryChange(category.name);
                  setFilterModalVisible(false);
                }}
                style={styles.filterCategoryButton}
                contentStyle={styles.filterCategoryButtonContent}
                labelStyle={[styles.filterButtonLabel, selectedCategory === category.name ? {color: 'white'} : null]}
              >
                {category.name}
              </Button>
            ))}
          </View>
          
          <Button 
            mode="contained" 
            onPress={() => setFilterModalVisible(false)}
            style={styles.applyFilterButton}
            icon="check"
            labelStyle={[styles.filterButtonLabel, {color: 'white'}]}
          >
            Apply Filters
          </Button>
        </Modal>
        
        {/* Meal detail modal */}
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedMeal && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <IconButton
                  icon="close"
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                />
              </View>
              
              <Image 
                source={{ uri: selectedMeal.image }} 
                style={styles.modalImage} 
              />
              
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
                <View style={styles.modalLabels}>
                  <Text 
                    style={[styles.modalLabel, selectedMeal.isVegetarian ? styles.vegModalLabel : styles.nonVegModalLabel]}
                  >
                    {selectedMeal.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                  </Text>
                  <Text style={[styles.modalLabel, styles.categoryModalLabel]}>{selectedMeal.category}</Text>
                </View>

                <View style={styles.nutritionContainer}>
                  <Text style={styles.sectionTitle}>Nutrition Information</Text>
                  <View style={styles.nutritionChips}>
                    <View style={styles.nutritionItem}>
                      <Chip 
                        icon="fire" 
                        textStyle={styles.nutritionChipText}
                      >
                        {selectedMeal.calories} cal
                      </Chip>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Chip 
                        icon="food-drumstick" 
                        textStyle={styles.nutritionChipText}
                      >
                        {selectedMeal.protein}g protein
                      </Chip>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Chip 
                        icon="bread-slice" 
                        textStyle={styles.nutritionChipText}
                      >
                        {selectedMeal.carbs}g carbs
                      </Chip>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Chip 
                        icon="oil" 
                        textStyle={styles.nutritionChipText}
                      >
                        {selectedMeal.fat}g fat
                      </Chip>
                    </View>
                  </View>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={[styles.recipeSection, {backgroundColor: '#F8F9FA'}]}>
                  {/* Ingredients */}
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  {selectedMeal.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
                  ))}
                  
                  <Divider style={styles.divider} />
                  
                  {/* Instructions */}
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {selectedMeal.instructions.map((instruction, index) => (
                    <Text key={index} style={styles.instruction}>
                      <Text style={styles.instructionNumber}>{index + 1}. </Text>
                      {instruction}
                    </Text>
                  ))}
                </View>

                <Button
                  mode="contained"
                  onPress={() => {
                    setModalVisible(false);
                    setMealTypeModalVisible(true);
                  }}
                  style={styles.addToMealButton}
                >
                  Add to Meal
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  recipeSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    margin: -8,
  },
  nutritionItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  mealTypeModalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  mealTypeButton: {
    marginVertical: 8,
    borderColor: '#5f259f',
    borderWidth: 1.5,
  },
  selectedMealTypeButton: {
    backgroundColor: '#5f259f',
  },
  mealTypeText: {
    color: '#5f259f',
    fontSize: 16,
  },
  selectedMealTypeText: {
    color: '#ffffff',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flex: 1,
    marginVertical: 0,
    height: 44,
    backgroundColor: '#f5f5f5',
  },
  searchBarInput: {
    textAlign: 'center',
  },
  filterIcon: {
    marginLeft: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#5f259f',
    borderRadius: 20,
  },
  mealTypeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  mealTypeButtonAlt: {
    marginHorizontal: 4,
    borderColor: '#5f259f',
    borderRadius: 20,
  },
  selectedMealType: {
    backgroundColor: '#f3e5f5',
  },
  highlightedButtonLabel: {
    fontWeight: 'bold',
    color: '#5f259f',
  },
  filterModalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
  },
  filterModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5f259f',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  filterButtonGroup: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  filterDietButton: {
    flex: 1,
    marginHorizontal: 4,
    borderColor: '#5f259f',
    height: 36,
    borderWidth: 1.5,
  },
  filterButtonContent: {
    paddingVertical: 2,
    height: 30,
  },
  filterButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  filterCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'center',
  },
  filterCategoryButton: {
    margin: 3,
    borderColor: '#5f259f',
    minWidth: '30%',
    height: 36,
    borderWidth: 1.5,
  },
  filterCategoryButtonContent: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    height: 30,
  },
  applyFilterButton: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 4,
    backgroundColor: '#5f259f',
    paddingVertical: 4,
    height: 40,
  },
  cardContainer: {
    width: '50%',
    padding: 8,
  },
  card: {
    elevation: 2,
  },
  cardImage: {
    height: 120,
  },
  cardTitle: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vegLabel: {
    color: '#388e3c',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  nonVegLabel: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryTag: {
    color: '#5f259f',
    backgroundColor: '#f3e5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  mealList: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#d32f2f',
  },
  emptyText: {
    textAlign: 'center',
    margin: 24,
    color: '#666666',
  },
  modalImage: {
    width: '100%',
    height: 200,
    marginBottom: 0,
  },
  modalLabels: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  modalLabel: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    fontSize: 14,
    marginRight: 8,
    overflow: 'hidden',
  },
  vegModalLabel: {
    color: '#388e3c',
    backgroundColor: '#e8f5e9',
  },
  nonVegModalLabel: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  categoryModalLabel: {
    color: '#5f259f',
    backgroundColor: '#f3e5f5',
  },
  nutritionContainer: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  nutritionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  nutritionChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingVertical: 6,
  },
  nutritionChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    marginHorizontal: 16,
  },
  divider: {
    marginVertical: 16,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 10,
    paddingLeft: 16,
    paddingRight: 16,
  },
  instruction: {
    fontSize: 16,
    marginBottom: 14,
    paddingLeft: 16,
    paddingRight: 16,
    lineHeight: 22,
  },
  instructionNumber: {
    fontWeight: 'bold',
  },
  addToMealButton: {
    marginTop: 24,
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: '#5f259f',
  },
});

export default MealScreen;
