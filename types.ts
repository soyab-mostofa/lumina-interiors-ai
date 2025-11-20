export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SELECTION = 'SELECTION',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isSystemMessage?: boolean; // For status updates like "Generating new design..."
}

export interface SuggestedPrompt {
  title: string;
  description: string;
  prompt: string;
}

export interface RoomAnalysis {
  roomType: string;
  architecturalFeatures: string[];
  designIssues: string[];
  decorSuggestions: string[];
  suggestedPrompts: SuggestedPrompt[];
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  previewGradient: string; // Tailwind classes for background gradient
  textColor: string;
  iconColor: string;
}

export const DESIGN_STYLES: StyleOption[] = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean lines, neutral palette, clutter-free aesthetic.',
    promptSuffix: 'in a modern minimalist style, clean lines, neutral colors, decluttered, sleek furniture, soft natural lighting, architectural simplicity',
    previewGradient: 'from-slate-100 to-gray-200',
    textColor: 'text-slate-800',
    iconColor: 'text-slate-600'
  },
  {
    id: 'scandinavian-warm',
    name: 'Scandinavian Warm',
    description: 'Cozy textures, light woods, airy hygge feel.',
    promptSuffix: 'in a Scandinavian style, hygge atmosphere, light wood textures, cozy textiles, white walls, warm lighting, functional decor, organic shapes',
    previewGradient: 'from-orange-50 to-amber-100',
    textColor: 'text-amber-900',
    iconColor: 'text-amber-700'
  },
  {
    id: 'luxury-contemporary',
    name: 'Luxury Contemporary',
    description: 'High-end finishes, bold accents, polished look.',
    promptSuffix: 'in a luxury contemporary style, high-end finishes, marble accents, velvet textures, gold hardware, dramatic lighting, sophisticated, expensive look',
    previewGradient: 'from-slate-800 to-zinc-900',
    textColor: 'text-white',
    iconColor: 'text-zinc-300'
  },
  {
    id: 'japandi-calm',
    name: 'Japandi Calm',
    description: 'Fusion of Japanese rustic & Scandinavian.',
    promptSuffix: 'in a Japandi style, fusion of Japanese and Scandinavian aesthetics, natural materials, earth tones, low profile furniture, zen atmosphere, wabi-sabi',
    previewGradient: 'from-stone-100 to-stone-300',
    textColor: 'text-stone-800',
    iconColor: 'text-stone-600'
  },
  {
    id: 'industrial-chic',
    name: 'Industrial Chic',
    description: 'Exposed raw elements, metal, leather, urban.',
    promptSuffix: 'in an industrial chic style, exposed brick, metal accents, leather furniture, raw materials, urban loft aesthetic, dramatic shadows, statement lighting',
    previewGradient: 'from-zinc-300 to-slate-400',
    textColor: 'text-slate-900',
    iconColor: 'text-slate-800'
  },
  {
    id: 'bohemian-eclectic',
    name: 'Bohemian Eclectic',
    description: 'Layered patterns, plants, vibrant & artistic.',
    promptSuffix: 'in a bohemian eclectic style, layered patterns, abundant indoor plants, rattan furniture, warm colors, artistic decor, relaxed atmosphere, textured rugs',
    previewGradient: 'from-teal-50 to-emerald-100',
    textColor: 'text-teal-900',
    iconColor: 'text-emerald-700'
  }
];
