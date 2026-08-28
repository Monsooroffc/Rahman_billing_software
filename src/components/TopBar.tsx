import { useNavigate } from 'react-router-dom'
import { Plus, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { db } from '@/db'
import { formatDate } from '@/utils/formatters'
import { getSessionUser } from '@/pages/Login'

export default function TopBar() {
  const navigate = useNavigate()
  const user = getSessionUser()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const load = async () => {
      const s = await db.getSettings()
      setIsDark(s.theme === 'dark')
    }
    load()
  }, [])

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    await db.updateSettings({ theme: newTheme })
  }

  return (
    <header className="h-14 bg-[#062457] text-white border-b border-[#123a76] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-blue-100">{formatDate(new Date())}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">{user?.loginId} ({user?.role})</span>
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[#123a76] text-blue-100">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={() => { localStorage.removeItem('rahman-session'); window.location.href = '/login' }} className="btn-secondary text-sm">Logout</button>
        <button onClick={() => navigate('/new-bill')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> New Bill
        </button>
      </div>
    </header>
  )
}
