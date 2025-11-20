import { body, ValidationChain } from 'express-validator';

// Maximum base64 image size (approx 5MB when decoded)
const MAX_BASE64_LENGTH = 7000000; // ~5MB in base64

// Maximum prompt length
const MAX_PROMPT_LENGTH = 2000;

// Base64 image validator
const base64ImageValidator = (fieldName: string): ValidationChain =>
  body(fieldName)
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .custom((value) => {
      // Check if it's valid base64
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      if (!base64Regex.test(value)) {
        throw new Error(`${fieldName} must be valid base64`);
      }
      return true;
    })
    .isLength({ max: MAX_BASE64_LENGTH })
    .withMessage(`${fieldName} exceeds maximum size (5MB)`);

// Context validator
export const validateAnalyzeRequest: ValidationChain[] = [
  base64ImageValidator('imageBase64'),
  body('context')
    .isIn(['Residential', 'Commercial'])
    .withMessage('context must be either "Residential" or "Commercial"'),
];

// Redesign request validator
export const validateRedesignRequest: ValidationChain[] = [
  base64ImageValidator('imageBase64'),
  body('prompt')
    .isString()
    .withMessage('prompt must be a string')
    .trim()
    .isLength({ min: 10, max: MAX_PROMPT_LENGTH })
    .withMessage(`prompt must be between 10 and ${MAX_PROMPT_LENGTH} characters`)
    .matches(/^[a-zA-Z0-9\s,.!?'"-]+$/)
    .withMessage('prompt contains invalid characters'),
];

// Generate request validator
export const validateGenerateRequest: ValidationChain[] = [
  body('prompt')
    .isString()
    .withMessage('prompt must be a string')
    .trim()
    .isLength({ min: 10, max: MAX_PROMPT_LENGTH })
    .withMessage(`prompt must be between 10 and ${MAX_PROMPT_LENGTH} characters`)
    .matches(/^[a-zA-Z0-9\s,.!?'"-]+$/)
    .withMessage('prompt contains invalid characters'),
];

// Chat request validator
export const validateChatRequest: ValidationChain[] = [
  body('history')
    .isArray()
    .withMessage('history must be an array'),
  body('history.*.role')
    .isIn(['user', 'ai'])
    .withMessage('message role must be either "user" or "ai"'),
  body('history.*.text')
    .isString()
    .withMessage('message text must be a string'),
  base64ImageValidator('currentImageBase64'),
  base64ImageValidator('originalImageBase64'),
  body('analysis')
    .optional()
    .isObject()
    .withMessage('analysis must be an object if provided'),
  body('userMessage')
    .isString()
    .withMessage('userMessage must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('userMessage must be between 1 and 500 characters'),
  body('roomContext')
    .isIn(['Residential', 'Commercial'])
    .withMessage('roomContext must be either "Residential" or "Commercial"'),
];
