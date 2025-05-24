import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models and routes
import { User } from './models/User';
import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';
import mealRouter from './routes/mealRoutes';
import { progressRouter } from './routes/progressRoutes';
import { feedbackRouter } from './routes/feedbackRoutes';

dotenv.config();

const app = express();

// Middleware
// Configure CORS
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse JSON bodies
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutritrack');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Verify database connection
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Verify User model is loaded
    const collections = await mongoose.connection.db.collections();
    console.log('Available collections:', collections.map(c => c.collectionName));
    
    // Create indexes for User collection if it doesn't exist
    const userCollection = mongoose.connection.collection('users');
    if (userCollection) {
      await userCollection.createIndex({ email: 1 }, { unique: true });
      console.log('User collection indexes created/verified');
      
      // Check if any users exist
      const userCount = await userCollection.countDocuments();
      console.log(`Number of users in database: ${userCount}`);
      
      if (userCount === 0) {
        console.log('No users found in database. You may need to register a user first.');
      }
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
};

connectDB();

// Test routes
app.get('/test', (req, res) => {
  try {
    res.json({
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    console.error('Test route error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/test/db', async (req, res) => {
  try {
    // Check MongoDB connection status
    const status = mongoose.connection.readyState;
    const statusMap: {[key: number]: string} = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (status !== 1) {
      throw new Error(`Database is ${statusMap[status]}`);
    }

    // Get database information
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const collections = await db.collections();
    const userCount = await db.collection('users').countDocuments();
    const dbName = db.databaseName;

    res.json({
      success: true,
      connection: {
        status: statusMap[status],
        host: mongoose.connection.host,
        database: dbName
      },
      collections: collections.map(c => c.collectionName),
      userCount
    });
  } catch (error: any) {
    console.error('DB test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: {
        mongoState: mongoose.connection.readyState,
        host: mongoose.connection.host
      }
    });
  }
});



// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/meals', mealRouter);
app.use('/api/progress', progressRouter);
app.use('/api/feedback', feedbackRouter);

// Debug route to verify API is working
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Debug middleware to log all routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Available routes:', app._router.stack
    .filter((r: any) => r.route)
    .map((r: any) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`)
  );
  next();
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Ensure err is an object with required properties
  const error = err instanceof Error ? err : new Error(err?.message || 'Unknown error');
  
  res.status(500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const port = 3000;

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Local access: http://localhost:${port}`);
  console.log(`Network access: http://192.168.72.135:${port}`);
  console.log('Available routes:');
  console.log('- POST /api/auth/signup - Register');
  console.log('- POST /api/auth/login - Login');
  console.log('- GET /api/users/profile - Get user profile');
  console.log('- GET /api/meals - Get user meals');
  console.log('- POST /api/meals - Add meal to user');
  console.log('- DELETE /api/meals/:id - Remove meal from user');
  console.log('- GET /api/progress - Get user progress');
  console.log('- POST /api/progress - Create progress entry');
  console.log('- PUT /api/progress/:id - Update progress entry');
});
