# Lumina Interiors AI

<div align="center">

**An AI-Powered Interior Design Assistant**

Transform your spaces with photorealistic AI-generated redesigns, powered by Google Gemini 2.5 Flash & Imagen 4.0

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19.2-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![Security](https://img.shields.io/badge/Security-A-brightgreen)

[Demo](https://ai.studio/apps/drive/1Hs0owFP08RSvb1hpdV5OH0aO_pdimA4L) • [Report Bug](https://github.com/soyab-mostofa/lumina-interiors-ai/issues) • [Request Feature](https://github.com/soyab-mostofa/lumina-interiors-ai/issues)

</div>

---

## ✨ Features

### Core Functionality
- 🏠 **Room Analysis** - AI analyzes architectural features, identifies issues, and suggests improvements
- 🎨 **Style Selection** - 6 preset styles + AI-recommended options + custom prompts
- 🖼️ **Before/After Comparison** - Interactive slider to compare original vs redesigned spaces
- 💬 **AI Chat Designer** - Conversational interface for iterative refinements
- 🌟 **Text-to-Image** - Generate entirely new spaces from text descriptions

### User Experience Enhancements (New!)
- 📎 **Drag & Drop Upload** - Intuitive file uploading with visual feedback
- ⌨️ **Keyboard Shortcuts** - Power user features (Cmd/Ctrl + K to view all)
- 🔔 **Toast Notifications** - Real-time feedback for all operations
- 📊 **Progress Indicators** - Smooth progress bars during generation
- 💀 **Skeleton Loaders** - Prevent layout shifts during loading
- 🎯 **Quick Actions** - Pre-built prompts in chat for common tasks
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- ✨ **Smooth Animations** - Polished transitions throughout

### Security & Performance
- 🔒 **Secure Backend Proxy** - API keys never exposed to frontend
- 🛡️ **Rate Limiting** - 100 req/15min general, 10 req/hour for images
- ✅ **Input Validation** - File type, size, and content validation
- 🚦 **Request Cancellation** - Abort in-flight requests on navigation
- 🎭 **Error Handling** - Graceful error recovery with user-friendly messages

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **pnpm** (or npm)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/soyab-mostofa/lumina-interiors-ai.git
cd lumina-interiors-ai
```

#### 2. Install Dependencies

**Frontend:**
```bash
pnpm install
```

**Backend:**
```bash
cd server
pnpm install
cd ..
```

#### 3. Configure Environment Variables

**Frontend** (`.env.local`):
```bash
cp .env.example .env.local
# Edit .env.local - usually no changes needed
```

**Backend** (` server/.env`):
```bash
cd server
cp .env.example .env
# Edit server/.env and add your GEMINI_API_KEY
```

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

The app will be available at:
- 🌐 Frontend: `http://localhost:3000`
- 🔧 Backend API: `http://localhost:3001`
- 💚 Health Check: `http://localhost:3001/api/health`

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Show keyboard shortcuts |
| `Cmd/Ctrl + U` | Upload image |
| `Cmd/Ctrl + Enter` | Generate/Redesign |
| `Cmd/Ctrl + /` | Toggle chat |
| `Cmd/Ctrl + R` | Reset and start over |
| `Escape` | Close modals |

*Press `Cmd/Ctrl + K` in the app to see all shortcuts!*

---

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **React 19.2** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool & dev server
- **Tailwind CSS 3** - Styling
- **Lucide React** - Icon library

#### Backend
- **Node.js + Express** - API server
- **TypeScript** - Type safety
- **Google Gemini SDK** - AI integration
- **Winston** - Structured logging
- **Helmet.js** - Security headers
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation

### Project Structure
```
lumina-interiors-ai/
├── components/          # React components
│   ├── AnalysisPanel.tsx
│   ├── BeforeAfterSlider.tsx
│   ├── DesignerChat.tsx
│   ├── Toast.tsx
│   ├── ProgressBar.tsx
│   └── SkeletonLoader.tsx
├── services/            # Frontend API client
│   └── geminiService.ts
├── server/              # Backend proxy server
│   ├── src/
│   │   ├── config/      # Configuration (logger)
│   │   ├── middleware/  # Validators, error handlers
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Gemini API integration
│   │   └── types/       # TypeScript interfaces
│   └── package.json
├── App.tsx              # Main application
├── types.ts             # TypeScript definitions
└── README.md
```

---

## 🔐 Security

### Implemented Security Measures

✅ **API Key Protection** - Keys stored server-side only, never in frontend
✅ **Rate Limiting** - Prevents abuse and controls costs
✅ **Input Validation** - File type (images only), size (10MB max), prompt length (2000 chars)
✅ **Security Headers** - Helmet.js (CSP, X-Frame-Options, etc.)
✅ **CORS Configuration** - Restrict cross-origin requests
✅ **Error Handling** - No sensitive data leaked in errors
✅ **Request Cancellation** - Prevent abandoned requests

### Security Score: 8/10

**Remaining Items** (See `IMPLEMENTATION_PLAN.md`):
- [ ] User authentication (OAuth 2.0)
- [ ] Content Security Policy (remove CDN dependencies)
- [ ] HTTPS/TLS in production

---

## 📖 API Documentation

### Backend Endpoints

#### `POST /api/v1/analyze`
Analyze a room image and extract features.

**Request:**
```json
{
  "imageBase64": "base64_encoded_image",
  "context": "Residential" | "Commercial"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomType": "Living Room",
    "architecturalFeatures": ["Hardwood floors", "Large windows"],
    "designIssues": ["Poor lighting", "Cluttered"],
    "decorSuggestions": ["Add plants", "Update curtains"],
    "suggestedPrompts": [...]
  }
}
```

#### `POST /api/v1/redesign`
Generate a redesigned version of the room.

**Request:**
```json
{
  "imageBase64": "base64_encoded_image",
  "prompt": "Modern minimalist style with white walls"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageBase64": "base64_generated_image"
  }
}
```

#### `POST /api/v1/generate`
Generate a completely new image from text.

**Request:**
```json
{
  "prompt": "A luxurious bedroom with marble floors and gold accents"
}
```

#### `POST /api/v1/chat`
Chat with the AI designer for iterative changes.

**Request:**
```json
{
  "history": [...],
  "currentImageBase64": "...",
  "originalImageBase64": "...",
  "analysis": {...},
  "userMessage": "Change the wall color to sage green",
  "roomContext": "Residential"
}
```

#### `GET /api/health`
Health check endpoint for monitoring.

---

## 🎨 Usage Guide

### 1. Upload & Analyze
1. Click the upload area or drag-and-drop an image
2. Select context: **Residential** or **Commercial**
3. Wait for AI analysis (8-10 seconds)

### 2. Choose a Style
- **AI Recommended**: Personalized suggestions based on your space
- **Classic Presets**: 6 curated design styles
- **Custom Prompt**: Describe your vision in detail

### 3. View Results
- Use the **interactive slider** to compare before/after
- Click **"Talk to Designer"** for refinements
- Download HD image when satisfied

### 4. Chat for Refinements
- Use **Quick Actions** for common requests
- Be specific: *"Change only the wall color to sage green"*
- Reference original: *"Restore the original flooring"*

---

## 🧪 Development

### Run Tests (Coming Soon)
```bash
pnpm test
```

### Build for Production
```bash
# Frontend
pnpm build

# Backend
cd server && pnpm build
```

### Lint Code
```bash
# Frontend
pnpm lint

# Backend
cd server && pnpm lint
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Analysis Time** | 8-10 seconds |
| **Redesign Time** | 10-15 seconds |
| **Generation Time** | 12-18 seconds |
| **Bundle Size** | ~150KB (gzipped) |
| **API Latency** | < 100ms (excluding AI) |

---

## 🐛 Known Issues

- Tailwind CSS loaded from CDN (security concern - fix pending)
- No offline support
- Large images may take longer to process
- Rate limits may affect heavy users

See `BUG_SCAN_REPORT.md` for detailed analysis.

---

## 🗺️ Roadmap

### Phase 2 (Next Month)
- [ ] Testing framework (Vitest + React Testing Library)
- [ ] Accessibility improvements (WCAG 2.1 AA)
- [ ] Remove Tailwind CDN, install locally
- [ ] Comprehensive CSP implementation

### Phase 3 (Q1 2026)
- [ ] User authentication (OAuth 2.0)
- [ ] Monitoring & observability (Sentry)
- [ ] Caching layer (Redis)
- [ ] Database for project history

### Phase 4 (Long-term)
- [ ] Save & load projects
- [ ] Sharing & collaboration
- [ ] Mobile app (React Native)
- [ ] Advanced AI features

See `IMPLEMENTATION_PLAN.md` for complete details.

---

## 📝 Documentation

- `BUG_SCAN_REPORT.md` - Security audit & bug fixes
- `IMPLEMENTATION_PLAN.md` - 6-phase development roadmap
- `server/README.md` - Backend API documentation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Google Gemini** - Powering the AI analysis & generation
- **Imagen 4.0** - Text-to-image generation
- **Tailwind CSS** - Beautiful styling
- **Lucide Icons** - Icon library
- **React Community** - Ecosystem & tools

---

## 💬 Support

- 📧 Email: support@lumina-interiors.ai
- 🐛 [Report Bugs](https://github.com/soyab-mostofa/lumina-interiors-ai/issues)
- 💡 [Request Features](https://github.com/soyab-mostofa/lumina-interiors-ai/issues)
- 📖 [Documentation](https://github.com/soyab-mostofa/lumina-interiors-ai/wiki)

---

<div align="center">

**Made with ❤️ using React, TypeScript, and Google Gemini**

⭐ Star this repo if you found it helpful!

</div>
