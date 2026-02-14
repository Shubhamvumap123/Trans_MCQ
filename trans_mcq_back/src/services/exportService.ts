// src/services/exportService.ts
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import Question from '../models/Question';
import AnalyticsSession from '../models/AnalyticsSession';
import UserResponse from '../models/UserResponse';

/**
 * Export questions to CSV format
 */
export async function exportQuestionsToCsv(transcriptionId: string): Promise<string> {
  try {
    const questions = await Question.find({ transcriptionId });

    if (questions.length === 0) {
      throw new Error('No questions found');
    }

    let csv = 'Question,Option A,Option B,Option C,Option D,Correct Answer,Difficulty,Learning Objective,Bloom Level\n';

    for (const question of questions) {
      const questionText = `"${question.question.replace(/"/g, '""')}"`;
      const options = question.options.map(opt => `"${opt.text.replace(/"/g, '""')}"`).join(',');
      const correctIndex = question.correctAnswerIndex || 0;
      const correctAnswer = question.options[correctIndex]?.text || 'N/A';

      csv += `${questionText},${options},"${correctAnswer}",${question.difficulty},${question.learningObjective || 'N/A'},${question.bloomLevel || 'N/A'}\n`;
    }

    return csv;
  } catch (error) {
    console.error('Error exporting questions to CSV:', error);
    throw error;
  }
}

/**
 * Export session results to PDF
 */
export async function exportSessionToPdf(sessionId: string): Promise<Buffer> {
  try {
    const session = await AnalyticsSession.findOne({ sessionId });
    const responses = await UserResponse.find({ sessionId }).populate('questionId');

    if (!session || !responses.length) {
      throw new Error('Session not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4'
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Quiz Session Report', { align: 'center' });
      doc.moveDown();

      // Session Info
      doc.fontSize(12).font('Helvetica');
      doc.text(`Session ID: ${sessionId}`);
      doc.text(`Date: ${session.startTime.toLocaleDateString()}`);
      doc.moveDown();

      // Score Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Score Summary');
      const correctAnswers = session.correctAnswers;
      const totalQuestions = session.totalQuestions;
      const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(1);

      doc.fontSize(12).font('Helvetica');
      doc.text(`Correct Answers: ${correctAnswers}/${totalQuestions}`);
      doc.text(`Percentage: ${percentage}%`);
      doc.text(`Average Time per Question: ${session.averageTimePerQuestion.toFixed(1)} seconds`);
      doc.moveDown();

      // Difficulty Breakdown
      doc.fontSize(14).font('Helvetica-Bold').text('Performance by Difficulty');
      doc.fontSize(11).font('Helvetica');
      
      ['easy', 'medium', 'hard'].forEach((difficulty: any) => {
        const stats = session.difficultyStats[difficulty];
        const diffPercentage = stats.attempted > 0 ? ((stats.correct / stats.attempted) * 100).toFixed(1) : 'N/A';
        doc.text(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}: ${stats.correct}/${stats.attempted} (${diffPercentage}%)`);
      });
      doc.moveDown();

      // Question Details
      doc.fontSize(14).font('Helvetica-Bold').text('Question Details');
      doc.fontSize(10).font('Helvetica');

      responses.forEach((response, index) => {
        const question = response.questionId as any;
        const isCorrect = response.isCorrect;
        const status = isCorrect ? '✓ CORRECT' : '✗ INCORRECT';
        
        doc.text(`${index + 1}. ${question.question}`);
        doc.text(`   Status: ${status}`, { color: isCorrect ? '#00AA00' : '#AA0000' });
        doc.text(`   Your Answer: ${question.options[response.selectedAnswerIndex]?.text || 'N/A'}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  } catch (error) {
    console.error('Error exporting session to PDF:', error);
    throw error;
  }
}

/**
 * Export session results to CSV
 */
export async function exportSessionToCsv(sessionId: string): Promise<string> {
  try {
    const session = await AnalyticsSession.findOne({ sessionId });
    const responses = await UserResponse.find({ sessionId }).populate('questionId');

    if (!session || !responses.length) {
      throw new Error('Session not found');
    }

    let csv = 'Question,Your Answer,Correct Answer,Result,Time Spent (s),Difficulty,Bloom Level\n';

    for (const response of responses) {
      const question = response.questionId as any;
      const correctAnswer = question.options[question.correctAnswerIndex]?.text || 'N/A';
      const yourAnswer = question.options[response.selectedAnswerIndex]?.text || 'N/A';
      const result = response.isCorrect ? 'Correct' : 'Incorrect';

      const questionText = `"${question.question.replace(/"/g, '""')}"`;
      const yourAnswerText = `"${yourAnswer.replace(/"/g, '""')}"`;
      const correctAnswerText = `"${correctAnswer.replace(/"/g, '""')}"`;

      csv += `${questionText},${yourAnswerText},${correctAnswerText},${result},${response.timeSpent},${question.difficulty || 'N/A'},${question.bloomLevel || 'N/A'}\n`;
    }

    // Add summary
    csv += '\n\nSummary\n';
    csv += `Total Questions,${session.totalQuestions}\n`;
    csv += `Correct Answers,${session.correctAnswers}\n`;
    csv += `Percentage,${((session.correctAnswers / session.totalQuestions) * 100).toFixed(1)}%\n`;
    csv += `Total Time Spent,${session.totalTimeSpent} seconds\n`;
    csv += `Average Time per Question,${session.averageTimePerQuestion.toFixed(1)} seconds\n`;

    return csv;
  } catch (error) {
    console.error('Error exporting session to CSV:', error);
    throw error;
  }
}
