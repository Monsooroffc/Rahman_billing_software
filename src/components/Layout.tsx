import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        navigate('/new-bill')
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
      }
      if (e.key === 'F1') {
        e.preventDefault()
        navigate('/new-bill')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className="flex h-screen bg-[#f5f7fb] dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
