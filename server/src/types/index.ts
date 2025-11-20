export interface RoomAnalysis {
  roomType: string;
  architecturalFeatures: string[];
  designIssues: string[];
  decorSuggestions: string[];
  suggestedPrompts: SuggestedPrompt[];
}

export interface SuggestedPrompt {
  title: string;
  description: string;
  prompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isSystemMessage?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId?: string;
}

export interface AnalyzeRequest {
  imageBase64: string;
  context: 'Residential' | 'Commercial';
}

export interface RedesignRequest {
  imageBase64: string;
  prompt: string;
}

export interface GenerateRequest {
  prompt: string;
}

export interface ChatRequest {
  history: ChatMessage[];
  currentImageBase64: string;
  originalImageBase64: string;
  analysis: RoomAnalysis | null;
  userMessage: string;
  roomContext: 'Residential' | 'Commercial';
}

export interface ChatResponse {
  text: string;
  newGenerationPrompt?: string;
}
