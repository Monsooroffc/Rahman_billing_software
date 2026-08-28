import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Wallet } from 'lucide-react'
import { db } from '@/db'
import type { Expense, ExpenseCategory } from '@/types'
import { formatCurrency, formatDate, getToday, getDateRange } from '@/utils/formatters'

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today')
  const [formData, setFormData] = useState({ category_id: 0, name: '', amount: 0, payment_method: 'cash', notes: '', expense_date: getToday() })

  useEffect(() => { loadData() }, [filter])

  const loadData = async () => {
    const range = getDateRange(filter)
    const e = await db.getExpenses({ from: range.from, to: range.to })
    const c = await db.getExpenseCategories()
    setExpenses(e)
    setCategories(c)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingExpense) {
      await db.updateExpense(editingExpense.id, formData)
    } else {
      await db.createExpense(formData)
    }
    setShowForm(false)
    setEditingExpense(null)
    setFormData({ category_id: 0, name: '', amount: 0, payment_method: 'cash', notes: '', expense_date: getToday() })
    loadData()
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({ category_id: expense.category_id || 0, name: expense.name, amount: expense.amount, payment_method: expense.payment_method, notes: expense.notes || '', expense_date: expense.expense_date })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this expense?')) {
      await db.deleteExpense(id)
      loadData()
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Expenses</h2>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="card flex items-center gap-3">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"><Wallet size={20} className="text-red-600" /></div>
        <div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p></div>
      </div>

      <button onClick={() => { setShowForm(true); setEditingExpense(null); setFormData({ category_id: categories[0]?.id || 0, name: '', amount: 0, payment_method: 'cash', notes: '', expense_date: getToday() }) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Expense</button>

      {showForm && (
        <div className="card max-w-md">
          <h3 className="font-semibold mb-3">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select className="input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})}>
              <option value={0}>Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="Expense Name" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="number" placeholder="Amount (₹)" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} required />
            <select className="input" value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
              <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="other">Other</option>
            </select>
            <input type="date" className="input" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} />
            <input type="text" placeholder="Notes (optional)" className="input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            <div className="flex gap-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editingExpense ? 'Update' : 'Add'}</button></div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <th className="text-left py-2 px-3">Name</th>
              <th className="text-left py-2 px-3">Category</th>
              <th className="text-right py-2 px-3">Amount</th>
              <th className="text-center py-2 px-3">Payment</th>
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-center py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2 px-3 font-medium">{expense.name}</td>
                <td className="py-2 px-3 text-xs text-gray-500">{expense.category_name || '-'}</td>
                <td className="py-2 px-3 text-right font-medium">₹{expense.amount.toFixed(2)}</td>
                <td className="py-2 px-3 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700">{expense.payment_method.toUpperCase()}</span></td>
                <td className="py-2 px-3 text-xs">{formatDate(expense.expense_date)}</td>
                <td className="py-2 px-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(expense)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(expense.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No expenses</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
