import { useState, useEffect } from 'react'
import { fetchPostImages, uploadPostImage, deletePostImage } from '@/api/posts'
import { resolveImageUrl } from '@/api/client'
import type { PostImage } from '@/types/post'

interface Props {
  postId: string
  onInsert: (snippet: string) => void
}

export default function PostImagePanel({ postId, onInsert }: Props) {
  const [images, setImages] = useState<PostImage[]>([])
  const [key, setKey] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetchPostImages(postId).then(setImages).catch((e) => setError(e.message))
  }

  useEffect(load, [postId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadPostImage(postId, file, key || undefined)
      setKey('')
      load()
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (imageId: string) => {
    try {
      await deletePostImage(postId, imageId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        Post Images
      </label>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key (auto from filename)"
          className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors w-48"
        />
        <label className="bg-white/10 hover:bg-white/15 text-sm px-4 py-2 rounded-full cursor-pointer transition-colors">
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {images.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {images.map((img) => (
              <code
                key={img.id}
                className="text-[11px] bg-primary/10 text-primary/90 px-2 py-0.5 rounded-full cursor-default select-all"
                title={img.url}
              >
                {img.key}
              </code>
            ))}
          </div>
          <div className="space-y-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2"
              >
                <img
                  src={resolveImageUrl(img.url)}
                  alt={img.key}
                  className="w-10 h-10 object-cover rounded"
                />
                <code className="text-xs text-primary/80 flex-1 truncate">{img.key}</code>
                <button
                  onClick={() => onInsert(`![${img.key}](${img.key})`)}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                >
                  Insert
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
