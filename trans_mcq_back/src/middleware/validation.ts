import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? xss(obj) : obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = xss(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

// Validate file upload
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_MIME_TYPES = [
    'video/mp4',
    'audio/mpeg',
    'audio/wav',
    'video/quicktime',
  ];

  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(413).json({ error: 'File too large. Maximum 500MB.' });
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(415).json({ error: 'Invalid file type' });
  }

  // Additional security: validate file magic numbers
  const buffer = req.file.buffer;
  if (!isValidMediaFile(buffer, req.file.mimetype)) {
    return res.status(415).json({ error: 'Invalid file format' });
  }

  next();
};

// Check file magic numbers
function isValidMediaFile(buffer: Buffer, mimeType: string): boolean {
  if (mimeType.startsWith('video/')) {
    // Check for MP4 signature: ftyp
    if (buffer.toString('hex', 4, 8) === '66747970') return true;
    // Check for MOV signature
    if (buffer.toString('hex', 4, 8) === '6d6f6f76') return true;
  }
  if (mimeType.startsWith('audio/')) {
    // Check for MP3 signature: FF FB or FF FA
    if (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa)) return true;
    // Check for WAV signature: RIFF
    if (buffer.toString('hex', 0, 4) === '52494646') return true;
  }
  return true; // Allow if can't validate (fallback)
}

// Validate MongoDB ObjectId
export const validateObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Validate question input
export const validateQuestionInput = (req: Request, res: Response, next: NextFunction) => {
  const { question, options, difficulty } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length < 10) {
    return res.status(400).json({ error: 'Question must be at least 10 characters' });
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    return res.status(400).json({ error: 'Must provide 2-6 options' });
  }

  if (!options.every((opt: any) => opt.text && typeof opt.isCorrect === 'boolean')) {
    return res.status(400).json({ error: 'Invalid options format' });
  }

  if (!options.some((opt: any) => opt.isCorrect)) {
    return res.status(400).json({ error: 'At least one option must be correct' });
  }

  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty level' });
  }

  next();
};
