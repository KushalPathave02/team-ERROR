"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Progress = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const progressSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
    },
    totalCalories: {
        type: Number,
        default: 0,
        min: [0, 'Total calories must be a positive number']
    },
    totalProtein: {
        type: Number,
        default: 0,
        min: [0, 'Total protein must be a positive number']
    },
    totalCarbs: {
        type: Number,
        default: 0,
        min: [0, 'Total carbs must be a positive number']
    },
    totalFat: {
        type: Number,
        default: 0,
        min: [0, 'Total fat must be a positive number']
    },
    meals: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Meal'
        }]
}, {
    timestamps: true
});
// Add compound index for efficient querying
progressSchema.index({ userId: 1, date: 1 }, { unique: true });
const ProgressModel = mongoose_1.default.model('Progress', progressSchema);
exports.Progress = ProgressModel;
