// src/models/UserResponse.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserResponse extends Document {
  transcriptionId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  timeSpent: number; // seconds
  timestamp: Date;
  sessionId: string;
}

const UserResponseSchema: Schema = new Schema({
  transcriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcription',
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
  },
  selectedAnswerIndex: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true,
    index: true
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  }
});

// Composite indexes for analytics queries
UserResponseSchema.index({ transcriptionId: 1, sessionId: 1 });
UserResponseSchema.index({ sessionId: 1, timestamp: -1 });

export default mongoose.model<IUserResponse>('UserResponse', UserResponseSchema);
