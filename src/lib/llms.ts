import { SITE_URL, profile } from './site';
import { articlesOf, getProjects, headlineOf, plainFirstParagraph, slugOf } from './projects';

const url = (path: string) => new URL(path, SITE_URL).toString();

export async function llmsText(full: boolean) {
  const projects = await getProjects();
  const articles = articlesOf(projects);
  const titleOf = (id?: string) => projects.find((p) => slugOf(p) === id)?.data.title;

  const lines = [
    `# ${profile.name}`,
    '',
    `> ${profile.summary}`,
    '',
    '## Key facts',
    '',
    `- Role: ${profile.jobTitle}`,
    `- Current: ${profile.current.role}, ${profile.current.org} (${profile.current.url})`,
    ...profile.education.map((e) => `- Education: ${e.degree}, ${e.school} (${e.period})`),
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
    '## Experience',
    '',
    ...profile.experience.map(
      (j) => `- ${j.role}, ${j.org}${j.note ? ` (${j.note})` : ''}${j.location ? `, ${j.location}` : ''}, ${j.period}: ${j.summary}`,
    ),
    '',
    '## Products (live, usable)',
    '',
    ...projects
      .filter((p) => p.data.kind === 'product')
      .map((p) => `- [${p.data.title}](${p.data.link})${p.data.platforms ? ` (${p.data.platforms.join(', ')})` : ''}: ${p.data.summary ?? plainFirstParagraph(p.body)}`),
    '',
    '## Technical write-ups (on this site)',
    '',
    ...articles.map(
      (p) =>
        `- [${headlineOf(p)}](${url(`${p.data.page}/`)})${p.data.kind === 'writeup' ? ` (about ${titleOf(p.data.product)})` : ''}: ${p.data.description ?? plainFirstParagraph(p.body)}`,
    ),
    '',
    '## Client work',
    '',
    ...projects
      .filter((p) => p.data.kind === 'client')
      .map((p) => `- [${p.data.title}](${p.data.link})${p.data.platforms ? ` (${p.data.platforms.join(', ')})` : ''}: ${p.data.summary ?? plainFirstParagraph(p.body)}`),
    '',
    '## Profiles',
    '',
    `- [GitHub](${profile.links.github})`,
    `- [LinkedIn](${profile.links.linkedin})`,
    `- [Substack](${profile.links.substack})`,
  ];

  if (full) {
    for (const p of articles) {
      lines.push('', '---', '', `# ${headlineOf(p)}`, '', `Source: ${url(`${p.data.page}/`)}`, '', (p.body ?? '').replace(/!\[[^\]]*\]\([^)]*\)\n?/g, '').trim());
    }
  } else {
    lines.push('', '## Optional', '', `- [Full text of technical write-ups](${url('/llms-full.txt')})`);
  }

  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
