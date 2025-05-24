import express, { Response, Router } from 'express';
import { auth } from '../middleware/auth';
import { Meal } from '../models/Meal';

export interface AuthRequest extends express.Request {
  userId?: string;
}

const router: Router = express.Router();

// Log all meal routes on startup
console.log('Meal routes initialized:', [
  'GET / - Get user meals',
  'POST / - Add meal to user',
  'DELETE /:id - Remove meal from user',
  'PATCH /:id - Update meal type'
]);

// Get all meals for a user
router.get('/', auth, (req: AuthRequest, res: Response) => {
  (async () => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      // Only fetch meals for the current user
      const meals = await Meal.find({ 
        userId: req.userId 
      }).sort({ date: -1 });

      res.json({
        success: true,
        data: {
          meals: meals
        }
      });
    } catch (error) {
      console.error('Error getting meals:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  })();
});

// Add a meal to user's meal plan
router.post('/', auth, (req: AuthRequest, res: Response) => {
  (async () => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { name, calories, protein, carbs, fat, date, mealType } = req.body;

      // Validate required fields
      if (!name || !calories || !protein || !carbs || !fat || !date) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      const meal = new Meal({
        userId: req.userId,
        name,
        calories,
        protein,
        carbs,
        fat,
        date,
        mealType
      });

      await meal.save();

      res.json({
        success: true,
        data: meal
      });
    } catch (error) {
      console.error('Error adding meal:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  })();
});

// Remove a meal from user's meal plan
router.delete('/:id', auth, (req: AuthRequest, res: Response) => {
  (async () => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const mealId = req.params.id;
      const meal = await Meal.findOne({ _id: mealId, userId: req.userId });

      if (!meal) {
        res.status(404).json({ 
          success: false, 
          message: 'Meal not found or not authorized' 
        });
        return;
      }

      await Meal.findByIdAndDelete(mealId);

      res.json({
        success: true,
        message: 'Meal deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting meal:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  })();
});

// Get meals by date
router.get('/by-date', auth, (req: AuthRequest, res: Response) => {
  (async () => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { date } = req.query;
      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
        return;
      }

      const meals = await Meal.find({ 
        userId: req.userId,
        date: date as string 
      }).sort({ createdAt: 1 });

      res.json({
        success: true,
        data: {
          meals: meals
        }
      });
    } catch (error) {
      console.error('Error fetching meals by date:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  })();
});

// Update a meal's type
router.patch('/:id', auth, (req: AuthRequest, res: Response) => {
  (async () => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const mealId = req.params.id;
      const { mealType } = req.body;

      const meal = await Meal.findOne({ _id: mealId, userId: req.userId });

      if (!meal) {
        res.status(404).json({ 
          success: false, 
          message: 'Meal not found or not authorized' 
        });
        return;
      }

      meal.mealType = mealType;
      await meal.save();

      res.json({
        success: true,
        data: meal
      });
    } catch (error) {
      console.error('Error updating meal:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  })();
});

export default router;
