export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num || 0)
}

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getToday = (): string => {
  return new Date().toISOString().split('T')[0]
}

export const getDateRange = (range: 'today' | 'yesterday' | 'week' | 'month' | 'custom', customFrom?: string, customTo?: string): { from: string; to: string } => {
  const today = new Date()
  const format = (d: Date) => d.toISOString().split('T')[0]
  switch (range) {
    case 'today': return { from: format(today), to: format(today) }
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: format(y), to: format(y) } }
    case 'week': { const w = new Date(today); w.setDate(w.getDate() - 6); return { from: format(w), to: format(today) } }
    case 'month': { const m = new Date(today); m.setDate(1); return { from: format(m), to: format(today) } }
    case 'custom': return { from: customFrom || format(today), to: customTo || format(today) }
    default: return { from: format(today), to: format(today) }
  }
}
