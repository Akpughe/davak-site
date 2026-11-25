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
  experience: [
    {
      role: 'Co-founder & Founding Engineer',
      org: 'Nuton',
      url: 'https://nuton.app',
      period: '2023 – Present',
      summary:
        'AI learning platform that turns documents, links, and YouTube videos into courses, quizzes, flashcards, and podcasts. Built the RAG pipeline, Nuton for Schools, and AI Blackboard, a real-time voice tutor.',
    },
    {
      role: 'Full-Stack Software Engineer',
      org: 'ChowCentral',
      note: 'YC S23',
      url: 'https://www.chowcentral.com',
      period: 'Mar 2025 – Oct 2026',
      summary:
        'Designed the NestJS backend for a multi-tenant food-ordering platform, built restaurant onboarding and Rider-as-a-Service dispatch on RabbitMQ and BullMQ, and shipped natural-language meal search.',
    },
    {
      role: 'Frontend Engineer',
      org: 'Autochek Africa',
      url: 'https://autochek.africa',
      period: 'Nov 2023 – Mar 2025',
      summary: 'Built React and Next.js interfaces for automotive platforms and extended the Retool apps used for internal operations.',
    },
    {
      role: 'Frontend Developer',
      org: 'Kudimata',
      url: 'https://www.kudimata.app',
      period: 'Jun 2022 – Sep 2023',
      summary:
        'Led a website redesign with the design team (user engagement up 30%), extended the admin dashboard, and built an assessment tool used by more than 50,000 people.',
    },
    {
      role: 'Full-Stack Software Engineer',
      org: 'Colubris Consulting',
      location: 'Gibraltar',
      period: 'Jun 2021 – Oct 2021',
      summary: 'Designed and deployed APIs and backend services for client projects.',
    },
  ] as { role: string; org: string; url?: string; note?: string; location?: string; period: string; summary: string }[],
  education: [
    { degree: 'MSc Artificial Intelligence', school: 'Wrexham University', period: 'In progress', completed: false },
    { degree: 'Honours BSc Computer Science', school: 'Babcock University', period: '2017 – 2021', completed: true },
  ],
  knowsAbout: [
    'Retrieval-augmented generation (RAG)',
    'Long-term memory for AI agents',
    'Large language model applications',
    'Real-time voice AI',
    'AI product engineering',
    'Hybrid search and reranking',
    'Document extraction and OCR pipelines',
    'EdTech',
    'TypeScript',
    'Next.js',
    'React Native',
    'NestJS',
    'Rust',
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
