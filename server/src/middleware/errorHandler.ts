import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { ApiResponse } from '../types/index.js';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate correlation ID for tracking
  const correlationId = req.headers['x-correlation-id'] || `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Log the error
  logger.error('API Error', {
    correlationId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
      correlationId: correlationId as string,
    };
    return res.status(err.statusCode).json(response);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      error: err.message,
      correlationId: correlationId as string,
    };
    return res.status(400).json(response);
  }

  // Handle generic errors
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
    correlationId: correlationId as string,
  };

  res.status(500).json(response);
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
