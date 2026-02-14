// src/services/analyticsService.ts
import UserResponse from '../models/UserResponse';
import AnalyticsSession from '../models/AnalyticsSession';
import Question from '../models/Question';

export interface SessionAnalytics {
  sessionId: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  skippedQuestions: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
  difficultyBreakdown: Record<string, { attempted: number; correct: number; percentage: number }>;
  bloomLevelBreakdown: Record<string, { attempted: number; correct: number; percentage: number }>;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Record user response
 */
export async function recordUserResponse(
  transcriptionId: string,
  questionId: string,
  selectedAnswerIndex: number,
  isCorrect: boolean,
  timeSpent: number,
  sessionId: string
): Promise<void> {
  try {
    const userResponse = new UserResponse({
      transcriptionId,
      questionId,
      selectedAnswerIndex,
      isCorrect,
      timeSpent,
      sessionId
    });
    await userResponse.save();
  } catch (error) {
    console.error('Error recording user response:', error);
    throw error;
  }
}

/**
 * Create new analytics session
 */
export async function createAnalyticsSession(
  sessionId: string,
  transcriptionId: string
): Promise<void> {
  try {
    const session = new AnalyticsSession({
      sessionId,
      transcriptionId,
      startTime: new Date()
    });
    await session.save();
  } catch (error) {
    console.error('Error creating analytics session:', error);
    throw error;
  }
}

/**
 * Calculate session analytics and update database
 */
export async function calculateSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
  try {
    // Get all responses for this session
    const responses = await UserResponse.find({ sessionId }).populate('questionId');
    
    if (responses.length === 0) {
      throw new Error('No responses found for this session');
    }

    // Get the first response to find transcriptionId
    const transcriptionId = responses[0].transcriptionId;
    
    // Calculate basic stats
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const totalQuestions = responses.length;
    const skippedQuestions = 0;
    const totalTimeSpent = responses.reduce((sum, r) => sum + r.timeSpent, 0);
    const averageTimePerQuestion = totalTimeSpent / totalQuestions;
    
    // Calculate difficulty breakdown
    const difficultyBreakdown: Record<string, { attempted: number; correct: number; percentage: number }> = {
      easy: { attempted: 0, correct: 0, percentage: 0 },
      medium: { attempted: 0, correct: 0, percentage: 0 },
      hard: { attempted: 0, correct: 0, percentage: 0 }
    };

    // Get question details
    const questions = await Question.find({
      _id: { $in: responses.map(r => r.questionId) }
    });

    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    // Breakdown by difficulty and Bloom's level
    const bloomLevelBreakdown: Record<string, { attempted: number; correct: number; percentage: number }> = {};

    for (const response of responses) {
      const question = questionMap.get(response.questionId.toString());
      if (question) {
        // Difficulty breakdown
        const difficulty = question.difficulty || 'medium';
        difficultyBreakdown[difficulty].attempted++;
        if (response.isCorrect) {
          difficultyBreakdown[difficulty].correct++;
        }

        // Bloom's level breakdown
        const bloomLevel = question.bloomLevel || 'Unknown';
        if (!bloomLevelBreakdown[bloomLevel]) {
          bloomLevelBreakdown[bloomLevel] = { attempted: 0, correct: 0, percentage: 0 };
        }
        bloomLevelBreakdown[bloomLevel].attempted++;
        if (response.isCorrect) {
          bloomLevelBreakdown[bloomLevel].correct++;
        }
      }
    }

    // Calculate percentages
    Object.keys(difficultyBreakdown).forEach(key => {
      const stats = difficultyBreakdown[key];
      stats.percentage = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
    });

    Object.keys(bloomLevelBreakdown).forEach(key => {
      const stats = bloomLevelBreakdown[key];
      stats.percentage = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
    });

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(difficultyBreakdown).forEach(([level, stats]) => {
      if (stats.percentage >= 80) {
        strengths.push(`Strong performance in ${level} difficulty questions (${stats.percentage.toFixed(1)}%)`);
      } else if (stats.percentage < 50) {
        weaknesses.push(`Needs improvement in ${level} difficulty questions (${stats.percentage.toFixed(1)}%)`);
      }
    });

    Object.entries(bloomLevelBreakdown).forEach(([level, stats]) => {
      if (stats.percentage >= 80) {
        strengths.push(`Excellent understanding of ${level} level concepts`);
      } else if (stats.percentage < 50) {
        weaknesses.push(`Struggle with ${level} level concepts`);
      }
    });

    // Update analytics session
    await AnalyticsSession.findOneAndUpdate(
      { sessionId },
      {
        endTime: new Date(),
        totalQuestions,
        correctAnswers,
        skippedQuestions,
        totalTimeSpent,
        averageTimePerQuestion,
        difficultyStats: difficultyBreakdown,
        bloomLevelStats: bloomLevelBreakdown
      }
    );

    const percentage = (correctAnswers / totalQuestions) * 100;
    const score = correctAnswers;

    return {
      sessionId,
      score,
      percentage,
      totalQuestions,
      correctAnswers,
      skippedQuestions,
      totalTimeSpent,
      averageTimePerQuestion,
      difficultyBreakdown,
      bloomLevelBreakdown,
      strengths,
      weaknesses
    };
  } catch (error) {
    console.error('Error calculating session analytics:', error);
    throw error;
  }
}

/**
 * Get session analytics
 */
export async function getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
  try {
    const session = await AnalyticsSession.findOne({ sessionId });
    
    if (!session) {
      throw new Error('Session not found');
    }

    const responses = await UserResponse.find({ sessionId }).populate('questionId');
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const totalQuestions = responses.length;

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (session.difficultyStats.easy.attempted > 0) {
      const easyPercentage = (session.difficultyStats.easy.correct / session.difficultyStats.easy.attempted) * 100;
      if (easyPercentage >= 80) {
        strengths.push(`Strong in easy questions (${easyPercentage.toFixed(1)}%)`);
      } else if (easyPercentage < 50) {
        weaknesses.push(`Struggles with easy questions (${easyPercentage.toFixed(1)}%)`);
      }
    }

    if (session.difficultyStats.medium.attempted > 0) {
      const mediumPercentage = (session.difficultyStats.medium.correct / session.difficultyStats.medium.attempted) * 100;
      if (mediumPercentage >= 80) {
        strengths.push(`Strong in medium difficulty (${mediumPercentage.toFixed(1)}%)`);
      } else if (mediumPercentage < 50) {
        weaknesses.push(`Needs improvement in medium difficulty (${mediumPercentage.toFixed(1)}%)`);
      }
    }

    if (session.difficultyStats.hard.attempted > 0) {
      const hardPercentage = (session.difficultyStats.hard.correct / session.difficultyStats.hard.attempted) * 100;
      if (hardPercentage >= 80) {
        strengths.push(`Excellent grasp of hard questions (${hardPercentage.toFixed(1)}%)`);
      } else if (hardPercentage < 50) {
        weaknesses.push(`Struggles with hard questions (${hardPercentage.toFixed(1)}%)`);
      }
    }

    const percentage = (correctAnswers / totalQuestions) * 100;

    return {
      sessionId,
      score: correctAnswers,
      percentage,
      totalQuestions,
      correctAnswers,
      skippedQuestions: session.skippedQuestions,
      totalTimeSpent: session.totalTimeSpent,
      averageTimePerQuestion: session.averageTimePerQuestion,
      difficultyBreakdown: {
        easy: { 
          attempted: session.difficultyStats.easy.attempted, 
          correct: session.difficultyStats.easy.correct,
          percentage: session.difficultyStats.easy.attempted > 0 ? (session.difficultyStats.easy.correct / session.difficultyStats.easy.attempted) * 100 : 0
        },
        medium: { 
          attempted: session.difficultyStats.medium.attempted, 
          correct: session.difficultyStats.medium.correct,
          percentage: session.difficultyStats.medium.attempted > 0 ? (session.difficultyStats.medium.correct / session.difficultyStats.medium.attempted) * 100 : 0
        },
        hard: { 
          attempted: session.difficultyStats.hard.attempted, 
          correct: session.difficultyStats.hard.correct,
          percentage: session.difficultyStats.hard.attempted > 0 ? (session.difficultyStats.hard.correct / session.difficultyStats.hard.attempted) * 100 : 0
        }
      },
      bloomLevelBreakdown: Object.fromEntries(session.bloomLevelStats),
      strengths,
      weaknesses
    };
  } catch (error) {
    console.error('Error getting session analytics:', error);
    throw error;
  }
}
