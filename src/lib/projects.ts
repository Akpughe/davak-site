import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

export const slugOf = (p: Project) => p.id.replace(/\.md$/, '');

export async function getProjects() {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}

// Every entry with an on-site article: write-ups, plus products that carry their own write-up.
export const articlesOf = (all: Project[]) => all.filter((p) => p.data.page);

// The product a write-up is about. A product with its own page is about itself.
export function productOf(article: Project, all: Project[]) {
  if (article.data.kind !== 'writeup') return article;
  return all.find((p) => slugOf(p) === article.data.product) ?? article;
}

// On-site articles about a product, its own page first.
export function articlesFor(product: Project, all: Project[]) {
  return articlesOf(all).filter((p) => p === product || p.data.product === slugOf(product));
}

export function readingMinutes(body = '') {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 230));
}

export function wordCount(body = '') {
  return body.split(/\s+/).filter(Boolean).length;
}

export function plainFirstParagraph(body = '') {
  return body.trim().split('\n\n')[0].replace(/[*_`#]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ');
}

// Meta description, falling back to the article's opening paragraph.
export function descriptionOf(p: Project) {
  if (p.data.description) return p.data.description;
  const text = plainFirstParagraph(p.body);
  return text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}…` : text;
}

export const headlineOf = (p: Project) => p.data.headline ?? p.data.title;

export const hostOf = (url: string) => new URL(url).host.replace(/^www\./, '');
