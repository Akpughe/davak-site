import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { dotField } from '../../lib/dot-art';
import { profile } from '../../lib/site';

type Card = { title: string; subtitle: string; seed: string };

export const getStaticPaths = (async () => {
  const projects = await getCollection('projects', ({ data }) => Boolean(data.page));
  const pages: { slug: string; card: Card }[] = [
    { slug: 'index', card: { title: profile.name, subtitle: `${profile.jobTitle} · Co-founder, Nuton`, seed: 'davak.site' } },
    { slug: 'writing', card: { title: 'Writing', subtitle: 'Essays on AI engineering and building products', seed: 'Writing' } },
    { slug: 'about', card: { title: `About ${profile.name}`, subtitle: `${profile.jobTitle} · ${profile.location}`, seed: 'About' } },
    ...projects.map((p) => ({
      slug: p.id.replace(/\.md$/, ''),
      card: {
        title: p.data.title,
        subtitle: `${p.data.category} · How it's built`,
        seed: p.data.title,
      },
    })),
  ];
  return pages.map(({ slug, card }) => ({ params: { slug }, props: card }));
}) satisfies GetStaticPaths;

// Resolved from the project root because this file is bundled before it runs.
const fontDir = join(process.cwd(), 'src/assets/fonts');
const fonts = Promise.all([
  readFile(join(fontDir, 'et-book-roman.woff')),
  readFile(join(fontDir, 'et-book-bold.woff')),
]);

function artDataUri(seed: string) {
  const { dots, width, height } = dotField(seed, 14, 14, 16);
  const circles = dots.map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="#9a9a96">${circles}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle, seed } = props as Card;
  const [roman, bold] = await fonts;

  const node = {
    type: 'div',
    props: {
      style: {
        width: 1200, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 80px', boxSizing: 'border-box', background: '#fafaf8', color: '#111111', fontFamily: 'et-book',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 640, height: 502 },
            children: [
              { type: 'div', props: { style: { fontSize: 28, color: '#6b7280' }, children: 'davak.site' } },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    { type: 'div', props: { style: { fontSize: title.length > 22 ? 64 : 80, lineHeight: 1.05, letterSpacing: '-0.03em' }, children: title } },
                    { type: 'div', props: { style: { marginTop: 24, fontSize: 32, color: '#6b7280' }, children: subtitle } },
                  ],
                },
              },
              { type: 'div', props: { style: { fontSize: 26, fontWeight: 700 }, children: profile.name } },
            ],
          },
        },
        { type: 'img', props: { src: artDataUri(seed), width: 340, height: 340, style: { flexShrink: 0 } } },
      ],
    },
  };

  const svg = await satori(node as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'et-book', data: roman, weight: 400, style: 'normal' },
      { name: 'et-book', data: bold, weight: 700, style: 'normal' },
    ],
  });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
