// src/models/File.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'transcribing' | 'generating' | 'completed' | 'failed';
}

const FileSchema: Schema = new Schema({
  originalName: { type: String, required: true, maxlength: 255 },
  filename: { type: String, required: true, unique: true },
  path: { type: String, required: true },
  size: { type: Number, required: true, index: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'transcribing', 'generating', 'completed', 'failed'],
    default: 'uploaded',
    index: true
  }
});

// Create indexes for commonly queried fields
FileSchema.index({ uploadedAt: -1 });
FileSchema.index({ status: 1, uploadedAt: -1 });
FileSchema.index({ createdAt: -1 });

export default mongoose.model<IFile>('File', FileSchema);

