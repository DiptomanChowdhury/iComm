import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, 'ICOMM_');

  return {
    root: 'src',
    envDir: projectRoot,
    envPrefix: 'ICOMM_',
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
    },
    define: {
      'process.env.ICOMM_API_URL': JSON.stringify(env.ICOMM_API_URL || ''),
      'process.env.ICOMM_GAZE_WS_URL': JSON.stringify(env.ICOMM_GAZE_WS_URL || ''),
      'process.env.ICOMM_SCREEN_W': JSON.stringify(env.ICOMM_SCREEN_W || ''),
      'process.env.ICOMM_SCREEN_H': JSON.stringify(env.ICOMM_SCREEN_H || ''),
    },
  };
});
