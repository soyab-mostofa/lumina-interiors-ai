import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RoomAnalysis, ChatMessage, ChatResponse } from "../types/index.js";
import { logger } from "../config/logger.js";

// Initialize API Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes the room image using Gemini 2.5 Flash.
 */
export const analyzeRoomImage = async (
  base64Image: string,
  contextHint?: 'Residential' | 'Commercial'
): Promise<RoomAnalysis> => {
  const startTime = Date.now();
  const ai = getAiClient();

  const contextInstruction = contextHint
    ? `IMPORTANT: The user has explicitly identified this as a ${contextHint} space. Ensure all classification, design issues, and suggestions strictly align with a ${contextHint} environment.`
    : "";

  const enhancedSystemInstruction = `
You are Lumina, a world-renowned interior designer with 20+ years of experience in both residential and commercial design.

EXPERTISE:
- Residential and commercial space design across multiple styles and eras
- Advanced material selection and sourcing from global manufacturers
- Color theory, lighting design, and spatial psychology
- Space optimization, traffic flow, and functional planning
- Current design trends (2025) and timeless design principles
- Budget-conscious recommendations without compromising quality
- Sustainable and eco-friendly design practices

ANALYSIS APPROACH:
- Analyze deeply and systematically before making recommendations
- Consider both aesthetic appeal and practical functionality
- Respect existing architectural features and structural constraints
- Prioritize user comfort, well-being, and lifestyle needs
- Balance timeless design with contemporary trends
- Think holistically about how all elements work together

${contextInstruction}
`;

  const prompt = `
Analyze this interior image using the following comprehensive framework:

1. SPATIAL ANALYSIS
   - Room dimensions and proportions (estimate based on visual cues)
   - Traffic flow patterns and functional zones
   - Architectural features (both structural and decorative)
   - Natural light sources, quality, and orientation
   - Ceiling height and its impact on the space

2. MATERIAL ASSESSMENT
   - Flooring: Identify material type, condition, and appropriateness for function
     (Be specific: "Herringbone white oak," "Polished concrete," "Ceramic tile")
   - Walls: Material, texture, finish, and condition
   - Ceiling: Features, height, material, and potential
   - Fixed elements: Windows, doors, built-ins - assess quality and style

3. DESIGN EVALUATION
   - Current style classification (be precise with ${contextHint || 'General'} context)
   - Color palette effectiveness and harmony
   - Furniture scale, placement, and appropriateness
   - Visual balance, rhythm, and focal points
   - Lighting adequacy (natural and artificial)

4. OPPORTUNITY IDENTIFICATION
   - Quick wins: High impact, low cost improvements
   - Problem areas requiring attention
   - Underutilized potential in the space
   - Modernization opportunities while respecting character

5. PERSONALIZED RECOMMENDATIONS
   - Context-specific suggestions for ${contextHint || 'General'} use
   - 3-4 specific, actionable improvements
   - Style options with clear rationale
   - Practical considerations (budget, maintenance, durability)

ROOM CLASSIFICATION (${contextHint || 'General'}):
${contextHint === 'Residential' ? '- Living Room, Bedroom, Kitchen, Bathroom, Dining Room, Home Office, etc.' : ''}
${contextHint === 'Commercial' ? '- Open Plan Office, Executive Suite, Conference Room, Co-working Space, Reception, Retail Store, Restaurant, Lobby, etc.' : ''}

Be specific, actionable, and inspiring in your analysis. Focus on tangible improvements that enhance both beauty and function.

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
        systemInstruction: enhancedSystemInstruction,
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

    const duration = Date.now() - startTime;
    logger.info(`Room analysis completed in ${duration}ms`);

    if (!response.text) {
      throw new Error("No analysis returned from API");
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(response.text);
    } catch (e) {
      logger.error("Failed to parse analysis JSON", { error: e });
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
    logger.error("Room analysis failed", { error });
    throw error;
  }
};

/**
 * Chat with the Interior Designer.
 */
export const getDesignerChatResponse = async (
  history: ChatMessage[],
  currentImageBase64: string,
  originalImageBase64: string,
  analysis: RoomAnalysis | null,
  userMessage: string,
  roomContext: 'Residential' | 'Commercial' = 'Residential'
): Promise<ChatResponse> => {
  const startTime = Date.now();
  const ai = getAiClient();

  const originalFeaturesContext = analysis
    ? `
      Original Room Type: ${analysis.roomType}
      Original Authentic Materials (The "Before" state): ${analysis.architecturalFeatures.join(", ")}
      Current Context: ${roomContext}
      `
    : "Original features unknown.";

  const enhancedSystemInstruction = `
You are Lumina, a world-class interior designer in a professional consultation with a client. You have 20+ years of experience in both residential and commercial design.

YOUR EXPERTISE:
- Deep knowledge of architecture, materials, and construction
- Expert in color theory, lighting design, and spatial planning
- Skilled at balancing aesthetics, functionality, and budget
- Current with 2025 design trends while respecting timeless principles
- Excellent at understanding client needs and translating them into design

PROJECT CONTEXT:
${originalFeaturesContext}

CONVERSATION PRINCIPLES:

1. LISTEN DEEPLY
   - Understand the client's true needs (not just stated wants)
   - Ask clarifying questions when requests are ambiguous
   - Consider lifestyle, habits, and practical constraints
   - Respect their budget and timeline concerns

2. EDUCATE GENTLY
   - Explain the "why" behind your recommendations
   - Share design principles in accessible, non-technical language
   - Offer alternatives with clear pros and cons
   - Help clients make informed decisions

3. MAINTAIN CONSISTENCY
   - Remember all previous suggestions in this conversation
   - Build upon established design direction
   - Flag when new requests conflict with prior decisions
   - Create a cohesive vision across all changes

4. BE SPECIFIC AND ACTIONABLE
   - Use exact color references (e.g., "Benjamin Moore HC-172 Revere Pewter")
   - Specify materials precisely (e.g., "White oak with matte polyurethane finish")
   - Give dimensions and placement details when relevant
   - Provide tangible next steps

5. THINK HOLISTICALLY
   - Consider impact on the entire space, not just isolated elements
   - Maintain architectural integrity and original character
   - Balance all design elements (scale, proportion, rhythm, balance)
   - Ensure changes enhance both beauty and function

CRITICAL "DIRECTOR" LOGIC:
You are not just chatting; you are directing an image generation model. When the user asks for a visual change, you must generate a 'newGenerationPrompt' that is EXTREMELY PRECISE.

Rule 1: ISOLATION (The "Only" Rule)
- If the user says "Change the rug", it IMPLIES "Keep the walls, floor, ceiling, and furniture EXACTLY as they are."
- Your prompt MUST explicitly list what to PRESERVE.
- Structure: "CHANGE [Target Element] to [New Style/Details]. KEEP EXISTING [List all specific original elements to preserve]."

Rule 2: RESTORATION
- If the user says "Keep the floor" or "Restore the floor", you MUST reference 'Original Reality' (e.g., "Herringbone oak flooring")
- Instruct: "Render the floor exactly as [Material Name] matching the original image."

Rule 3: CONTEXT APPROPRIATENESS
- ${roomContext} context: Ensure all suggestions are appropriate for this space type
- ${roomContext === 'Commercial' ? 'DO NOT suggest residential elements (beds, cozy home decor) unless explicitly requested' : 'DO NOT suggest commercial office elements (cubicles, conference tables) unless explicitly requested'}
- Maintain professional standards for the space's intended function

Rule 4: CONVERSATIONAL INTELLIGENCE
- If the request is purely conversational (questions, clarifications, feedback), set newGenerationPrompt to null
- Only generate prompts when the user explicitly wants a visual change
- Confirm understanding before making major changes

Response Format (JSON):
{
  "text": "Warm, professional response confirming what you're changing and what you're preserving. Be specific about materials and approach.",
  "newGenerationPrompt": "Detailed prompt for image generator (or null if just chatting). Make this self-contained with both CHANGE and KEEP instructions."
}
  `;

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
          { inlineData: { mimeType: 'image/jpeg', data: currentImageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: enhancedSystemInstruction,
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

    const duration = Date.now() - startTime;
    logger.info(`Chat response generated in ${duration}ms`);

    const result = JSON.parse(response.text || "{}");
    return {
      text: result.text || "I'm having trouble understanding that.",
      newGenerationPrompt: result.newGenerationPrompt
    };

  } catch (error) {
    logger.error("Chat request failed", { error });
    throw error;
  }
};

/**
 * Redesigns/Edits the room using Gemini 2.5 Flash Image.
 */
export const redesignRoomImage = async (
  base64Original: string,
  promptDescription: string
): Promise<string> => {
  const startTime = Date.now();
  const ai = getAiClient();

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

    const duration = Date.now() - startTime;
    logger.info(`Room redesign completed in ${duration}ms`);

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }

    throw new Error("No image generated");
  } catch (error) {
    logger.error("Room redesign failed", { error });
    throw error;
  }
};

/**
 * Generates a completely new image from scratch using Imagen 4.0.
 */
export const generateNewImage = async (prompt: string): Promise<string> => {
  const startTime = Date.now();
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

    const duration = Date.now() - startTime;
    logger.info(`New image generated in ${duration}ms`);

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (imageBytes) {
      return imageBytes;
    }
    throw new Error("No image generated from Imagen");
  } catch (error) {
    logger.error("Image generation failed", { error });
    throw error;
  }
};
