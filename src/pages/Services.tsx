import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { db } from '@/db'
import { hasCloudDatabase } from '@/db/supabase'
import type { Service, ServiceCategory } from '@/types'

const DEFAULT_CATEGORIES = ['Xerox', 'Printout', 'ID Card', 'Lamination', 'Scanning', 'Photo', 'Binding', 'Online Services', 'Government Services', 'Other']

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({ category_id: 0, name: '', unit: 'piece', default_rate: 0, min_rate: 0, price_options: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    if (!window.electronAPI && !hasCloudDatabase) {
      const stored = JSON.parse(localStorage.getItem('rahman-browser-services') || '[]') as Service[]
      const names = [...new Set([...DEFAULT_CATEGORIES, ...stored.map(service => service.category_name).filter(Boolean)])] as string[]
      setServices(stored)
      setCategories(names.map((name, index) => ({ id: index + 1, name, display_order: index, is_active: 1, created_at: '' })))
      return
    }
    const s = await db.getServices()
    const c = await db.getServiceCategories()
    setServices(s)
    setCategories(c)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let priceOptions = formData.price_options.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0)
    if (priceOptions.length === 0) priceOptions = [formData.default_rate]

    const serviceData = {
      category_id: formData.category_id,
      name: formData.name,
      unit: formData.unit,
      default_rate: formData.default_rate,
      min_rate: formData.min_rate,
    }

    if (!window.electronAPI && !hasCloudDatabase) {
      const category = categories.find(item => item.id === formData.category_id)
      const stored = JSON.parse(localStorage.getItem('rahman-browser-services') || '[]') as Service[]
      const service: Service = {
        ...(editingService || { id: Date.now(), is_active: 1, is_custom: 1, display_order: stored.length, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        ...serviceData,
        category_name: category?.name || 'Other',
        price_options: priceOptions.map((rate, index) => ({ id: Date.now() + index, service_id: editingService?.id || Date.now(), rate, is_default: index === 0 ? 1 : 0, created_at: new Date().toISOString() }))
      } as Service
      const next = editingService ? stored.map(item => item.id === editingService.id ? service : item) : [...stored, service]
      localStorage.setItem('rahman-browser-services', JSON.stringify(next))
    } else if (editingService) {
      await db.updateService(editingService.id, serviceData, priceOptions)
    } else {
      await db.createService(serviceData, priceOptions)
    }

    setShowForm(false)
    setEditingService(null)
    setFormData({ category_id: 0, name: '', unit: 'piece', default_rate: 0, min_rate: 0, price_options: '' })
    loadData()
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      category_id: service.category_id,
      name: service.name,
      unit: service.unit,
      default_rate: service.default_rate,
      min_rate: service.min_rate || 0,
      price_options: service.price_options?.map(o => o.rate).join(', ') || String(service.default_rate)
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this service?')) {
      if (!window.electronAPI && !hasCloudDatabase) {
        const stored = JSON.parse(localStorage.getItem('rahman-browser-services') || '[]') as Service[]
        localStorage.setItem('rahman-browser-services', JSON.stringify(stored.filter(service => service.id !== id)))
      } else await db.deleteService(id)
      loadData()
    }
  }

  const toggleActive = async (service: Service) => {
    if (!window.electronAPI && !hasCloudDatabase) {
      const stored = JSON.parse(localStorage.getItem('rahman-browser-services') || '[]') as Service[]
      localStorage.setItem('rahman-browser-services', JSON.stringify(stored.map(item => item.id === service.id ? { ...item, is_active: service.is_active ? 0 : 1 } : item)))
    } else await db.updateService(service.id, { is_active: service.is_active ? 0 : 1 })
    loadData()
  }

  const grouped = categories.map(cat => ({
    ...cat,
    services: services.filter(s => s.category_name === cat.name)
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Services & Rates</h2>
        <button onClick={() => { setShowForm(true); setEditingService(null); setFormData({ category_id: categories[0]?.id || 0, name: '', unit: 'piece', default_rate: 0, min_rate: 0, price_options: '' }) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Service</button>
      </div>

      {showForm && (
        <div className="card max-w-lg">
          <h3 className="font-semibold mb-3">{editingService ? 'Edit Service' : 'Add Service'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select className="input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})} required>
              <option value={0}>Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="Service Name" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="text" placeholder="Unit (page, copy, piece, etc.)" className="input" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            <input type="number" placeholder="Default Rate (₹)" className="input" value={formData.default_rate} onChange={e => setFormData({...formData, default_rate: parseFloat(e.target.value) || 0})} required />
            <input type="text" placeholder="Price Options (comma separated, e.g. 15, 20)" className="input" value={formData.price_options} onChange={e => setFormData({...formData, price_options: e.target.value})} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editingService ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(group => (
          <div key={group.id} className="card">
            <h3 className="font-semibold text-primary-700 dark:text-primary-400 mb-3">{group.name}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-2">Service</th>
                    <th className="text-left py-2">Unit</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Options</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.services.map(service => (
                    <tr key={service.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 font-medium">{service.name}</td>
                      <td className="py-2 text-gray-500">{service.unit}</td>
                      <td className="py-2 text-right">₹{service.default_rate.toFixed(2)}</td>
                      <td className="py-2 text-right text-xs text-gray-500">{service.price_options?.map(o => `₹${o.rate}`).join(', ')}</td>
                      <td className="py-2 text-center"><button onClick={() => toggleActive(service)} className={service.is_active ? 'text-shop-600' : 'text-gray-400'}>{service.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button></td>
                      <td className="py-2">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEdit(service)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(service.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
