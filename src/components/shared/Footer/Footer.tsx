import { footer } from '@/data/content'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-2 px-6 py-8 text-xs text-slate-400 sm:flex-row">
        <span>{footer.copyright}</span>
        <span>{footer.built_with}</span>
      </div>
    </footer>
  )
}
