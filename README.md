# Lumina Interiors AI

AI-powered interior design assistant built with the T3 Stack. Upload room photos, get expert analysis, and see stunning redesigns powered by Google's Gemini AI.

## Tech Stack

This is a [T3 Stack](https://create.t3.gg/) project:

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API Layer**: [tRPC](https://trpc.io) (Type-safe APIs)
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **AI**: [Google Gemini](https://ai.google.dev/) (Gemini 2.5 Flash + Imagen 4.0)

## Features

### Redesign Room
1. **Upload & Analyze**: Upload a room photo and select context (Residential/Commercial)
2. **AI Analysis**: Get detailed architectural analysis and design suggestions
3. **Style Selection**: Choose from 6 preset styles, AI recommendations, or custom prompts
4. **Transformation**: See before/after comparison with interactive slider
5. **Designer Chat**: Refine designs with conversational AI

### Create New
- Generate completely new interior concepts from text descriptions
- Powered by Imagen 4.0 for photorealistic results

## Prerequisites

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **Gemini API Key**: Get yours at [Google AI Studio](https://aistudio.google.com/app/apikey)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd lumina-interiors-ai
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/lumina_interiors"

# Google Gemini AI
GEMINI_API_KEY="your-api-key-here"
```

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup Options

### Option 1: Local PostgreSQL

Install PostgreSQL and create a database:

```bash
createdb lumina_interiors
```

### Option 2: Cloud PostgreSQL

Use a managed PostgreSQL service:

- **[Neon](https://neon.tech)** - Serverless PostgreSQL (Free tier available)
- **[Supabase](https://supabase.com)** - Open-source Firebase alternative
- **[Railway](https://railway.app)** - Infrastructure platform

Copy the connection string to `DATABASE_URL` in your `.env` file.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to DB |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Add environment variables:
     - `DATABASE_URL`
     - `GEMINI_API_KEY`

3. **Deploy**: Vercel will automatically build and deploy

## Migration Notes

This project was migrated from Vite to T3 Stack. See `MIGRATION_REQUIREMENTS.md` for details.

### Key Changes
- ✅ Vite → Next.js 15
- ✅ Client-side → Full-stack with tRPC
- ✅ No database → PostgreSQL + Prisma
- ✅ Secure server-side API calls

## Learn More

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Gemini API](https://ai.google.dev/)

## License

MIT
