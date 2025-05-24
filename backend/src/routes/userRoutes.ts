import express, { Response, Router } from 'express';
import { User, IUser } from '../models/User';
import { auth } from '../middleware/auth';

interface AuthRequest extends express.Request {
  userId?: string;
}

const router = express.Router();

// Log all user routes on startup
console.log('User routes initialized:', [
  'GET /:id - Get user profile',
  'PATCH /:id - Update user profile',
  'GET /profile - Get user profile',
  'PUT /profile - Update user profile'
]);

// Get current user's profile
router.get('/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Get user profile by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user can only access their own profile
    if (req.userId !== req.params.id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user profile
router.put('/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const updates = req.body;
    delete updates.password; // Don't allow password updates through this route

    // Allow all user profile fields
    const allowedUpdates = [
      'fullName',
      'email',
      'age',
      'gender',
      'weight',
      'height',
      'activityLevel',
      'goal',
      'dietaryPreferences',
      'healthConditions'
    ];

    // Filter out any fields that aren't in allowedUpdates
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating user profile'
    });
  }
});

export const userRouter = router;
