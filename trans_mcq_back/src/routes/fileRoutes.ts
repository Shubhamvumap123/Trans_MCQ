// src/routes/fileRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import File from '../models/File';
import { transcribeAudioFile } from '../services/transcriptionService';
import { IFile } from '../models/File';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateObjectId } from '../middleware/validation';

const router = express.Router();

// Improved Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate cryptographically secure filename
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    // Whitelist safe extensions
    const safeExts = ['.mp4', '.mp3', '.wav', '.mov', '.avi', '.webm', '.m4a'];
    
    if (!safeExts.includes(ext)) {
      cb(new Error('Invalid file extension') as any);
      return;
    }
    
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio and video files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Upload file endpoint
router.post('/upload', upload.single('video'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    const error: CustomError = new Error('No file uploaded');
    error.status = 400;
    throw error;
  }

  // Save file info to database
  const fileDoc = new File({
    originalName: req.file.originalname.substring(0, 255), // Limit filename
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimeType: req.file.mimetype,
    status: 'uploaded'
  });

  const savedFile = await fileDoc.save() as IFile;

  // Start transcription process in background (fire and forget with error handling)
  const fileId: string = typeof (savedFile._id as any) === 'string' 
    ? (savedFile._id as any) 
    : (savedFile._id as any).toString();
    
  transcribeAudioFile(fileId).catch(error => {
    console.error(`Transcription error for file ${fileId}:`, error.message);
    // Update file status to failed
    File.findByIdAndUpdate(fileId, { status: 'failed' }).catch(err =>
      console.error('Failed to update file status:', err.message)
    );
  });

  res.status(201).json({
    message: 'File uploaded successfully',
    file: {
      id: savedFile._id,
      originalName: savedFile.originalName,
      size: savedFile.size,
      mimeType: savedFile.mimeType,
      status: savedFile.status,
      uploadedAt: savedFile.uploadedAt
    }
  });
}));

// Get file by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid file ID');
    error.status = 400;
    throw error;
  }

  const file = await File.findById(req.params.id);
  if (!file) {
    const error: CustomError = new Error('File not found');
    error.status = 404;
    throw error;
  }

  res.json(file);
}));

// Get all files (with pagination)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const [files, total] = await Promise.all([
    File.find().sort({ uploadedAt: -1 }).skip(skip).limit(limit),
    File.countDocuments()
  ]);

  res.json({
    data: files,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Update file status
router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid file ID');
    error.status = 400;
    throw error;
  }

  const { status } = req.body;
  const validStatuses = ['uploaded', 'processing', 'transcribing', 'generating', 'completed', 'failed'];
  
  if (!validStatuses.includes(status)) {
    const error: CustomError = new Error('Invalid status');
    error.status = 400;
    throw error;
  }

  const file = await File.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!file) {
    const error: CustomError = new Error('File not found');
    error.status = 404;
    throw error;
  }

  res.json(file);
}));

// Delete file
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid file ID');
    error.status = 400;
    throw error;
  }

  const file = await File.findById(req.params.id);
  if (!file) {
    const error: CustomError = new Error('File not found');
    error.status = 404;
    throw error;
  }

  // Delete physical file if exists
  if (fs.existsSync(file.path)) {
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting file:', err.message);
    });
  }

  // Delete from database
  await File.findByIdAndDelete(req.params.id);

  res.json({ message: 'File deleted successfully' });
}));

export default router;