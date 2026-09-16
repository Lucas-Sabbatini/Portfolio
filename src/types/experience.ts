/** A substring of a bullet that gets a hand-drawn mark. */
export interface ExperienceMark {
  text: string
  type?: 'underline' | 'highlight'
}

export interface ExperienceEntry {
  id: string
  role: string
  company: string
  period: string
  description: string[]
  /** Optional phrases within `description` to underline/highlight. */
  marks?: ExperienceMark[]
  sort_order: number
}
