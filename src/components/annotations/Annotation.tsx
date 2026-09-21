import { useEffect, useRef, useState, type ReactNode } from 'react'
import { RoughNotation } from 'react-rough-notation'
import type { types as RoughNotationType } from 'react-rough-notation'

export type AnnotationType = RoughNotationType

/**
 * One shared "pen" for the whole site. Every annotation goes through these
 * defaults so the marks feel like they were drawn by the same hand. Only
 * override a value when a specific mark genuinely needs it.
 */
const PEN = {
  /** Ink for underline / box / circle. */
  color: '#2563eb', // blue-600 — the site accent
  /**
   * Marker swipe drawn *behind* the text, so it has to stay light enough to
   * keep the text legible on top of it.
   */
  highlightColor: '#bfdbfe', // blue-200
  strokeWidth: 2,
  padding: 3,
  iterations: 2,
  multiline: true,
  animationDuration: 600,
  animationDelay: 60,
} as const

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])

  return reduced
}

/** Draw the mark once, the first time it scrolls into view. */
function useRevealOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, revealed }
}

interface AnnotationProps {
  children: ReactNode
  type?: AnnotationType
  color?: string
  strokeWidth?: number
  padding?: number
  iterations?: number
  multiline?: boolean
  className?: string
}

/**
 * Hand-drawn annotation around a piece of existing content.
 *
 *   <Annotation type="underline">AI Researcher</Annotation>
 *   <Annotation type="circle">+19.6%</Annotation>
 *
 * Decorative only: it never captures pointer events and the underlying
 * content stays fully readable without it.
 */
export default function Annotation({
  children,
  type = 'underline',
  color,
  strokeWidth = PEN.strokeWidth,
  padding = PEN.padding,
  iterations = PEN.iterations,
  multiline = PEN.multiline,
  className = '',
}: AnnotationProps) {
  const { ref, revealed } = useRevealOnce<HTMLSpanElement>()
  const reducedMotion = useReducedMotion()
  const ink = color ?? (type === 'highlight' ? PEN.highlightColor : PEN.color)

  return (
    <span ref={ref} className={className}>
      <RoughNotation
        type={type}
        show={revealed}
        animate={!reducedMotion}
        animationDuration={PEN.animationDuration}
        animationDelay={PEN.animationDelay}
        color={ink}
        strokeWidth={strokeWidth}
        padding={padding}
        iterations={iterations}
        multiline={multiline}
      >
        {children}
      </RoughNotation>
    </span>
  )
}
