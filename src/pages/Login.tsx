import { FormEvent, useState } from 'react'
import { LockKeyhole, LogIn } from 'lucide-react'

export type UserRole = 'owner' | 'employee'

export interface SessionUser {
  loginId: string
  role: UserRole
}

const USERS = [
  { loginId: 'Sulthankbm', password: 'Sulthan@123', role: 'owner' as const },
  { loginId: 'm72026', password: 'admin', role: 'employee' as const },
]

export const getSessionUser = (): SessionUser | null => {
  const stored = localStorage.getItem('rahman-session')
  return stored ? JSON.parse(stored) as SessionUser : null
}

export default function Login() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const user = USERS.find(account => account.loginId === loginId.trim() && account.password === password)
    if (!user) {
      setError('Invalid login ID or password')
      return
    }
    localStorage.setItem('rahman-session', JSON.stringify({ loginId: user.loginId, role: user.role }))
    window.location.href = user.role === 'owner' ? '/' : '/new-bill'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm card">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <LockKeyhole className="text-primary-600" size={24} />
          </div>
          <h1 className="text-xl font-bold text-primary-700 dark:text-primary-400">RAHMAN XEROX</h1>
          <p className="text-sm text-gray-500">&amp; SIFY IWAY</p>
          <p className="mt-4 font-semibold">Sign in</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" value={loginId} onChange={event => setLoginId(event.target.value)} placeholder="Login ID" autoComplete="username" required autoFocus />
          <input className="input" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full flex items-center justify-center gap-2" type="submit"><LogIn size={16} /> Login</button>
        </form>
      </div>
    </div>
  )
}
