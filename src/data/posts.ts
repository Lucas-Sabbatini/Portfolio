export type PostTag = 'System Entry' | 'Research' | 'Archived' | 'Drafting'

export const tagColors: Record<PostTag, string> = {
  'System Entry': 'text-primary border-primary/20 bg-primary/10',
  Research: 'text-tertiary border-tertiary/20 bg-tertiary/10',
  Archived: 'text-on-surface-variant border-white/10 bg-white/5',
  Drafting: 'text-secondary-dim border-white/10 bg-white/5',
}
