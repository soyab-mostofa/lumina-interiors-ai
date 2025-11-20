import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: process.env.HOST || 'localhost',
      },
      plugins: [react()],
      // SECURITY WARNING: API keys should NEVER be exposed in client-side code
      // TODO: Move all Gemini API calls to a backend server to properly secure the API key
      // For now, the API key is still used client-side but should be migrated to a backend service
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
