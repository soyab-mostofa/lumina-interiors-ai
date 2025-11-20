/**
 * Application-wide constants
 */

export const IMAGE_CONSTRAINTS = {
  // Maximum dimensions for uploaded images
  UPLOAD_MAX_WIDTH: 768,
  UPLOAD_MAX_HEIGHT: 768,

  // Maximum dimension for chat image compression
  CHAT_COMPRESS_MAX_DIM: 512,

  // Generation settings
  GENERATE_ASPECT_RATIO: '16:9' as const,
  GENERATE_ASPECT_RATIO_NUMERIC: 16 / 9,

  // File size limits (in bytes)
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB

  // Image quality settings
  COMPRESSION_QUALITY: 0.85,
  COMPRESSION_FORMAT: 'image/jpeg' as const,
} as const;

export const GENERATION_CONFIG = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json' as const,
} as const;

export const LOGGING = {
  ENABLE_DEV_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_ERROR_TRACKING: true,
} as const;
