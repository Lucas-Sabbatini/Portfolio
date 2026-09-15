import { useRef } from 'react'
import { useInView } from 'framer-motion'

export function useScrollReveal() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  return { ref, animate: isInView ? 'visible' as const : 'hidden' as const }
}
