import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, type HTMLAttributes, type ReactNode, type CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkEmoji from 'remark-emoji'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import { motion, useReducedMotion } from 'framer-motion'
import type { Post, PostDetail } from '@/types/post'
import { fetchPost, fetchPosts } from '@/api/posts'
import { fetchContent } from '@/api/content'
import { subscribe } from '@/api/newsletter'
import { ApiError, resolveImageUrl } from '@/api/client'
import { resolvePostImageKeys } from '@/utils/resolvePostImages'
import { TagChip } from '@/components/blog/PostCard/PostCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { fadeUp, viewportOnce } from '@/lib/animations'
import 'highlight.js/styles/github-dark.min.css'
import 'katex/dist/katex.min.css'
import './PostPage.css'

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className', 'style'],
    div: [...(defaultSchema.attributes?.div ?? []), 'className', 'style'],
    math: [...(defaultSchema.attributes?.math ?? []), 'xmlns'],
    svg: [...(defaultSchema.attributes?.svg ?? []), 'xmlns', 'viewBox', 'width', 'height'],
    sup: [...(defaultSchema.attributes?.sup ?? []), 'id'],
    a: [...(defaultSchema.attributes?.a ?? []), 'id', 'href', 'className'],
    li: [...(defaultSchema.attributes?.li ?? []), 'id'],
    section: [...(defaultSchema.attributes?.section ?? []), 'className'],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub',
    'mfrac', 'mover', 'munder', 'msqrt', 'mtable', 'mtr', 'mtd',
    'mtext', 'annotation', 'svg', 'path', 'line', 'section',
  ],
}

function CodeBlock({ children, onCopy, ...props }: HTMLAttributes<HTMLPreElement> & { onCopy?: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const code = (typeof children === 'object' && children !== null && 'props' in (children as React.ReactElement))
      ? ((children as React.ReactElement).props as { children?: string }).children ?? ''
      : String(children ?? '')
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    })
  }, [children, onCopy])

  return (
    <div className="code-block">
      <button type="button" onClick={handleCopy} className="code-copy-btn" aria-label="Copy code">
        <span className="material-symbols-outlined text-[16px]">
          {copied ? 'check' : 'content_copy'}
        </span>
      </button>
      <pre {...props}>
        {children}
      </pre>
    </div>
  )
}

interface Heading {
  level: number
  text: string
  id: string
}

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return getTextContent((node as React.ReactElement).props.children)
  }
  return ''
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '')
}

function HeadingWithId({ level, children, ...props }: HTMLAttributes<HTMLHeadingElement> & { level: number }) {
  const id = slugify(getTextContent(children))
  switch (level) {
    case 1: return <h1 id={id} {...props}>{children}</h1>
    case 2: return <h2 id={id} {...props}>{children}</h2>
    case 3: return <h3 id={id} {...props}>{children}</h3>
    case 4: return <h4 id={id} {...props}>{children}</h4>
    case 5: return <h5 id={id} {...props}>{children}</h5>
    default: return <h6 id={id} {...props}>{children}</h6>
  }
}

const headingComponents = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => <HeadingWithId level={1} {...props} />,
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => <HeadingWithId level={2} {...props} />,
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => <HeadingWithId level={3} {...props} />,
  h4: (props: HTMLAttributes<HTMLHeadingElement>) => <HeadingWithId level={4} {...props} />,
  h5: (props: HTMLAttributes<HTMLHeadingElement>) => <HeadingWithId level={5} {...props} />,
  h6: (props: HTMLAttributes<HTMLHeadingElement>) => <HeadingWithId level={6} {...props} />,
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newsletterMsg, setNewsletterMsg] = useState<{ text: string; cls: string } | null>(null)
  const [postContent, setPostContent] = useState<Record<string, string>>({})
  const { track } = useAnalytics()
  const reducedMotion = useReducedMotion()
  const [activeId, setActiveId] = useState('')
  const headerRef = useRef<HTMLElement>(null)
  const proseRef = useRef<HTMLDivElement>(null)
  const [tocStyle, setTocStyle] = useState<CSSProperties>({ display: 'none' })

  const headings = useMemo<Heading[]>(() => {
    if (!post?.body) return []
    const regex = /^(#{1,6})\s+(.+)$/gm
    const results: Heading[] = []
    let match
    while ((match = regex.exec(post.body)) !== null) {
      const level = match[1].length
      if (level === 1) continue
      const text = match[2].replace(/[*_`~[\]]/g, '')
      const id = slugify(text)
      results.push({ level, text, id })
    }
    return results
  }, [post?.body])

  useEffect(() => {
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '0px 0px -80% 0px' },
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  useLayoutEffect(() => {
    if (!proseRef.current || !headerRef.current || !headings.length) return

    let ticking = false
    const tocWidth = 200
    const gap = 48
    const stickyTop = 40

    const update = () => {
      if (!proseRef.current || !headerRef.current) return
      const proseRect = proseRef.current.getBoundingClientRect()
      const headerRect = headerRef.current.getBoundingClientRect()
      const hasSpace = window.innerWidth - proseRect.right >= tocWidth + gap
      const inView = proseRect.bottom > stickyTop && headerRect.top < window.innerHeight

      if (hasSpace && inView) {
        const top = Math.max(stickyTop, headerRect.top)
        const bottomMargin = 40
        const availableFromViewport = window.innerHeight - top - bottomMargin
        const availableFromProse = proseRect.bottom - top
        const maxHeight = Math.max(0, Math.min(availableFromViewport, availableFromProse))
        setTocStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${proseRect.right + gap}px`,
          width: `${tocWidth}px`,
          maxHeight: `${maxHeight}px`,
          overflowY: 'auto',
        })
      } else {
        setTocStyle({ display: 'none' })
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  }, [headings])

  useEffect(() => {
    fetchContent('post').then(setPostContent).catch(console.error)
  }, [])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    Promise.all([
      fetchPost(slug),
      fetchPosts(),
    ])
      .then(([postData, postsData]) => {
        setPost(postData)
        setAllPosts(postsData)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          console.error(err)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  const currentIndex = allPosts.findIndex((p) => p.slug === post?.slug)
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

  const renderedBody = useMemo(
    () => post ? (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex, [rehypeSanitize, sanitizeSchema]]}
        components={{
          pre: (preProps) => <CodeBlock {...preProps} onCopy={() => track('code-copy', { slug: post.slug })} />,
          table: ({ children, ...props }) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),
          ...headingComponents,
        }}
      >
        {resolvePostImageKeys(post.body, post.images ?? [])}
      </ReactMarkdown>
    ) : null,
    [post, track],
  )

  const formattedDate = post?.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
    : ''

  useEffect(() => {
    if (!post) return
    const thresholds = [25, 50, 75, 100]
    const fired = new Set<number>()

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        thresholds.forEach(t => {
          if (scrolled >= t && !fired.has(t)) {
            fired.add(t)
            track('scroll-depth', { percent: t, slug: post?.slug })
          }
        })
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [post, track])

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <article className="max-w-3xl mx-auto space-y-12" role="status" aria-busy="true">
          <h1 className="sr-only">Loading post</h1>
          <div className="solid-card h-12 w-2/3 rounded-full animate-pulse" />
          <div className="solid-card h-4 w-1/4 rounded-full animate-pulse" />
          <div className="solid-card w-full h-[400px] rounded-[2rem] animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="solid-card h-4 w-full rounded animate-pulse" />
          ))}
        </article>
      </main>
    )
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setNewsletterMsg(null)
    try {
      await subscribe(email)
      setEmail('')
      setNewsletterMsg({ text: 'Signal received.', cls: 'text-primary text-xs' })
      track('newsletter-subscribe')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNewsletterMsg({ text: 'Already subscribed.', cls: 'text-on-surface-variant text-xs' })
      } else {
        setNewsletterMsg({ text: 'Something went wrong.', cls: 'text-error text-xs' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound || !post) {
    return (
      <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <div className="post-not-found">
          <h1 className="sr-only">Post not found</h1>
          <span className="material-symbols-outlined text-primary/30 text-6xl" aria-hidden="true">signal_disconnected</span>
          <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">
            Signal not found
          </p>
          <Link to="/blog" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">
            ← Back to Archive
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
      <article className="max-w-3xl mx-auto space-y-12">
        <header ref={headerRef} className="space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/blog" className="inline-flex items-center min-h-[44px] text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
              ← Signal Archive
            </Link>
            <span className="w-1 h-1 rounded-full bg-on-surface/20" />
            <TagChip tag={post.tag} />
          </div>
          <h1 className="font-headline font-extrabold text-4xl md:text-6xl tracking-tighter leading-tight text-on-surface">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
            <span>{formattedDate}</span>
            <span className="w-1 h-1 rounded-full bg-on-surface/20" />
            <span>{post.read_time}</span>
          </div>
        </header>

        {post.cover_image && (
          <div className="post-cover">
            <img src={resolveImageUrl(post.cover_image)} alt={post.title} loading="lazy" className="w-full h-auto opacity-80" />
          </div>
        )}

        <div ref={proseRef} className="post-prose max-w-none">
          {renderedBody}
        </div>

        {headings.length > 0 && (
          <nav className="post-toc" style={tocStyle} aria-label="Table of contents">
            <span className="post-toc-label">On this page</span>
            <ul>
              {headings.map(({ id, text, level }) => (
                <li key={id} className="post-toc-item">
                  {activeId === id && (
                    <motion.div
                      layoutId="toc-indicator"
                      className="post-toc-indicator"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 350, damping: 30 }
                      }
                    />
                  )}
                  <a
                    href={`#${id}`}
                    className={`post-toc-link ${activeId === id ? 'post-toc-link-active' : ''}`}
                    style={{ paddingLeft: `${12 + (level - 2) * 12}px` }}
                    onClick={(e) => {
                      e.preventDefault()
                      track('toc-click', { heading: text, slug: post.slug })
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="h-[1px] bg-on-surface/5" />

        {/* ── Prev / Next navigation ─────────────────────────────── */}
        {(prevPost || nextPost) && (
          <motion.nav
            aria-label="Post navigation"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="post-nav"
          >
            {prevPost ? (
              <Link to={`/blog/${prevPost.slug}`} className="post-nav-link group" onClick={() => track('post-navigate', { direction: 'previous', slug: prevPost.slug })}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                  ← Previous
                </span>
                <span className="font-headline font-bold text-sm tracking-tight text-on-surface group-hover:text-primary transition-colors">
                  {prevPost.title}
                </span>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link to={`/blog/${nextPost.slug}`} className="post-nav-link group text-right" onClick={() => track('post-navigate', { direction: 'next', slug: nextPost.slug })}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                  Next →
                </span>
                <span className="font-headline font-bold text-sm tracking-tight text-on-surface group-hover:text-primary transition-colors">
                  {nextPost.title}
                </span>
              </Link>
            ) : <div />}
          </motion.nav>
        )}

        {/* ── Newsletter CTA ─────────────────────────────────────── */}
        <motion.section
          aria-label="Newsletter signup"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="post-newsletter"
        >
          <div className="space-y-2">
            <h2 className="font-headline font-extrabold text-xl md:text-2xl tracking-tight text-on-surface">
              {postContent.newsletter_title ?? 'Stay on the signal.'}
            </h2>
            <p className="text-on-surface-variant text-sm font-light">
              {postContent.newsletter_subtitle ?? 'New dispatches land in your inbox. No noise.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="post-newsletter-input"
              />
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="post-newsletter-btn"
              >
                {submitting ? 'Transmitting…' : 'Subscribe'}
              </motion.button>
            </form>
            {newsletterMsg && (
              <p className={newsletterMsg.cls}>{newsletterMsg.text}</p>
            )}
          </div>
        </motion.section>

        {/* ── Back to top ─────────────────────────────────────────── */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="post-back-to-top group"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-y-0.5 transition-transform">
              arrow_upward
            </span>
            Back to top
          </button>
        </div>
      </article>

    </main>
  )
}
