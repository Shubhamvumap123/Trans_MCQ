// src/routes/analyticsRoutes.ts
import express, { Request, Response } from 'express';
import {
  recordUserResponse,
  createAnalyticsSession,
  calculateSessionAnalytics,
  getSessionAnalytics
} from '../services/analyticsService';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateObjectId } from '../middleware/validation';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create new quiz session
router.post('/session/create', asyncHandler(async (req: Request, res: Response) => {
  const { transcriptionId } = req.body;

  if (!transcriptionId || !validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const sessionId = uuidv4();
  await createAnalyticsSession(sessionId, transcriptionId);

  res.status(201).json({
    sessionId,
    message: 'Analytics session created successfully'
  });
}));

// Record user response
router.post('/response/record', asyncHandler(async (req: Request, res: Response) => {
  const {
    transcriptionId,
    questionId,
    selectedAnswerIndex,
    isCorrect,
    timeSpent,
    sessionId
  } = req.body;

  if (!transcriptionId || !validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  if (!questionId || !validateObjectId(questionId)) {
    const error: CustomError = new Error('Invalid question ID');
    error.status = 400;
    throw error;
  }

  if (typeof selectedAnswerIndex !== 'number' || selectedAnswerIndex < 0) {
    const error: CustomError = new Error('Invalid answer index');
    error.status = 400;
    throw error;
  }

  if (typeof isCorrect !== 'boolean') {
    const error: CustomError = new Error('Invalid isCorrect value');
    error.status = 400;
    throw error;
  }

  if (!sessionId || typeof sessionId !== 'string') {
    const error: CustomError = new Error('Invalid session ID');
    error.status = 400;
    throw error;
  }

  await recordUserResponse(
    transcriptionId,
    questionId,
    selectedAnswerIndex,
    isCorrect,
    timeSpent || 0,
    sessionId
  );

  res.status(201).json({
    message: 'Response recorded successfully'
  });
}));

// Get session analytics
router.get('/session/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId || typeof sessionId !== 'string') {
    const error: CustomError = new Error('Invalid session ID');
    error.status = 400;
    throw error;
  }

  const analytics = await getSessionAnalytics(sessionId);

  res.json(analytics);
}));

// Calculate and finalize session analytics
router.post('/session/:sessionId/finalize', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId || typeof sessionId !== 'string') {
    const error: CustomError = new Error('Invalid session ID');
    error.status = 400;
    throw error;
  }

  const analytics = await calculateSessionAnalytics(sessionId);

  res.json({
    message: 'Session analytics finalized',
    data: analytics
  });
}));

export default router;
