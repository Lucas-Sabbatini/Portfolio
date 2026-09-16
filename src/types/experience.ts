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
  /** Optional phrase within `description` to underline/highlight. */
  mark?: ExperienceMark
  sort_order: number
}
