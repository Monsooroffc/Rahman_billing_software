import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, Trash2, Printer, Save } from 'lucide-react'
import { db } from '@/db'
import { hasCloudDatabase } from '@/db/supabase'
import type { Service, BillItem, Customer, Settings, Bill } from '@/types'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'CASH', color: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'upi', label: 'UPI', color: 'bg-purple-500 hover:bg-purple-600' },
  { id: 'card', label: 'CARD', color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'other', label: 'OTHER', color: 'bg-gray-500 hover:bg-gray-600' },
]

const QUICK_SERVICES = [
  'A4 B/W Single Side',
  'A4 B/W Front & Back',
  'A4 Color Single Side',
  'A4 Color Front & Back',
  'A3 B/W Single Side',
  'A3 Color Single Side',
  'ID Card B/W',
  'ID Card Color',
  'B/W Scan',
  'Color Scan',
  'A4 Lamination',
  'A3 Lamination',
  'Passport Photo - 8 Copies',
  'Soft Binding',
  'Spiral Binding',
  'PAN Card Service',
  'Aadhaar Address Update',
  'Email / Document Send',
]

const QUICK_SERVICE_RATES: Record<string, number> = {
  'A4 B/W Single Side': 2,
  'A4 B/W Front & Back': 3,
  'A4 Color Single Side': 10,
  'A4 Color Front & Back': 15,
  'A3 B/W Single Side': 10,
  'A3 Color Single Side': 30,
  'ID Card B/W': 4,
  'ID Card Color': 10,
  'B/W Scan': 6,
  'Color Scan': 10,
  'A4 Lamination': 35,
  'A3 Lamination': 70,
  'Passport Photo - 8 Copies': 80,
  'Soft Binding': 30,
  'Spiral Binding': 40,
  'PAN Card Service': 260,
  'Aadhaar Address Update': 50,
  'Email / Document Send': 10,
}

export default function NewBill() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<BillItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedRate, setSelectedRate] = useState<number>(0)
  const [quantity, setQuantity] = useState(1)
  const [customRate, setCustomRate] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadServices()
    loadCustomers()
    db.getSettings().then(setSettings)
    searchRef.current?.focus()
  }, [])

  const loadServices = async () => {
    const s = !window.electronAPI && !hasCloudDatabase
      ? (JSON.parse(localStorage.getItem('rahman-browser-services') || '[]') as Service[]).filter(service => service.is_active)
      : await db.getActiveServices()
    setServices(s)
    const cats = [...new Set(s.map(sv => sv.category_name).filter(Boolean))]
    setCategories(cats as string[])
  }

  const loadCustomers = async () => {
    const c = await db.getCustomers()
    setCustomers(c)
  }

  const filteredServices = services.filter(s => {
    const matchesCategory = selectedCategory === 'All' || s.category_name === selectedCategory
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const total = Math.max(0, subtotal - discount)

  const addItem = () => {
    if (!selectedService) return
    const rate = isCustom ? parseFloat(customRate) || 0 : selectedRate
    if (rate <= 0 || quantity <= 0) return
    
    const amount = rate * quantity
    const newItem: BillItem = {
      service_id: selectedService.id,
      service_name_snapshot: selectedService.name,
      category_name_snapshot: selectedService.category_name,
      quantity,
      rate,
      amount
    }
    setItems([...items, newItem])
    setSelectedService(null)
    setSelectedRate(0)
    setQuantity(1)
    setCustomRate('')
    setIsCustom(false)
    setSearchQuery('')
    searchRef.current?.focus()
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, delta: number) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item
      const newQty = Math.max(1, item.quantity + delta)
      return { ...item, quantity: newQty, amount: newQty * item.rate }
    }))
  }

  const saveBill = async (shouldPrint = false) => {
    if (items.length === 0) {
      alert('Please add at least one item')
      return
    }

    if (!window.electronAPI && !hasCloudDatabase) {
      const browserBills = JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]')
      const billNumber = await db.getNextBillNumber()
      const savedBill: Bill = {
        id: Date.now(),
        bill_number: billNumber,
        customer_name: customerName.trim() || settings?.default_customer || 'Walk-in Customer',
        customer_mobile: customerMobile.trim(),
        items,
        subtotal,
        discount,
        total,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === 'cash' ? total : 0,
        upi_amount: paymentMethod === 'upi' ? total : 0,
        card_amount: paymentMethod === 'card' ? total : 0,
        other_amount: paymentMethod === 'other' ? total : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'COMPLETED'
      }
      browserBills.push(savedBill)
      localStorage.setItem('rahman-browser-bills', JSON.stringify(browserBills))
      if (shouldPrint) {
        const receiptWindow = window.open('', '_blank', 'width=420,height=700')
        if (receiptWindow) {
          const { generateReceiptHTML } = await import('@/utils/receipt')
          receiptWindow.document.write(generateReceiptHTML(savedBill, settings || {} as Settings, settings?.receipt_paper_size !== 'a4'))
          receiptWindow.document.close()
          receiptWindow.focus()
          receiptWindow.print()
        } else {
          alert('Popup blocked. Allow popups to print the receipt.')
        }
      } else {
        alert('Bill saved in browser preview.')
      }
      setItems([])
      setDiscount(0)
      setPaymentMethod('cash')
      setCustomerName('')
      setCustomerMobile('')
      setSearchQuery('')
      searchRef.current?.focus()
      return
    }

    let customerId: number | undefined
    if (customerName.trim()) {
      const existing = customers.find(c => c.name === customerName.trim() && c.mobile === customerMobile.trim())
      if (existing) {
        customerId = existing.id
      } else {
        customerId = await db.createCustomer({ name: customerName.trim(), mobile: customerMobile.trim() })
      }
    }

    const billData = {
      customer_id: customerId,
      customer_name: customerName.trim() || undefined,
      customer_mobile: customerMobile.trim() || undefined,
      subtotal,
      discount,
      total,
      payment_method: paymentMethod,
      cash_amount: paymentMethod === 'cash' ? total : 0,
      upi_amount: paymentMethod === 'upi' ? total : 0,
      card_amount: paymentMethod === 'card' ? total : 0,
      other_amount: paymentMethod === 'other' ? total : 0,
    }

    try {
      const { generateReceiptHTML } = await import('@/utils/receipt')
      const billId = await db.createBill(billData, items)
      const savedBill = await db.getBillById(billId)
      const settings = await db.getSettings()

      if (shouldPrint && savedBill) {
        const html = generateReceiptHTML(savedBill, settings, settings.receipt_paper_size === 'thermal')
        await db.printReceipt(html, settings.printer_name)
      }

      setItems([])
      setDiscount(0)
      setPaymentMethod('cash')
      setCustomerName('')
      setCustomerMobile('')
      setSearchQuery('')
      searchRef.current?.focus()
    } catch (err) {
      alert('Bill could not be saved. Please try again.')
      console.error(err)
    }
  }

  const selectQuickService = (serviceName: string) => {
    const svc = services.find(s => s.name === serviceName) || {
      id: -QUICK_SERVICES.indexOf(serviceName) - 1,
      category_id: 0,
      category_name: 'Other',
      name: serviceName,
      unit: 'piece',
      default_rate: QUICK_SERVICE_RATES[serviceName] || 0,
      min_rate: 0,
      is_active: 1,
      is_custom: 1,
      display_order: 0,
      created_at: '',
      updated_at: '',
      price_options: []
    } as Service
    setSelectedService(svc)
    const defaultRate = svc.price_options?.find(o => o.is_default)?.rate || svc.default_rate
    setSelectedRate(defaultRate)
    setQuantity(1)
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search services..."
            className="input pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_SERVICES.map(name => (
            <button
              key={name}
              onClick={() => selectQuickService(name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedService?.name === name ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-300 text-primary-700 dark:text-primary-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCategory('All')} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${selectedCategory === 'All' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat!)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{cat}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredServices.map(service => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service)
                  const defaultRate = service.price_options?.find(o => o.is_default)?.rate || service.default_rate
                  setSelectedRate(defaultRate)
                  setQuantity(1)
                  setIsCustom(false)
                }}
                className={`service-btn ${selectedService?.id === service.id ? 'service-btn-active' : ''}`}
              >
                <p className="font-medium text-sm">{service.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">₹{service.default_rate}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-96 flex flex-col gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-bold text-lg">Current Bill</h3>

        <div className="relative">
          <input
            type="text"
            placeholder="Customer Name (optional)"
            className="input text-sm"
            value={customerName}
            onChange={e => { setCustomerName(e.target.value); setShowCustomerDropdown(true) }}
          />
          {showCustomerDropdown && customerName && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
              {customers.filter(c => c.name?.toLowerCase().includes(customerName.toLowerCase())).map(c => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                  onClick={() => { setCustomerName(c.name || ''); setCustomerMobile(c.mobile || ''); setShowCustomerDropdown(false) }}
                >
                  {c.name} {c.mobile && `- ${c.mobile}`}
                </button>
              ))}
            </div>
          )}
          <input type="text" placeholder="Mobile (optional)" className="input text-sm mt-2" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} />
        </div>

        {selectedService && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
            <p className="font-medium text-sm">{selectedService.name}</p>
            {selectedService.price_options && selectedService.price_options.length > 1 && !isCustom && (
              <div className="flex flex-wrap gap-2">
                {selectedService.price_options.map(opt => (
                  <button key={opt.id} onClick={() => setSelectedRate(opt.rate)} className={`px-2 py-1 rounded text-xs ${selectedRate === opt.rate ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500'}`}>₹{opt.rate}</button>
                ))}
                <button onClick={() => setIsCustom(true)} className="px-2 py-1 rounded text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500">Custom</button>
              </div>
            )}
            {isCustom && <input type="number" placeholder="Enter custom rate" className="input text-sm" value={customRate} onChange={e => setCustomRate(e.target.value)} autoFocus />}
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Minus size={14} /></button>
              <input type="number" className="input text-center w-16 text-sm py-1" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              <button onClick={() => setQuantity(quantity + 1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Plus size={14} /></button>
              <span className="text-sm text-gray-500">{selectedService.unit}</span>
            </div>
            <button onClick={addItem} className="btn-success w-full text-sm py-1.5"><Plus size={14} className="inline mr-1" /> Add Item</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No items added</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-1">Service</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Rate</th>
                  <th className="text-right py-1">Amt</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-1.5 text-xs">{item.service_name_snapshot}</td>
                    <td className="py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => updateQuantity(i, -1)} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><Minus size={10} /></button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(i, 1)} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><Plus size={10} /></button>
                      </div>
                    </td>
                    <td className="py-1.5 text-right text-xs">₹{item.rate.toFixed(2)}</td>
                    <td className="py-1.5 text-right font-medium">₹{item.amount.toFixed(2)}</td>
                    <td className="py-1.5">
                      <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
          <div className="flex items-center gap-2 text-sm"><span>Discount</span><input type="number" className="input w-24 text-right text-sm py-1" value={discount} onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} /></div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2"><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(pm => (
            <button key={pm.id} onClick={() => setPaymentMethod(pm.id)} className={`py-2 rounded-lg text-sm font-bold text-white transition-colors ${pm.color} ${paymentMethod === pm.id ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : 'opacity-70'}`}>{pm.label}</button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => saveBill(false)} className="btn-secondary flex-1 text-sm py-2.5"><Save size={14} className="inline mr-1" /> Save</button>
          <button onClick={() => saveBill(true)} className="btn-primary flex-1 text-sm py-2.5"><Printer size={14} className="inline mr-1" /> Save & Print</button>
        </div>
      </div>

      <div className="hidden 2xl:flex w-80 flex-col bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="rounded-lg bg-[#062457] text-white px-3 py-2 font-bold text-sm">RECEIPT PREVIEW</div>
        <div className="flex-1 mt-3 border border-gray-200 bg-white p-4 text-gray-900 text-xs shadow-inner overflow-y-auto">
          <div className="text-center border-b border-dashed border-gray-400 pb-3">
            <p className="text-base font-bold">RAHMAN XEROX</p>
            <p className="font-bold">&amp; SIFY IWAY</p>
            <p className="text-[10px] mt-1">XEROX • PRINT • SCAN • LAMINATION</p>
          </div>
          <div className="py-2 space-y-1">
            <div className="flex justify-between"><span>Bill No.</span><span>RX-PREVIEW</span></div>
            <div className="flex justify-between"><span>Date</span><span>{new Date().toLocaleDateString('en-IN')}</span></div>
            {customerName && <div>Customer: {customerName}</div>}
          </div>
          <div className="border-t border-dashed border-gray-400 pt-2">
            {items.map((item, index) => <div key={index} className="flex justify-between gap-2 py-1"><span className="truncate">{item.service_name_snapshot} x {item.quantity}</span><span>₹{item.amount.toFixed(2)}</span></div>)}
            {items.length === 0 && <p className="text-center text-gray-400 py-8">Items will appear here</p>}
          </div>
          <div className="border-t border-dashed border-gray-400 mt-2 pt-2 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
            <p className="text-center pt-4">THANK YOU!<br />VISIT AGAIN</p>
          </div>
        </div>
      </div>
    </div>
  )
}
