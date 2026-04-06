import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import type { PostCreate } from '../../api/posts'
import { fetchPost, createPost, updatePost, uploadCoverImage } from '../../api/posts'
import { resolveImageUrl } from '../../api/client'

const slugify = (title: string) =>
  title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const TAGS = ['System Entry', 'Research', 'Archived', 'Drafting'] as const

export default function AdminPostEditPage() {
  const { slug } = useParams<{ slug?: string }>()
  const isNew = !slug
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [tag, setTag] = useState<PostCreate['tag']>('System Entry')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [readTime, setReadTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    fetchPost(slug).then(p => {
      setTitle(p.title)
      setPostSlug(p.slug)
      setTag(p.tag)
      setExcerpt(p.excerpt)
      setBody(p.body)
      setCoverImage(p.cover_image ?? '')
      setReadTime(p.read_time ?? '')
    }).catch((err) => setError(err.message))
  }, [slug])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (isNew) setPostSlug(slugify(val))
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadCoverImage(file)
      setCoverImage(result.url)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const data: PostCreate = {
      title,
      slug: postSlug || undefined,
      tag,
      excerpt,
      body,
      cover_image: coverImage || undefined,
      read_time: readTime || undefined,
    }
    try {
      if (isNew) {
        await createPost(data)
      } else {
        await updatePost(slug!, data)
      }
      navigate('/admin/posts')
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline font-extrabold text-3xl tracking-tighter">
        {isNew ? 'New Post' : 'Edit Post'}
      </h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-4 max-w-2xl">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Slug</label>
          <input
            type="text"
            value={postSlug}
            onChange={(e) => setPostSlug(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tag</label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as PostCreate['tag'])}
            className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
          >
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-[1rem] px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Read Time</label>
          <input
            type="text"
            value={readTime}
            onChange={(e) => setReadTime(e.target.value)}
            placeholder="e.g. 12 min"
            className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cover Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverImageChange}
            className="w-full text-sm text-on-surface-variant"
          />
          {coverImage && (
            <img src={resolveImageUrl(coverImage)} alt="Cover preview" className="rounded-[1rem] max-h-48 object-cover mt-2" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Body</label>
        <MDEditor value={body} onChange={(val) => setBody(val ?? '')} height={500} data-color-mode="dark" />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-3 rounded-full disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
