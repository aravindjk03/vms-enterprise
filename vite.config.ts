import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'apps/web',
  // Served by the API at '/'. The static demo build (GitHub Pages under /vms-enterprise/) sets VITE_BASE=./
  base: process.env.VITE_BASE || '/',
  resolve: {
    alias: {
      '@vms/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
      '@vms/validation': path.resolve(__dirname, 'packages/validation/src/index.ts'),
      '@vms/permissions': path.resolve(__dirname, 'packages/permissions/src/index.ts'),
      '@vms/events': path.resolve(__dirname, 'packages/events/src/index.ts'),
      '@vms/ui/tokens': path.resolve(__dirname, 'packages/ui/tokens/index.ts'),
      '@vms/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
      '@vms/transport': path.resolve(__dirname, 'services/transport/src/index.ts'),
      '@vms/ghg': path.resolve(__dirname, 'services/ghg/src/index.ts'),
      '@vms/database': path.resolve(__dirname, 'packages/database/src/index.ts'),
      '@vms/workflow': path.resolve(__dirname, 'services/workflow/src/index.ts'),
      '@vms/visitor': path.resolve(__dirname, 'services/visitor/src/index.ts'),
      '@vms/customer': path.resolve(__dirname, 'services/customer/src/index.ts'),
      '@vms/contractor': path.resolve(__dirname, 'services/contractor/src/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
});
