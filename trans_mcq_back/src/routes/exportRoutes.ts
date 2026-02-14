// src/routes/exportRoutes.ts
import express, { Request, Response } from 'express';
import {
  exportQuestionsToCsv,
  exportSessionToPdf,
  exportSessionToCsv
} from '../services/exportService';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateObjectId } from '../middleware/validation';

const router = express.Router();

// Export questions to CSV
router.get('/questions/:transcriptionId/csv', asyncHandler(async (req: Request, res: Response) => {
  const { transcriptionId } = req.params;

  if (!validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const csv = await exportQuestionsToCsv(transcriptionId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="questions-${transcriptionId}.csv"`);
  res.send(csv);
}));

// Export session results to PDF
router.get('/session/:sessionId/pdf', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId || typeof sessionId !== 'string') {
    const error: CustomError = new Error('Invalid session ID');
    error.status = 400;
    throw error;
  }

  const pdfBuffer = await exportSessionToPdf(sessionId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.pdf"`);
  res.send(pdfBuffer);
}));

// Export session results to CSV
router.get('/session/:sessionId/csv', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId || typeof sessionId !== 'string') {
    const error: CustomError = new Error('Invalid session ID');
    error.status = 400;
    throw error;
  }

  const csv = await exportSessionToCsv(sessionId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.csv"`);
  res.send(csv);
}));

export default router;
