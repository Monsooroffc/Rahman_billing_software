import { useEffect, useState } from 'react'
import { Search, Plus, User, Trash2, Edit, X } from 'lucide-react'
import { db } from '@/db'
import type { Customer, Bill } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' })
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerBills, setCustomerBills] = useState<Bill[]>([])

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    const c = await db.getCustomers()
    setCustomers(c)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCustomer) {
      await db.updateCustomer(editingCustomer.id, formData)
    } else {
      await db.createCustomer(formData)
    }
    setShowForm(false)
    setEditingCustomer(null)
    setFormData({ name: '', mobile: '', email: '' })
    loadCustomers()
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({ name: customer.name || '', mobile: customer.mobile || '', email: customer.email || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this customer?')) {
      await db.deleteCustomer(id)
      loadCustomers()
    }
  }

  const viewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer)
    const bills = await db.getCustomerBills(customer.id)
    setCustomerBills(bills)
  }

  const filtered = customers.filter(c => 
    (c.name?.toLowerCase().includes(search.toLowerCase()) || false) ||
    (c.mobile?.includes(search) || false)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Customers</h2>
        <button onClick={() => { setShowForm(true); setEditingCustomer(null); setFormData({ name: '', mobile: '', email: '' }) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Customer</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="search" placeholder="Search customers..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="card max-w-md">
          <h3 className="font-semibold mb-3">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Name" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="text" placeholder="Mobile" className="input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
            <input type="email" placeholder="Email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editingCustomer ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(customer => (
          <div key={customer.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg"><User size={16} className="text-primary-600" /></div>
                <div>
                  <p className="font-medium">{customer.name || 'Unnamed'}</p>
                  {customer.mobile && <p className="text-xs text-gray-500">{customer.mobile}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(customer)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={14} /></button>
                <button onClick={() => handleDelete(customer.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
              <span className="text-gray-500">{customer.total_bills} bills</span>
              <span className="font-medium">{formatCurrency(customer.total_spent)}</span>
            </div>
            <button onClick={() => viewHistory(customer)} className="mt-2 w-full text-center text-xs text-primary-600 hover:underline">View History</button>
          </div>
        ))}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{selectedCustomer.name} - Transaction History</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X size={18} /></button>
            </div>
            {customerBills.length === 0 ? <p className="text-center text-gray-400 py-4">No transactions</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-gray-600"><th className="text-left py-2">Bill</th><th className="text-left py-2">Date</th><th className="text-right py-2">Total</th></tr></thead>
                <tbody>
                  {customerBills.map(bill => (
                    <tr key={bill.id} className="border-b border-gray-100 dark:border-gray-700"><td className="py-2">{bill.bill_number}</td><td className="py-2 text-xs">{formatDate(bill.created_at)}</td><td className="py-2 text-right font-medium">₹{bill.total.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
