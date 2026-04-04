import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import Navbar from '@/components/shared/Navbar/Navbar'
import Footer from '@/components/shared/Footer/Footer'
import HomePage from '@/pages/HomePage'
import BlogPage from '@/pages/BlogPage/BlogPage'
import PostPage from '@/pages/PostPage/PostPage'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminPostsPage from '@/pages/admin/AdminPostsPage'
import AdminPostEditPage from '@/pages/admin/AdminPostEditPage'
import AdminContentPage from '@/pages/admin/AdminContentPage'
import AdminExperiencePage from '@/pages/admin/AdminExperiencePage'
import AdminSkillsPage from '@/pages/admin/AdminSkillsPage'
import AdminSocialLinksPage from '@/pages/admin/AdminSocialLinksPage'
import AdminNewsletterPage from '@/pages/admin/AdminNewsletterPage'
import { getMe } from '@/api/auth'

function AdminRoute() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    getMe().then(() => setAuthed(true)).catch(() => setAuthed(false))
  }, [])

  if (authed === null) return null
  if (!authed) return <Navigate to="/admin/login" replace />
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="posts" element={<AdminPostsPage />} />
        <Route path="posts/new" element={<AdminPostEditPage />} />
        <Route path="posts/:slug/edit" element={<AdminPostEditPage />} />
        <Route path="content" element={<AdminContentPage />} />
        <Route path="experience" element={<AdminExperiencePage />} />
        <Route path="skills" element={<AdminSkillsPage />} />
        <Route path="social-links" element={<AdminSocialLinksPage />} />
        <Route path="newsletter" element={<AdminNewsletterPage />} />
        <Route index element={<Navigate to="posts" replace />} />
      </Route>
    </Routes>
  )
}

function Layout() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const isPostPage = pathname.startsWith('/blog/')

  if (isAdmin) return <Outlet />

  return (
    <div className="dark">
      <Navbar minimal={pathname === '/blog' || isPostPage} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<PostPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="/*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  )
}
