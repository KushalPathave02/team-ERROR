import mongoose, { Document, Types, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { NextFunction } from 'express';

export interface IPreference {
  type: string;
  value: any;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  fullName: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  activityLevel?: string;
  preferences: IPreference[];
  meals: any[];
  progress: any[];
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length >= 6,
      message: 'Password must be at least 6 characters'
    }
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'other'],
      message: '{VALUE} is not a valid gender'
    }
  },
  age: {
    type: Number,
    validate: {
      validator: (v: number) => v >= 0,
      message: 'Age must be a positive number'
    }
  },
  weight: {
    type: Number,
    validate: {
      validator: (v: number) => v >= 0,
      message: 'Weight must be a positive number'
    }
  },
  height: {
    type: Number,
    validate: {
      validator: (v: number) => v >= 0,
      message: 'Height must be a positive number'
    }
  },
  goal: {
    type: String
  },
  activityLevel: {
    type: String
  },
  preferences: {
    type: [new Schema({
      type: { type: String, required: true },
      value: { type: mongoose.Schema.Types.Mixed }
    })],
    default: []
  },
  meals: [{ type: mongoose.Schema.Types.Mixed }],
  progress: [{ type: mongoose.Schema.Types.Mixed }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes
userSchema.index({ email: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('Password hashed successfully');
    }
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

// Create and export the User model
const UserModel = mongoose.model<IUser>('User', userSchema);
export { UserModel as User };
