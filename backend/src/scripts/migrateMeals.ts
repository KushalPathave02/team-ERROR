import mongoose from 'mongoose';
import { User } from '../models/User';
import { Meal } from '../models/Meal';
import dotenv from 'dotenv';

dotenv.config();

const migrateMeals = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database');
    console.log('Connected to MongoDB');

    // Get all users with meals
    const users = await User.find({ meals: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with meals`);

    // Migrate meals for each user
    for (const user of users) {
      if (!user.meals) continue;

      console.log(`Migrating meals for user ${user.email}`);
      
      // Create new meal documents
      const mealPromises = user.meals.map(meal => {
        const newMeal = new Meal({
          userId: user._id,
          name: meal.name,
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
          date: meal.date,
          mealType: meal.mealType || 'snack',
          createdAt: new Date()
        });
        return newMeal.save();
      });

      await Promise.all(mealPromises);
      console.log(`Migrated ${user.meals.length} meals for user ${user.email}`);

      // Clear meals array from user document
      user.meals = [];
      await user.save();
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateMeals();
