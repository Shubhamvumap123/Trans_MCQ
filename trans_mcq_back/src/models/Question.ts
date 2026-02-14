import mongoose, { Document, Schema } from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  transcriptionId: mongoose.Types.ObjectId;
  segmentIndex: number;
  question: string;
  options: IOption[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

const OptionSchema: Schema = new Schema({
  text: { type: String, required: true, maxlength: 500 },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

const QuestionSchema: Schema = new Schema({
  transcriptionId: { type: Schema.Types.ObjectId, ref: 'Transcription', required: true, index: true },
  segmentIndex: { type: Number, required: true, index: true },
  question: { type: String, required: true, maxlength: 500 },
  options: {
    type: [OptionSchema],
    validate: {
      validator: function(v: IOption[]) {
        return v.length >= 2 && v.length <= 6 && v.some(opt => opt.isCorrect);
      },
      message: 'Question must have 2-6 options with at least one correct answer'
    }
  },
  explanation: { type: String, maxlength: 1000 },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true
  },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Create composite indexes for frequently filtered queries
QuestionSchema.index({ transcriptionId: 1, segmentIndex: 1 });
QuestionSchema.index({ transcriptionId: 1, createdAt: -1 });
QuestionSchema.index({ difficulty: 1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);