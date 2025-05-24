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
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
exports.default = router;
// Log all user routes on startup
console.log('User routes initialized:', [
    'POST /signup - Create new user',
    'POST /login - User login',
    'GET /:id - Get user profile',
    'PATCH /:id - Update user profile'
]);
// User signup
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Received signup request:', req.body);
    try {
        const { email, password, fullName } = req.body;
        // Check if user already exists
        const existingUser = yield User_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }
        // Create new user
        const user = new User_1.User({
            email,
            password,
            fullName
        });
        yield user.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        // Return user data (excluding password) and token
        const userResponse = yield User_1.User.findById(user._id).select('-password');
        res.status(201).json({
            user: userResponse,
            token
        });
        return;
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user' });
        return;
    }
}));
// User login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Check password
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        // Return user data (excluding password) and token
        const userResponse = yield User_1.User.findById(user._id).select('-password');
        res.json({
            user: userResponse,
            token
        });
        return;
    }
    catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
        return;
    }
}));
// Get user profile
router.get('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure user can only access their own profile
        if (req.userId !== req.params.id) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        const user = yield User_1.User.findById(req.params.id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
}));
// Update user profile
router.patch('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure user can only update their own profile
        if (req.userId !== req.params.id) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        const updates = req.body;
        delete updates.password; // Don't allow password updates through this route
        // Validate update fields
        const allowedUpdates = ['name', 'preferences'];
        const updateFields = Object.keys(updates);
        const isValidOperation = updateFields.every(field => allowedUpdates.includes(field));
        if (!isValidOperation) {
            res.status(400).json({ message: 'Invalid updates' });
            return;
        }
        const user = yield User_1.User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
}));
exports.userRouter = router;
