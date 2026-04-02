import { useState, useEffect } from 'react'
import type { SocialLink } from '../../api/content'
import { fetchSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink } from '../../api/content'

const emptyForm = { platform: '', url: '', label: '', icon: '', sort_order: 0 }

function LinkForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<SocialLink, 'id'>
  onSave: (data: Omit<SocialLink, 'id'>) => void
  onCancel?: () => void
}) {
  const [platform, setPlatform] = useState(initial.platform)
  const [url, setUrl] = useState(initial.url)
  const [label, setLabel] = useState(initial.label)
  const [icon, setIcon] = useState(initial.icon ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order))

  return (
    <div className="space-y-3 p-6 glass-card rounded-[1.5rem]">
      {[
        { label: 'Platform', value: platform, set: setPlatform },
        { label: 'URL', value: url, set: setUrl },
        { label: 'Label', value: label, set: setLabel },
        { label: 'Icon', value: icon, set: setIcon, hint: 'Material Symbol key' },
        { label: 'Sort Order', value: sortOrder, set: setSortOrder },
      ].map(({ label: lbl, value, set, hint }) => (
        <div key={lbl} className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">{lbl}</span>
          <input
            type="text"
            value={value}
            placeholder={hint}
            onChange={(e) => set(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      ))}
      <div className="flex gap-3">
        <button
          onClick={() => onSave({ platform, url, label, icon: icon || undefined, sort_order: Number(sortOrder) })}
          className="bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-2 rounded-full"
        >
          Save
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:text-primary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminSocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSocialLinks().then(setLinks).catch((err) => setError(err.message))
  }, [])

  const handleUpdate = async (id: string, data: Omit<SocialLink, 'id'>) => {
    try {
      const updated = await updateSocialLink(id, data)
      setLinks(prev => prev.map(l => l.id === id ? updated : l))
      setEditing(null)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleCreate = async (data: Omit<SocialLink, 'id'>) => {
    try {
      const created = await createSocialLink(data)
      setLinks(prev => [...prev, created])
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"?`)) return
    try {
      await deleteSocialLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Social Links</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="space-y-3">
        {links.map(link => (
          <div key={link.id}>
            {editing === link.id ? (
              <LinkForm
                initial={link}
                onSave={(data) => handleUpdate(link.id, data)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                className="glass-card rounded-[1.5rem] p-5 flex items-center gap-6 cursor-pointer"
                onClick={() => setEditing(link.id)}
              >
                {link.icon && (
                  <span className="material-symbols-outlined text-xl text-primary/70">{link.icon}</span>
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{link.label}</p>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">{link.platform} · {link.url}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(link.id, link.label) }}
                  className="text-red-400 text-[10px] font-bold uppercase tracking-widest"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h2 className="font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Add Link</h2>
        <LinkForm initial={emptyForm} onSave={handleCreate} />
      </div>
    </div>
  )
}
