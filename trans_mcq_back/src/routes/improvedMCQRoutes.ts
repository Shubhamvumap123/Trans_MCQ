// src/routes/improvedMCQRoutes.ts
/**
 * Improved MCQ Generation Routes
 * Endpoints for generating realistic, high-quality MCQs using LLMs
 * Supports multiple difficulty levels and learning objectives
 */

import express, { Router, Request, Response } from 'express';
import { 
  createQuestioner, 
  generateAndSaveImprovedMCQs,
  ImprovedMCQConfig,
  KeyConcept
} from '../services/improveMCQGenerationService';
import Question from '../models/Question';
import Transcription from '../models/Transcription';
import File from '../models/File';

const router = Router();

/**
 * POST /api/questions/improved/generate
 * Generate improved MCQs for a transcription
 * 
 * Body: {
 *   transcriptionId: string,
 *   language: string,
 *   difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
 *   questionCount: number (optional, default: 5 per segment),
 *   focusAreas: string[] (optional),
 *   enableMisconceptions: boolean (optional, default: true),
 *   llmProvider: 'openai' | 'mistral' | 'ollama' (optional)
 * }
 */
router.post('/improved/generate', async (req: Request, res: Response) => {
  try {
    const {
      transcriptionId,
      language = 'en',
      difficulty = 'mixed',
      questionCount = 5,
      focusAreas = [],
      enableMisconceptions = true,
      llmProvider
    } = req.body;

    // Verify transcription exists
    const transcription = await Transcription.findById(transcriptionId);
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    // Prepare configuration
    const config: ImprovedMCQConfig = {
      language,
      difficulty: difficulty === 'mixed' ? undefined : difficulty,
      questionCount,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
      enableMisconceptions
    };

    // Override LLM provider if specified
    if (llmProvider) {
      process.env.LLM_PROVIDER = llmProvider;
    }

    // Create questioner
    const questioner = createQuestioner(config);

    // Extract concepts from each segment
    const conceptsBySegment: Record<number, KeyConcept[]> = {};
    
    for (const segment of transcription.segments) {
      const concepts = await questioner.extractConcepts(segment.text, language);
      conceptsBySegment[segment.segmentIndex] = concepts;
    }

    // Generate MCQs
    await generateAndSaveImprovedMCQs(
      transcriptionId,
      transcription.segments.map(s => ({
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.text,
        segmentIndex: s.segmentIndex
      })),
      config
    );

    // Fetch generated questions
    const generatedQuestions = await Question.find({ 
      transcriptionId,
      bloomLevel: { $exists: true }
    }).limit(questionCount * transcription.segments.length);

    res.status(201).json({
      success: true,
      message: 'Improved MCQs generated successfully',
      transcriptionId,
      generatedCount: generatedQuestions.length,
      config: {
        language,
        difficulty,
        questionCount,
        llmProvider: process.env.LLM_PROVIDER || 'openai',
        misconceptionsEnabled: enableMisconceptions
      },
      conceptsExtracted: Object.keys(conceptsBySegment).reduce((sum, key) => 
        sum + conceptsBySegment[parseInt(key)].length, 0
      ),
      qualityMetrics: {
        avgQuestionsPerSegment: (generatedQuestions.length / transcription.segments.length).toFixed(2),
        diverseBloomLevels: [...new Set(generatedQuestions.map(q => q.bloomLevel))].length,
        includesMisconceptions: generatedQuestions.filter(q => 
          q.options.some(opt => opt.misconception)
        ).length
      }
    });
  } catch (error) {
    console.error('Error generating improved MCQs:', error);
    res.status(500).json({ 
      error: 'Failed to generate MCQs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/questions/improved/transcription/:transcriptionId
 * Get all improved MCQs for a transcription with enhanced metadata
 * Supports filtering by difficulty, learning objective, Bloom's level
 */
router.get('/improved/transcription/:transcriptionId', async (req: Request, res: Response) => {
  try {
    const {
      difficulty,
      bloomLevel,
      objective,
      conceptFilter,
      page = 1,
      limit = 10
    } = req.query;

    const transcription = await Transcription.findById(req.params.transcriptionId);
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    // Build filter
    const filter: any = { transcriptionId: req.params.transcriptionId };
    
    if (difficulty) filter.difficulty = difficulty;
    if (bloomLevel) filter.bloomLevel = bloomLevel;
    if (objective) filter.learningObjective = objective;

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * pageSize;

    // Fetch questions
    const questions = await Question.find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort({ segmentIndex: 1 });

    const total = await Question.countDocuments(filter);

    // Group by difficulty and Bloom's level for statistics
    const allQuestions = await Question.find({ 
      transcriptionId: req.params.transcriptionId 
    });

    const stats = {
      byDifficulty: {
        easy: allQuestions.filter(q => q.difficulty === 'easy').length,
        medium: allQuestions.filter(q => q.difficulty === 'medium').length,
        hard: allQuestions.filter(q => q.difficulty === 'hard').length
      },
      byBloomLevel: {},
      byObjective: {
        recall: allQuestions.filter(q => q.learningObjective === 'recall').length,
        application: allQuestions.filter(q => q.learningObjective === 'application').length,
        analysis: allQuestions.filter(q => q.learningObjective === 'analysis').length
      },
      withMisconceptions: allQuestions.filter(q => 
        q.options.some(opt => opt.misconception)
      ).length,
      withRealLifeExamples: allQuestions.filter(q => 
        q.explanation && q.explanation.includes('example') || q.explanation.includes('instance')
      ).length
    };

    // Count by Bloom's level
    const bloomLevels = [...new Set(allQuestions.map(q => q.bloomLevel))];
    bloomLevels.forEach(level => {
      stats.byBloomLevel[level as any] = allQuestions.filter(q => q.bloomLevel === level).length;
    });

    res.json({
      success: true,
      transcriptionId: req.params.transcriptionId,
      currentPage: pageNum,
      pageSize,
      totalQuestions: total,
      totalPages: Math.ceil(total / pageSize),
      questions: questions.map(q => ({
        id: q._id,
        question: q.question,
        options: q.options.map(opt => ({
          text: opt.text,
          explanation: opt.explanation,
          misconception: opt.misconception,
          isCorrect: opt.isCorrect
        })),
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        learningObjective: q.learningObjective,
        concepts: q.explanation ? extractConcepts(q.explanation) : [],
        timestamp: q.timestamp,
        segmentIndex: q.segmentIndex
      })),
      statistics: stats,
      filters: {
        difficulty: difficulty || 'all',
        bloomLevel: bloomLevel || 'all',
        objective: objective || 'all'
      }
    });
  } catch (error) {
    console.error('Error fetching improved MCQs:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * GET /api/questions/improved/concepts/:transcriptionId
 * Extract and list all key concepts from a transcription
 */
router.get('/improved/concepts/:transcriptionId', async (req: Request, res: Response) => {
  try {
    const transcription = await Transcription.findById(req.params.transcriptionId);
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    // Extract concepts from all segments
    const questioner = createQuestioner({ language: transcription.language || 'en' });
    const conceptMap = new Map<string, any>();

    for (const segment of transcription.segments) {
      const concepts = await questioner.extractConcepts(segment.text, transcription.language || 'en');
      concepts.forEach(concept => {
        if (!conceptMap.has(concept.term)) {
          conceptMap.set(concept.term, concept);
        }
      });
    }

    const concepts = Array.from(conceptMap.values());

    // Group by difficulty
    const groupedByDifficulty = {
      easy: concepts.filter(c => c.difficulty === 'easy'),
      medium: concepts.filter(c => c.difficulty === 'medium'),
      hard: concepts.filter(c => c.difficulty === 'hard')
    };

    res.json({
      success: true,
      transcriptionId: req.params.transcriptionId,
      totalConcepts: concepts.length,
      byDifficulty: {
        easy: groupedByDifficulty.easy.length,
        medium: groupedByDifficulty.medium.length,
        hard: groupedByDifficulty.hard.length
      },
      concepts: concepts.map(c => ({
        term: c.term,
        definition: c.definition,
        difficulty: c.difficulty,
        relatedConcepts: c.relatedConcepts,
        contextSegment: c.context.substring(0, 100) + '...'
      }))
    });
  } catch (error) {
    console.error('Error extracting concepts:', error);
    res.status(500).json({ error: 'Failed to extract concepts' });
  }
});

/**
 * GET /api/questions/improved/quality-metrics/:transcriptionId
 * Get quality metrics and recommendations for MCQs
 */
router.get('/improved/quality-metrics/:transcriptionId', async (req: Request, res: Response) => {
  try {
    const questions = await Question.find({ 
      transcriptionId: req.params.transcriptionId 
    });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this transcription' });
    }

    const metrics = {
      totalQuestions: questions.length,
      coverage: {
        bloomLevels: [...new Set(questions.map(q => q.bloomLevel))].length,
        uniqueBloomLevels: [...new Set(questions.map(q => q.bloomLevel))],
        difficulties: {
          easy: questions.filter(q => q.difficulty === 'easy').length,
          medium: questions.filter(q => q.difficulty === 'medium').length,
          hard: questions.filter(q => q.difficulty === 'hard').length
        },
        objectives: {
          recall: questions.filter(q => q.learningObjective === 'recall').length,
          application: questions.filter(q => q.learningObjective === 'application').length,
          analysis: questions.filter(q => q.learningObjective === 'analysis').length
        }
      },
      quality: {
        withExplanations: questions.filter(q => q.explanation).length,
        withMisconceptions: questions.filter(q => 
          q.options.some(opt => opt.misconception)
        ).length,
        optionsPerQuestion: {
          min: Math.min(...questions.map(q => q.options.length)),
          max: Math.max(...questions.map(q => q.options.length)),
          average: (questions.reduce((sum, q) => sum + q.options.length, 0) / questions.length).toFixed(2)
        }
      },
      recommendations: generateRecommendations(questions),
      overallQualityScore: calculateQualityScore(questions)
    };

    res.json({
      success: true,
      transcriptionId: req.params.transcriptionId,
      metrics
    });
  } catch (error) {
    console.error('Error calculating quality metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

/**
 * Helper function to extract concepts from text
 */
function extractConcepts(text: string): string[] {
  // Simple concept extraction based on common patterns
  const concepts: string[] = [];
  const patterns = [
    /(?:theory|concept|principle|method|process|algorithm|technique|approach)\s+(?:of|called|named|known as|referred to as)\s+([A-Z][a-z\w\s]+)/gi,
    /(?:the\s+)?([A-Z][a-z\w\s]+)\s+(?:is|are|refers to|means|denotes)/gi
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        concepts.push(match[1].trim());
      }
    }
  });

  return [...new Set(concepts)].slice(0, 5);
}

/**
 * Helper function to generate recommendations
 */
function generateRecommendations(questions: any[]): string[] {
  const recommendations: string[] = [];

  const bloomLevels = new Set(questions.map(q => q.bloomLevel));
  if (bloomLevels.size < 4) {
    recommendations.push('Consider adding more questions covering different Bloom\'s levels to improve comprehensive assessment');
  }

  const hardQuestions = questions.filter(q => q.difficulty === 'hard').length;
  if (hardQuestions < questions.length * 0.2) {
    recommendations.push('Add more challenging questions to enhance critical thinking assessment');
  }

  const withMisconceptions = questions.filter(q => q.options.some(opt => opt.misconception)).length;
  if (withMisconceptions < questions.length * 0.7) {
    recommendations.push('Incorporate more misconception-based distractors for better learning assessment');
  }

  if (recommendations.length === 0) {
    recommendations.push('Question set is well-balanced and comprehensive!');
  }

  return recommendations;
}

/**
 * Helper function to calculate overall quality score
 */
function calculateQualityScore(questions: any[]): { score: number; level: string } {
  let score = 0;
  let maxScore = 0;

  // Scoring criteria
  // 1. Has explanations (25 points)
  score += questions.filter(q => q.explanation).length * 25 / questions.length;
  maxScore += 25;

  // 2. Has misconceptions (25 points)
  score += questions.filter(q => q.options.some(opt => opt.misconception)).length * 25 / questions.length;
  maxScore += 25;

  // 3. Diverse difficulty levels (25 points)
  const difficulties = new Set(questions.map(q => q.difficulty)).size;
  score += (difficulties / 3) * 25;
  maxScore += 25;

  // 4. Diverse Bloom's levels (25 points)
  const bloomLevels = new Set(questions.map(q => q.bloomLevel)).size;
  score += (bloomLevels / 6) * 25;
  maxScore += 25;

  const finalScore = Math.round((score / maxScore) * 100);
  const level = finalScore >= 85 ? 'Excellent' : finalScore >= 70 ? 'Good' : finalScore >= 50 ? 'Fair' : 'Needs Improvement';

  return { score: finalScore, level };
}

export default router;
