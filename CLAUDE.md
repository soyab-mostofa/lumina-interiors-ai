# CLAUDE.md - AI Assistant Guide for Lumina Interiors AI

## Project Overview

**Lumina Interiors AI** is a sophisticated React-based web application that leverages Google's Gemini AI models (Gemini 2.5 Flash, Gemini 2.5 Flash Image, and Imagen 4.0) to provide AI-powered interior design services. The application enables users to:

- Upload room photos for AI analysis and receive personalized design recommendations
- Generate photorealistic interior redesigns with before/after comparison
- Engage in iterative chat-based design refinement with an AI designer
- Create entirely new interior concepts from text descriptions

**Key Technologies**: React 19, TypeScript 5.8, Vite 6.2, Google GenAI SDK, Tailwind CSS

**Project Type**: Single Page Application (SPA) - AI-powered interior design tool

---

## Codebase Structure

```
lumina-interiors-ai/
├── components/              # React UI components
│   ├── AnalysisPanel.tsx   # Displays AI room analysis (structure, opportunities, fixes)
│   ├── BeforeAfterSlider.tsx # Interactive before/after image comparison slider
│   └── DesignerChat.tsx    # Chat interface for iterative design refinement
├── services/                # API and external service integration
│   └── geminiService.ts    # All Google GenAI API interactions (390 lines)
├── App.tsx                  # Main application component (41KB, central state management)
├── index.tsx                # React DOM entry point
├── types.ts                 # TypeScript type definitions and constants
├── index.html               # HTML template with Tailwind CSS and fonts
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
├── .gitignore              # Git ignore rules
├── .env.local              # Environment variables (GEMINI_API_KEY) - not in repo
└── README.md               # Documentation
```

### File Organization Principles

1. **Components**: React components live in `/components` - each component is self-contained
2. **Services**: External API integrations live in `/services` - pure functions, no React hooks
3. **Types**: All TypeScript interfaces, enums, and constants are in `types.ts`
4. **Root Level**: Main app logic (`App.tsx`), entry point (`index.tsx`), and configuration files

---

## Technology Stack

### Core Framework
- **React 19.2.0** - Latest React with concurrent features, hooks, and modern patterns
- **TypeScript 5.8.2** - Static typing with ES2022 target
- **Vite 6.2.0** - Build tool and dev server (fast HMR, ESM-first)

### AI/ML Integration
- **@google/genai 1.30.0** - Google's GenAI SDK
  - **Gemini 2.5 Flash** - Text analysis, structured JSON responses, chat interactions
  - **Gemini 2.5 Flash Image** - Image transformation (redesign existing rooms)
  - **Imagen 4.0** - Text-to-image generation (create new interiors from scratch)

### UI & Styling
- **Tailwind CSS** - Utility-first CSS (via CDN in index.html)
- **Lucide React 0.554.0** - Icon library with 550+ icons
- **Google Fonts** - "Plus Jakarta Sans" font family
- **Custom Animations** - Defined in index.html (fade-in, slide-up, scale-in, pulse-slow)

### Build & Development
- **Node.js** - Runtime environment (version 16+ recommended)
- **npm/pnpm** - Package manager (pnpm preferred for speed)
- **@vitejs/plugin-react** - Vite plugin for React with Fast Refresh

---

## Development Workflows

### Initial Setup

```bash
# 1. Install dependencies
npm install
# or
pnpm install

# 2. Create .env.local file and add your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 3. Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build (outputs to /dist)
npm run preview  # Preview production build locally
```

### Development Server
- **Port**: 3000
- **Host**: 0.0.0.0 (accessible on network)
- **Hot Module Replacement (HMR)**: Enabled via Vite
- **Environment Variables**: Loaded from `.env.local` via Vite's `loadEnv`

### Building for Production

```bash
npm run build
```

**Output**: `/dist` directory with optimized bundles
- Code splitting and tree-shaking enabled
- ES modules for modern browsers
- Environment variables injected at build time

### Environment Variables

Required environment variable in `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: The API key is injected at build time via Vite's `define` config. In production, consider proxying API requests through a backend to avoid exposing the key.

---

## Architecture & Patterns

### Application Architecture

**Pattern**: Component-based architecture with centralized state management in `App.tsx`

```
User Interface (App.tsx)
    ├── Tab Navigation (Redesign Room / Create New)
    ├── State Management (redesignState, generateState)
    └── Components
        ├── BeforeAfterSlider (visual comparison)
        ├── AnalysisPanel (AI analysis display)
        └── DesignerChat (iterative refinement)
                    ↓
Service Layer (geminiService.ts)
    ├── Image processing (base64 conversion, compression)
    ├── AI API calls (Gemini 2.5 Flash, Flash Image, Imagen 4.0)
    └── Prompt engineering (context-aware, structured)
                    ↓
Google GenAI API
```

### State Management

**Approach**: React useState hooks in `App.tsx` - no external state management library

**Key State Variables**:
```typescript
// Redesign flow state
redesignState: AppState  // IDLE → ANALYZING → SELECTION → GENERATING → COMPLETE

// Generate flow state
generateState: AppState  // IDLE → GENERATING → COMPLETE

// Data state
originalImage: string | null       // Base64 of uploaded image
redesignedImage: string | null     // Base64 of generated redesign
generatedImage: string | null      // Base64 of text-to-image result
roomAnalysis: RoomAnalysis | null  // AI analysis results
chatHistory: ChatMessage[]         // Chat conversation history
```

### State Flow - Redesign Room

```
1. IDLE (Initial state)
   - User uploads image → setOriginalImage()
   - Transitions to ANALYZING

2. ANALYZING
   - Calls analyzeRoomImage() with context hint
   - Receives RoomAnalysis (room type, features, issues, suggestions)
   - Transitions to SELECTION

3. SELECTION
   - User chooses style (preset, AI-suggested, or custom)
   - Transitions to GENERATING

4. GENERATING
   - Calls redesignRoomImage() with style prompt
   - Receives transformed image
   - Transitions to COMPLETE

5. COMPLETE
   - Displays BeforeAfterSlider
   - Chat refinement available via DesignerChat
   - Options: Try another style (→ SELECTION) or Reset (→ IDLE)
```

### Component Architecture

**Design Philosophy**: Presentational components with props-based communication

1. **App.tsx** - Container component (stateful)
   - Manages all application state
   - Handles API calls via geminiService
   - Renders child components with props

2. **BeforeAfterSlider** - Presentational component
   - Receives: `beforeImage`, `afterImage`
   - Manages: Internal slider position state
   - No API calls or business logic

3. **AnalysisPanel** - Presentational component
   - Receives: `analysis` object
   - Displays: Structured analysis in three sections
   - No state or side effects

4. **DesignerChat** - Semi-smart component
   - Receives: Multiple props including images, analysis, callbacks
   - Manages: Internal chat UI state
   - Calls: Parent callbacks for message sending and regeneration

---

## Key Conventions

### File Naming
- **Components**: PascalCase with `.tsx` extension (e.g., `BeforeAfterSlider.tsx`)
- **Services**: camelCase with `.ts` extension (e.g., `geminiService.ts`)
- **Types**: camelCase (e.g., `types.ts`)
- **Config**: Lowercase with dots (e.g., `vite.config.ts`, `tsconfig.json`)

### Code Style

**TypeScript**:
- Always use explicit types for function parameters and return values
- Use interfaces for object shapes
- Use enums for state machines (e.g., `AppState`)
- Enable strict mode (implicit via TypeScript 5.8 defaults)

**React**:
- Functional components only (no class components)
- Hooks for state and side effects
- Props destructuring in function signatures
- Event handlers prefixed with `handle` (e.g., `handleUpload`, `handleStyleSelect`)

**Async Operations**:
```typescript
// Always use try-catch for async calls
try {
  const result = await geminiService.analyzeRoomImage(base64, context);
  // Handle success
} catch (error) {
  console.error('Analysis failed:', error);
  // Handle error - update state, show user-friendly message
}
```

**Imports**:
```typescript
// Order: External libraries → Internal modules → Types → Assets
import { useState, useEffect } from 'react';
import { Sparkles, Camera } from 'lucide-react';
import * as geminiService from './services/geminiService';
import { AppState, RoomAnalysis } from './types';
```

### Component Patterns

**Props Interface Pattern**:
```typescript
interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: number;
  callbackProp: (data: SomeType) => void;
}

export function ComponentName({ requiredProp, optionalProp = 10, callbackProp }: ComponentNameProps) {
  // Component implementation
}
```

**Conditional Rendering Pattern**:
```typescript
// Prefer early returns for clarity
if (appState === AppState.IDLE) {
  return <UploadScreen />;
}

if (appState === AppState.ANALYZING) {
  return <LoadingSpinner />;
}

// Main render for primary state
return <MainContent />;
```

---

## AI Integration Details

### Service Layer: `geminiService.ts`

All AI interactions are encapsulated in this service module. It exports pure functions (no React dependencies).

**Key Functions**:

#### 1. `analyzeRoomImage(base64Image: string, contextHint: string): Promise<RoomAnalysis>`
- **Purpose**: Analyze uploaded room image for features, issues, and design opportunities
- **AI Model**: Gemini 2.5 Flash (vision + structured output)
- **Input**: Base64 image (max 768px) + context ("Residential" or "Commercial")
- **Output**: Structured JSON with room type, architectural features, design issues, decor suggestions, and 3 suggested prompts
- **Error Handling**: Falls back to default analysis if JSON parsing fails

#### 2. `redesignRoomImage(base64Image: string, promptDescription: string): Promise<string>`
- **Purpose**: Transform room image with specified design style
- **AI Model**: Gemini 2.5 Flash Image
- **Input**: Original base64 image + detailed style prompt
- **Output**: Base64 transformed image
- **Constraints**: Preserves room geometry and layout, applies style changes only
- **Prompt Engineering**: Includes strict instructions to maintain structure and perspective

#### 3. `generateNewImage(prompt: string): Promise<string>`
- **Purpose**: Generate new interior concepts from text descriptions
- **AI Model**: Imagen 4.0
- **Input**: Text description of desired interior
- **Output**: Base64 generated image (16:9 aspect ratio, JPEG)
- **Use Case**: "Create New" tab for generating interiors from scratch

#### 4. `getDesignerChatResponse(history, images, analysis, userMessage): Promise<ChatResponse>`
- **Purpose**: Iterative chat-based design refinement
- **AI Model**: Gemini 2.5 Flash (vision + conversation)
- **Features**:
  - **Director Logic**: Precise change generation with CHANGE vs KEEP instructions
  - **Context Memory**: Maintains conversation history and room context
  - **Preservation Rules**: Respects original room features unless explicitly changed
- **Returns**: Both conversational text AND generation prompt (if regeneration needed)

#### 5. `fileToBase64(file: File): Promise<string>`
- **Purpose**: Convert uploaded File to base64 with optimization
- **Optimization**: Resizes to max 768px dimension, 0.6 JPEG quality
- **Prevents**: Payload size errors when sending to API

#### 6. `compressBase64(base64: string): Promise<string>`
- **Purpose**: Aggressive compression for chat context images
- **Optimization**: Resizes to max 512px, 0.5 JPEG quality
- **Use Case**: Reduce payload size when sending images in chat API calls

### AI Prompt Engineering Principles

**For Image Analysis**:
- Provide context hints (Residential/Commercial) to improve accuracy
- Request structured JSON output with specific schema
- Include examples in system instructions

**For Image Transformation**:
- Emphasize preservation of layout, geometry, and perspective
- Use detailed style descriptions with specific materials and lighting
- Add constraints like "maintain room dimensions" and "keep window positions"

**For Chat Refinement**:
- Implement "Director Logic" for precise change control
- Use CHANGE vs KEEP language to specify what to modify
- Maintain room context and original features in system instructions
- Include conversation history for coherent responses

---

## Component Structure

### App.tsx (Main Application)

**Responsibilities**:
- Tab navigation between "Redesign Room" and "Create New"
- State management for both flows
- API orchestration via geminiService
- Error handling and user feedback

**Key Sections**:
1. **State Declarations** - All application state
2. **Handler Functions** - Event handlers for user actions
3. **Render Logic** - Conditional rendering based on state
4. **Tab Content** - Redesign flow vs Generate flow

**State Machine** (Redesign Flow):
```
IDLE → ANALYZING → SELECTION → GENERATING → COMPLETE
  ↑                                            ↓
  └────────────── Reset ─────────────────────┘
                      ↓
              Try Another Style
                      ↓
                  SELECTION
```

### BeforeAfterSlider.tsx

**Purpose**: Interactive comparison of before/after images

**Features**:
- Drag slider to compare images
- Touch support for mobile devices
- Percentage-based position tracking
- Smooth clipping animation
- Visual indicator line

**Props**:
```typescript
interface BeforeAfterSliderProps {
  beforeImage: string;  // Base64 or URL
  afterImage: string;   // Base64 or URL
}
```

**State**:
- `sliderPosition`: number (0-100) - Current slider percentage

### AnalysisPanel.tsx

**Purpose**: Display AI-generated room analysis

**Features**:
- Three-section layout (Structure, Opportunities, Fixes)
- Icon-enhanced sections
- List-based presentation
- Responsive design

**Props**:
```typescript
interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}
```

**No internal state** - Pure presentational component

### DesignerChat.tsx

**Purpose**: Chat interface for iterative design refinement

**Features**:
- Message history display
- User input with send button
- Typing indicator during AI response
- System messages for status updates
- Automatic scrolling to latest message

**Props**:
```typescript
interface DesignerChatProps {
  roomAnalysis: RoomAnalysis | null;
  originalImage: string | null;
  currentImage: string | null;
  onSendMessage: (message: string) => Promise<void>;
  onRegenerateImage: (prompt: string) => Promise<void>;
}
```

**Internal State**:
- `isOpen`: boolean - Chat widget open/closed
- `inputValue`: string - Current message input
- `chatHistory`: ChatMessage[] - Full conversation
- `isAiTyping`: boolean - Loading indicator

---

## Working with the Codebase

### Guidelines for AI Assistants

When working with this codebase, follow these principles:

#### 1. **Understand the State Flow**
   - Always check which `AppState` the user is in before making changes
   - Respect state transitions (don't skip states)
   - Update state atomically (don't leave partial states)

#### 2. **Maintain Type Safety**
   - Use existing types from `types.ts`
   - Create new interfaces if needed, but add them to `types.ts`
   - Never use `any` type unless absolutely necessary
   - Prefer explicit types over type inference for function signatures

#### 3. **API Call Patterns**
   - All API calls go through `geminiService.ts` - never call Google APIs directly from components
   - Always wrap API calls in try-catch blocks
   - Handle errors gracefully with user-friendly messages
   - Show loading states during async operations

#### 4. **Component Modifications**
   - Keep components focused on single responsibilities
   - Prefer props over context for data passing (current architecture)
   - Don't add external state management unless absolutely necessary
   - Maintain consistent prop naming with existing components

#### 5. **Image Handling**
   - Always compress images before API calls (use `fileToBase64` or `compressBase64`)
   - Store images as base64 strings in state
   - Be mindful of payload size limits
   - Use aggressive compression for chat context (512px max)

#### 6. **Prompt Engineering**
   - Study existing prompts in `geminiService.ts` before creating new ones
   - Maintain consistency in prompt structure
   - Use structured output (JSON) when possible
   - Include preservation constraints for image transformations

#### 7. **Error Handling**
   - Set `AppState.ERROR` when critical operations fail
   - Log errors to console for debugging
   - Display user-friendly error messages
   - Provide recovery options (reset, retry)

#### 8. **Performance Considerations**
   - Don't block UI during long operations - use loading states
   - Optimize images before sending to API
   - Avoid unnecessary re-renders (use React.memo if needed)
   - Keep bundle size small (tree-shaking via Vite)

---

## Common Tasks

### Adding a New Design Style

1. **Update `types.ts`**:
```typescript
export const DESIGN_STYLES: StyleOption[] = [
  // ... existing styles
  {
    id: 'new-style-id',
    name: 'New Style Name',
    description: 'Brief description for users',
    promptSuffix: 'detailed prompt describing style, materials, lighting, atmosphere',
    previewGradient: 'from-color-100 to-color-200',  // Tailwind classes
    textColor: 'text-color-900',
    iconColor: 'text-color-700'
  }
];
```

2. **No other changes needed** - The style will automatically appear in the selection UI

### Modifying AI Analysis Output

1. **Update prompt in `geminiService.ts`** - `analyzeRoomImage()` function
2. **Update `RoomAnalysis` interface in `types.ts`** if structure changes
3. **Update `AnalysisPanel.tsx`** to display new fields

### Adding a New Tab

1. **Add state in `App.tsx`**:
```typescript
const [activeTab, setActiveTab] = useState<'redesign' | 'create' | 'newTab'>('redesign');
```

2. **Add tab button in render**:
```tsx
<button onClick={() => setActiveTab('newTab')}>New Tab</button>
```

3. **Add conditional render**:
```tsx
{activeTab === 'newTab' && (
  <div>New tab content</div>
)}
```

### Integrating a New AI Model

1. **Add function to `geminiService.ts`**:
```typescript
export async function newAIFunction(input: string): Promise<Output> {
  const genai = new GoogleGenAI(process.env.GEMINI_API_KEY!);
  const model = genai.getModel('model-name');

  try {
    const result = await model.generateContent(input);
    return processResult(result);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

2. **Add types to `types.ts`** if needed

3. **Call from component**:
```typescript
const handleNewAI = async () => {
  setAppState(AppState.GENERATING);
  try {
    const result = await geminiService.newAIFunction(input);
    // Handle result
    setAppState(AppState.COMPLETE);
  } catch (error) {
    console.error('Failed:', error);
    setAppState(AppState.ERROR);
  }
};
```

### Modifying Chat Behavior

1. **Update `getDesignerChatResponse()` in `geminiService.ts`**
   - Modify system instructions for AI personality/behavior
   - Adjust "Director Logic" rules for change detection
   - Update prompt structure for different responses

2. **Update `DesignerChat.tsx` if UI changes needed**
   - Modify message rendering
   - Add new message types
   - Adjust styling or interactions

### Environment Configuration

**Development**:
- Create `.env.local` with `GEMINI_API_KEY=your_key`
- Vite auto-loads during `npm run dev`

**Production**:
- Set environment variables in hosting platform
- Vite injects at build time via `define` config
- **Security Note**: Consider backend proxy to hide API key

---

## Important Notes

### Security Considerations

1. **API Key Exposure**:
   - Current setup: API key injected at build time, visible in client bundle
   - **Recommendation**: Implement backend API proxy for production
   - Never commit `.env.local` to version control

2. **Input Validation**:
   - File upload: Check file type and size
   - Text inputs: Sanitize before sending to API
   - Currently minimal validation - consider adding more for production

3. **Rate Limiting**:
   - Google GenAI has rate limits
   - Consider implementing client-side throttling/debouncing
   - Add rate limit error handling

### Performance Optimization

1. **Image Compression**:
   - Upload images: Max 768px, 0.6 quality
   - Chat context: Max 512px, 0.5 quality
   - Prevents API payload errors and reduces latency

2. **Bundle Size**:
   - Tailwind CSS via CDN (not bundled)
   - Vite code splitting enabled
   - Tree-shaking removes unused code
   - Current bundle size is minimal

3. **Loading States**:
   - Always show loading indicators during API calls
   - Use skeleton screens or spinners
   - Provide progress feedback for long operations

### Known Limitations

1. **API Key Security**: Client-side API key exposure (see Security section)
2. **Image Size Limits**: Large images may fail API calls despite compression
3. **No Backend**: All logic in frontend - no database, no user accounts
4. **No Error Retry**: Failed API calls don't auto-retry
5. **Session Persistence**: No local storage - refreshing loses state

### Browser Compatibility

- **Target**: Modern browsers with ES2022 support
- **Modules**: ES modules only (not compatible with IE11)
- **Tested**: Chrome, Firefox, Safari (latest versions)
- **Mobile**: Responsive design, touch events supported

---

## Testing Approach

**Current State**: No automated tests in the codebase

**Recommendations for Adding Tests**:

1. **Unit Tests** - Service layer (`geminiService.ts`)
   - Mock Google GenAI API responses
   - Test image compression logic
   - Test base64 conversion

2. **Component Tests** - React components
   - Test BeforeAfterSlider drag functionality
   - Test AnalysisPanel rendering with different data
   - Test DesignerChat message flow

3. **Integration Tests** - Full user flows
   - Upload → Analyze → Select Style → Generate
   - Chat refinement flow
   - Text-to-image generation

**Suggested Tools**:
- **Vitest** (fast, Vite-native test runner)
- **React Testing Library** (component testing)
- **MSW** (Mock Service Worker for API mocking)

---

## Deployment

### Recommended Platforms

1. **Vercel** (Recommended for Vite apps)
   ```bash
   npm run build
   # Deploy /dist folder
   ```
   - Set `GEMINI_API_KEY` in environment variables
   - Automatic deployments from Git

2. **Netlify**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Set environment variables in dashboard

3. **Firebase Hosting**
   ```bash
   npm run build
   firebase deploy
   ```

### Build Configuration

**Vite Production Build**:
- Minification: Enabled by default
- Source maps: Disabled in production
- Environment variables: Injected via `define`
- Output: `/dist` directory

**Environment Variables**:
```
GEMINI_API_KEY=your_production_api_key
```

---

## Quick Reference

### File Locations

| What | Where |
|------|-------|
| Main app logic | `/App.tsx` |
| API calls | `/services/geminiService.ts` |
| Type definitions | `/types.ts` |
| UI components | `/components/*.tsx` |
| Build config | `/vite.config.ts` |
| TypeScript config | `/tsconfig.json` |
| Environment vars | `/.env.local` (not in repo) |

### Key State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `redesignState` | AppState | Current state in redesign flow |
| `generateState` | AppState | Current state in generate flow |
| `originalImage` | string \| null | Base64 of uploaded image |
| `redesignedImage` | string \| null | Base64 of generated redesign |
| `generatedImage` | string \| null | Base64 of text-to-image result |
| `roomAnalysis` | RoomAnalysis \| null | AI analysis results |
| `chatHistory` | ChatMessage[] | Chat conversation |

### AppState Enum Values

```typescript
IDLE       // Initial state, waiting for user input
ANALYZING  // Processing uploaded image
SELECTION  // Waiting for style selection
GENERATING // Generating design
COMPLETE   // Design complete, showing results
ERROR      // Error occurred
```

### Common Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
git status               # Check git status
git add .                # Stage changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
```

---

## Best Practices Summary

### Do's ✅

- Always use TypeScript with explicit types
- Keep API logic in `geminiService.ts`
- Compress images before sending to API
- Show loading states during async operations
- Handle errors gracefully with user feedback
- Follow existing code patterns and conventions
- Test changes locally before committing
- Write clear commit messages
- Update this CLAUDE.md when architecture changes

### Don'ts ❌

- Don't call Google APIs directly from components
- Don't skip state transitions in AppState flow
- Don't use `any` type without good reason
- Don't commit `.env.local` or API keys
- Don't add dependencies without consideration
- Don't break existing component interfaces
- Don't ignore TypeScript errors
- Don't leave console.log statements in production code
- Don't modify configuration files without testing

---

## Conclusion

This codebase follows modern React and TypeScript best practices with a focus on:
- **Clean architecture** with separated concerns
- **Type safety** throughout the application
- **User experience** with smooth interactions and feedback
- **AI integration** with sophisticated prompt engineering
- **Performance** through optimization and lazy loading

When making changes, always consider the impact on:
1. Type safety (TypeScript errors)
2. State management (AppState flow)
3. User experience (loading states, error handling)
4. Performance (image optimization, bundle size)
5. Maintainability (code clarity, documentation)

For questions or clarifications, refer to the source code comments and this documentation. Happy coding! 🚀
