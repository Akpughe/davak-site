// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Last meaningful update per page, surfaced as <lastmod> in the sitemap.
const lastmod = {
  '/': '2026-11-13',
  '/about/': '2026-11-13',
  '/projects/nuton-rag/': '2026-11-12',
  '/projects/nuton-for-schools/': '2026-11-12',
};

// https://astro.build/config
export default defineConfig({
  site: 'https://www.davak.site',
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/og/'),
      serialize(item) {
        const date = lastmod[new URL(item.url).pathname];
        return date ? { ...item, lastmod: date } : item;
      },
    }),
  ],
  redirects: {
    '/projects/nutonai-pad': '/projects/nuton-for-schools',
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
