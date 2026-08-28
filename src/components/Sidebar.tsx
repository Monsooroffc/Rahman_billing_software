import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Receipt, Users, Settings as SettingsIcon, BarChart3, Wallet } from 'lucide-react'
import { getSessionUser } from '@/pages/Login'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/new-bill', label: 'New Bill', icon: FileText },
  { path: '/bills', label: 'Bills', icon: Receipt },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/services', label: 'Services', icon: SettingsIcon },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const isOwner = getSessionUser()?.role === 'owner'
  const visibleItems = isOwner ? navItems : navItems.filter(item => ['/', '/new-bill', '/bills', '/customers'].includes(item.path))
  return (
    <aside className="w-56 bg-[#062457] text-white border-r border-[#123a76] flex flex-col">
      <div className="p-4 border-b border-[#123a76]">
        <h1 className="text-sm font-bold text-white leading-tight">
          RAHMAN XEROX<br />
          <span className="text-xs font-normal text-blue-200">& SIFY IWAY</span>
        </h1>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-[#123a76]'}`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-[#123a76] text-xs text-blue-200 text-center">
        F1 = New Bill
      </div>
    </aside>
  )
}
