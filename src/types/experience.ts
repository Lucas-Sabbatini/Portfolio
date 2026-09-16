export interface ExperienceEntry {
  id: string
  role: string
  company: string
  period: string
  description: string[]
  /** Optional substring of `description` to hand-annotate (decorative). */
  emphasis?: string
  sort_order: number
}
