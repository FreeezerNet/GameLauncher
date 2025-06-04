import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        react({
            jsxRuntime: 'automatic',
            fastRefresh: true,
            // Include development features
            include: "**/*.{jsx,tsx}",
        })
    ],
    base: process.env.NODE_ENV === 'development' ? '/' : './',
    build: {
        outDir: 'dist/renderer',
        emptyOutDir: true,
        assetsDir: '.',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html')
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/renderer'),
        },
    },
    server: {
        hmr: {
            protocol: 'ws',
            host: 'localhost',
        },
    },
}); 