import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Trash2 } from 'lucide-react'
import { db } from '@/db'
import type { Bill, Settings } from '@/types'
import { formatDateTime } from '@/utils/formatters'

export default function BillView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bill, setBill] = useState<Bill | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    loadBill()
  }, [id])

  const loadBill = async () => {
    if (!id) return
    if (!window.electronAPI) {
      const browserBill = (JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]') as Bill[])
        .find(item => item.id === Number(id))
      setBill(browserBill || null)
      setSettings(await db.getSettings())
      return
    }
    const b = await db.getBillById(parseInt(id))
    const s = await db.getSettings()
    setBill(b || null)
    setSettings(s)
  }

  const handlePrint = async () => {
    if (!bill || !settings) return
    const { generateReceiptHTML } = await import('@/utils/receipt')
    const html = generateReceiptHTML(bill, settings, settings.receipt_paper_size === 'thermal')
    if (window.electronAPI) {
      await db.printReceipt(html, settings.printer_name)
    } else {
      const printWindow = window.open('', '_blank', 'width=420,height=700')
      if (!printWindow) {
        alert('Popup blocked. Allow popups to print the receipt.')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const handleVoid = async () => {
    if (!bill) return
    const reason = prompt('Enter reason for voiding:')
    if (reason) {
      if (!window.electronAPI) {
        const browserBills = JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]') as Bill[]
        localStorage.setItem('rahman-browser-bills', JSON.stringify(browserBills.map(item =>
          item.id === bill.id ? { ...item, status: 'VOID', void_reason: reason } : item
        )))
        loadBill()
        return
      }
      await db.voidBill(bill.id, reason)
      loadBill()
    }
  }

  if (!bill) return <div className="p-4">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/bills')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ArrowLeft size={20} /></button>
        <h2 className="text-xl font-bold">Bill {bill.bill_number}</h2>
      </div>

      <div className="card space-y-4">
        <div className="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
          <h3 className="text-lg font-bold">{settings?.shop_name}</h3>
          <p className="text-sm text-gray-500">Printing • Xerox • Scanning • Online Services</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Bill Number</p><p className="font-medium">{bill.bill_number}</p></div>
          <div><p className="text-gray-500">Date & Time</p><p className="font-medium">{formatDateTime(bill.created_at)}</p></div>
          {bill.customer_name && <div><p className="text-gray-500">Customer</p><p className="font-medium">{bill.customer_name} {bill.customer_mobile && `- ${bill.customer_mobile}`}</p></div>}
          <div><p className="text-gray-500">Status</p><span className={`px-2 py-0.5 rounded-full text-xs ${bill.status === 'COMPLETED' ? 'bg-shop-100 text-shop-700' : 'bg-red-100 text-red-700'}`}>{bill.status}</span></div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="text-left py-2">Service</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Rate</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2">{item.service_name_snapshot}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">₹{item.rate.toFixed(2)}</td>
                <td className="py-2 text-right font-medium">₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{bill.subtotal.toFixed(2)}</span></div>
          {bill.discount > 0 && <div className="flex justify-between text-sm"><span>Discount</span><span>₹{bill.discount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span>₹{bill.total.toFixed(2)}</span></div>
          <div className="text-center text-sm font-medium bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">Payment: {bill.payment_method.toUpperCase()}</div>
        </div>

        {bill.status === 'VOID' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
            <p className="text-red-700 dark:text-red-400 font-medium">VOIDED</p>
            <p className="text-red-600 dark:text-red-300">Reason: {bill.void_reason}</p>
            <p className="text-red-500 text-xs">{formatDateTime(bill.voided_at!)}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2"><Printer size={16} /> Print</button>
          {bill.status === 'COMPLETED' && <button onClick={handleVoid} className="btn-danger flex items-center justify-center gap-2"><Trash2 size={16} /> Void</button>}
        </div>
      </div>
    </div>
  )
}
