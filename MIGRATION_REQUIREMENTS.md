# Lumina Interiors AI - T3 Stack Migration Requirements

## Executive Summary

Migrate Lumina Interiors AI from a client-side Vite React application to a full-stack T3 architecture (Next.js, tRPC, Prisma, Tailwind CSS, TypeScript) with proper backend security, database persistence, and scalability.

---

## 1. Technology Stack Changes

### Current Stack
- **Build Tool**: Vite
- **Framework**: React 19 (client-side only)
- **Styling**: TailwindCSS (via CDN)
- **State**: Local React state (useState)
- **API**: Direct client-to-Gemini calls
- **Database**: None (in-memory only)
- **Auth**: None

### Target T3 Stack
- **Framework**: Next.js 15+ (App Router)
- **API Layer**: tRPC v11 (type-safe APIs)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: TailwindCSS (properly configured)
- **Auth**: NextAuth.js v5 (optional but recommended)
- **TypeScript**: Strict mode
- **Deployment**: Vercel-ready

---

## 2. Architecture Requirements

### 2.1 Backend API Layer (tRPC)

**Security Requirements:**
- ✅ Move Gemini API key to server-side environment variables
- ✅ Create tRPC router with protected endpoints
- ✅ Implement rate limiting for AI API calls
- ✅ Add request validation using Zod schemas
- ✅ Handle file uploads securely (base64 validation)

**API Endpoints (tRPC Procedures):**

```typescript
// Room Analysis Router
roomAnalysis.analyze          // POST - Analyze room image
roomAnalysis.redesign          // POST - Redesign with style
roomAnalysis.chatRefine        // POST - Chat-based refinement
roomAnalysis.getHistory        // GET - User's past redesigns

// Image Generation Router
imageGeneration.createNew      // POST - Text-to-image generation
imageGeneration.getHistory     // GET - User's generated images

// User Data Router (if auth enabled)
user.getProfile               // GET - User profile
user.updatePreferences        // PATCH - Update settings
user.getUsageStats            // GET - API usage statistics
```

### 2.2 Database Schema (Prisma)

**Core Models:**

```prisma
model User {
  id            String          @id @default(cuid())
  email         String?         @unique
  name          String?
  image         String?
  emailVerified DateTime?
  accounts      Account[]
  sessions      Session[]
  projects      Project[]
  generations   Generation[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model Project {
  id              String        @id @default(cuid())
  userId          String?
  name            String
  description     String?
  roomContext     String        // 'Residential' | 'Commercial'
  originalImage   String        // URL or base64
  analysis        Json          // RoomAnalysis JSON
  redesigns       Redesign[]
  chatHistory     ChatMessage[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  user            User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Redesign {
  id              String        @id @default(cuid())
  projectId       String
  styleId         String?
  customPrompt    String?
  resultImage     String        // URL or base64
  project         Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt       DateTime      @default(now())
}

model ChatMessage {
  id          String        @id @default(cuid())
  projectId   String
  role        String        // 'user' | 'assistant'
  content     String
  imagePrompt String?
  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt   DateTime      @default(now())
}

model Generation {
  id          String        @id @default(cuid())
  userId      String?
  prompt      String
  resultImage String        // URL or base64
  user        User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime      @default(now())
}
```

### 2.3 File Storage Strategy

**Phase 1 (MVP):**
- Store base64 images in database (PostgreSQL supports large text fields)
- Implement image compression on server-side
- Add cleanup jobs for old images

**Phase 2 (Production):**
- Migrate to cloud storage (AWS S3, Cloudinary, or Vercel Blob)
- Store URLs in database instead of base64
- Implement CDN for faster image delivery

### 2.4 Frontend Architecture (Next.js App Router)

**Directory Structure:**

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing/home page
│   ├── dashboard/
│   │   ├── page.tsx            # Main app (redesign + generate)
│   │   └── projects/
│   │       └── [id]/page.tsx   # Individual project view
│   ├── api/
│   │   └── trpc/[trpc]/route.ts # tRPC API handler
│   └── auth/
│       └── signin/page.tsx     # Sign-in page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── AnalysisPanel.tsx
│   ├── BeforeAfterSlider.tsx
│   ├── DesignerChat.tsx
│   └── ...
├── server/
│   ├── api/
│   │   ├── root.ts             # Root tRPC router
│   │   └── routers/
│   │       ├── roomAnalysis.ts
│   │       ├── imageGeneration.ts
│   │       └── user.ts
│   ├── db.ts                   # Prisma client
│   └── auth.ts                 # NextAuth config
├── services/
│   └── geminiService.ts        # Gemini API wrapper (server-only)
├── lib/
│   ├── utils.ts                # Utility functions
│   └── trpc.ts                 # tRPC client setup
├── types/
│   └── index.ts                # Shared TypeScript types
└── styles/
    └── globals.css             # Tailwind + custom CSS
```

---

## 3. Feature Preservation & Enhancements

### 3.1 Core Features (Must Preserve)

✅ **Redesign Room Workflow:**
- Upload image with drag-and-drop
- Context selection (Residential/Commercial)
- AI-powered room analysis
- Style selection (6 presets + 3 AI-suggested + custom)
- Before/after slider comparison
- Download HD option

✅ **Designer Chat:**
- Conversational refinement interface
- Context-aware suggestions
- Isolation commands support
- State preservation

✅ **Create New (Text-to-Image):**
- Generate images from text prompts
- Imagen 4.0 integration

### 3.2 New Features (T3 Stack Enabled)

**User Management:**
- User authentication (email, Google, GitHub)
- Project history and organization
- Save and resume projects
- Personal design library

**Collaboration (Future):**
- Share projects via link
- Commenting system
- Export to PDF/presentation

**Analytics:**
- Track API usage per user
- Popular styles analytics
- Cost monitoring

**Improvements:**
- Server-side image optimization
- Faster initial load with SSR
- Progressive image loading
- Better error handling and retry logic

---

## 4. Configuration Requirements

### 4.1 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Gemini AI
GEMINI_API_KEY="your-api-key"

# NextAuth (if enabled)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."

# File Upload (future)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="..."
```

### 4.2 Package Dependencies

**Core:**
- `next@15+`
- `react@19+`
- `react-dom@19+`
- `typescript@5+`

**T3 Stack:**
- `@trpc/server@11+`
- `@trpc/client@11+`
- `@trpc/react-query@11+`
- `@tanstack/react-query@5+`
- `@prisma/client@5+`
- `prisma@5+` (dev)
- `zod@3+`

**Auth:**
- `next-auth@5+`

**UI:**
- `tailwindcss@3+`
- `@radix-ui/react-*` (via shadcn/ui)
- `lucide-react@0.554+`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

**AI:**
- `@google/genai@1.30+`

---

## 5. Migration Strategy

### Phase 1: Foundation (Hours 1-2)
1. ✅ Initialize T3 stack with create-t3-app
2. ✅ Set up PostgreSQL database
3. ✅ Configure Prisma schema
4. ✅ Run initial migration
5. ✅ Configure environment variables
6. ✅ Set up TailwindCSS properly

### Phase 2: API Layer (Hours 3-4)
1. ✅ Create tRPC routers
2. ✅ Move Gemini service to server-side
3. ✅ Implement input validation with Zod
4. ✅ Add error handling
5. ✅ Test API endpoints

### Phase 3: Frontend Migration (Hours 5-7)
1. ✅ Convert App.tsx to Next.js pages
2. ✅ Migrate components to src/components
3. ✅ Set up tRPC client in frontend
4. ✅ Replace useState with tRPC mutations/queries
5. ✅ Implement React Query for caching
6. ✅ Migrate styling from CDN to local config

### Phase 4: Database Integration (Hours 8-9)
1. ✅ Connect frontend to database via tRPC
2. ✅ Implement project saving/loading
3. ✅ Add history features
4. ✅ Test data persistence

### Phase 5: Testing & Cleanup (Hours 10-11)
1. ✅ Test all workflows end-to-end
2. ✅ Remove all Vite-related files
3. ✅ Clean up unused dependencies
4. ✅ Update README with new setup instructions
5. ✅ Verify environment variables
6. ✅ Test production build

### Phase 6: Documentation (Hour 12)
1. ✅ Update README.md
2. ✅ Add API documentation
3. ✅ Create deployment guide
4. ✅ Document database schema

---

## 6. Testing Requirements

### Unit Tests
- tRPC router procedures
- Gemini service functions
- Utility functions

### Integration Tests
- Full redesign workflow
- Chat refinement flow
- Image generation flow
- Database operations

### E2E Tests (Optional)
- User authentication
- Complete project creation
- Image upload and processing

---

## 7. Performance Requirements

- **Initial Page Load**: < 2 seconds
- **API Response Time**: < 5 seconds (Gemini dependent)
- **Image Upload**: Support up to 10MB
- **Database Query**: < 500ms average
- **Concurrent Users**: Support 100+ simultaneous users

---

## 8. Security Requirements

✅ **API Security:**
- Never expose Gemini API key to client
- Validate all inputs with Zod
- Sanitize base64 image data
- Implement rate limiting (10 requests/minute per user)

✅ **Database Security:**
- Use Prisma parameterized queries (built-in)
- Implement row-level security
- Regular backups

✅ **Authentication:**
- Secure session management
- CSRF protection (Next.js built-in)
- HTTP-only cookies

---

## 9. Deployment Requirements

**Target Platform**: Vercel

**Database Hosting**:
- Neon (PostgreSQL)
- Supabase
- Railway
- PlanetScale (MySQL alternative)

**Build Configuration:**
- Environment variables in Vercel dashboard
- Automatic deployments from main branch
- Preview deployments for PRs

---

## 10. Success Criteria

✅ All existing features work identically
✅ API key secure on server-side
✅ Projects persist in database
✅ Users can save/load history
✅ No client-side API calls to Gemini
✅ Clean removal of all Vite artifacts
✅ Production build succeeds
✅ Application deployable to Vercel
✅ Documentation updated
✅ Type safety maintained throughout

---

## 11. Files to Delete (Legacy Cleanup)

```
# Vite Configuration
vite.config.ts
index.html

# Old Entry Points
index.tsx
App.tsx (migrate to Next.js pages)

# Components (migrate to src/components)
components/ (move to src/components)

# Services (migrate to src/server/services)
services/ (keep but move)

# Types (migrate to src/types)
types.ts (move to src/types/index.ts)

# Vite-specific
public/ (merge with Next.js public/)
node_modules/ (reinstall)
package-lock.json (regenerate)
```

---

## 12. New Files to Create

```
# Next.js Config
next.config.js
tailwind.config.ts
postcss.config.mjs

# Prisma
prisma/schema.prisma
prisma/seed.ts

# Environment
.env.example
.env (gitignored)

# tRPC
src/server/api/root.ts
src/server/api/routers/*.ts
src/app/api/trpc/[trpc]/route.ts

# Auth (if enabled)
src/server/auth.ts
src/app/auth/signin/page.tsx

# Styles
src/styles/globals.css

# Utils
src/lib/utils.ts
src/lib/trpc.ts

# Documentation
MIGRATION_REQUIREMENTS.md (this file)
SETUP.md (new setup guide)
```

---

## Timeline Estimate

**Total**: 10-12 hours for full migration

- Initial setup: 2 hours
- API migration: 2 hours
- Frontend migration: 3 hours
- Database integration: 2 hours
- Testing & cleanup: 2 hours
- Documentation: 1 hour

---

## Risk Assessment

**High Risk:**
- Image handling (base64 size limits in PostgreSQL)
- Gemini API rate limits
- State migration complexity

**Medium Risk:**
- Database schema changes during development
- Performance with large images
- OAuth provider setup

**Low Risk:**
- Component migration (mostly copy-paste)
- Styling migration
- Type safety (TypeScript already in use)

---

## Mitigation Strategies

1. **Image Size**: Implement aggressive compression + cloud storage plan
2. **Rate Limits**: Add queueing system with Redis
3. **State**: Use React Query for automatic sync
4. **Performance**: Implement lazy loading and SSR strategically

---

## Next Steps

1. Review and approve requirements
2. Create feature branch: `claude/migrate-vite-to-t3-*`
3. Initialize T3 stack
4. Begin Phase 1 implementation
5. Iterative testing and refinement
