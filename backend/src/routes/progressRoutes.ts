import express, { Response, Router } from 'express';
import { User, IUser } from '../models/User';
import { auth } from '../middleware/auth';
import mongoose from 'mongoose';

export interface AuthRequest extends express.Request {
  userId?: string;
}

const router: Router = express.Router();

// Log all progress routes on startup
console.log('Progress routes initialized:', [
  'GET / - Get user progress',
  'POST / - Create progress entry',
  'PUT /:id - Update progress entry',
  'DELETE /:id - Delete progress entry'
]);

// Get user progress
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

      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: {
          progress: user.progress || []
        }
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching progress',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  })();
});

// Create progress entry
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

      const { date, weight, measurements, notes } = req.body;

      if (!date) {
        res.status(400).json({ 
          success: false, 
          message: 'Date is required' 
        });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
        return;
      }

      // Initialize progress array if it doesn't exist
      if (!user.progress) {
        user.progress = [];
      }

      // Create new progress entry with ObjectId
      const progressEntry = {
        _id: new mongoose.Types.ObjectId(),
        date,
        weight: weight || null,
        measurements: measurements || {},
        notes: notes || ''
      };

      user.progress.push(progressEntry);
      await user.save();

      res.status(201).json({
        success: true,
        data: {
          progress: progressEntry
        }
      });
    } catch (error) {
      console.error('Error creating progress entry:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating progress entry',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  })();
});

// Update progress entry
router.put('/:id', auth, (req: AuthRequest, res: Response) => {
  (async () => {
    try {
      if (!req.userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { date, weight, measurements, notes } = req.body;
      const entryId = req.params.id;

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
        return;
      }

      // Find the progress entry
      if (!user.progress) {
        res.status(404).json({ 
          success: false, 
          message: 'Progress entry not found' 
        });
        return;
      }

      const entryIndex = user.progress.findIndex(entry => entry._id.toString() === entryId);
      if (entryIndex === -1) {
        res.status(404).json({ 
          success: false, 
          message: 'Progress entry not found' 
        });
        return;
      }

      // Update the entry
      if (date) user.progress[entryIndex].date = date;
      if (weight !== undefined) user.progress[entryIndex].weight = weight;
      if (measurements) user.progress[entryIndex].measurements = measurements;
      if (notes !== undefined) user.progress[entryIndex].notes = notes;

      await user.save();

      res.json({
        success: true,
        data: {
          progress: user.progress[entryIndex]
        }
      });
    } catch (error) {
      console.error('Error updating progress entry:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating progress entry',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  })();
});

export const progressRouter = router;
