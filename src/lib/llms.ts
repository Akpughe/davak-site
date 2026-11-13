import { getCollection } from 'astro:content';
import { SITE_URL, profile } from './site';

const url = (path: string) => new URL(path, SITE_URL).toString();

export async function llmsText(full: boolean) {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const firstParagraph = (body: string) => body.trim().split('\n\n')[0].replace(/\s+/g, ' ');

  const lines = [
    `# ${profile.name}`,
    '',
    `> ${profile.summary}`,
    '',
    '## Key facts',
    '',
    `- Role: ${profile.jobTitle}`,
    `- Current: ${profile.current.role}, ${profile.current.org} (${profile.current.url})`,
    ...profile.previous.map((p) => `- Previously: ${p.role} at ${p.org}${p.note ? ` (${p.note})` : ''}`),
    `- Education: ${profile.education.degree}, ${profile.education.school}`,
    `- Based in: ${profile.location}`,
    `- Focus areas: ${profile.knowsAbout.join(', ')}`,
    `- Contact: ${profile.email} · Book a call: ${profile.links.cal}`,
    '',
    '## Pages',
    '',
    `- [Home](${url('/')}): profile and selected work`,
    `- [About](${url('/about/')}): short biography and background`,
    `- [Writing](${url('/writing/')}): essays on AI engineering and building products`,
    '',
    '## Projects',
    '',
    ...projects.map(
      (p) => `- [${p.data.title}](${p.data.page ? url(`${p.data.page}/`) : p.data.link}): ${firstParagraph(p.body ?? '')}`,
    ),
    '',
    '## Profiles',
    '',
    `- [GitHub](${profile.links.github})`,
    `- [LinkedIn](${profile.links.linkedin})`,
    `- [Substack](${profile.links.substack})`,
  ];

  if (full) {
    for (const p of projects.filter((p) => p.data.page)) {
      lines.push('', '---', '', `# ${p.data.title}`, '', `Source: ${url(`${p.data.page}/`)}`, '', (p.body ?? '').trim());
    }
  } else {
    lines.push('', '## Optional', '', `- [Full text of technical write-ups](${url('/llms-full.txt')})`);
  }

  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
