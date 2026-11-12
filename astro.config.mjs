// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://davak-portfolio.vercel.app',
  output: 'static',
  integrations: [sitemap()],
  redirects: {
    '/projects/nutonai-pad': '/projects/nuton-for-schools',
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
