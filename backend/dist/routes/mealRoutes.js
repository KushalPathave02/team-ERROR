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
const auth_1 = require("../middleware/auth");
const Meal_1 = require("../models/Meal");
const Progress_1 = require("../models/Progress");
const router = express_1.default.Router();
// Log all meal routes on startup
console.log('Meal routes initialized:', [
    'GET / - Get user meals',
    'POST / - Create meal',
    'GET /:id - Get meal by id',
    'PUT /:id - Update meal',
    'DELETE /:id - Delete meal'
]);
// Get all meals for the authenticated user
router.get('/', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meals = yield Meal_1.Meal.find({ userId: req.userId })
            .sort({ date: -1 })
            .exec();
        res.json(meals);
        return;
    }
    catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ message: 'Error fetching meals' });
        return;
    }
}));
// Create a new meal for the authenticated user
router.post('/', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mealData = Object.assign(Object.assign({}, req.body), { userId: req.userId });
        const meal = new Meal_1.Meal(mealData);
        yield meal.save();
        // Update or create progress for the day
        const mealDate = new Date(meal.date);
        mealDate.setHours(0, 0, 0, 0);
        yield Progress_1.Progress.findOneAndUpdate({
            userId: req.userId,
            date: mealDate
        }, {
            $inc: {
                totalCalories: meal.calories,
                totalProtein: meal.protein,
                totalCarbs: meal.carbs,
                totalFat: meal.fat
            },
            $push: { meals: meal._id }
        }, {
            upsert: true,
            new: true
        });
        res.status(201).json(meal);
        return;
    }
    catch (error) {
        console.error('Error creating meal:', error);
        res.status(500).json({ message: 'Error creating meal' });
        return;
    }
}));
// Get a specific meal (only if it belongs to the authenticated user)
router.get('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meal = yield Meal_1.Meal.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        if (!meal) {
            res.status(404).json({ message: 'Meal not found' });
            return;
        }
        res.json(meal);
        return;
    }
    catch (error) {
        console.error('Error fetching meal:', error);
        res.status(500).json({ message: 'Error fetching meal' });
        return;
    }
}));
// Update a meal (only if it belongs to the authenticated user)
router.put('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meal = yield Meal_1.Meal.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        if (!meal) {
            res.status(404).json({ message: 'Meal not found' });
            return;
        }
        // Get the old values for progress update
        const oldCalories = meal.calories;
        const oldProtein = meal.protein;
        const oldCarbs = meal.carbs;
        const oldFat = meal.fat;
        // Update the meal
        Object.assign(meal, req.body);
        yield meal.save();
        // Update progress for the day
        const mealDate = new Date(meal.date);
        mealDate.setHours(0, 0, 0, 0);
        yield Progress_1.Progress.findOneAndUpdate({
            userId: req.userId,
            date: mealDate
        }, {
            $inc: {
                totalCalories: meal.calories - oldCalories,
                totalProtein: meal.protein - oldProtein,
                totalCarbs: meal.carbs - oldCarbs,
                totalFat: meal.fat - oldFat
            }
        });
        res.json(meal);
    }
    catch (error) {
        console.error('Error updating meal:', error);
        res.status(500).json({ message: 'Error updating meal' });
        return;
    }
}));
// Delete a meal (only if it belongs to the authenticated user)
router.delete('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meal = yield Meal_1.Meal.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        if (!meal) {
            res.status(404).json({ message: 'Meal not found' });
            return;
        }
        // Update progress for the day
        const mealDate = new Date(meal.date);
        mealDate.setHours(0, 0, 0, 0);
        yield Progress_1.Progress.findOneAndUpdate({
            userId: req.userId,
            date: mealDate
        }, {
            $inc: {
                totalCalories: -meal.calories,
                totalProtein: -meal.protein,
                totalCarbs: -meal.carbs,
                totalFat: -meal.fat
            },
            $pull: { meals: meal._id }
        });
        yield meal.deleteOne();
        res.json({ message: 'Meal deleted successfully' });
        return;
    }
    catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ message: 'Error deleting meal' });
        return;
    }
}));
exports.default = router;
