import { motion } from 'framer-motion'
import type { PostTag } from '../../data/posts'

type Filter = 'All' | PostTag

const filters: Filter[] = ['All', 'System Entry', 'Research', 'Archived', 'Drafting']

interface BlogFilterProps {
  active: Filter
  onChange: (f: Filter) => void
  counts: Record<string, number>
}

export default function BlogFilter({ active, onChange, counts }: BlogFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => {
        const isActive = f === active
        const count = f === 'All' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[f] ?? 0

        return (
          <motion.button
            key={f}
            onClick={() => onChange(f)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-pressed={isActive}
            className={`relative px-5 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              isActive
                ? 'bg-primary text-on-primary filter-pill-active'
                : 'solid-card text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {f}
            <span
              className={`ml-2 text-xs opacity-50`}
            >
              {count}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
