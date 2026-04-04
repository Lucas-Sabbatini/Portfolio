import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Post } from '../../api/posts'
import { fetchPosts, publishPost, deletePost } from '../../api/posts'

function PostRow({ post, onDelete, onPublish }: {
  post: Post
  onDelete: (slug: string) => void
  onPublish: (slug: string) => void
}) {
  const isPublished = post.status === 'published'

  return (
    <div className="glass-card rounded-[1.5rem] p-5 flex items-center gap-6">
      <span
        className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border flex-shrink-0 ${
          isPublished
            ? 'text-primary bg-primary/10 border-primary/20'
            : 'text-on-surface-variant bg-white/5 border-white/10'
        }`}
      >
        {post.status}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-on-surface truncate">{post.title}</p>
      </div>
      <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'}
      </span>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          to={`/admin/posts/${post.slug}/edit`}
          className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
        >
          Edit
        </Link>
        <button
          onClick={() => onPublish(post.slug)}
          className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${post.title}"?`)) {
              onDelete(post.slug)
            }
          }}
          className="text-red-400 text-[10px] font-bold uppercase tracking-widest hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetchPosts(undefined, 'all').then(setPosts).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (slug: string) => {
    try {
      await deletePost(slug)
      setPosts(prev => prev.filter(p => p.slug !== slug))
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handlePublish = async (slug: string) => {
    try {
      const updated = await publishPost(slug)
      setPosts(prev => prev.map(p => p.slug === slug ? updated : p))
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Posts</h1>
        <Link to="/admin/posts/new">
          <button className="bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-3 rounded-full">
            New Post
          </button>
        </Link>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading ? (
        <p className="text-on-surface-variant text-sm">Loading…</p>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostRow key={post.id} post={post} onDelete={handleDelete} onPublish={handlePublish} />
          ))}
        </div>
      )}
    </div>
  )
}
