import mongoose, { Document, Schema } from 'mongoose';

export interface IMeal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  mealType?: string;
  createdAt: Date;
}

const mealSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  calories: {
    type: Number,
    required: true,
    min: [0, 'Calories cannot be negative']
  },
  protein: {
    type: Number,
    required: true,
    min: [0, 'Protein cannot be negative']
  },
  carbs: {
    type: Number,
    required: true,
    min: [0, 'Carbs cannot be negative']
  },
  fat: {
    type: Number,
    required: true,
    min: [0, 'Fat cannot be negative']
  },
  date: {
    type: String,
    required: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
mealSchema.index({ userId: 1, date: 1 });

const MealModel = mongoose.model<IMeal>('Meal', mealSchema);
export { MealModel as Meal };
