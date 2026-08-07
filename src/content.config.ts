import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.enum(['Product', 'Engineering', 'AI/ML', 'Open Source', 'Client Work']),
    link: z.string().url(),
    page: z.string().optional(),
    ctaLabel: z.string().optional(),
    order: z.number().default(0),
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
