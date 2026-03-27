import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../api/auth'

const navItems = [
  { label: 'Posts', path: '/admin/posts' },
  { label: 'Content', path: '/admin/content' },
  { label: 'Experience', path: '/admin/experience' },
  { label: 'Skills', path: '/admin/skills' },
  { label: 'Social Links', path: '/admin/social-links' },
  { label: 'Newsletter', path: '/admin/newsletter' },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout().catch(console.error)
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 glass-card border-r border-white/5 flex flex-col p-6 gap-2">
        <Link to="/" className="text-xl font-black text-on-surface mb-6">
          lucas.janot
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
              pathname.startsWith(item.path)
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-red-400 transition-colors text-left"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <div className="ml-56 flex-1 p-10">
        <Outlet />
      </div>
    </div>
  )
}
