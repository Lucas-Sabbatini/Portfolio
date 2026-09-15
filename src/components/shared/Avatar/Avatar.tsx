import { useState } from 'react'

interface AvatarProps {
  src: string
  alt: string
  fallback: string
}

/**
 * Circular profile picture. Falls back to initials if the image is missing.
 * Drop a photo at `public/profile.jpg` to replace the placeholder.
 */
export default function Avatar({ src, alt, fallback }: AvatarProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-600 ring-1 ring-blue-100"
        aria-hidden="true"
      >
        {fallback}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={80}
      height={80}
      onError={() => setFailed(true)}
      className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
    />
  )
}
