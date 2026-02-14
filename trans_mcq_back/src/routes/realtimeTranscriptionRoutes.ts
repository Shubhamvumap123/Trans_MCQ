// src/routes/realtimeTranscriptionRoutes.ts
/**
 * Real-Time Transcription Routes
 * Endpoints for streaming transcription during video playback
 * Supports multiple languages: English, Hindi, Marathi, Kannada, Telugu
 */

import express, { Router, Request, Response } from 'express';
import { 
  createTranscriber, 
  SUPPORTED_LANGUAGES, 
  saveRealtimeTranscription,
  RealtimeTranscriptionConfig 
} from '../services/realtimeTranscriptionService';
import File from '../models/File';
import Transcription from '../models/Transcription';

const router = Router();

/**
 * GET /api/transcription/languages
 * Get list of supported languages for transcription
 */
router.get('/languages', (req: Request, res: Response) => {
  try {
    const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
      code,
      name: info.name,
      fullName: info.fullName
    }));

    res.json({
      success: true,
      languages,
      providers: {
        available: process.env.TRANSCRIPTION_PROVIDER || 'google',
        supported: ['google', 'azure', 'assemblyai', 'ollama']
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

/**
 * POST /api/transcription/realtime/start
 * Start real-time transcription for a video
 * 
 * Body: {
 *   fileId: string,
 *   language: 'en' | 'hi' | 'mr' | 'kn' | 'te',
 *   detectSpeaker: boolean (optional),
 *   enablePunctuation: boolean (optional)
 * }
 */
router.post('/realtime/start', async (req: Request, res: Response) => {
  try {
    const { fileId, language = 'en', detectSpeaker = false, enablePunctuation = true } = req.body;

    // Validate file exists
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Validate language
    if (!Object.keys(SUPPORTED_LANGUAGES).includes(language)) {
      return res.status(400).json({ 
        error: 'Unsupported language',
        supported: Object.keys(SUPPORTED_LANGUAGES)
      });
    }

    // Update file with language and realtime setting
    await File.findByIdAndUpdate(fileId, { 
      language,
      enableRealtime: true,
      transcriptionProvider: process.env.TRANSCRIPTION_PROVIDER || 'google'
    });

    // Initialize transcriber
    const config: RealtimeTranscriptionConfig = {
      language,
      detectSpeaker,
      enablePunctuation
    };

    const transcriber = createTranscriber(config);

    res.json({
      success: true,
      message: 'Real-time transcription started',
      fileId,
      language,
      languageName: SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES].fullName,
      provider: process.env.TRANSCRIPTION_PROVIDER || 'google',
      features: {
        speakerDetection: detectSpeaker,
        automaticPunctuation: enablePunctuation
      }
    });
  } catch (error) {
    console.error('Error starting real-time transcription:', error);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
});

/**
 * POST /api/transcription/realtime/segment
 * Receive a transcription segment during real-time playback
 * This would typically be called from the frontend via WebSocket
 * 
 * Body: {
 *   fileId: string,
 *   sessionId: string,
 *   segmentText: string,
 *   timestamp: { start: number, end: number },
 *   confidence: number,
 *   isFinal: boolean
 * }
 */
router.post('/realtime/segment', async (req: Request, res: Response) => {
  try {
    const { fileId, sessionId, segmentText, timestamp, confidence, isFinal } = req.body;

    if (!fileId || !segmentText || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store segment in temporary session or cache
    // In production, this would be stored in Redis or similar
    
    res.json({
      success: true,
      message: 'Segment received',
      segmentId: `${sessionId}-${Date.now()}`,
      processingTime: Math.random() * 100 // Mock
    });
  } catch (error) {
    console.error('Error processing segment:', error);
    res.status(500).json({ error: 'Failed to process segment' });
  }
});

/**
 * POST /api/transcription/realtime/finish
 * Finalize real-time transcription session
 * 
 * Body: {
 *   fileId: string,
 *   sessionId: string,
 *   segments: Array of complete segments
 * }
 */
router.post('/realtime/finish', async (req: Request, res: Response) => {
  try {
    const { fileId, sessionId, segments } = req.body;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Save transcription
    const transcription = await saveRealtimeTranscription(
      fileId,
      segments,
      file.language || 'en'
    );

    // Update file status
    await File.findByIdAndUpdate(fileId, { 
      status: 'completed',
      enableRealtime: false
    });

    res.json({
      success: true,
      message: 'Transcription completed',
      transcriptionId: transcription._id,
      segmentCount: segments.length,
      duration: transcription.duration,
      language: transcription.language,
      provider: transcription.transcriptionProvider,
      averageConfidence: transcription.averageConfidence
    });
  } catch (error) {
    console.error('Error finishing transcription:', error);
    res.status(500).json({ error: 'Failed to complete transcription' });
  }
});

/**
 * GET /api/transcription/file/:fileId/confidence
 * Get confidence metrics for a transcription
 */
router.get('/file/:fileId/confidence', async (req: Request, res: Response) => {
  try {
    const transcription = await Transcription.findOne({ fileId: req.params.fileId });

    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    const segmentConfidences = transcription.segments.map(seg => ({
      segmentIndex: seg.segmentIndex,
      confidence: seg.confidence || 0,
      text: seg.text.substring(0, 50) + '...'
    }));

    const avgConfidence = segmentConfidences.length > 0
      ? segmentConfidences.reduce((sum, s) => sum + s.confidence, 0) / segmentConfidences.length
      : 0;

    const lowConfidenceSegments = segmentConfidences.filter(s => s.confidence < 0.8);

    res.json({
      success: true,
      fileId: req.params.fileId,
      provider: transcription.transcriptionProvider,
      language: transcription.language,
      averageConfidence: Math.round(avgConfidence * 100),
      totalSegments: segmentConfidences.length,
      lowConfidenceSegments: lowConfidenceSegments.length,
      details: {
        excellent: segmentConfidences.filter(s => s.confidence >= 0.95).length,
        good: segmentConfidences.filter(s => s.confidence >= 0.8 && s.confidence < 0.95).length,
        fair: segmentConfidences.filter(s => s.confidence >= 0.6 && s.confidence < 0.8).length,
        poor: segmentConfidences.filter(s => s.confidence < 0.6).length
      },
      recommendation: avgConfidence < 0.8 
        ? 'Consider re-recording in a quieter environment' 
        : 'Transcription quality is good'
    });
  } catch (error) {
    console.error('Error fetching confidence metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * POST /api/transcription/file/:fileId/language
 * Change transcription language (re-transcribe if needed)
 */
router.post('/file/:fileId/language', async (req: Request, res: Response) => {
  try {
    const { newLanguage } = req.body;

    if (!Object.keys(SUPPORTED_LANGUAGES).includes(newLanguage)) {
      return res.status(400).json({ 
        error: 'Unsupported language',
        supported: Object.keys(SUPPORTED_LANGUAGES)
      });
    }

    const file = await File.findByIdAndUpdate(
      req.params.fileId,
      { language: newLanguage },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      message: 'Language updated',
      fileId: file._id,
      newLanguage,
      languageName: SUPPORTED_LANGUAGES[newLanguage as keyof typeof SUPPORTED_LANGUAGES].fullName,
      note: 'Transcription will be updated using the new language on next processing'
    });
  } catch (error) {
    console.error('Error updating language:', error);
    res.status(500).json({ error: 'Failed to update language' });
  }
});

/**
 * GET /api/transcription/file/:fileId/language
 * Get current language setting for a file
 */
router.get('/file/:fileId/language', async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const language = file.language || 'en';
    const transcription = await Transcription.findOne({ fileId: file._id });

    res.json({
      success: true,
      fileId: file._id,
      uploadedLanguage: language,
      uploadedLanguageName: SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES].fullName,
      transcribedLanguage: transcription?.language || null,
      provider: file.transcriptionProvider || 'google',
      realtimeEnabled: file.enableRealtime || false
    });
  } catch (error) {
    console.error('Error fetching language:', error);
    res.status(500).json({ error: 'Failed to fetch language' });
  }
});

export default router;
