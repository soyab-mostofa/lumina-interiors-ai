import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RoomAnalysis, ChatMessage } from "../types";

// Initialize API Client
// NOTE: In a real production app, requests should be proxied through a backend to keep the key secure.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Converts a File object to a Base64 string.
 * Optimized to prevent "Rpc failed" or Payload Too Large errors.
 * Max dimension: 768px. Quality: 0.6.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_WIDTH = 768;
        const MAX_HEIGHT = 768;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
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
 * Target: 512px max dimension, 0.5 quality.
 */
const compressBase64 = async (base64Data: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      // Handle potential missing prefix
      const src = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
      img.src = src;
      
      img.onload = () => {
        const MAX_DIM = 512;
        let w = img.width;
        let h = img.height;
        
        // Scale down if needed
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h *= MAX_DIM / w;
            w = MAX_DIM;
          } else {
            w *= MAX_DIM / h;
            h = MAX_DIM;
          }
        } else {
          // If already small, just return original to save processing
          // stripping prefix if it was added for loading
          resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            // Aggressive compression for chat context (it only needs to see general layout/colors)
            const data = canvas.toDataURL('image/jpeg', 0.5);
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
 * Analyzes the room image using Gemini 2.5 Flash.
 * Accepts a contextHint to bias the analysis.
 */
export const analyzeRoomImage = async (base64Image: string, contextHint?: 'Residential' | 'Commercial'): Promise<RoomAnalysis> => {
  const ai = getAiClient();
  
  const contextInstruction = contextHint 
    ? `IMPORTANT: The user has explicitly identified this as a ${contextHint} space. Ensure all classification, design issues, and suggestions strictly align with a ${contextHint} environment.` 
    : "";

  const prompt = `
    You are Lumina, a world-class Interior Designer.
    Analyze this interior image. ${contextInstruction}
    
    1. CLASSIFY the room accurately within the context of ${contextHint || 'General'}.
       - If Residential: Living Room, Bedroom, Kitchen, etc.
       - If Commercial: Open Plan Office, Executive Suite, Conference Room, Co-working Space, Retail Store, Lobby.
    2. Describe architectural features and MATERIALS explicitly (e.g., "Herringbone oak flooring", "Exposed concrete ceiling", "Floor-to-ceiling glass windows", "White drywall").
    3. Identify design issues specific to the function.
    4. PROACTIVELY suggest additions appropriate to the context.
    
    Return JSON matching this schema:
    {
      "roomType": "string",
      "architecturalFeatures": ["string"],
      "designIssues": ["string"],
      "decorSuggestions": ["string"],
      "suggestedPrompts": [
        { "title": "string", "description": "string", "prompt": "string" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roomType: { type: Type.STRING },
            architecturalFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            designIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            decorSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedPrompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prompt: { type: Type.STRING }
                }
              }
            }
          },
        },
      },
    });

    if (!response.text) throw new Error("No analysis returned");
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse analysis JSON", e);
      return {
        roomType: "Room",
        architecturalFeatures: [],
        designIssues: [],
        decorSuggestions: [],
        suggestedPrompts: []
      };
    }
    
    return {
      roomType: parsed.roomType || "Unknown Room",
      architecturalFeatures: Array.isArray(parsed.architecturalFeatures) ? parsed.architecturalFeatures : [],
      designIssues: Array.isArray(parsed.designIssues) ? parsed.designIssues : [],
      decorSuggestions: Array.isArray(parsed.decorSuggestions) ? parsed.decorSuggestions : [],
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts) ? parsed.suggestedPrompts : []
    } as RoomAnalysis;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Chat with the Interior Designer.
 * Logic acts as a strict "State Manager" to enforce user constraints.
 */
export const getDesignerChatResponse = async (
  history: ChatMessage[], 
  currentImageBase64: string, 
  originalImageBase64: string,
  analysis: RoomAnalysis | null,
  userMessage: string,
  roomContext: 'Residential' | 'Commercial' = 'Residential'
): Promise<{ text: string; newGenerationPrompt?: string }> => {
  const ai = getAiClient();

  // Compress the image before sending to avoid XHR/RPC errors
  const optimizedImage = await compressBase64(currentImageBase64);

  // Provide deep context about what the "Real" room looks like
  const originalFeaturesContext = analysis 
    ? `
      Original Room Type: ${analysis.roomType}
      Original Authentic Materials (The "Before" state): ${analysis.architecturalFeatures.join(", ")}
      Current Context: ${roomContext}
      ` 
    : "Original features unknown.";

  const systemInstruction = `
    You are Lumina, an expert AI Interior Designer.
    
    CONTEXT:
    1. **Original Reality**: ${originalFeaturesContext}
    2. **Task**: You are modifying this space based on user requests.
    
    CRITICAL "DIRECTOR" LOGIC:
    You are not just chatting; you are directing an image generation model. When the user asks for a change, you must generate a 'newGenerationPrompt' that is EXTREMELY PRECISE.
    
    Rule 1: ISOLATION (The "Only" Rule)
    - If the user says "Change the rug", it IMPLIES "Keep the walls, floor, ceiling, and furniture EXACTLY as they are."
    - Your prompt MUST explicitly list what to PRESERVE.
    - Structure your prompt like this: "CHANGE [Target Element] to [New Style]. KEEP EXISTING [List of specific original elements to preserve]."
    
    Rule 2: RESTORATION
    - If the user says "Keep the floor" or "Restore the floor", you MUST look at 'Original Reality' (e.g., "Herringbone oak flooring") and instruct the generator to "Render the floor exactly as [Material Name] matching the original image."

    Rule 3: CONTEXT
    - If ${roomContext} is Commercial, DO NOT suggest beds or cozy home decor unless forced.
    - If ${roomContext} is Residential, DO NOT suggest office cubicles unless forced.

    Response Format (JSON):
    {
      "text": "Conversational response to user (be helpful and confirm exactly what you are keeping/changing)",
      "newGenerationPrompt": "Full detailed prompt for the image generator (or null if just chatting). Make this prompt self-contained."
    }
  `;

  // Construct history string
  const historyContext = history.map(h => `${h.role}: ${h.text}`).join(" | ");
  const prompt = `
    User Request: "${userMessage}"
    Conversation History: ${historyContext.substring(0, 2000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          // We send the COMPRESSED current image so the model sees the current state without hitting payload limits
          { inlineData: { mimeType: 'image/jpeg', data: optimizedImage } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            newGenerationPrompt: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      text: result.text || "I'm having trouble understanding that.",
      newGenerationPrompt: result.newGenerationPrompt
    };

  } catch (error) {
    console.error("Chat failed:", error);
    return { text: "I'm sorry, I couldn't process that request right now." };
  }
};

/**
 * Redesigns/Edits the room using Gemini 2.5 Flash Image.
 */
export const redesignRoomImage = async (base64Original: string, promptDescription: string): Promise<string> => {
  const ai = getAiClient();

  // Wrap prompt with "Anchor" instructions to prevent hallucinations
  const fullPrompt = `
    ${promptDescription}
    
    STRICT GENERATION CONSTRAINTS:
    1. PRESERVATION PRIORITY: If the prompt asks to "Retain", "Keep", "Existing", or "Preserve" an element, that specific area MUST remain visually identical to the input image (same material, texture, color).
    2. GEOMETRY: Do not change the room layout, window positions, or perspective.
    3. ISOLATION: Only modify the specific elements mentioned in the 'CHANGE' section of the prompt. Leave everything else untouched.
    4. STYLE: Photorealistic, 8k, high-end interior design photography.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Original
            }
          },
          { text: fullPrompt }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Redesign failed:", error);
    throw error;
  }
};

/**
 * Generates a completely new image from scratch using Imagen 4.0.
 */
export const generateNewImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    const mimeType = response.generatedImages?.[0]?.image?.mimeType || 'image/jpeg';
    
    if (imageBytes) {
      return `data:${mimeType};base64,${imageBytes}`;
    }
    throw new Error("No image generated from Imagen");
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};
