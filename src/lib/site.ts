// Single source of truth for who David is, shared by structured data, llms.txt and /about.
export const SITE_URL = 'https://www.davak.site';

export const profile = {
  name: 'David Akpughe',
  jobTitle: 'AI/ML Product Engineer',
  summary:
    'David Akpughe is an AI/ML product engineer based in the United Kingdom and the co-founder of Nuton, an AI-powered learning platform that turns YouTube videos and documents into courses, quizzes, flashcards, and podcasts.',
  location: 'United Kingdom',
  email: 'davidakpughe2@gmail.com',
  image: '/images/david-640.jpg',
  current: { role: 'Co-founder', org: 'Nuton', url: 'https://nuton.app' },
  previous: [
    { role: 'Full-Stack Engineer', org: 'ChowCentral', note: 'YC S23' },
    { role: 'Full-Stack Engineer', org: 'Autochek Africa' },
  ],
  education: { degree: 'Honours BSc Computer Science', school: 'Babcock University' },
  knowsAbout: [
    'Retrieval-augmented generation (RAG)',
    'Large language model applications',
    'AI product engineering',
    'Hybrid search and reranking',
    'Document extraction and OCR pipelines',
    'EdTech',
    'TypeScript',
    'Next.js',
    'Python',
    'FastAPI',
    'PostgreSQL',
  ],
  links: {
    linkedin: 'https://www.linkedin.com/in/david-akpughe-392241103/',
    github: 'https://github.com/Akpughe',
    substack: 'https://substack.com/@davak01',
    substackBlog: 'https://davak01.substack.com',
    cal: 'https://cal.com/david-akpughe-igoy5i/15min',
  },
};
