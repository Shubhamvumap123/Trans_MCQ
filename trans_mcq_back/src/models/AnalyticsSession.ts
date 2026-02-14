// src/models/AnalyticsSession.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsSession extends Document {
  sessionId: string;
  transcriptionId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  correctAnswers: number;
  skippedQuestions: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
  difficultyStats: {
    easy: { attempted: number; correct: number };
    medium: { attempted: number; correct: number };
    hard: { attempted: number; correct: number };
  };
  bloomLevelStats: {
    [key: string]: { attempted: number; correct: number };
  };
}

const AnalyticsSessionSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transcriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcription',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: Date,
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  skippedQuestions: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  averageTimePerQuestion: { type: Number, default: 0 },
  difficultyStats: {
    easy: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 } },
    medium: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 } },
    hard: { attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 } }
  },
  bloomLevelStats: { type: Map, of: { attempted: Number, correct: Number }, default: new Map() }
});

export default mongoose.model<IAnalyticsSession>('AnalyticsSession', AnalyticsSessionSchema);
