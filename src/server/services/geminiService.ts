import "server-only";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { env } from "~/env";
import type { RoomAnalysis, ChatMessage } from "~/types";

// Initialize API Client with server-side env
const getAiClient = () => new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// Helper to strip data URI prefix
const stripBase64Prefix = (base64: string) => base64.replace(/^data:image\/\w+;base64,/, "");

/**
 * Analyzes the room image using Gemini 2.5 Flash.
 * Accepts a contextHint to bias the analysis.
 */
export const analyzeRoomImage = async (
  base64Image: string,
  contextHint?: "Residential" | "Commercial"
): Promise<RoomAnalysis> => {
  const ai = getAiClient();

  const contextInstruction = contextHint
    ? `IMPORTANT: The user has explicitly identified this as a ${contextHint} space. Ensure all classification, design issues, and suggestions strictly align with a ${contextHint} environment.`
    : "";

  const prompt = `
    You are Lumina, a world-class Interior Designer.
    Analyze this interior image. ${contextInstruction}

    1. CLASSIFY the room accurately within the context of ${contextHint ?? "General"}.
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
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: stripBase64Prefix(base64Image) } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roomType: { type: Type.STRING },
            architecturalFeatures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            designIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            decorSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedPrompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    if (!response.text) throw new Error("No analysis returned");

    let parsed: RoomAnalysis;
    try {
      parsed = JSON.parse(response.text) as RoomAnalysis;
    } catch (e) {
      console.error("Failed to parse analysis JSON", e);
      return {
        roomType: "Room",
        architecturalFeatures: [],
        designIssues: [],
        decorSuggestions: [],
        suggestedPrompts: [],
      };
    }

    return {
      roomType: parsed.roomType ?? "Unknown Room",
      architecturalFeatures: Array.isArray(parsed.architecturalFeatures)
        ? parsed.architecturalFeatures
        : [],
      designIssues: Array.isArray(parsed.designIssues)
        ? parsed.designIssues
        : [],
      decorSuggestions: Array.isArray(parsed.decorSuggestions)
        ? parsed.decorSuggestions
        : [],
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts)
        ? parsed.suggestedPrompts
        : [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Analysis failed:", errorMessage);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
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
  roomContext: "Residential" | "Commercial" = "Residential"
): Promise<{ text: string; newGenerationPrompt?: string }> => {
  const ai = getAiClient();

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
  const historyContext = history.map((h) => `${h.role}: ${h.text}`).join(" | ");
  const prompt = `
    User Request: "${userMessage}"
    Conversation History: ${historyContext.substring(0, 2000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: { mimeType: "image/jpeg", data: stripBase64Prefix(currentImageBase64) },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            newGenerationPrompt: { type: Type.STRING },
          },
        },
      },
    });

    const result = JSON.parse(response.text ?? "{}") as {
      text?: string;
      newGenerationPrompt?: string;
    };
    return {
      text: result.text ?? "I'm having trouble understanding that.",
      newGenerationPrompt: result.newGenerationPrompt,
    };
  } catch (error) {
    console.error("Chat failed:", error);
    return {
      text: "I'm sorry, I couldn't process that request right now.",
    };
  }
};

/**
 * Redesigns/Edits the room using Gemini 2.5 Flash Image.
 */
export const redesignRoomImage = async (
  base64Original: string,
  promptDescription: string
): Promise<string> => {
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
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: stripBase64Prefix(base64Original),
            },
          },
          { text: fullPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      const mimeType = part.inlineData.mimeType ?? "image/png";
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
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "16:9",
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    const mimeType =
      response.generatedImages?.[0]?.image?.mimeType ?? "image/jpeg";

    if (imageBytes) {
      return `data:${mimeType};base64,${imageBytes}`;
    }
    throw new Error("No image generated from Imagen");
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};
