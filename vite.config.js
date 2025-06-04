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
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
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