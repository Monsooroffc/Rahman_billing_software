import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download } from 'lucide-react'
import { db } from '@/db'
import { hasCloudDatabase } from '@/db/supabase'
import { formatCurrency, getDateRange, getToday } from '@/utils/formatters'
import type { PaymentSummary, ServiceReport } from '@/types'

const COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#6b7280']

export default function Reports() {
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('today')
  const [customFrom, setCustomFrom] = useState(getToday())
  const [customTo, setCustomTo] = useState(getToday())
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [serviceReport, setServiceReport] = useState<ServiceReport[]>([])
  const [billsCount, setBillsCount] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [voidedCount, setVoidedCount] = useState(0)

  useEffect(() => { loadReport() }, [range, customFrom, customTo])

  const loadReport = async () => {
    const { from, to } = getDateRange(range, customFrom, customTo)
    if (!window.electronAPI && !hasCloudDatabase) {
      const browserBills = JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]') as Array<{
        total: number
        subtotal: number
        discount: number
        payment_method: string
        created_at: string
        status: string
        items?: Array<{ service_name_snapshot: string; category_name_snapshot?: string; quantity: number; amount: number }>
      }>
      const periodBills = browserBills.filter(bill => {
        const date = bill.created_at.slice(0, 10)
        return date >= from && date <= to
      })
      const completed = periodBills.filter(bill => bill.status === 'COMPLETED')
      const amount = (method?: string) => completed
        .filter(bill => !method || bill.payment_method === method)
        .reduce((sum, bill) => sum + bill.total, 0)
      const paymentData = {
        cash: amount('cash'),
        upi: amount('upi'),
        card: amount('card'),
        other: amount('other'),
        total: amount()
      }
      const serviceTotals = new Map<string, ServiceReport>()
      completed.forEach(bill => bill.items?.forEach(item => {
        const existing = serviceTotals.get(item.service_name_snapshot)
        serviceTotals.set(item.service_name_snapshot, {
          service_name: item.service_name_snapshot,
          category_name: item.category_name_snapshot || '',
          quantity: (existing?.quantity || 0) + item.quantity,
          total_revenue: (existing?.total_revenue || 0) + item.amount
        })
      }))
      setPaymentSummary(paymentData)
      setServiceReport([...serviceTotals.values()].sort((a, b) => b.total_revenue - a.total_revenue))
      setBillsCount(completed.length)
      setTotalSales(completed.reduce((sum, bill) => sum + bill.total, 0))
      setTotalDiscount(completed.reduce((sum, bill) => sum + bill.discount, 0))
      setVoidedCount(periodBills.filter(bill => bill.status === 'VOID').length)
      return
    }
    const payments = await db.getPaymentSummary(from, to)
    setPaymentSummary(payments)
    const services = await db.getServiceReport(from, to)
    setServiceReport(services)
    const allBills = await db.getBills({ from, to })
    const completed = allBills.filter(b => b.status === 'COMPLETED')
    const voided = allBills.filter(b => b.status === 'VOID')
    setBillsCount(completed.length)
    setTotalSales(completed.reduce((s, b) => s + b.total, 0))
    setTotalDiscount(completed.reduce((s, b) => s + b.discount, 0))
    setVoidedCount(voided.length)
  }

  const paymentData = paymentSummary ? [
    { name: 'Cash', value: paymentSummary.cash },
    { name: 'UPI', value: paymentSummary.upi },
    { name: 'Card', value: paymentSummary.card },
    { name: 'Other', value: paymentSummary.other },
  ].filter(d => d.value > 0) : []

  const downloadReport = () => {
    const rows = [
      ['RAHMAN XEROX & SIFY IWAY'],
      ['Report period', `${getDateRange(range, customFrom, customTo).from} to ${getDateRange(range, customFrom, customTo).to}`],
      [],
      ['Summary', 'Value'],
      ['Total Bills', billsCount],
      ['Gross Sales', totalSales.toFixed(2)],
      ['Discount', totalDiscount.toFixed(2)],
      ['Voided Bills', voidedCount],
      [],
      ['Payment Method', 'Amount'],
      ['Cash', paymentSummary?.cash.toFixed(2) || '0.00'],
      ['UPI', paymentSummary?.upi.toFixed(2) || '0.00'],
      ['Card', paymentSummary?.card.toFixed(2) || '0.00'],
      ['Other', paymentSummary?.other.toFixed(2) || '0.00'],
      ['Total', paymentSummary?.total.toFixed(2) || '0.00'],
      [],
      ['Service', 'Quantity', 'Revenue'],
      ...serviceReport.map(row => [row.service_name, row.quantity, row.total_revenue.toFixed(2)])
    ]
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `rahman-report-${getDateRange(range, customFrom, customTo).from}-to-${getDateRange(range, customFrom, customTo).to}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reports</h2>
        <div className="flex items-center gap-2">
          {(['today', 'week', 'month', 'custom'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-sm ${range === r ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {r === 'custom' ? 'Custom' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          <button onClick={downloadReport} title="Download report for selected dates" className="btn-primary flex items-center gap-2 text-sm"><Download size={15} /> Download</button>
        </div>
      </div>

      {range === 'custom' && <div className="flex gap-2"><input type="date" className="input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} /><input type="date" className="input" value={customTo} onChange={e => setCustomTo(e.target.value)} /></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card"><p className="text-xs text-gray-500">Total Bills</p><p className="text-xl font-bold">{billsCount}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Gross Sales</p><p className="text-xl font-bold">{formatCurrency(totalSales)}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Discount</p><p className="text-xl font-bold text-red-500">{formatCurrency(totalDiscount)}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Voided Bills</p><p className="text-xl font-bold text-red-500">{voidedCount}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3">Payment Methods</h3>
          {paymentData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ₹${value.toFixed(0)}`}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-gray-400 py-8">No data</p>}
          <div className="mt-3 space-y-1">
            {paymentSummary && (
              <>
                <div className="flex justify-between text-sm"><span>Cash</span><span>{formatCurrency(paymentSummary.cash)}</span></div>
                <div className="flex justify-between text-sm"><span>UPI</span><span>{formatCurrency(paymentSummary.upi)}</span></div>
                <div className="flex justify-between text-sm"><span>Card</span><span>{formatCurrency(paymentSummary.card)}</span></div>
                <div className="flex justify-between text-sm"><span>Other</span><span>{formatCurrency(paymentSummary.other)}</span></div>
                <div className="flex justify-between text-sm font-bold border-t pt-1"><span>Total</span><span>{formatCurrency(paymentSummary.total)}</span></div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Service-wise Sales</h3>
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-600"><th className="text-left py-2">Service</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Revenue</th></tr></thead>
              <tbody>
                {serviceReport.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700"><td className="py-2">{row.service_name}</td><td className="py-2 text-right">{row.quantity}</td><td className="py-2 text-right font-medium">{formatCurrency(row.total_revenue)}</td></tr>
                ))}
                {serviceReport.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-400">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
