import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, IndianRupee, Wallet, CreditCard, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { db } from '@/db'
import { hasCloudDatabase } from '@/db/supabase'
import type { DashboardSummary } from '@/types'
import { formatCurrency, formatNumber, getToday } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartRange, setChartRange] = useState<'day' | 'week' | 'month'>('day')

  useEffect(() => {
    loadData()
  }, [chartRange])

  const loadData = async () => {
    if (!window.electronAPI && !hasCloudDatabase) {
      const today = getToday()
      const bills = JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]') as Array<{
        total: number
        payment_method: string
        created_at: string
        status: string
      }>
      const todayBills = bills.filter(bill => bill.created_at.slice(0, 10) === today && bill.status === 'COMPLETED')
      const total = (method?: string) => todayBills
        .filter(bill => !method || bill.payment_method === method)
        .reduce((sum, bill) => sum + bill.total, 0)
      setSummary({
        today_sales: total(),
        today_bills: todayBills.length,
        today_cash: total('cash'),
        today_upi: total('upi'),
        today_card: total('card'),
        today_other: total('other'),
        today_expenses: 0,
        net_collection: total()
      })
      setChartData(chartRange === 'day' ? [{ label: 'Today', sales: total() }] : [])
      return
    }
    const s = await db.getDashboardSummary()
    setSummary(s)
    const c = await db.getSalesChartData(chartRange)
    setChartData(c)
  }

  const statCards = [
    { label: "Today's Sales", value: formatCurrency(summary?.today_sales || 0), icon: IndianRupee, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Bills', value: formatNumber(summary?.today_bills || 0), icon: FileText, color: 'text-shop-600 bg-shop-50 dark:bg-shop-900/20' },
    { label: 'Cash', value: formatCurrency(summary?.today_cash || 0), icon: Wallet, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'UPI', value: formatCurrency(summary?.today_upi || 0), icon: CreditCard, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Expenses', value: formatCurrency(summary?.today_expenses || 0), icon: TrendingDown, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
    { label: 'Net Collection', value: formatCurrency(summary?.net_collection || 0), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">Main</p><h2 className="text-xl font-bold">Dashboard</h2></div>
        <button onClick={() => navigate('/new-bill')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Quick New Bill
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon size={18} />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span>
            </div>
            <p className="text-lg font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[#062457] text-white p-4 flex items-center justify-between shadow-sm">
        <div><p className="text-xs text-blue-200 uppercase tracking-wide">Today's Sales</p><p className="text-2xl font-bold mt-1">{formatCurrency(summary?.today_sales || 0)}</p></div>
        <div className="text-right text-sm text-blue-100"><p>Bills: {summary?.today_bills || 0}</p><p>Net: {formatCurrency(summary?.net_collection || 0)}</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Sales Overview</h3>
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map(r => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`px-3 py-1 rounded text-sm ${chartRange === r ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
