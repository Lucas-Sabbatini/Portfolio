import Navbar from '@/components/shared/Navbar/Navbar'
import Footer from '@/components/shared/Footer/Footer'
import HomePage from '@/pages/HomePage'

export default function App() {
  return (
    <div className="dark">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>
      <Navbar />
      <HomePage />
      <Footer />
    </div>
  )
}
