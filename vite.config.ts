import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Trình duyệt không được gọi trực tiếp api.openai.com (CORS). Proxy thêm Authorization từ .env */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, './', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/openai-chat': {
            target: 'https://api.openai.com',
            changeOrigin: true,
            rewrite: () => '/v1/chat/completions',
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                const key = env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY;
                if (key) proxyReq.setHeader('Authorization', `Bearer ${key}`);
              });
            },
          },
          '/api/gemini-chat': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/gemini-chat/, '/v1beta/models/gemini-1.5-flash:generateContent'),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                const key = env.VITE_GEMINI_API_KEY_1 || env.GEMINI_API_KEY_1;
                if (key) {
                  const separator = proxyReq.path.includes('?') ? '&' : '?';
                  proxyReq.path += `${separator}key=${key}`;
                }
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY_1 || env.VITE_GEMINI_API_KEY_2 || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      root: path.resolve(__dirname, './')
    };
});
