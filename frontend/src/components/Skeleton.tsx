export default function Skeleton({ className = 'w-32 h-6' }: { className?: string }) {
  return (
    <span className={`inline-block rounded bg-white/5 animate-pulse ${className}`} />
  )
}
