import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  type: 'suggestion' | 'question' | 'bug' | 'feature' | 'other';
  status: 'pending' | 'reviewed' | 'implemented' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['suggestion', 'question', 'bug', 'feature', 'other'],
    default: 'suggestion'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'implemented', 'declined'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
