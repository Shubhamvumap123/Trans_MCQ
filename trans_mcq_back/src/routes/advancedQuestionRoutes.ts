// src/routes/advancedQuestionRoutes.ts
import express, { Request, Response } from 'express';
import Question from '../models/Question';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateObjectId } from '../middleware/validation';

const router = express.Router();

// Get questions filtered by difficulty
router.get('/transcription/:transcriptionId/difficulty/:difficulty', asyncHandler(async (req: Request, res: Response) => {
  const { transcriptionId, difficulty } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  if (!validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(difficulty.toLowerCase())) {
    const error: CustomError = new Error('Invalid difficulty level. Valid options: easy, medium, hard');
    error.status = 400;
    throw error;
  }

  const [questions, total] = await Promise.all([
    Question.find({
      transcriptionId,
      difficulty: difficulty.toLowerCase()
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments({
      transcriptionId,
      difficulty: difficulty.toLowerCase()
    })
  ]);

  res.json({
    data: questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get questions filtered by learning objective
router.get('/transcription/:transcriptionId/objective/:objective', asyncHandler(async (req: Request, res: Response) => {
  const { transcriptionId, objective } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  if (!validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const validObjectives = ['recall', 'application', 'analysis'];
  if (!validObjectives.includes(objective.toLowerCase())) {
    const error: CustomError = new Error('Invalid learning objective. Valid options: recall, application, analysis');
    error.status = 400;
    throw error;
  }

  const [questions, total] = await Promise.all([
    Question.find({
      transcriptionId,
      learningObjective: objective.toLowerCase()
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments({
      transcriptionId,
      learningObjective: objective.toLowerCase()
    })
  ]);

  res.json({
    data: questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get questions filtered by Bloom's level
router.get('/transcription/:transcriptionId/bloom/:bloomLevel', asyncHandler(async (req: Request, res: Response) => {
  const { transcriptionId, bloomLevel } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  if (!validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const [questions, total] = await Promise.all([
    Question.find({
      transcriptionId,
      bloomLevel: bloomLevel
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments({
      transcriptionId,
      bloomLevel: bloomLevel
    })
  ]);

  res.json({
    data: questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get questions with advanced filtering (combined)
router.get('/transcription/:transcriptionId/advanced', asyncHandler(async (req: Request, res: Response) => {
  const { transcriptionId } = req.params;
  const { difficulty, objective, bloomLevel, page = 1, limit = 20 } = req.query;

  if (!validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const filter: any = { transcriptionId };

  if (difficulty) {
    const diffArray = Array.isArray(difficulty) ? difficulty : [difficulty];
    filter.difficulty = { $in: diffArray };
  }

  if (objective) {
    filter.learningObjective = objective;
  }

  if (bloomLevel) {
    filter.bloomLevel = bloomLevel;
  }

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, parseInt(limit as string) || 20);
  const skip = (pageNum - 1) * limitNum;

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum),
    Question.countDocuments(filter)
  ]);

  res.json({
    data: questions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    },
    filters: {
      difficulty,
      objective,
      bloomLevel
    }
  });
}));

// Get statistics for transcription
router.get('/transcription/:transcriptionId/statistics', asyncHandler(async (req: Request, res: Response) => {
  const { transcriptionId } = req.params;

  if (!validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const stats = await Question.aggregate([
    {
      $match: { transcriptionId: require('mongoose').Types.ObjectId(transcriptionId) }
    },
    {
      $facet: {
        byDifficulty: [
          {
            $group: {
              _id: '$difficulty',
              count: { $sum: 1 }
            }
          }
        ],
        byObjective: [
          {
            $group: {
              _id: '$learningObjective',
              count: { $sum: 1 }
            }
          }
        ],
        byBloomLevel: [
          {
            $group: {
              _id: '$bloomLevel',
              count: { $sum: 1 }
            }
          }
        ],
        total: [
          {
            $count: 'count'
          }
        ]
      }
    }
  ]);

  if (stats.length === 0) {
    const error: CustomError = new Error('No questions found for this transcription');
    error.status = 404;
    throw error;
  }

  res.json({
    transcriptionId,
    statistics: {
      totalQuestions: stats[0].total[0]?.count || 0,
      byDifficulty: stats[0].byDifficulty,
      byLearningObjective: stats[0].byObjective,
      byBloomLevel: stats[0].byBloomLevel
    }
  });
}));

export default router;
