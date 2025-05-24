"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meal = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mealSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'Meal name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner'],
        required: [true, 'Meal type is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
    },
    calories: {
        type: Number,
        required: [true, 'Calories are required'],
        min: [0, 'Calories must be a positive number']
    },
    protein: {
        type: Number,
        required: [true, 'Protein content is required'],
        min: [0, 'Protein must be a positive number']
    },
    carbs: {
        type: Number,
        required: [true, 'Carbs content is required'],
        min: [0, 'Carbs must be a positive number']
    },
    fat: {
        type: Number,
        required: [true, 'Fat content is required'],
        min: [0, 'Fat must be a positive number']
    },
    image: String,
    category: String,
    isVegetarian: {
        type: Boolean,
        default: false
    },
    ingredients: [{
            type: String,
            trim: true
        }],
    instructions: [{
            type: String,
            trim: true
        }]
}, {
    timestamps: true
});
// Add compound index for efficient querying
mealSchema.index({ userId: 1, date: 1 });
const MealModel = mongoose_1.default.model('Meal', mealSchema);
exports.Meal = MealModel;
