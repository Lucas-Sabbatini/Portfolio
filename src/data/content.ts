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
  status: 'Open to conversations',
  email: 'lucassabbatinijp@gmail.com',
  summary:
    'Software engineer building React and TypeScript products, with a background in payment infrastructure and microservices. Published applied-ML research on Transformer models for medical spectra classification.',
} as const

export interface Fact {
  label: string
  value: string
}

export const facts: Fact[] = [
  { label: 'Experience', value: '3+ years' },
  { label: 'Focus', value: 'Full-stack & AI' },
  { label: 'English', value: 'C1' },
  { label: 'Education', value: 'CS · UFU 2026' },
]

export const research = {
  title: 'AI Researcher',
  org: '@ AINet · UFU',
  body: 'Developed a Transformer-Based Architecture for FTIR Spectra Classification in Oral Cancer Diagnosis. Evaluated against several state-of-the-art baselines. Our model was able to outperform all Neural Network architectures for this task.',
  image_url: '/research-topology.webp',
  image_alt: 'Neural topology',
  stats: [
    { value: '14+', label: 'Citations' },
    { value: '02', label: 'Publications' },
  ],
} as const

export const footer = {
  copyright: '© 2026 Lucas Janot.',
  built_with: 'Built with React, TypeScript & Tailwind CSS.',
} as const

export const experiences: ExperienceEntry[] = [
  {
    id: '60b9a048-67c1-4f88-9cea-4eea745276ec',
    role: 'Software Engineer',
    company: 'Levty, Belo Horizonte, Brazil',
    period: 'Sep 2026 – Present',
    description: [
      'Engineer on a 5-person squad reporting to a Tech Lead, building React/TypeScript contracting flows on top of SYDLE ONE (Elasticsearch-backed) for digital product sales.',
      'Architected a headless state-machine layer (React 19, TypeScript, Zustand, React Hook Form + Zod) for a multi-step digital product contracting flow, driving checkout conversion from 4.28% to 5.12% (+19.6%) across ~80k monthly sessions, validated via Amplitude A/B tests over 6 weeks.',
      'Eliminated inconsistent UI states and silent submission failures by designing a layered validation pattern (schema-level with Zod, step-level via the state machine, server-level against SYDLE ONE), cutting flow-related support tickets by 25% quarter-over-quarter (~120 → ~90/month).',
      'Authored the `petQueue` selection pattern (web components embedded in React) to persist multi-entity choices across back-navigation, lifting step-to-step conversion by 19.74% versus the prior form-based UI; shipped team-wide after peer review via GitLab MRs.',
      'Stack: React 19, TypeScript, Zustand, React Hook Form, Zod, TanStack Query, Stencil.js, Vite, Cypress, MSW, Amplitude, SYDLE ONE, Elasticsearch, GitLab CI.',
    ],
    sort_order: 0,
  },
  {
    id: 'd7988d5d-a0a6-4e86-b38c-e84bd4d5036b',
    role: 'Junior Fullstack Developer',
    company: 'Trivvo, Remote, Brazil',
    period: 'Jul 2024 - Sep 2025',
    description: [
      'Built the payment routing layer integrating Stripe, Asaas, and other gateways with cascading fallback logic for course-purchase transactions, enabling automatic retries across providers and reducing failed checkouts on production traffic.',
      'Developed the transactions processing backbone on a microservices architecture (Java/Kotlin, Spring Boot, Apache Kafka, Redis), handling course purchase events and exposing REST APIs consumed by business-facing dashboards and the routing layer.',
      'Built real-time analytics dashboards (React.js, JavaScript, Tailwind CSS) used by ~50 business customers to monitor course revenue, transaction status, and enrollments, replacing manual spreadsheet reporting.',
      'Designed and shipped 4 automation flows across marketing and finance operations (campaign triggers, reconciliation, payout reporting), eliminating an estimated 8–12 hours/week of manual operational work.',
      'Contributed to production AWS environments alongside the DevOps lead deploying containerized services (Docker, Kubernetes) and maintaining CI/CD pipelines for backend microservices.',
    ],
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
    id: '481f4c47-ee8f-45ca-bd62-df42fe21b9a4',
    name: 'Python',
    category: 'Language',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
    sort_order: 2,
  },
  {
    id: 'f13506c2-51ad-476c-8dda-c10d7c16f08a',
    name: 'React',
    category: 'Framework',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    sort_order: 3,
  },
  {
    id: '9a8c6a6a-6d90-4697-8157-c9562bfebf79',
    name: 'PyTorch',
    category: 'Framework',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg',
    sort_order: 4,
  },
  {
    id: '1efdb144-d8a2-455f-823d-a41ab046646e',
    name: 'PostgreSQL',
    category: 'Database',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg',
    sort_order: 5,
  },
  {
    id: 'a91349eb-569a-47dc-ad47-7ba7290ef232',
    name: 'AWS',
    category: 'Cloud',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    sort_order: 6,
  },
]

/** Skill categories in display order. */
export const skillCategories = ['Language', 'Framework', 'Database', 'Cloud'] as const

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
]

/** Public URL of the CV object hosted on S3 (served through CloudFront). */
export const CV_URL = import.meta.env.VITE_CV_URL ?? '/cv'
