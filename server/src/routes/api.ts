import express, { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  validateAnalyzeRequest,
  validateRedesignRequest,
  validateGenerateRequest,
  validateChatRequest,
} from '../middleware/validators.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import {
  analyzeRoomImage,
  redesignRoomImage,
  generateNewImage,
  getDesignerChatResponse,
} from '../services/geminiService.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/v1/analyze
 * Analyze a room image
 */
router.post(
  '/analyze',
  validateAnalyzeRequest,
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, `Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    const { imageBase64, context } = req.body;

    logger.info('Analyzing room image', { context });

    const result = await analyzeRoomImage(imageBase64, context);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  })
);

/**
 * POST /api/v1/redesign
 * Redesign a room with a specific style/prompt
 */
router.post(
  '/redesign',
  validateRedesignRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, `Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    const { imageBase64, prompt } = req.body;

    logger.info('Redesigning room', { promptLength: prompt.length });

    const resultBase64 = await redesignRoomImage(imageBase64, prompt);

    const response: ApiResponse = {
      success: true,
      data: { imageBase64: resultBase64 },
    };

    res.json(response);
  })
);

/**
 * POST /api/v1/generate
 * Generate a completely new image from text
 */
router.post(
  '/generate',
  validateGenerateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, `Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    const { prompt } = req.body;

    logger.info('Generating new image', { promptLength: prompt.length });

    const resultBase64 = await generateNewImage(prompt);

    const response: ApiResponse = {
      success: true,
      data: { imageBase64: resultBase64 },
    };

    res.json(response);
  })
);

/**
 * POST /api/v1/chat
 * Chat with the AI designer
 */
router.post(
  '/chat',
  validateChatRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, `Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    const {
      history,
      currentImageBase64,
      originalImageBase64,
      analysis,
      userMessage,
      roomContext,
    } = req.body;

    logger.info('Processing chat request', {
      messageCount: history.length,
      roomContext
    });

    const result = await getDesignerChatResponse(
      history,
      currentImageBase64,
      originalImageBase64,
      analysis,
      userMessage,
      roomContext
    );

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  })
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
