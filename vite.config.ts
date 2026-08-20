import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localPlannerPersistence } from './vite.localPersistence';

export default defineConfig({
  base: '/paper-roadmap/',
  plugins: [localPlannerPersistence(), react(), tailwindcss()],
});
