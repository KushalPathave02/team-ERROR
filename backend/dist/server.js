"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const userRoutes_1 = require("./routes/userRoutes");
const authRoutes_1 = require("./routes/authRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
// Configure CORS
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));
app.use(express_1.default.json());
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
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        console.log('Attempting to connect to MongoDB...');
        const conn = yield mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Verify database connection
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database connection not established');
        }
        // Verify User model is loaded
        const collections = yield mongoose_1.default.connection.db.collections();
        console.log('Available collections:', collections.map(c => c.collectionName));
        // Create indexes for User collection if it doesn't exist
        const userCollection = mongoose_1.default.connection.collection('users');
        if (userCollection) {
            yield userCollection.createIndex({ email: 1 }, { unique: true });
            console.log('User collection indexes created/verified');
            // Check if any users exist
            const userCount = yield userCollection.countDocuments();
            console.log(`Number of users in database: ${userCount}`);
            if (userCount === 0) {
                console.log('No users found in database. You may need to register a user first.');
            }
        }
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        console.error('Error details:', error instanceof Error ? error.stack : error);
        process.exit(1);
    }
});
connectDB();
// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});
// Routes
app.use('/api/auth', authRoutes_1.authRouter);
app.use('/api/users', userRoutes_1.userRouter);
// Debug route to verify API is working
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});
// Debug middleware to log all routes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Available routes:', app._router.stack
        .filter((r) => r.route)
        .map((r) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`));
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
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`For local network access: http://192.168.214.135:${PORT}`);
    console.log('Available routes:');
    console.log('- POST /api/auth/signup - Register');
    console.log('- POST /api/auth/login - Login');
    console.log('- GET /api/users/profile - Get user profile');
});
