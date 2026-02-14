// src/routes/questionRoutes.ts
import express, { Request, Response } from 'express';
import Question from '../models/Question';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateObjectId, validateQuestionInput } from '../middleware/validation';

const router = express.Router();

// Get questions by transcription ID (with pagination)
router.get('/transcription/:transcriptionId', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    Question.find({ transcriptionId: req.params.transcriptionId })
      .sort({ segmentIndex: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments({ transcriptionId: req.params.transcriptionId })
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

// Get questions by transcription ID and segment
router.get('/transcription/:transcriptionId/segment/:segmentIndex', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.transcriptionId)) {
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

  const questions = await Question.find({
    transcriptionId: req.params.transcriptionId,
    segmentIndex: segmentIndex
  }).sort({ createdAt: 1 });

  res.json(questions);
}));

// Get question by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid question ID');
    error.status = 400;
    throw error;
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    const error: CustomError = new Error('Question not found');
    error.status = 404;
    throw error;
  }

  res.json(question);
}));

// Create new question
router.post('/', validateQuestionInput, asyncHandler(async (req: Request, res: Response) => {
  const {
    transcriptionId,
    segmentIndex,
    question,
    options,
    explanation,
    difficulty
  } = req.body;

  // Validate MongoDB ObjectId
  if (!validateObjectId(transcriptionId)) {
    const error: CustomError = new Error('Invalid transcription ID');
    error.status = 400;
    throw error;
  }

  // Validate segment index
  if (typeof segmentIndex !== 'number' || segmentIndex < 0) {
    const error: CustomError = new Error('Invalid segment index');
    error.status = 400;
    throw error;
  }

  const newQuestion = new Question({
    transcriptionId,
    segmentIndex,
    question: question.trim(),
    options: options.map((opt: any) => ({
      text: opt.text.trim(),
      isCorrect: opt.isCorrect
    })),
    explanation: explanation ? explanation.trim() : undefined,
    difficulty: difficulty || 'medium'
  });

  const savedQuestion = await newQuestion.save();
  res.status(201).json(savedQuestion);
}));

// Update question
router.put('/:id', validateQuestionInput, asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid question ID');
    error.status = 400;
    throw error;
  }

  const { question, options, explanation, difficulty } = req.body;

  const updatedQuestion = await Question.findByIdAndUpdate(
    req.params.id,
    {
      question: question.trim(),
      options: options.map((opt: any) => ({
        text: opt.text.trim(),
        isCorrect: opt.isCorrect
      })),
      explanation: explanation ? explanation.trim() : undefined,
      difficulty
    },
    { new: true, runValidators: true }
  );

  if (!updatedQuestion) {
    const error: CustomError = new Error('Question not found');
    error.status = 404;
    throw error;
  }

  res.json(updatedQuestion);
}));

// Delete question
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!validateObjectId(req.params.id)) {
    const error: CustomError = new Error('Invalid question ID');
    error.status = 400;
    throw error;
  }

  const result = await Question.findByIdAndDelete(req.params.id);
  if (!result) {
    const error: CustomError = new Error('Question not found');
    error.status = 404;
    throw error;
  }

  res.json({ message: 'Question deleted successfully' });
}));

export default router;    );
    
    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json(updatedQuestion);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
    
    if (!deletedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    return res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Get questions statistics
router.get('/stats/transcription/:transcriptionId', async (req: Request, res: Response) => {
  try {
    const stats = await Question.aggregate([
      { $match: { transcriptionId: req.params.transcriptionId } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          byDifficulty: {
            $push: "$difficulty"
          },
          bySegment: {
            $push: "$segmentIndex"
          }
        }
      }
    ]);

    const difficultyCount = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    const segmentCount: { [key: number]: number } = {};

    if (stats.length > 0) {
      stats[0].byDifficulty.forEach((diff: string) => {
        if (diff in difficultyCount) {
          difficultyCount[diff as keyof typeof difficultyCount]++;
        }
      });

      stats[0].bySegment.forEach((seg: number) => {
        segmentCount[seg] = (segmentCount[seg] || 0) + 1;
      });
    }

    res.json({
      totalQuestions: stats.length > 0 ? stats[0].totalQuestions : 0,
      difficultyBreakdown: difficultyCount,
      segmentBreakdown: segmentCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get question statistics' });
  }
});

export default router;