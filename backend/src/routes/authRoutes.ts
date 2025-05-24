import express, { Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';

const router: Router = express.Router();

// Log all auth routes on startup
console.log('Auth routes initialized:', [
  'POST /signup - Register new user',
  'POST /login - User login',
  'GET /status - Check auth status'
]);

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
};

// Test endpoint for getting a token
router.post('/test-token', async (req, res: Response): Promise<void> => {
  try {
    const testUser = { _id: 'test123', email: 'test@example.com' };
    const token = generateToken(testUser._id);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: testUser._id,
          email: testUser.email
        }
      }
    });
  } catch (error) {
    console.error('Error generating test token:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating test token',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Register
router.post('/signup', async (req, res: Response): Promise<void> => {
  console.log('Signup request received:', req.body);
  console.log('Request headers:', req.headers);
  try {
    const { email, password, fullName, name } = req.body;
    console.log('Parsed request body:', { email, fullName, name, hasPassword: !!password });

    if (!email || !password || !fullName) {
      console.log('Missing required fields:', { hasEmail: !!email, hasPassword: !!password, hasFullName: !!fullName });
      res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Create user
    const user = new User({
      email,
      password,
      fullName,
      name: name || fullName, // Use fullName as name if not provided
    });

    console.log('Attempting to save user:', { email: user.email, fullName: user.fullName });
    await user.save();
    console.log('User saved successfully:', { id: user._id, email: user.email });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name || user.fullName,
          fullName: user.fullName,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in /signup:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code // MongoDB error code if present
    });
    
    // Handle specific MongoDB errors
    if (error.code === 11000) { // Duplicate key error
      res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'duplicate_email'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res: Response): Promise<void> => {
  console.log('Login request received:', req.body);
  console.log('Request headers:', req.headers);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Find user
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    console.log('Login successful for user:', email);
    
    const response = {
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name || '',
          fullName: user.fullName || user.name || '',
        },
      },
    };
    
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Check auth status
router.get('/status', async (req, res: Response): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    console.error('Error in auth status:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export const authRouter = router;
