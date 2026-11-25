// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync } from 'node:fs';

// Last meaningful update per page, surfaced as <lastmod> in the sitemap.
// Write-ups take theirs from frontmatter (`updated`, else `published`).
/** @type {Record<string, string>} */
const lastmod = {
  '/': '2026-11-25',
  '/about/': '2026-11-25',
  '/writing/': '2026-11-22',
};
const projectsDir = new URL('./src/data/projects/', import.meta.url);
for (const file of readdirSync(projectsDir).filter((f) => f.endsWith('.md'))) {
  const frontmatter = readFileSync(new URL(file, projectsDir), 'utf8').split('---')[1] ?? '';
  const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*'?([^'\\n]+)'?`, 'm'))?.[1];
  const page = field('page');
  const date = field('updated') ?? field('published');
  if (page && date) lastmod[`${page}/`] = date;
}

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
    '/projects/nuton-web': '/projects/nuton',
  },
  // Generate srcsets for images in write-ups, capped at the article column width.
  image: { layout: 'constrained' },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
