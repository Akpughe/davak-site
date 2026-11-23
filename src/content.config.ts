import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Article title for the write-up, distinct from the product name.
      headline: z.string().optional(),
      date: z.string(),
      category: z.enum(['Product', 'Engineering', 'AI/ML', 'Open Source', 'Mobile', 'Side Project', 'Client Work']),
      // product: something people can use · writeup: an article about a product · client: work for a client
      kind: z.enum(['product', 'writeup', 'client']).default('product'),
      // For write-ups: the id of the product the article is about.
      product: z.string().optional(),
      // For products: where it runs. Each one is a coloured chip on the home page.
      platforms: z.array(z.enum(['Web', 'iOS', 'Android', 'Chrome extension', 'Rust', 'Docker'])).optional(),
      status: z.enum(['Live', 'Open source', 'In development']).optional(),
      // Short name for the article in link lists, e.g. "Product tour".
      label: z.string().optional(),
      link: z.string().url(),
      // card: also show this link on the home page product card.
      links: z.array(z.object({ label: z.string(), url: z.string().url(), card: z.boolean().optional() })).optional(),
      page: z.string().optional(),
      ctaLabel: z.string().optional(),
      order: z.number().default(0),
      summary: z.string().optional(),
      description: z.string().max(170).optional(),
      seoTitle: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      published: z.string().optional(),
      updated: z.string().optional(),
    }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    link: z.string().url(),
  }),
});

export const collections = { projects, writing };
