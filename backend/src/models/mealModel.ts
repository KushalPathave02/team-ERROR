import mongoose from 'mongoose';

// Make sure to export the interface
export interface IMeal extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: Date;
  image?: string;
  category?: string;
  isVegetarian?: boolean;
  ingredients?: string[];
  instructions?: string;
}

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  calories: {
    type: Number,
    required: true
  },
  protein: {
    type: Number
  },
  carbs: {
    type: Number
  },
  fat: {
    type: Number
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true,
    default: 'breakfast'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  image: {
    type: String
  },
  category: {
    type: String
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  ingredients: [{
    type: String
  }],
  instructions: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model<IMeal>('Meal', mealSchema);
