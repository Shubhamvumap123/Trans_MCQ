// src/routes/transcriptionRoutes.ts
import { Router, Request, Response } from 'express';
import Transcription from '../models/Transcription';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateObjectId } from '../middleware/validation';

const router = Router();

// Get transcription by file ID
router.get('/file/:fileId', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.fileId)) {
    const error: CustomError = new Error('Invalid file ID');
    error.status = 400;
    throw error;
  }

  const transcription = await Transcription.findOne({ fileId: req.params.fileId })
    .populate('fileId');
  
  if (!transcription) {
    const error: CustomError = new Error('Transcription not found');
    error.status = 404;
    throw error;
  }
  
  res.json(transcription);
}));

// Get transcription by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const transcription = await Transcription.findById(req.params.id)
    .populate('fileId');
  
  if (!transcription) {
    const error: CustomError = new Error('Transcription not found');
    error.status = 404;
    throw error;
  }
  
  res.json(transcription);
}));

// Get all transcriptions (with pagination)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const [transcriptions, total] = await Promise.all([
    Transcription.find()
      .populate('fileId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transcription.countDocuments()
  ]);

  res.json({
    data: transcriptions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get transcription segments
router.get('/:id/segments', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const transcription = await Transcription.findById(req.params.id);
  
  if (!transcription) {
    const error: CustomError = new Error('Transcription not found');
    error.status = 404;
    throw error;
  }
  
  res.json({
    transcriptionId: transcription._id,
    segments: transcription.segments,
    totalSegments: transcription.segments.length
  });
}));

// Get specific segment
router.get('/:id/segments/:segmentIndex', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const segmentIndex = parseInt(req.params.segmentIndex);
  if (isNaN(segmentIndex) || segmentIndex < 0) {
    const error: CustomError = new Error('Invalid segment index');
    error.status = 400;
    throw error;
  }

  const transcription = await Transcription.findById(req.params.id);
  
  if (!transcription) {
    const error: CustomError = new Error('Transcription not found');
    error.status = 404;
    throw error;
  }
  
  const segment = transcription.segments.find((s: any) => s.segmentIndex === segmentIndex);
  
  if (!segment) {
    const error: CustomError = new Error('Segment not found');
    error.status = 404;
    throw error;
  }
  
  res.json(segment);
}));

export default router;
