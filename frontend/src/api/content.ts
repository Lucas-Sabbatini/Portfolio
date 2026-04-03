import { apiFetch } from './client'

export const fetchContent = (section: string): Promise<Record<string, string>> =>
  apiFetch(`/api/content/${section}`)

export const patchContent = (section: string, key: string, value: string): Promise<void> =>
  apiFetch(`/api/content/${section}/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  })

export interface ExperienceEntry {
  id: string
  role: string
  company: string
  period: string
  description: string[]
  sort_order: number
}

export const fetchExperience = (): Promise<ExperienceEntry[]> =>
  apiFetch('/api/experience')

export const createExperience = (data: Omit<ExperienceEntry, 'id'>): Promise<ExperienceEntry> =>
  apiFetch('/api/experience', { method: 'POST', body: JSON.stringify(data) })

export const updateExperience = (id: string, data: Omit<ExperienceEntry, 'id'>): Promise<ExperienceEntry> =>
  apiFetch(`/api/experience/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteExperience = (id: string): Promise<void> =>
  apiFetch(`/api/experience/${id}`, { method: 'DELETE' })

export interface Skill {
  id: string
  name: string
  category: string
  icon?: string
  sort_order: number
}

export const fetchSkills = (): Promise<Skill[]> =>
  apiFetch('/api/skills')

export const createSkill = (data: Omit<Skill, 'id'>): Promise<Skill> =>
  apiFetch('/api/skills', { method: 'POST', body: JSON.stringify(data) })

export const updateSkill = (id: string, data: Omit<Skill, 'id'>): Promise<Skill> =>
  apiFetch(`/api/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteSkill = (id: string): Promise<void> =>
  apiFetch(`/api/skills/${id}`, { method: 'DELETE' })

export interface SocialLink {
  id: string
  platform: string
  url: string
  label: string
  icon?: string
  color?: string
  sort_order: number
}

export const fetchSocialLinks = (): Promise<SocialLink[]> =>
  apiFetch('/api/social-links')

export const createSocialLink = (data: Omit<SocialLink, 'id'>): Promise<SocialLink> =>
  apiFetch('/api/social-links', { method: 'POST', body: JSON.stringify(data) })

export const updateSocialLink = (id: string, data: Omit<SocialLink, 'id'>): Promise<SocialLink> =>
  apiFetch(`/api/social-links/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteSocialLink = (id: string): Promise<void> =>
  apiFetch(`/api/social-links/${id}`, { method: 'DELETE' })
