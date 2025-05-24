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
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const router = express_1.default.Router();
// Log all auth routes on startup
console.log('Auth routes initialized:', [
    'POST /signup - Register new user',
    'POST /login - User login',
    'GET /status - Check auth status'
]);
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
};
// Test endpoint for getting a token
router.post('/test-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        console.error('Error generating test token:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating test token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
// Register
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Signup request received:', req.body);
    try {
        const { email, password, fullName, name } = req.body;
        if (!email || !password || !fullName) {
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
        const existingUser = yield User_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email already registered' });
            return;
        }
        // Create user
        const user = new User_1.User({
            email,
            password,
            fullName,
            name: name || fullName, // Use fullName as name if not provided
        });
        yield user.save();
        console.log('User saved successfully:', user._id);
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
    }
    catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        // Check password
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
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
                    id: user._id,
                    email: user.email,
                    name: user.name || '',
                    fullName: user.fullName || user.name || '',
                },
            },
        };
        console.log('Sending response:', response);
        res.json(response);
    }
    catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
// Check auth status
router.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ success: false, message: 'No token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const user = yield User_1.User.findById(decoded.userId).select('-password');
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
    }
    catch (error) {
        console.error('Error in auth status:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));
exports.authRouter = router;
