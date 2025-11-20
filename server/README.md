# Lumina Interiors API Server

Backend proxy server for the Lumina Interiors AI application. This server securely handles API requests to Google Gemini, implements rate limiting, input validation, and provides a secure architecture for production deployment.

## Features

- 🔒 **Secure API Key Management** - API keys never exposed to frontend
- 🛡️ **Rate Limiting** - Prevents abuse and controls costs
- ✅ **Input Validation** - Validates all incoming requests
- 📊 **Structured Logging** - Winston logger with correlation IDs
- 🚨 **Error Handling** - Centralized error handling with meaningful messages
- 🔐 **Security Headers** - Helmet.js for security best practices
- 🌐 **CORS Support** - Configurable CORS for frontend communication
- 📈 **Health Checks** - Monitoring endpoint for uptime tracking

## Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- Google Gemini API Key

## Installation

```bash
cd server
pnpm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your configuration:
```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Running the Server

### Development Mode (with auto-reload)
```bash
pnpm dev
```

### Production Mode
```bash
pnpm build
pnpm start
```

## API Endpoints

### Health Check
```http
GET /api/health
```

Returns server health status and uptime.

### Analyze Room
```http
POST /api/v1/analyze
Content-Type: application/json

{
  "imageBase64": "base64_encoded_image_string",
  "context": "Residential" | "Commercial"
}
```

### Redesign Room
```http
POST /api/v1/redesign
Content-Type: application/json

{
  "imageBase64": "base64_encoded_image_string",
  "prompt": "Design transformation description"
}
```

### Generate New Image
```http
POST /api/v1/generate
Content-Type: application/json

{
  "prompt": "Image description"
}
```

### Chat with Designer
```http
POST /api/v1/chat
Content-Type: application/json

{
  "history": [...],
  "currentImageBase64": "...",
  "originalImageBase64": "...",
  "analysis": {...},
  "userMessage": "User's message",
  "roomContext": "Residential" | "Commercial"
}
```

## Rate Limits

### General API Endpoints
- **100 requests** per 15 minutes per IP
- Applies to all `/api/*` endpoints

### Image Generation Endpoints
- **10 requests** per hour per IP
- Applies to `/api/v1/redesign` and `/api/v1/generate`

Rate limits return HTTP 429 with a `retryAfter` value in seconds.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "correlationId": "err-1234567890-abc123"
}
```

## Logging

The server uses Winston for structured logging:
- **Development**: Colorized console output
- **Production**: JSON logs written to `logs/` directory

Log levels:
- `error`: Error messages with stack traces
- `warn`: Warning messages (rate limits, etc.)
- `info`: Request/response logging
- `debug`: Detailed debugging (dev only)

## Security Features

### Helmet.js
Automatically sets secure HTTP headers:
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

### Input Validation
- Maximum image size: 5MB (base64)
- Maximum prompt length: 2000 characters
- Character whitelisting for prompts
- Type validation for all fields

### CORS
Configured to only allow requests from the frontend URL specified in `.env`.

## Error Handling

All errors include:
- HTTP status code
- Error message
- Correlation ID for tracking
- Stack trace (development only)

## Deployment

### Environment Variables (Production)
```env
GEMINI_API_KEY=your_production_key
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
IMAGE_RATE_LIMIT_MAX=10
```

### Process Manager (PM2 Recommended)
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/index.js --name lumina-api

# Monitor
pm2 monit

# View logs
pm2 logs lumina-api
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## Monitoring

### Health Check Endpoint
Monitor server health at `/api/health`:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-20T10:30:00.000Z",
    "uptime": 3600.5
  }
}
```

### Recommended Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **APM**: New Relic, Datadog
- **Error Tracking**: Sentry, Rollbar
- **Logs**: LogDNA, Papertrail

## Troubleshooting

### API Key Issues
```
Error: GEMINI_API_KEY is not configured
```
Solution: Ensure `.env` file exists and contains valid API key.

### Rate Limit Errors
```
HTTP 429: Too many requests
```
Solution: Wait for the retry period or adjust rate limits in `.env`.

### CORS Errors
```
Access-Control-Allow-Origin error
```
Solution: Ensure `FRONTEND_URL` in `.env` matches your frontend domain.

## Development

### Project Structure
```
server/
├── src/
│   ├── config/
│   │   └── logger.ts          # Winston logger configuration
│   ├── middleware/
│   │   ├── validators.ts      # Input validation schemas
│   │   └── errorHandler.ts    # Error handling middleware
│   ├── routes/
│   │   └── api.ts             # API route definitions
│   ├── services/
│   │   └── geminiService.ts   # Google Gemini API integration
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── index.ts               # Main server file
├── dist/                       # Compiled JavaScript (generated)
├── logs/                       # Log files (generated in production)
├── .env                        # Environment variables (create from .env.example)
├── .env.example               # Example environment configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Proprietary - Lumina Interiors AI
