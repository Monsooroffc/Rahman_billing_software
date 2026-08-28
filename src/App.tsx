import { Navigate, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewBill from './pages/NewBill'
import Bills from './pages/Bills'
import BillView from './pages/BillView'
import Customers from './pages/Customers'
import Services from './pages/Services'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import Login, { getSessionUser, type SessionUser } from './pages/Login'
import { db } from './db'

function App() {
  const [session] = useState<SessionUser | null>(() => getSessionUser())

  useEffect(() => {
    if (!session) return
    const loadTheme = async () => {
      const settings = await db.getSettings()
      document.documentElement.classList.toggle('dark', settings?.theme === 'dark')
    }
    loadTheme()
  }, [session])

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={session ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="new-bill" element={<NewBill />} />
        <Route path="bills" element={<Bills />} />
        <Route path="bills/:id" element={<BillView />} />
        <Route path="customers" element={<Customers />} />
        <Route path="services" element={session?.role === 'owner' ? <Services /> : <Navigate to="/new-bill" replace />} />
        <Route path="reports" element={session?.role === 'owner' ? <Reports /> : <Navigate to="/new-bill" replace />} />
        <Route path="expenses" element={session?.role === 'owner' ? <Expenses /> : <Navigate to="/new-bill" replace />} />
        <Route path="settings" element={session?.role === 'owner' ? <Settings /> : <Navigate to="/new-bill" replace />} />
      </Route>
    </Routes>
  )
}

export default App
