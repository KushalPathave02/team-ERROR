import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/nutritrack');
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }

    // Create test user
    // Delete existing user if exists
    await User.deleteOne({ email: 'test@example.com' });

    // Create new user
    const user = new User({
      email: 'test@example.com',
      password: 'password123', // Will be hashed by the pre-save middleware
      name: 'Test User',
      preferences: ['test']
    });


    await user.save();
    console.log('Test user created successfully');
    console.log('Login credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createTestUser();
