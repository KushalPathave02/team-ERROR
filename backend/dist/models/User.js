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
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    name: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    age: {
        type: Number,
        min: [0, 'Age must be a positive number'],
    },
    weight: {
        type: Number,
        min: [0, 'Weight must be a positive number'],
    },
    height: {
        type: Number,
        min: [0, 'Height must be a positive number'],
    },
    goal: String,
    activityLevel: String,
    preferences: [{
            type: String,
        }],
}, {
    timestamps: true,
});
// Add indexes
userSchema.index({ email: 1 }, { unique: true });
// Hash password before saving
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isModified('password')) {
                const salt = yield bcryptjs_1.default.genSalt(10);
                this.password = yield bcryptjs_1.default.hash(this.password, salt);
                console.log('Password hashed successfully');
            }
            next();
        }
        catch (error) {
            console.error('Error hashing password:', error);
            next(error instanceof Error ? error : new Error(String(error)));
        }
    });
});
// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isMatch = yield bcryptjs_1.default.compare(candidatePassword, this.password);
            return isMatch;
        }
        catch (error) {
            console.error('Error comparing password:', error);
            return false;
        }
    });
};
// Create and export the User model
const UserModel = mongoose_1.default.model('User', userSchema);
exports.User = UserModel;
