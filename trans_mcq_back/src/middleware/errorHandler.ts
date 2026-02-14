import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  status?: number;
  message: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error safely (don't expose sensitive data)
  console.error({
    timestamp: new Date().toISOString(),
    status,
    message,
    path: req.path,
    method: req.method,
  });

  // Send sanitized response
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
