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
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const createTestUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        yield mongoose_1.default.connect('mongodb://127.0.0.1:27017/nutritrack');
        console.log('Connected to MongoDB');
        // Check if user already exists
        const existingUser = yield User_1.User.findOne({ email: 'test@example.com' });
        if (existingUser) {
            console.log('Test user already exists');
            process.exit(0);
        }
        // Create test user
        // Delete existing user if exists
        yield User_1.User.deleteOne({ email: 'test@example.com' });
        // Create new user
        const user = new User_1.User({
            email: 'test@example.com',
            password: 'password123', // Will be hashed by the pre-save middleware
            name: 'Test User',
            preferences: ['test']
        });
        yield user.save();
        console.log('Test user created successfully');
        console.log('Login credentials:');
        console.log('Email: test@example.com');
        console.log('Password: password123');
    }
    catch (error) {
        console.error('Error creating test user:', error);
    }
    finally {
        yield mongoose_1.default.disconnect();
        process.exit(0);
    }
});
createTestUser();
