import { useState, useEffect } from 'react'
import { fetchContent, patchContent } from '../../api/content'

interface FieldRowProps {
  section: string
  fieldKey: string
  value: string
}

function FieldRow({ section, fieldKey, value: initialValue }: FieldRowProps) {
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setValue(initialValue) }, [initialValue])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await patchContent(section, fieldKey, value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-48 flex-shrink-0">
        {fieldKey}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-4 py-2 rounded-full disabled:opacity-60 flex-shrink-0"
      >
        {saving ? '…' : saved ? 'Saved' : 'Save'}
      </button>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}

interface SectionPanelProps {
  title: string
  section: string
  keys: string[]
  data: Record<string, string>
}

function SectionPanel({ title, section, keys, data }: SectionPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="glass-card rounded-[2rem] p-8 space-y-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <h2 className="font-bold text-[10px] uppercase tracking-widest text-primary/60">{title}</h2>
        <span className="material-symbols-outlined text-on-surface-variant text-sm">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div>
          {keys.map(k => (
            <FieldRow key={k} section={section} fieldKey={k} value={data[k] ?? ''} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminContentPage() {
  const [hero, setHero] = useState<Record<string, string>>({})
  const [narrative, setNarrative] = useState<Record<string, string>>({})
  const [research, setResearch] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetchContent('hero'),
      fetchContent('narrative'),
      fetchContent('research'),
    ]).then(([h, n, r]) => { setHero(h); setNarrative(n); setResearch(r) })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Content</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <SectionPanel
        title="Hero"
        section="hero"
        keys={['headline_line1', 'headline_line2', 'status_badge', 'cta_primary', 'cta_primary_link', 'cta_secondary', 'cta_secondary_link']}
        data={hero}
      />
      <SectionPanel
        title="Narrative"
        section="narrative"
        keys={['section_label', 'body']}
        data={narrative}
      />
      <SectionPanel
        title="Research"
        section="research"
        keys={['title_line1', 'title_line2', 'body', 'stat_citations_value', 'stat_citations_label', 'stat_pubs_value', 'stat_pubs_label']}
        data={research}
      />
    </div>
  )
}
