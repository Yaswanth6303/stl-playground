// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Production host (see docker-compose.yml). Used for the canonical URL and Open Graph tags.
  site: 'https://stl.yswnth.me',
  integrations: [react()],
  vite: {
    build: {
      // The hero island's Three.js chunk is ~530 kB minified (~133 kB gzipped); WebGLRenderer
      // cannot be split further. It loads only with the hero island, never for the rest of the page.
      chunkSizeWarningLimit: 600,
    },
  },
});
