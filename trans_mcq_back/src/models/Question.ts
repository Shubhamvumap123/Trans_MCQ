import mongoose, { Document, Schema } from 'mongoose';

export interface IOptionWithExplanation {
  text: string;
  isCorrect: boolean;
  explanation: string; // Why this is correct/incorrect
  misconception?: string; // Common misconception this addresses
}

export interface IQuestion extends Document {
  transcriptionId: mongoose.Types.ObjectId;
  segmentIndex: number;
  segmentText?: string; // Reference to original segment text
  timestamp?: {
    start: number;
    end: number;
  };
  question: string;
  options: IOptionWithExplanation[];
  explanation?: string;
  correctAnswerIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjective: 'recall' | 'application' | 'analysis';
  bloomLevel: string; // Bloom's taxonomy level
  createdAt: Date;
}

const OptionSchema: Schema = new Schema({
  text: { type: String, required: true, maxlength: 500 },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: String, required: true, maxlength: 500 },
  misconception: { type: String, maxlength: 300 }
}, { _id: false });

const QuestionSchema: Schema = new Schema({
  transcriptionId: { type: Schema.Types.ObjectId, ref: 'Transcription', required: true, index: true },
  segmentIndex: { type: Number, required: true, index: true },
  segmentText: { type: String, maxlength: 2000 },
  timestamp: {
    start: Number,
    end: Number
  },
  question: { type: String, required: true, maxlength: 500 },
  options: {
    type: [OptionSchema],
    validate: {
      validator: function(v: IOptionWithExplanation[]) {
        return v.length >= 2 && v.length <= 6 && v.some(opt => opt.isCorrect);
      },
      message: 'Question must have 2-6 options with at least one correct answer'
    }
  },
  explanation: { type: String, maxlength: 1000 },
  correctAnswerIndex: { type: Number, required: true },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true
  },
  learningObjective: {
    type: String,
    enum: ['recall', 'application', 'analysis'],
    default: 'recall',
    index: true
  },
  bloomLevel: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

// Create composite indexes for frequently filtered queries
QuestionSchema.index({ transcriptionId: 1, segmentIndex: 1 });
QuestionSchema.index({ transcriptionId: 1, createdAt: -1 });
QuestionSchema.index({ difficulty: 1, learningObjective: 1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);