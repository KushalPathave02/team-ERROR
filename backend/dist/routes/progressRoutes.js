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
const Progress_1 = require("../models/Progress");
const router = express_1.default.Router();
// Log all progress routes on startup
console.log('Progress routes initialized:', [
    'GET / - Get user progress',
    'GET /date/:date - Get progress by date',
    'GET /range - Get progress by date range'
]);
// Get all progress entries for the authenticated user
router.get('/', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const progress = yield Progress_1.Progress.find({ userId: req.userId })
            .sort({ date: -1 })
            .populate('meals')
            .exec();
        res.json(progress);
        return;
        return;
    }
    catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Error fetching progress' });
        return;
    }
}));
// Get progress for a specific date
router.get('/date/:date', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const date = new Date(req.params.date);
        date.setHours(0, 0, 0, 0);
        let progress = yield Progress_1.Progress.findOne({
            userId: req.userId,
            date: date
        }).populate('meals');
        if (!progress) {
            // If no progress exists for the date, return empty progress
            progress = new Progress_1.Progress({
                userId: req.userId,
                date: date,
                totalCalories: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalFat: 0,
                meals: []
            });
        }
        res.json(progress);
        return;
    }
    catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Error fetching progress' });
        return;
    }
}));
// Get progress for a date range
router.get('/range', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ message: 'Start date and end date are required' });
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const progress = yield Progress_1.Progress.find({
            userId: req.userId,
            date: {
                $gte: start,
                $lte: end
            }
        }).populate('meals').sort({ date: 1 });
        res.json(progress);
        return;
    }
    catch (error) {
        console.error('Error fetching progress range:', error);
        res.status(500).json({ message: 'Error fetching progress range' });
        return;
    }
}));
exports.default = router;
