import express, { Response } from 'express';
import { Feedback } from '../models/Feedback';
import { auth } from '../middleware/auth';

const router = express.Router();

// Log all feedback routes on startup
console.log('Feedback routes initialized:', [
  'POST / - Submit feedback',
  'GET / - Get user feedback',
  'GET /all - Get all feedback (admin)',
  'PATCH /:id - Update feedback status (admin)'
]);

// Submit feedback
router.post('/', auth, async (req: any, res: Response): Promise<void> => {
  try {
    const { content, type = 'suggestion' } = req.body;
    const userId = req.userId;

    if (!content) {
      res.status(400).json({
        success: false,
        message: 'Feedback content is required'
      });
      return;
    }

    const feedback = new Feedback({
      userId,
      content,
      type
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get user's feedback
router.get('/', auth, async (req: any, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting feedback',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get all feedback (admin only)
router.get('/all', auth, async (req: any, res: Response): Promise<void> => {
  try {
    // TODO: Add admin check here
    const feedback = await Feedback.find()
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error getting all feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting all feedback',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Update feedback status (admin only)
router.patch('/:id', auth, async (req: any, res: Response): Promise<void> => {
  try {
    // TODO: Add admin check here
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!feedback) {
      res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
      return;
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Delete feedback (only if it belongs to the user)
router.delete('/:id', auth, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      res.status(404).json({ message: 'Feedback not found' });
      return;
    }

    // Check if the feedback belongs to the user
    if (feedback.userId.toString() !== req.userId) {
      res.status(403).json({ message: 'Not authorized to delete this feedback' });
      return;
    }

    await Feedback.findByIdAndDelete(id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export const feedbackRouter = router;
