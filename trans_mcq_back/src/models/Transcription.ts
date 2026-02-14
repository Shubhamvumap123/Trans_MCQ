import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscriptionSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string; // Speaker label (e.g., "Speaker 1", "Instructor")
  normalizedText?: string; // Normalized with proper punctuation
  segmentIndex: number;
  confidence?: number; // Confidence score from transcription service (0-1)
}

export interface ITranscription extends Document {
  fileId: mongoose.Types.ObjectId;
  fullTranscript: string;
  normalizedTranscript?: string; // Full text with proper punctuation and speaker labels
  segments: ITranscriptionSegment[];
  duration: number;
  language?: string;
  hasMultipleSpeakers: boolean;
  createdAt: Date;
  status: 'processing' | 'completed' | 'failed';
  transcriptionProvider?: 'google' | 'azure' | 'assemblyai' | 'ollama' | 'webspeech'; // Which service was used
  averageConfidence?: number; // Average confidence across all segments
}

const TranscriptionSegmentSchema: Schema = new Schema({
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  text: { type: String, required: true },
  speaker: { type: String },
  normalizedText: { type: String },
  segmentIndex: { type: Number, required: true, index: true },
  confidence: { type: Number, min: 0, max: 1 }
}, { _id: false });

const TranscriptionSchema: Schema = new Schema({
  fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true, unique: true },
  fullTranscript: { type: String, required: true },
  normalizedTranscript: { type: String },
  segments: [TranscriptionSegmentSchema],
  duration: { type: Number, required: true },
  language: { type: String, default: 'en', index: true },
  hasMultipleSpeakers: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true
  },
  transcriptionProvider: {
    type: String,
    enum: ['google', 'azure', 'assemblyai', 'ollama', 'webspeech'],
    default: 'google'
  },
  averageConfidence: { type: Number, min: 0, max: 1 }
});

// Create composite indexes for frequently filtered queries
TranscriptionSchema.index({ fileId: 1, status: 1 });
TranscriptionSchema.index({ createdAt: -1 });

export default mongoose.model<ITranscription>('Transcription', TranscriptionSchema);
