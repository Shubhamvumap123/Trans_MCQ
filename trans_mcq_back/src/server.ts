// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import morgan from 'morgan';
import fileRoutes from './routes/fileRoutes';
import transcriptionRoutes from './routes/transcriptionRoutes';
import questionRoutes from './routes/questionRoutes';
import { helmetConfig, httpsRedirect, corsOptions, apiLimiter, fileUploadLimiter } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { sanitizeInput } from './middleware/validation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// HTTPS enforcement
app.use(httpsRedirect);

// Security headers
app.use(helmetConfig);

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS with restrictions
app.use(cors(corsOptions));

// Body parsing with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// General API rate limiting
app.use(apiLimiter);

// Static files for uploaded content (with cache control)
app.use('/uploads', express.static('uploads', {
  maxAge: '7d',
  etag: false
}));

// Health check endpoint (no rate limit)
app.get('/api/health', (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// API Routes
app.use('/api/files', fileUploadLimiter, fileRoutes);
app.use('/api/transcription', transcriptionRoutes);
app.use('/api/questions', questionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// MongoDB connection with retry logic
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not defined');
  process.exit(1);
}

let dbConnectionAttempts = 0;
const maxConnectionAttempts = 5;

const connectDatabase = () => {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✓ Connected to MongoDB');
      dbConnectionAttempts = 0;
      
      app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    })
    .catch((error) => {
      console.error('✗ MongoDB connection error:', error.message);
      dbConnectionAttempts++;
      
      if (dbConnectionAttempts < maxConnectionAttempts) {
        console.log(`Retrying connection... (${dbConnectionAttempts}/${maxConnectionAttempts})`);
        setTimeout(connectDatabase, 5000);
      } else {
        console.error('✗ Max connection attempts reached. Exiting.');
        process.exit(1);
      }
    });
};

connectDatabase();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Closing gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

export default app;