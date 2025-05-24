import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Text, IconButton, Modal, Portal, ProgressBar, Button } from 'react-native-paper';
import { useMeals } from '../contexts/MealsContext';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-svg-charts';

// Color constants for nutrition information
const NUTRITION_COLORS = {
  calories: '#6739B7',  // PhonePe Purple
  protein: '#2196F3',   // Blue
  carbs: '#4CAF50',     // Green
  fat: '#FF5722'        // Orange
};

// PhonePe theme colors
const THEME_COLORS = {
  primary: '#6739B7',     // Main purple
  secondary: '#8B6CC1',   // Lighter purple
  background: '#F5F7FA',  // Light gray background
  surface: '#FFFFFF',     // White surface
  text: '#1C1939',       // Dark text
  textLight: '#6B6B6B'    // Gray text
};

// Target values for daily nutrition
const DAILY_TARGETS = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65
};

export const HomeScreen = () => {
  const { meals, removeMeal, dailyTotals } = useMeals();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const mealsRef = useRef<ScrollView>(null);
  const [weekDates, setWeekDates] = useState<Array<{
    fullDate: string;
    day: string;
    date: string;
    month: string;
  }>>([]);
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);

  const calculatePercentages = () => {
    return [
      {
        key: 'carbs',
        value: (dailyTotals.carbs / DAILY_TARGETS.carbs) * 100,
        svg: { fill: NUTRITION_COLORS.carbs },
        label: 'Carbs',
      },
      {
        key: 'fat',
        value: (dailyTotals.fat / DAILY_TARGETS.fat) * 100,
        svg: { fill: NUTRITION_COLORS.fat },
        label: 'Fat',
      },
      {
        key: 'protein',
        value: (dailyTotals.protein / DAILY_TARGETS.protein) * 100,
        svg: { fill: NUTRITION_COLORS.protein },
        label: 'Protein',
      },
      {
        key: 'calories',
        value: (dailyTotals.calories / DAILY_TARGETS.calories) * 100,
        svg: { fill: NUTRITION_COLORS.calories },
        label: 'Calories',
      },
    ];
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate().toString(),
      month: months[date.getMonth()]
    };
  };

  useEffect(() => {
    // Generate week dates starting from Sunday of current week
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = new Date(today);
    
    // Go back to Sunday
    startDate.setDate(today.getDate() - currentDay);
    
    // Generate 7 days starting from Sunday
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const formatted = formatDate(date);
      
      dates.push({
        fullDate: date.toISOString().split('T')[0],
        day: formatted.day,
        date: formatted.date,
        month: formatted.month,
      });
    }
    
    // Set initial selected date to today
    setSelectedDate(today.toISOString().split('T')[0]);
    setWeekDates(dates);
  }, []);

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    // Scroll to meals section when a date is selected
    if (mealsRef.current) {
      mealsRef.current.scrollTo({ y: 400, animated: true }); // Scroll to approximate position of meals section
    }
  };

  const handleMealRemove = async (mealId: string) => {
    try {
      await removeMeal(mealId);
    } catch (error) {
      console.error('Error removing meal:', error);
    }
  };

  const renderMealSection = (title: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    console.log(`Rendering ${title} section for date ${selectedDate}`);
    console.log('Available meals:', meals.length);
    
    // First, log all meals for debugging
    console.log('All meals:', meals.map(m => ({
      id: m._id,
      name: m.name,
      type: m.mealType,
      date: m.date
    })));

    const mealsOfType = meals.filter(meal => {
      // Check if meal is for the selected date
      const mealDate = meal.date?.split('T')[0];
      if (mealDate !== selectedDate) {
        console.log(`Meal ${meal.name} date ${mealDate} doesn't match selected date ${selectedDate}`);
        return false;
      }

      // Normalize meal type for comparison (case insensitive)
      if (!meal.mealType) {
        console.log(`Meal ${meal.name} has no meal type`);
        return false;
      }

      const normalizedMealType = meal.mealType.toLowerCase();
      const normalizedTargetType = mealType.toLowerCase();
      const matches = normalizedMealType === normalizedTargetType;
      
      console.log(`Meal ${meal.name} type ${normalizedMealType} ${matches ? 'matches' : 'does not match'} ${normalizedTargetType}`);
      return matches;
    });

    console.log(`Found ${mealsOfType.length} meals for ${mealType} on ${selectedDate}:`, 
      mealsOfType.map(m => ({ id: m._id, name: m.name, type: m.mealType })));

    return (
      <View style={styles.mealSection}>
        <Title style={styles.sectionTitle}>{title}</Title>
        {mealsOfType.length > 0 ? (
          mealsOfType.map(meal => (
            <Card key={meal._id} style={styles.mealCard}>
              <Card.Content style={styles.mealCardContent}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealTitle}>{meal.name}</Text>
                  <View style={styles.nutritionInfo}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionText}>{meal.calories} cal</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionText}>{meal.protein}g protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionText}>{meal.carbs}g carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionText}>{meal.fat}g fat</Text>
                    </View>
                  </View>
                </View>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleMealRemove(meal._id)}
                  style={styles.removeButton}
                />
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>No {title.toLowerCase()} logged for this day</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView ref={mealsRef} style={styles.container}>
      <Card style={styles.progressCard}>
        <TouchableOpacity onPress={() => setShowDetailedProgress(true)}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Daily Progress</Title>
              <Text style={styles.mealsTracked}>{meals.length} meals tracked</Text>
            </View>

          <View style={styles.progressSection}>
            {/* Calories */}
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.labelText}>Calories</Text>
                <Text style={styles.progressValue}>
                  {dailyTotals.calories} / {DAILY_TARGETS.calories} cal
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(dailyTotals.calories / DAILY_TARGETS.calories, 1)}
                color={NUTRITION_COLORS.calories}
                style={styles.progressBar}
              />
            </View>

            {/* Protein */}
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.labelText}>Protein</Text>
                <Text style={styles.progressValue}>
                  {dailyTotals.protein} / {DAILY_TARGETS.protein}g
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(dailyTotals.protein / DAILY_TARGETS.protein, 1)}
                color={NUTRITION_COLORS.protein}
                style={styles.progressBar}
              />
            </View>

            {/* Carbs */}
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.labelText}>Carbs</Text>
                <Text style={styles.progressValue}>
                  {dailyTotals.carbs} / {DAILY_TARGETS.carbs}g
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(dailyTotals.carbs / DAILY_TARGETS.carbs, 1)}
                color={NUTRITION_COLORS.carbs}
                style={styles.progressBar}
              />
            </View>

            {/* Fat */}
            <View style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <Text style={styles.labelText}>Fat</Text>
                <Text style={styles.progressValue}>
                  {dailyTotals.fat} / {DAILY_TARGETS.fat}g
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(dailyTotals.fat / DAILY_TARGETS.fat, 1)}
                color={NUTRITION_COLORS.fat}
                style={styles.progressBar}
              />
            </View>
          </View>
          </Card.Content>
        </TouchableOpacity>
      </Card>

      <Portal>
        <Modal
          visible={showDetailedProgress}
          onDismiss={() => setShowDetailedProgress(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Detailed Progress</Title>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowDetailedProgress(false)}
              />
            </View>
            
            <View style={styles.chartContainer}>
              <PieChart
                style={styles.chart}
                data={calculatePercentages()}
                innerRadius={'80%'}
                padAngle={0.02}
              />
            </View>

            <View style={styles.percentageList}>
              {calculatePercentages().map((item) => (
                <View key={item.key} style={styles.percentageItem}>
                  <View style={styles.percentageLabel}>
                    <View 
                      style={[styles.colorDot, { backgroundColor: item.svg.fill }]} 
                    />
                    <Text style={styles.labelText}>{item.label}</Text>
                  </View>
                  <Text style={styles.percentageValue}>{Math.round(item.value)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </Modal>
      </Portal>

      <Card style={styles.weeklyPlanCard}>
        <Card.Content>
          <Title style={styles.weeklyTitle}>Weekly Meal Plan</Title>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekSelector}
          >
            {weekDates.map((date) => {
              const isSelected = date.fullDate === selectedDate;
              return (
                <TouchableOpacity 
                  key={date.fullDate}
                  onPress={() => handleDayPress(date.fullDate)}
                  style={[styles.dateButton, isSelected && styles.selectedDayCard]}
                >
                  <Text style={[styles.dayText, isSelected && styles.selectedText]}>
                    {date.day}
                  </Text>
                  <Text style={[styles.dateText, isSelected && styles.selectedText]}>
                    {date.date}
                  </Text>
                  {date.date === '1' && (
                    <Text style={[styles.monthText, isSelected && styles.selectedText]}>
                      {date.month}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card.Content>
      </Card>

      {renderMealSection('Breakfast', 'breakfast')}
      {renderMealSection('Lunch', 'lunch')}
      {renderMealSection('Dinner', 'dinner')}
    </ScrollView>
  );
};

const styles = StyleSheet.create<any>({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartContainer: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
  chart: {
    height: '100%',
  },
  percentageList: {
    width: '100%',
    gap: 16,
  },
  percentageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  percentageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  percentageValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  progressCard: {
    elevation: 4,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.surface,
    margin: 16,
    marginBottom: 24,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  mealsTracked: {
    color: THEME_COLORS.textLight,
    fontSize: 14,
  },
  progressSection: {
    gap: 20,
    paddingVertical: 8,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME_COLORS.text,
  },
  progressValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME_COLORS.text,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginVertical: 6,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  weeklyPlanCard: {
    marginHorizontal: 16,
    marginVertical: 24,
    elevation: 4,
    backgroundColor: THEME_COLORS.surface,
  },
  weeklyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: THEME_COLORS.text,
  },
  weekSelector: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dateButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: THEME_COLORS.background,
    minWidth: 64,
    elevation: 1,
  },
  selectedDayCard: {
    backgroundColor: THEME_COLORS.primary,
    elevation: 4,
  },
  dayText: {
    fontSize: 14,
    color: THEME_COLORS.textLight,
    marginBottom: 4,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  monthText: {
    fontSize: 12,
    color: THEME_COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  selectedText: {
    color: '#fff',
  },
  mealSection: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  mealCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: THEME_COLORS.surface,
  },
  mealCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
  },
  nutritionInfo: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  nutritionItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  nutritionText: {
    fontSize: 16,
    color: THEME_COLORS.text,
    fontWeight: '500',
  },
  removeButton: {
    margin: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default HomeScreen;
