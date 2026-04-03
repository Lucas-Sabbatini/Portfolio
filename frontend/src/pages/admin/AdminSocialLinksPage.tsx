import { useState, useEffect } from 'react'
import type { SocialLink } from '../../api/content'
import { fetchSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink } from '../../api/content'

const emptyForm = { platform: '', url: '', label: '', icon: '', color: '', sort_order: 0 }

function IconPreview({ icon, color }: { icon: string; color?: string }) {
  if (!icon) return null
  const isUrl = icon.startsWith('http://') || icon.startsWith('https://')

  if (isUrl && color && icon.toLowerCase().includes('.svg')) {
    return (
      <span
        style={{
          display: 'inline-block',
          width: 20, height: 20,
          backgroundColor: color,
          WebkitMaskImage: `url(${icon})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: `url(${icon})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
      />
    )
  }

  if (isUrl) {
    return <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
  }

  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: 20, lineHeight: 1, color: color || undefined }}
    >
      {icon}
    </span>
  )
}

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
  const [color, setColor] = useState(initial.color ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order))

  return (
    <div className="space-y-3 p-6 glass-card rounded-[1.5rem]">
      {[
        { label: 'Platform', value: platform, set: setPlatform },
        { label: 'URL', value: url, set: setUrl },
        { label: 'Label', value: label, set: setLabel },
      ].map(({ label: lbl, value, set }) => (
        <div key={lbl} className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">{lbl}</span>
          <input
            type="text"
            value={value}
            onChange={(e) => set(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      ))}

      {/* Icon field with live preview */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">Icon</span>
        <input
          type="text"
          value={icon}
          placeholder="Material Symbol key or https://... URL"
          onChange={(e) => setIcon(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
        />
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10">
            <IconPreview icon={icon} color={color || undefined} />
          </div>
        )}
      </div>

      {/* Color field */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">Color</span>
        <div className="flex flex-1 items-center gap-2">
          <input
            type="color"
            value={color || '#ffffff'}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0 p-0"
          />
          <input
            type="text"
            value={color}
            placeholder="#ffffff or rgb(...)"
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
          />
          {color && (
            <button
              onClick={() => setColor('')}
              className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full hover:text-primary transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {/* Sort order */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">Sort Order</span>
        <input
          type="text"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onSave({
            platform,
            url,
            label,
            icon: icon || undefined,
            color: color || undefined,
            sort_order: Number(sortOrder),
          })}
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
                  <div className="flex items-center justify-center w-8 h-8">
                    <IconPreview icon={link.icon} color={link.color} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{link.label}</p>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">{link.platform} · {link.url}</p>
                </div>
                {link.color && (
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: link.color }}
                    title={link.color}
                  />
                )}
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
