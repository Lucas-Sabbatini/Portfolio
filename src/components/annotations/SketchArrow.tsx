type Direction = 'right' | 'down' | 'left' | 'up'

const ROTATION: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
}

interface SketchArrowProps {
  className?: string
  direction?: Direction
  width?: number
  height?: number
}

/**
 * A small hand-drawn arrow used to gesture at nearby content.
 *
 * It is purely decorative: it has `pointer-events: none`, is hidden from
 * assistive technology, and inherits its colour from `currentColor` so it
 * always matches the surrounding text.
 */
export default function SketchArrow({
  className = '',
  direction = 'right',
  width = 56,
  height = 36,
}: SketchArrowProps) {
  return (
    <svg
      viewBox="0 0 56 36"
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none ${className}`}
      style={{ transform: `rotate(${ROTATION[direction]}deg)` }}
    >
      {/* The head is angled to the shaft's end tangent (26.6°) so the two
          strokes meet cleanly instead of crossing at an angle. */}
      <path
        d="M6 30C15 21 32 21 46 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 14.1 46 14 39.3 22.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
