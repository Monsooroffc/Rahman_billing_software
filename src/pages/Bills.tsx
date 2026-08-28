import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Printer, Trash2, Search } from 'lucide-react'
import { db } from '@/db'
import type { Bill } from '@/types'
import { formatCurrency, formatDateTime, getDateRange, getToday } from '@/utils/formatters'

export default function Bills() {
  const navigate = useNavigate()
  const [bills, setBills] = useState<Bill[]>([])
  const [filter, setFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today')
  const [customFrom, setCustomFrom] = useState(getToday())
  const [customTo, setCustomTo] = useState(getToday())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadBills()
  }, [filter, customFrom, customTo, searchQuery])

  const loadBills = async () => {
    const range = getDateRange(filter, customFrom, customTo)
    if (!window.electronAPI) {
      const browserBills = JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]') as Bill[]
      const data = browserBills.filter(bill => {
        const billDate = bill.created_at.slice(0, 10)
        const matchesDate = billDate >= range.from && billDate <= range.to
        const query = searchQuery.toLowerCase()
        const matchesSearch = !query || [bill.bill_number, bill.customer_name, bill.customer_mobile]
          .some(value => value?.toLowerCase().includes(query))
        return matchesDate && matchesSearch
      })
      setBills(data)
      return
    }
    const data = await db.getBills({
      from: range.from,
      to: range.to,
      search: searchQuery || undefined
    })
    setBills(data)
  }

  const handleVoid = async (bill: Bill) => {
    const reason = prompt('Enter reason for voiding bill:')
    if (reason) {
      if (!window.electronAPI) {
        const browserBills = JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]') as Bill[]
        localStorage.setItem('rahman-browser-bills', JSON.stringify(browserBills.map(item =>
          item.id === bill.id ? { ...item, status: 'VOID', void_reason: reason } : item
        )))
        loadBills()
        return
      }
      await db.voidBill(bill.id, reason)
      loadBills()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Bills</h2>
        <div className="flex gap-2">
          {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {f === 'custom' ? 'Custom' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filter === 'custom' && (
        <div className="flex gap-2">
          <input type="date" className="input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
          <input type="date" className="input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="search" placeholder="Search bill number, customer, mobile..." className="input pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-2 px-3">Bill No</th>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Customer</th>
                <th className="text-right py-2 px-3">Total</th>
                <th className="text-center py-2 px-3">Payment</th>
                <th className="text-center py-2 px-3">Status</th>
                <th className="text-center py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 px-3 font-medium">{bill.bill_number}</td>
                  <td className="py-2 px-3 text-xs">{formatDateTime(bill.created_at)}</td>
                  <td className="py-2 px-3">{bill.customer_name || '-'}</td>
                  <td className="py-2 px-3 text-right font-medium">₹{bill.total.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700">{bill.payment_method.toUpperCase()}</span></td>
                  <td className="py-2 px-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${bill.status === 'COMPLETED' ? 'bg-shop-100 text-shop-700' : 'bg-red-100 text-red-700'}`}>{bill.status}</span></td>
                  <td className="py-2 px-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => navigate(`/bills/${bill.id}`)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><Eye size={14} /></button>
                      <button onClick={() => navigate(`/bills/${bill.id}`)} title="Open and print bill" className="p-1.5 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 rounded"><Printer size={14} /></button>
                      {bill.status === 'COMPLETED' && <button onClick={() => handleVoid(bill)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No bills found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
