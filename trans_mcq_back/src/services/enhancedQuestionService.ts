// src/services/enhancedQuestionService.ts
import Question from '../models/Question';

export interface EnhancedMCQOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
  misconception?: string;
}

export interface EnhancedMCQ {
  question: string;
  options: EnhancedMCQOption[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjective: 'recall' | 'application' | 'analysis';
  bloomLevel: string;
}

/**
 * Generate enhanced MCQs with learning objectives and misconception-based distractors
 */
export async function generateEnhancedMCQsFromText(
  text: string,
  segmentIndex: number,
  startTime: number,
  endTime: number
): Promise<EnhancedMCQ[]> {
  const questions: EnhancedMCQ[] = [];

  // Example: Generate different types of questions based on content analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();

    // Type 1: Recall questions (factual)
    if (trimmed.length > 20) {
      const recallQ = generateRecallQuestion(trimmed);
      if (recallQ) questions.push(recallQ);
    }

    // Type 2: Application questions (how to use)
    if (containsVerb(trimmed, ['process', 'calculate', 'apply', 'use'])) {
      const appQ = generateApplicationQuestion(trimmed);
      if (appQ) questions.push(appQ);
    }

    // Type 3: Analysis questions (why/how)
    if (containsVerb(trimmed, ['why', 'because', 'cause', 'effect', 'reason'])) {
      const analysisQ = generateAnalysisQuestion(trimmed);
      if (analysisQ) questions.push(analysisQ);
    }
  }

  return questions;
}

/**
 * Generate recall-level questions (Bloom's: Remember)
 */
function generateRecallQuestion(text: string): EnhancedMCQ | null {
  // Extract key terms
  const keyTerm = extractKeyTerm(text);
  if (!keyTerm) return null;

  const correctAnswer = extractDefinition(text, keyTerm);
  if (!correctAnswer) return null;

  const misconceptions = generateMisconceptions(keyTerm, correctAnswer);

  return {
    question: `What is ${keyTerm}?`,
    options: createOptionsWithMisconceptions(correctAnswer, misconceptions),
    correctAnswerIndex: 0,
    explanation: `${keyTerm} refers to ${correctAnswer}. This is directly stated in the lecture.`,
    difficulty: 'easy',
    learningObjective: 'recall',
    bloomLevel: 'Remember'
  };
}

/**
 * Generate application-level questions (Bloom's: Apply)
 */
function generateApplicationQuestion(text: string): EnhancedMCQ | null {
  const scenario = extractScenario(text);
  if (!scenario) return null;

  const correctAction = extractAction(text);
  if (!correctAction) return null;

  return {
    question: `In the context of "${scenario}", what should be done?`,
    options: [
      {
        text: correctAction,
        isCorrect: true,
        explanation: `This is the correct approach as discussed in the lecture.`
      },
      {
        text: `Ignore the ${scenario} entirely`,
        isCorrect: false,
        explanation: `This would not address the ${scenario} properly.`,
        misconception: 'Thinking inaction is better than proper action'
      },
      {
        text: `Use the opposite of ${correctAction}`,
        isCorrect: false,
        explanation: `This would lead to incorrect results.`,
        misconception: 'Reversing the proper approach'
      },
      {
        text: `Wait indefinitely for external help`,
        isCorrect: false,
        explanation: `Proactive action is necessary in these situations.`,
        misconception: 'Over-relying on external intervention'
      }
    ],
    correctAnswerIndex: 0,
    explanation: `The correct approach is ${correctAction}, which aligns with the principles discussed.`,
    difficulty: 'medium',
    learningObjective: 'application',
    bloomLevel: 'Apply'
  };
}

/**
 * Generate analysis-level questions (Bloom's: Analyze)
 */
function generateAnalysisQuestion(text: string): EnhancedMCQ | null {
  const cause = extractCause(text);
  const effect = extractEffect(text);

  if (!cause || !effect) return null;

  return {
    question: `Why does ${effect} occur when ${cause}?`,
    options: [
      {
        text: `Because ${cause} directly leads to ${effect}`,
        isCorrect: true,
        explanation: `The causal relationship between ${cause} and ${effect} was established in the lecture.`
      },
      {
        text: `Due to an unrelated factor not mentioned in the lecture`,
        isCorrect: false,
        explanation: `The lecture specifically discusses the relationship between ${cause} and ${effect}.`,
        misconception: 'Attributing causes to unmentioned factors'
      },
      {
        text: `${effect} actually causes ${cause}, not the reverse`,
        isCorrect: false,
        explanation: `The causal direction is ${cause} → ${effect}, as explained in class.`,
        misconception: 'Reversing the direction of causality'
      },
      {
        text: `There is no relationship between ${cause} and ${effect}`,
        isCorrect: false,
        explanation: `A clear causal relationship was established in the lecture.`,
        misconception: 'Assuming independence when causality exists'
      }
    ],
    correctAnswerIndex: 0,
    explanation: `The relationship between ${cause} and ${effect} exemplifies the principles discussed in the lecture.`,
    difficulty: 'hard',
    learningObjective: 'analysis',
    bloomLevel: 'Analyze'
  };
}

// Helper functions

function extractKeyTerm(text: string): string | null {
  const words = text.split(/\s+/);
  return words.length > 0 ? words[0] : null;
}

function extractDefinition(text: string, term: string): string | null {
  const patterns = [
    /(?:is|refers to|means|defined as|called)\s+([^.!?]+)/i,
    /(?:the\s+)?([^.!?]+)\s+(?:is|are|refers to)\s+([^.!?]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[2];
  }

  return null;
}

function generateMisconceptions(term: string, correctAnswer: string): string[] {
  return [
    `A common misconception about ${term}`,
    `The opposite of ${correctAnswer}`,
    `A related but distinct concept`
  ];
}

function createOptionsWithMisconceptions(
  correctAnswer: string,
  misconceptions: string[]
): Array<{ text: string; isCorrect: boolean; explanation: string; misconception?: string }> {
  return [
    {
      text: correctAnswer,
      isCorrect: true,
      explanation: `This is the correct definition as stated in the lecture.`
    },
    {
      text: misconceptions[0],
      isCorrect: false,
      explanation: `This is a common misconception. The correct definition is ${correctAnswer}.`,
      misconception: misconceptions[0]
    },
    {
      text: misconceptions[1],
      isCorrect: false,
      explanation: `This represents the opposite or inverse. The correct answer is ${correctAnswer}.`,
      misconception: 'Confusing with opposite concept'
    },
    {
      text: misconceptions[2],
      isCorrect: false,
      explanation: `This is related but not accurate. ${correctAnswer} is the correct definition.`,
      misconception: 'Confusing related but distinct concepts'
    }
  ];
}

function extractScenario(text: string): string | null {
  const match = text.match(/(?:in|during|when|while|if)\s+([^,]+)/i);
  return match ? match[1].trim() : null;
}

function extractAction(text: string): string | null {
  const match = text.match(/(?:should|would|must|can)\s+([^.!?]+)/i);
  return match ? match[1].trim() : null;
}

function extractCause(text: string): string | null {
  const match = text.match(/([^,]+)\s+(?:causes|leads to|results in|due to)/i);
  return match ? match[1].trim() : null;
}

function extractEffect(text: string): string | null {
  const match = text.match(/(?:causes|leads to|results in|due to)\s+([^.!?]+)/i);
  return match ? match[1].trim() : null;
}

function containsVerb(text: string, verbs: string[]): boolean {
  const lowerText = text.toLowerCase();
  return verbs.some(verb => lowerText.includes(verb));
}

/**
 * Save enhanced questions to database
 */
export async function saveEnhancedQuestions(
  transcriptionId: string,
  segmentIndex: number,
  segmentText: string,
  startTime: number,
  endTime: number,
  questions: EnhancedMCQ[]
): Promise<void> {
  try {
    for (const mcq of questions) {
      const question = new Question({
        transcriptionId,
        segmentIndex,
        segmentText,
        timestamp: { start: startTime, end: endTime },
        question: mcq.question,
        options: mcq.options,
        correctAnswerIndex: mcq.correctAnswerIndex,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty,
        learningObjective: mcq.learningObjective,
        bloomLevel: mcq.bloomLevel
      });
      await question.save();
    }
    console.log(`Saved ${questions.length} questions for segment ${segmentIndex}`);
  } catch (error) {
    console.error('Error saving enhanced questions:', error);
    throw error;
  }
}
