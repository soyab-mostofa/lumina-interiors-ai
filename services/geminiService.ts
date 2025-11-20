import { RoomAnalysis, ChatMessage } from "../types";

// Image compression constants
export const IMAGE_COMPRESSION = {
  UPLOAD_MAX_SIZE: 768,
  UPLOAD_QUALITY: 0.6,
  CHAT_MAX_SIZE: 512,
  CHAT_QUALITY: 0.5,
} as const;

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper to generate correlation IDs
const generateCorrelationId = () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to handle API errors
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public correlationId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Makes an API request to the backend
 */
async function apiRequest<T>(
  endpoint: string,
  data: any,
  signal?: AbortSignal
): Promise<T> {
  const correlationId = generateCorrelationId();

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(data),
      signal,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        result.error || 'Request failed',
        result.correlationId || correlationId
      );
    }

    if (!result.success) {
      throw new ApiError(
        response.status,
        result.error || 'Request failed',
        result.correlationId || correlationId
      );
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError(499, 'Request cancelled', correlationId);
      }
      throw new ApiError(500, error.message, correlationId);
    }

    throw new ApiError(500, 'An unexpected error occurred', correlationId);
  }
}

/**
 * Converts a File object to a Base64 string.
 * Optimized to prevent "Rpc failed" or Payload Too Large errors.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const { UPLOAD_MAX_SIZE, UPLOAD_QUALITY } = IMAGE_COMPRESSION;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > UPLOAD_MAX_SIZE) {
            height *= UPLOAD_MAX_SIZE / width;
            width = UPLOAD_MAX_SIZE;
          }
        } else {
          if (height > UPLOAD_MAX_SIZE) {
            width *= UPLOAD_MAX_SIZE / height;
            height = UPLOAD_MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', UPLOAD_QUALITY);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Helper to downscale any base64 image string before sending to Chat API.
 * Critical for preventing payload size errors with generated images.
 */
export const compressBase64 = async (base64Data: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      // Handle potential missing prefix
      const src = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
      img.src = src;

      img.onload = () => {
        const { CHAT_MAX_SIZE, CHAT_QUALITY } = IMAGE_COMPRESSION;
        let w = img.width;
        let h = img.height;

        // Scale down if needed
        if (w > CHAT_MAX_SIZE || h > CHAT_MAX_SIZE) {
          if (w > h) {
            h *= CHAT_MAX_SIZE / w;
            w = CHAT_MAX_SIZE;
          } else {
            w *= CHAT_MAX_SIZE / h;
            h = CHAT_MAX_SIZE;
          }
        } else {
          // If already small, just return original to save processing
          resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const data = canvas.toDataURL('image/jpeg', CHAT_QUALITY);
          resolve(data.split(',')[1]);
        } else {
          resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
        }
      };

      img.onerror = () => {
        console.warn("Image compression failed to load image, using original.");
        resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
      };
    } catch (e) {
      console.warn("Image compression error:", e);
      resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
    }
  });
};

/**
 * Helper to extract base64 from data URL safely
 */
export const extractBase64 = (dataUrl: string): string => {
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
};

/**
 * Analyzes the room image via backend API
 */
export const analyzeRoomImage = async (
  base64Image: string,
  contextHint?: 'Residential' | 'Commercial',
  signal?: AbortSignal
): Promise<RoomAnalysis> => {
  return apiRequest<RoomAnalysis>(
    '/analyze',
    {
      imageBase64: base64Image,
      context: contextHint || 'Residential',
    },
    signal
  );
};

/**
 * Chat with the Interior Designer via backend API
 */
export const getDesignerChatResponse = async (
  history: ChatMessage[],
  currentImageBase64: string,
  originalImageBase64: string,
  analysis: RoomAnalysis | null,
  userMessage: string,
  roomContext: 'Residential' | 'Commercial' = 'Residential',
  signal?: AbortSignal
): Promise<{ text: string; newGenerationPrompt?: string }> => {
  // Compress the image before sending to avoid XHR/RPC errors
  const optimizedImage = await compressBase64(currentImageBase64);

  return apiRequest<{ text: string; newGenerationPrompt?: string }>(
    '/chat',
    {
      history,
      currentImageBase64: optimizedImage,
      originalImageBase64,
      analysis,
      userMessage,
      roomContext,
    },
    signal
  );
};

/**
 * Redesigns/Edits the room via backend API
 */
export const redesignRoomImage = async (
  base64Original: string,
  promptDescription: string,
  signal?: AbortSignal
): Promise<string> => {
  const result = await apiRequest<{ imageBase64: string }>(
    '/redesign',
    {
      imageBase64: base64Original,
      prompt: promptDescription,
    },
    signal
  );

  // Return as data URL for consistency with frontend
  return `data:image/png;base64,${result.imageBase64}`;
};

/**
 * Generates a completely new image from scratch via backend API
 */
export const generateNewImage = async (
  prompt: string,
  signal?: AbortSignal
): Promise<string> => {
  const result = await apiRequest<{ imageBase64: string }>(
    '/generate',
    {
      prompt,
    },
    signal
  );

  // Return as data URL for consistency with frontend
  return `data:image/jpeg;base64,${result.imageBase64}`;
};
