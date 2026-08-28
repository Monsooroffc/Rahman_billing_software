import { useEffect, useState } from 'react'
import { Save, Download, Upload, Database, Lock, Palette, Printer, Store, ReceiptText, ShieldCheck } from 'lucide-react'
import { db } from '@/db'
import type { Settings as SettingsType } from '@/types'

const DEFAULT_SETTINGS: SettingsType = {
  id: 1, shop_name: 'RAHMAN XEROX & SIFY IWAY', shop_email: 'ammaporur@gmail.com', shop_phone: '', shop_address: '',
  bill_prefix: 'RX-', starting_number: 1, default_customer: 'Walk-in Customer', receipt_paper_size: 'thermal', printer_name: '',
  show_email_on_receipt: 0, show_customer_on_receipt: 1, pin_enabled: 0, pin_code: '', theme: 'light', created_at: '', updated_at: ''
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [form, setForm] = useState<Partial<SettingsType>>({})
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    const s = !window.electronAPI
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('rahman-browser-settings') || '{}') }
      : await db.getSettings()
    setSettings(s)
    setForm(s)
  }

  const handleSave = async () => {
    if (!form.shop_name?.trim()) { setMessage('Shop name is required.'); return }
    if (!form.bill_prefix?.trim()) { setMessage('Bill prefix is required.'); return }
    if (!form.default_customer?.trim()) { setMessage('Default customer name is required.'); return }
    try {
      await db.updateSettings(form)
      await loadSettings()
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage('Settings could not be saved. Please try again.')
    }
  }

  const handleBackup = async () => {
    if (!window.electronAPI) {
      const data = JSON.stringify({ settings: form, bills: JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]'), services: JSON.parse(localStorage.getItem('rahman-browser-services') || '[]') }, null, 2)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
      link.download = `rahman-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(link.href)
      setMessage('Backup downloaded successfully!')
      return
    }
    const path = await db.getPath('documents')
    const result = await db.showSaveDialog({
      defaultPath: `${path}/rahman_xerox_backup_${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }]
    })
    if (!result.canceled && result.filePath) {
      await db.backup(result.filePath)
      setMessage('Backup created successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleRestore = async () => {
    if (!window.electronAPI) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file || !confirm('This will replace current browser data. Continue?')) return
        const data = JSON.parse(await file.text())
        if (data.settings) localStorage.setItem('rahman-browser-settings', JSON.stringify(data.settings))
        if (data.bills) localStorage.setItem('rahman-browser-bills', JSON.stringify(data.bills))
        if (data.services) localStorage.setItem('rahman-browser-services', JSON.stringify(data.services))
        await loadSettings()
        setMessage('Backup restored successfully!')
      }
      input.click()
      return
    }
    const result = await db.showOpenDialog({
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      if (confirm('WARNING: This will replace all current data. Continue?')) {
        await db.restore(result.filePaths[0])
        setMessage('Database restored! Please restart the application.')
        setTimeout(() => setMessage(''), 5000)
      }
    }
  }

  const togglePin = async () => {
    if (!form.pin_enabled) {
      if (pin.length < 4) { alert('PIN must be at least 4 digits'); return }
      if (!window.electronAPI) localStorage.setItem('rahman-browser-settings', JSON.stringify({ ...form, pin_enabled: 1, pin_code: pin }))
      else await db.updateSettings({ pin_enabled: 1, pin_code: pin })
    } else {
      if (!window.electronAPI) localStorage.setItem('rahman-browser-settings', JSON.stringify({ ...form, pin_enabled: 0, pin_code: '' }))
      else await db.updateSettings({ pin_enabled: 0, pin_code: '' })
    }
    loadSettings()
  }

  if (!settings) return <div className="p-4">Loading...</div>

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-xl font-bold">Settings</h2><p className="text-sm text-gray-500 mt-1">Complete your shop setup and billing preferences.</p></div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-shop-700 bg-shop-50 border border-shop-200 rounded-lg px-3 py-2"><ShieldCheck size={15} /> Setup ready to save</div>
      </div>
      {message && <div className="bg-shop-50 dark:bg-shop-900/20 border border-shop-200 dark:border-shop-800 text-shop-700 dark:text-shop-400 px-4 py-2 rounded-lg text-sm">{message}</div>}

      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Store size={17} /> Shop Details</h3>
        <div><label className="text-sm text-gray-500 block mb-1">Shop Name</label><input type="text" className="input" value={form.shop_name || ''} onChange={e => setForm({...form, shop_name: e.target.value})} /></div>
        <div><label className="text-sm text-gray-500 block mb-1">Email</label><input type="email" className="input" value={form.shop_email || ''} onChange={e => setForm({...form, shop_email: e.target.value})} /></div>
        <div><label className="text-sm text-gray-500 block mb-1">Phone (optional)</label><input type="text" className="input" value={form.shop_phone || ''} onChange={e => setForm({...form, shop_phone: e.target.value})} /></div>
        <div><label className="text-sm text-gray-500 block mb-1">Address (optional)</label><textarea className="input" rows={2} value={form.shop_address || ''} onChange={e => setForm({...form, shop_address: e.target.value})} /></div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><ReceiptText size={17} /> Billing Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-500 block mb-1">Bill Prefix</label><input type="text" className="input" value={form.bill_prefix || ''} onChange={e => setForm({...form, bill_prefix: e.target.value})} /></div>
          <div><label className="text-sm text-gray-500 block mb-1">Starting Number</label><input type="number" className="input" value={form.starting_number || 1} onChange={e => setForm({...form, starting_number: parseInt(e.target.value) || 1})} /></div>
        </div>
        <div><label className="text-sm text-gray-500 block mb-1">Default Customer Name</label><input type="text" className="input" value={form.default_customer || ''} onChange={e => setForm({...form, default_customer: e.target.value})} /></div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Printer size={17} /> Receipt & Printer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-500 block mb-1">Paper Size</label><select className="input" value={form.receipt_paper_size || 'thermal'} onChange={e => setForm({...form, receipt_paper_size: e.target.value})}><option value="thermal">Thermal Receipt (80mm)</option><option value="a4">A4 Paper</option></select></div>
          <div><label className="text-sm text-gray-500 block mb-1">Printer Name (optional)</label><input type="text" className="input" value={form.printer_name || ''} onChange={e => setForm({...form, printer_name: e.target.value})} placeholder="Default system printer" /></div>
        </div>
        <div className="flex items-center gap-3"><input type="checkbox" id="showEmail" checked={!!form.show_email_on_receipt} onChange={e => setForm({...form, show_email_on_receipt: e.target.checked ? 1 : 0})} /><label htmlFor="showEmail" className="text-sm">Show email on receipt</label></div>
        <div className="flex items-center gap-3"><input type="checkbox" id="showCustomer" checked={!!form.show_customer_on_receipt} onChange={e => setForm({...form, show_customer_on_receipt: e.target.checked ? 1 : 0})} /><label htmlFor="showCustomer" className="text-sm">Show customer details on receipt</label></div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Palette size={17} /> Appearance</h3>
        <div><label className="text-sm text-gray-500 block mb-1">Application Theme</label><select className="input" value={form.theme || 'light'} onChange={e => { const theme = e.target.value; setForm({...form, theme}); document.documentElement.classList.toggle('dark', theme === 'dark') }}><option value="light">Light</option><option value="dark">Dark</option></select></div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Lock size={16} /> Security</h3>
        <div className="flex items-center gap-3"><input type="checkbox" id="pinEnabled" checked={!!form.pin_enabled} onChange={togglePin} /><label htmlFor="pinEnabled" className="text-sm">Enable PIN protection for dashboard & reports</label></div>
        {!form.pin_enabled && <div><label className="text-sm text-gray-500 block mb-1">Set PIN (min 4 digits)</label><input type="password" className="input" value={pin} onChange={e => setPin(e.target.value)} placeholder="****" /></div>}
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Database size={16} /> Backup & Restore</h3>
        <div className="flex gap-2">
          <button onClick={handleBackup} className="btn-primary flex items-center gap-2"><Download size={16} /> Backup Now</button>
          <button onClick={handleRestore} className="btn-danger flex items-center gap-2"><Upload size={16} /> Restore</button>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2 py-3"><Save size={18} /> Save All Settings</button>
    </div>
  )
}
