import type { ExperienceEntry } from '@/types/experience'
import type { Skill } from '@/types/skill'
import type { SocialLink } from '@/types/social'

/**
 * Static site content.
 *
 * Facts (experience, research, stack, links) were captured from the former
 * production API. Marketing/poetic copy was intentionally dropped in favor of
 * information-only content.
 */

export const profile = {
  name: 'Lucas Janot',
  role: 'Software Engineer & AI Researcher',
  /** The part of `role` that gets the hand-drawn underline. */
  roleEmphasis: 'AI Researcher',
  email: 'lucassabbatinijp@gmail.com',
  summary:
    'Software Engineer building Nest.js fintech products. Indie hacker for fun. Published applied-ML research on Transformer models for medical spectra classification.',
} as const

export interface Fact {
  label: string
  value: string
}

export const facts: Fact[] = [
  { label: 'Experience', value: '3+ years' },
  { label: 'Focus', value: 'Backend & AI' },
  { label: 'English', value: 'C1' },
  { label: 'Education', value: 'CS · UFU 2026' },
]

export const research = {
  title: 'AI Researcher',
  org: '@ AINet · UFU',
  bullets: [
    'Developed a Transformer-Based Architecture for FTIR Spectra Classification in Oral Cancer Diagnosis.',
    'Evaluated against several state-of-the-art baselines.',
    'Outperformed all Neural Network architectures for this task.',
  ],
  image_url: '/research-topology.webp',
  image_alt: 'Neural topology',
  stats: [{ value: '02', label: 'Publications' }],
  doi: {
    label: '10.5753/sbcas.2026.21672',
    url: 'https://doi.org/10.5753/sbcas.2026.21672',
  },
} as const

export const experiences: ExperienceEntry[] = [
  {
    id: '60b9a048-67c1-4f88-9cea-4eea745276ec',
    role: 'Software Engineer',
    company: 'Levty, Belo Horizonte, Brazil',
    period: 'Sep 2026 – Present',
    description: [
      'Engineer on a 5-person squad building React/TypeScript contracting flows on SYDLE ONE (Elasticsearch-backed) for digital product sales.',
      'Architected a headless state-machine layer (React 19, Zustand, React Hook Form + Zod) that lifted checkout conversion from 4.28% to 5.12% (+19.6%) across ~80k monthly sessions.',
      'Cut flow-related support tickets 25% quarter-over-quarter (~120 → ~90/month) with a layered validation pattern (Zod schema, state machine, server-side).',
    ],
    mark: { text: '+19.6%' },
    sort_order: 0,
  },
  {
    id: 'd7988d5d-a0a6-4e86-b38c-e84bd4d5036b',
    role: 'Junior Fullstack Developer',
    company: 'Trivvo, Remote, Brazil',
    period: 'Jul 2024 - Sep 2025',
    description: [
      'Built the payment routing layer integrating Stripe, Asaas, and other gateways with cascading fallback and automatic retries, reducing failed checkouts in production.',
      'Developed the transactions processing backbone on a microservices stack (Java/Kotlin, Spring Boot, Apache Kafka, Redis), exposing REST APIs to business dashboards.',
      'Shipped 4 automation flows that removed ~8–12 hours/week of manual work, and built real-time React analytics dashboards used by ~50 customers.',
    ],
    mark: { text: 'payment routing layer' },
    sort_order: 1,
  },
  {
    id: 'bed44f4d-f04c-4bf3-818b-6e23d3c459b5',
    role: 'Project Director',
    company: 'ASCII, Uberlândia, Brazil',
    period: 'Jan 2024 - Feb 2025',
    description: [
      'Directed delivery of 5+ concurrent software projects leading a team of 5, owning scope, timelines, client communication, and delivery retrospectives.',
      'Led development of an internal desktop contract management system (Python, PostgreSQL) that automated contract drafting, saving ~5 hours per contract across 25+ recurring contract templates.',
      'Contributed to the company\'s React.js institutional website, supporting lead generation. Therefore, recognized by the "Núcleo Triângulo" as a high-growth organization.',
    ],
    sort_order: 2,
  },
]

export const skills: Skill[] = [
  {
    id: '8d198d66-6791-4bca-b301-13a02753f723',
    name: 'Java',
    category: 'Language',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
    sort_order: 0,
  },
  {
    id: '807ddb04-4fe9-4506-a9e9-3e01a0bba74b',
    name: 'Kotlin',
    category: 'Language',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg',
    sort_order: 1,
  },
  {
    id: 'f13506c2-51ad-476c-8dda-c10d7c16f08a',
    name: 'React',
    category: 'Framework',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    sort_order: 2,
  },
  {
    id: '150e3baa-6a29-4b68-b597-f58ea8bbeb7d',
    name: 'NestJS',
    category: 'Framework',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg',
    sort_order: 3,
  },
  {
    id: '1efdb144-d8a2-455f-823d-a41ab046646e',
    name: 'PostgreSQL',
    category: 'Database',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg',
    sort_order: 4,
  },
  {
    id: '481f4c47-ee8f-45ca-bd62-df42fe21b9a4',
    name: 'Python',
    category: 'Language',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
    sort_order: 5,
  },
  {
    id: '9a8c6a6a-6d90-4697-8157-c9562bfebf79',
    name: 'PyTorch',
    category: 'Framework',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg',
    sort_order: 6,
  },
  {
    id: 'a91349eb-569a-47dc-ad47-7ba7290ef232',
    name: 'AWS',
    category: 'Cloud',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    sort_order: 7,
  },
]

export const socialLinks: SocialLink[] = [
  {
    id: '5f6aa580-2e9e-49a6-8fd0-af918088905a',
    platform: 'GitHub',
    url: 'https://github.com/Lucas-Sabbatini',
    label: 'GitHub',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg',
    sort_order: 0,
  },
  {
    id: '397667ab-aecf-4d94-83ca-5f4b473a569f',
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/lucas-janot',
    label: 'LinkedIn',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg',
    sort_order: 1,
  },
  {
    id: '6925830b-7e80-410e-b50a-d2a2bb788f5b',
    platform: 'X',
    url: 'https://x.com/LucasProcp0t',
    label: 'X',
    icon: 'https://cdn.simpleicons.org/x',
    sort_order: 2,
  },
]

/** Public URL of the CV object hosted on S3 (served through CloudFront). */
export const CV_URL = import.meta.env.VITE_CV_URL ?? '/cv'
