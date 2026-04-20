import { useState, useEffect } from 'react'
import { deleteCv, fetchContent, patchContent, uploadCv, uploadImage } from '../../api/content'
import { ApiError } from '../../api/client'

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

function ImageFieldRow({ section, fieldKey, value: initialValue }: FieldRowProps) {
  const [url, setUrl] = useState(initialValue)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setUrl(initialValue) }, [initialValue])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setSaved(false)
    setError('')
    try {
      const result = await uploadImage(file)
      await patchContent(section, fieldKey, result.url)
      setUrl(result.url)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-48 flex-shrink-0">
        {fieldKey}
      </span>
      <div className="flex-1 flex items-center gap-4">
        {url && (
          <img
            src={url.startsWith('/') ? `${apiBase}${url}` : url}
            alt="Preview"
            className="w-20 h-14 object-cover rounded-lg border border-white/10"
          />
        )}
        <label className="bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-4 py-2 rounded-full cursor-pointer disabled:opacity-60 flex-shrink-0">
          {uploading ? 'Uploading…' : saved ? 'Saved' : 'Upload'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}

function CvPanel() {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState('')
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    setSaved(false)
    try {
      await uploadCv(file)
      setSaved(true)
      setMissing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete the current CV? This cannot be undone.')) return
    setDeleting(true)
    setError('')
    try {
      await deleteCv()
      setMissing(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMissing(true)
      } else if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="glass-card rounded-[2rem] p-8 space-y-4">
      <h2 className="font-bold text-[10px] uppercase tracking-widest text-primary/60">CV</h2>
      <div className="flex items-center gap-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-48 flex-shrink-0">
          cv.pdf
        </span>
        {missing ? (
          <span className="text-xs text-on-surface-variant italic">No CV uploaded</span>
        ) : (
          <a
            href={`${apiBase}/cv`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline"
          >
            View current CV
          </a>
        )}
        <div className="flex-1" />
        {!missing && (
          <button
            onClick={handleDelete}
            disabled={deleting || uploading}
            className="bg-error/80 hover:bg-error text-on-error font-bold tracking-wider text-[10px] uppercase px-4 py-2 rounded-full disabled:opacity-60 flex-shrink-0"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
        <label className="bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-4 py-2 rounded-full cursor-pointer disabled:opacity-60 flex-shrink-0">
          {uploading ? 'Uploading…' : saved ? 'Saved' : 'Upload PDF'}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    </div>
  )
}

interface SectionPanelProps {
  title: string
  section: string
  keys: string[]
  imageKeys?: string[]
  data: Record<string, string>
}

function SectionPanel({ title, section, keys, imageKeys = [], data }: SectionPanelProps) {
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
          {imageKeys.map(k => (
            <ImageFieldRow key={k} section={section} fieldKey={k} value={data[k] ?? ''} />
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
  const [contact, setContact] = useState<Record<string, string>>({})
  const [blog, setBlog] = useState<Record<string, string>>({})
  const [post, setPost] = useState<Record<string, string>>({})
  const [footer, setFooter] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetchContent('hero'),
      fetchContent('narrative'),
      fetchContent('research'),
      fetchContent('contact'),
      fetchContent('blog'),
      fetchContent('post'),
      fetchContent('footer'),
    ]).then(([h, n, r, c, b, p, f]) => {
      setHero(h); setNarrative(n); setResearch(r)
      setContact(c); setBlog(b); setPost(p); setFooter(f)
    })
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
        keys={[
          'section_label', 'body',
          'stat_1_label', 'stat_1_value', 'stat_1_sub', 'stat_1_small',
          'stat_2_label', 'stat_2_value', 'stat_2_sub', 'stat_2_small',
          'stat_3_label', 'stat_3_value', 'stat_3_sub', 'stat_3_small',
          'stat_4_label', 'stat_4_value', 'stat_4_sub', 'stat_4_small',
        ]}
        data={narrative}
      />
      <SectionPanel
        title="Research"
        section="research"
        keys={['title_line1', 'title_line2', 'body', 'stat_citations_value', 'stat_citations_label', 'stat_pubs_value', 'stat_pubs_label']}
        imageKeys={['image_url']}
        data={research}
      />
      <SectionPanel
        title="Contact"
        section="contact"
        keys={['heading', 'heading_dim', 'email', 'subtitle']}
        data={contact}
      />
      <SectionPanel
        title="Blog"
        section="blog"
        keys={['title', 'subtitle', 'newsletter_title', 'newsletter_subtitle']}
        data={blog}
      />
      <SectionPanel
        title="Post"
        section="post"
        keys={['newsletter_title', 'newsletter_subtitle']}
        data={post}
      />
      <SectionPanel
        title="Footer"
        section="footer"
        keys={['copyright', 'tagline']}
        data={footer}
      />
      <CvPanel />
    </div>
  )
}
