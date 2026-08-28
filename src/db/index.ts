import type { Settings, Service, ServiceCategory, ServicePriceOption, Customer, Bill, BillItem, Expense, ExpenseCategory, DashboardSummary, PaymentSummary, ServiceReport } from '@/types'
import { hasCloudDatabase, supabase } from './supabase'

const api = window.electronAPI

const BROWSER_SETTINGS_KEY = 'rahman-browser-settings'
const BROWSER_DEFAULT_SETTINGS: Settings = {
  id: 1,
  shop_name: 'RAHMAN XEROX & SIFY IWAY',
  shop_email: 'ammaporur@gmail.com',
  shop_phone: '',
  shop_address: '',
  bill_prefix: 'RX-',
  starting_number: 1,
  default_customer: 'Walk-in Customer',
  receipt_paper_size: 'thermal',
  printer_name: '',
  show_email_on_receipt: 1,
  show_customer_on_receipt: 1,
  pin_enabled: 0,
  pin_code: '',
  theme: 'light',
  created_at: '',
  updated_at: ''
}

export const db = {
  async getSettings(): Promise<Settings> {
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('settings').select('*').eq('id', 1).single()
      if (error) throw error
      return data as Settings
    }
    if (!api) return { ...BROWSER_DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(BROWSER_SETTINGS_KEY) || '{}') }
    return api.db.get('SELECT * FROM settings WHERE id = 1')
  },

  async updateSettings(settings: Partial<Settings>) {
    if (hasCloudDatabase) {
      const { error } = await supabase!.from('settings').update(settings).eq('id', 1)
      if (error) throw error
      return
    }
    if (!api) {
      const current = await this.getSettings()
      localStorage.setItem(BROWSER_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
      return
    }
    const editableFields: (keyof Settings)[] = [
      'shop_name', 'shop_email', 'shop_phone', 'shop_address', 'bill_prefix',
      'starting_number', 'default_customer', 'receipt_paper_size', 'printer_name',
      'show_email_on_receipt', 'show_customer_on_receipt', 'pin_enabled', 'pin_code', 'theme'
    ]
    const entries = editableFields
      .filter(field => settings[field] !== undefined)
      .map(field => [field, settings[field]] as const)
    if (entries.length === 0) return
    const fields = entries.map(([field]) => `${field} = ?`).join(', ')
    const values = entries.map(([, value]) => value)
    return api.db.run(`UPDATE settings SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`, values)
  },

  async getServices(): Promise<Service[]> {
    const services = await api.db.all(`
      SELECT s.*, sc.name as category_name 
      FROM services s 
      LEFT JOIN service_categories sc ON s.category_id = sc.id 
      ORDER BY sc.display_order, s.display_order, s.name
    `)
    for (const service of services) {
      service.price_options = await api.db.all(
        'SELECT * FROM service_price_options WHERE service_id = ? ORDER BY is_default DESC, rate ASC',
        [service.id]
      )
    }
    return services
  },

  async getActiveServices(): Promise<Service[]> {
    const services = await api.db.all(`
      SELECT s.*, sc.name as category_name 
      FROM services s 
      LEFT JOIN service_categories sc ON s.category_id = sc.id 
      WHERE s.is_active = 1
      ORDER BY sc.display_order, s.display_order, s.name
    `)
    for (const service of services) {
      service.price_options = await api.db.all(
        'SELECT * FROM service_price_options WHERE service_id = ? ORDER BY is_default DESC, rate ASC',
        [service.id]
      )
    }
    return services
  },

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return api.db.all('SELECT * FROM service_categories WHERE is_active = 1 ORDER BY display_order')
  },

  async createService(service: Partial<Service>, priceOptions: number[]) {
    const result = await api.db.run(
      'INSERT INTO services (category_id, name, unit, default_rate, min_rate, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
      [service.category_id, service.name, service.unit, service.default_rate, service.min_rate || 0, service.is_custom || 0]
    )
    const serviceId = result.lastInsertRowid
    for (let i = 0; i < priceOptions.length; i++) {
      await api.db.run(
        'INSERT INTO service_price_options (service_id, rate, is_default) VALUES (?, ?, ?)',
        [serviceId, priceOptions[i], i === 0 ? 1 : 0]
      )
    }
    return serviceId
  },

  async updateService(id: number, service: Partial<Service>, priceOptions?: number[]) {
    await api.db.run(
      'UPDATE services SET category_id = ?, name = ?, unit = ?, default_rate = ?, min_rate = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [service.category_id, service.name, service.unit, service.default_rate, service.min_rate, service.is_active, id]
    )
    if (priceOptions) {
      await api.db.run('DELETE FROM service_price_options WHERE service_id = ?', [id])
      for (let i = 0; i < priceOptions.length; i++) {
        await api.db.run(
          'INSERT INTO service_price_options (service_id, rate, is_default) VALUES (?, ?, ?)',
          [id, priceOptions[i], i === 0 ? 1 : 0]
        )
      }
    }
  },

  async deleteService(id: number) {
    return api.db.run('DELETE FROM services WHERE id = ?', [id])
  },

  async getCustomers(): Promise<Customer[]> {
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('customers').select('*').order('name')
      if (error) throw error
      return data as Customer[]
    }
    if (!api) return JSON.parse(localStorage.getItem('rahman-browser-customers') || '[]')
    return api.db.all('SELECT * FROM customers ORDER BY name')
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('customers').select('*').or(`name.ilike.%${query}%,mobile.ilike.%${query}%`).order('name')
      if (error) throw error
      return data as Customer[]
    }
    return api.db.all(
      'SELECT * FROM customers WHERE name LIKE ? OR mobile LIKE ? ORDER BY name',
      [`%${query}%`, `%${query}%`]
    )
  },

  async createCustomer(customer: Partial<Customer>): Promise<number> {
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('customers').insert({ name: customer.name, mobile: customer.mobile, email: customer.email }).select('id').single()
      if (error) throw error
      return data.id
    }
    if (!api) {
      const customers = await this.getCustomers()
      const created = { ...customer, id: Date.now(), total_bills: 0, total_spent: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Customer
      localStorage.setItem('rahman-browser-customers', JSON.stringify([...customers, created]))
      return created.id
    }
    const result = await api.db.run(
      'INSERT INTO customers (name, mobile, email) VALUES (?, ?, ?)',
      [customer.name, customer.mobile, customer.email]
    )
    return result.lastInsertRowid as number
  },

  async updateCustomer(id: number, customer: Partial<Customer>) {
    if (hasCloudDatabase) {
      const { error } = await supabase!.from('customers').update({ name: customer.name, mobile: customer.mobile, email: customer.email, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      return
    }
    return api.db.run(
      'UPDATE customers SET name = ?, mobile = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [customer.name, customer.mobile, customer.email, id]
    )
  },

  async deleteCustomer(id: number) {
    if (hasCloudDatabase) {
      const { error } = await supabase!.from('customers').delete().eq('id', id)
      if (error) throw error
      return
    }
    return api.db.run('DELETE FROM customers WHERE id = ?', [id])
  },

  async getCustomerBills(customerId: number): Promise<Bill[]> {
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('bills').select('*').eq('customer_id', customerId).eq('status', 'COMPLETED').order('created_at', { ascending: false })
      if (error) throw error
      return data as Bill[]
    }
    return api.db.all(
      'SELECT * FROM bills WHERE customer_id = ? AND status = "COMPLETED" ORDER BY created_at DESC',
      [customerId]
    )
  },

  async getNextBillNumber(): Promise<string> {
    const settings = await this.getSettings()
    const prefix = settings.bill_prefix || 'RX-'
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('bills').select('bill_number').order('id', { ascending: false }).limit(1)
      if (error) throw error
      let nextNum = settings.starting_number || 1
      const lastNumber = data?.[0]?.bill_number?.match(/(\d+)$/)?.[1]
      if (lastNumber) nextNum = Math.max(nextNum, Number(lastNumber) + 1)
      return `${prefix}${String(nextNum).padStart(6, '0')}`
    }
    if (!api) {
      const bills = JSON.parse(localStorage.getItem('rahman-browser-bills') || '[]') as Array<{ bill_number?: string }>
      let nextNum = settings.starting_number || 1
      const lastNumber = bills.map(bill => bill.bill_number?.match(/(\d+)$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => b - a)[0]
      if (lastNumber) nextNum = Math.max(nextNum, lastNumber + 1)
      return `${prefix}${String(nextNum).padStart(6, '0')}`
    }
    const lastBill = await api.db.get('SELECT bill_number FROM bills ORDER BY id DESC LIMIT 1')
    let nextNum = settings.starting_number || 1
    if (lastBill) {
      const match = lastBill.bill_number.match(/(\d+)$/)
      if (match) {
        nextNum = Math.max(nextNum, parseInt(match[1]) + 1)
      }
    }
    return `${prefix}${String(nextNum).padStart(6, '0')}`
  },

  async createBill(bill: Partial<Bill>, items: BillItem[]): Promise<number> {
    const billNumber = bill.bill_number || (await this.getNextBillNumber())
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('bills').insert({ ...bill, bill_number: billNumber, status: 'COMPLETED' }).select('id').single()
      if (error) throw error
      const billId = data.id as number
      const { error: itemError } = await supabase!.from('bill_items').insert(items.map(item => ({ ...item, id: undefined, bill_id: billId })))
      if (itemError) throw itemError
      if (bill.customer_id) {
        const { data: customer } = await supabase!.from('customers').select('total_bills,total_spent').eq('id', bill.customer_id).single()
        if (customer) await supabase!.from('customers').update({ total_bills: customer.total_bills + 1, total_spent: Number(customer.total_spent) + Number(bill.total || 0), last_visit: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', bill.customer_id)
      }
      return billId
    }
    const result = await api.db.run(
      `INSERT INTO bills (
        bill_number, customer_id, customer_name, customer_mobile, subtotal, discount, total,
        payment_method, cash_amount, upi_amount, card_amount, other_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billNumber, bill.customer_id, bill.customer_name, bill.customer_mobile,
        bill.subtotal, bill.discount, bill.total, bill.payment_method,
        bill.cash_amount, bill.upi_amount, bill.card_amount, bill.other_amount,
        'COMPLETED'
      ]
    )
    const billId = result.lastInsertRowid as number

    for (const item of items) {
      await api.db.run(
        'INSERT INTO bill_items (bill_id, service_id, service_name_snapshot, category_name_snapshot, quantity, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [billId, item.service_id, item.service_name_snapshot, item.category_name_snapshot, item.quantity, item.rate, item.amount]
      )
    }

    if (bill.customer_id) {
      await api.db.run(
        `UPDATE customers SET 
          total_bills = total_bills + 1,
          total_spent = total_spent + ?,
          last_visit = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [bill.total, bill.customer_id]
      )
    }

    return billId
  },

  async getBills(filters?: { from?: string; to?: string; status?: string; search?: string }): Promise<Bill[]> {
    if (hasCloudDatabase) {
      let query = supabase!.from('bills').select('*').order('created_at', { ascending: false })
      if (filters?.from) query = query.gte('created_at', `${filters.from}T00:00:00`)
      if (filters?.to) query = query.lt('created_at', `${filters.to}T23:59:59.999`)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.search) query = query.or(`bill_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_mobile.ilike.%${filters.search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as Bill[]
    }
    let sql = 'SELECT * FROM bills WHERE 1=1'
    const params: any[] = []
    if (filters?.from) { sql += ' AND date(created_at) >= date(?)'; params.push(filters.from) }
    if (filters?.to) { sql += ' AND date(created_at) <= date(?)'; params.push(filters.to) }
    if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status) }
    if (filters?.search) {
      sql += ' AND (bill_number LIKE ? OR customer_name LIKE ? OR customer_mobile LIKE ?)'
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
    }
    sql += ' ORDER BY created_at DESC'
    return api.db.all(sql, params)
  },

  async getBillById(id: number): Promise<Bill | undefined> {
    if (hasCloudDatabase) {
      const { data, error } = await supabase!.from('bills').select('*, bill_items(*)').eq('id', id).single()
      if (error) return undefined
      return { ...data, items: data.bill_items } as Bill
    }
    const bill = await api.db.get('SELECT * FROM bills WHERE id = ?', [id])
    if (bill) {
      bill.items = await api.db.all('SELECT * FROM bill_items WHERE bill_id = ?', [id])
    }
    return bill
  },

  async voidBill(id: number, reason: string) {
    if (hasCloudDatabase) {
      const { error } = await supabase!.from('bills').update({ status: 'VOID', void_reason: reason, voided_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      return
    }
    return api.db.run(
      'UPDATE bills SET status = "VOID", void_reason = ?, voided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [reason, id]
    )
  },

  async getExpenses(filters?: { from?: string; to?: string }): Promise<Expense[]> {
    let sql = 'SELECT e.*, ec.name as category_name FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id WHERE 1=1'
    const params: any[] = []
    if (filters?.from) { sql += ' AND date(e.expense_date) >= date(?)'; params.push(filters.from) }
    if (filters?.to) { sql += ' AND date(e.expense_date) <= date(?)'; params.push(filters.to) }
    sql += ' ORDER BY e.expense_date DESC'
    return api.db.all(sql, params)
  },

  async createExpense(expense: Partial<Expense>) {
    return api.db.run(
      'INSERT INTO expenses (category_id, name, amount, payment_method, notes, expense_date) VALUES (?, ?, ?, ?, ?, ?)',
      [expense.category_id, expense.name, expense.amount, expense.payment_method, expense.notes, expense.expense_date]
    )
  },

  async updateExpense(id: number, expense: Partial<Expense>) {
    return api.db.run(
      'UPDATE expenses SET category_id = ?, name = ?, amount = ?, payment_method = ?, notes = ?, expense_date = ? WHERE id = ?',
      [expense.category_id, expense.name, expense.amount, expense.payment_method, expense.notes, expense.expense_date, id]
    )
  },

  async deleteExpense(id: number) {
    return api.db.run('DELETE FROM expenses WHERE id = ?', [id])
  },

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return api.db.all('SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY name')
  },

  async getDashboardSummary(date?: string): Promise<DashboardSummary> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    if (hasCloudDatabase) {
      const { data: bills, error: billError } = await supabase!.from('bills').select('total,payment_method').eq('status', 'COMPLETED').gte('created_at', `${targetDate}T00:00:00`).lt('created_at', `${targetDate}T23:59:59.999`)
      if (billError) throw billError
      const total = (method?: string) => (bills || []).filter(bill => !method || bill.payment_method === method).reduce((sum, bill) => sum + Number(bill.total), 0)
      return { today_sales: total(), today_bills: bills?.length || 0, today_cash: total('cash'), today_upi: total('upi'), today_card: total('card'), today_other: total('other'), today_expenses: 0, net_collection: total() }
    }
    const sales = await api.db.get(`
      SELECT 
        COUNT(*) as today_bills,
        COALESCE(SUM(total), 0) as today_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as today_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN total ELSE 0 END), 0) as today_upi,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as today_card,
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN total ELSE 0 END), 0) as today_other
      FROM bills 
      WHERE date(created_at) = date(?) AND status = 'COMPLETED'
    `, [targetDate])
    
    const expenses = await api.db.get(
      'SELECT COALESCE(SUM(amount), 0) as today_expenses FROM expenses WHERE date(expense_date) = date(?)',
      [targetDate]
    )
    
    return {
      today_sales: sales.today_sales,
      today_bills: sales.today_bills,
      today_cash: sales.today_cash,
      today_upi: sales.today_upi,
      today_card: sales.today_card,
      today_other: sales.today_other,
      today_expenses: expenses.today_expenses,
      net_collection: sales.today_sales - expenses.today_expenses
    }
  },

  async getPaymentSummary(from: string, to: string): Promise<PaymentSummary> {
    return api.db.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash,
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN total ELSE 0 END), 0) as upi,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card,
        COALESCE(SUM(CASE WHEN payment_method = 'other' THEN total ELSE 0 END), 0) as other,
        COALESCE(SUM(total), 0) as total
      FROM bills 
      WHERE date(created_at) >= date(?) AND date(created_at) <= date(?) AND status = 'COMPLETED'
    `, [from, to])
  },

  async getServiceReport(from: string, to: string): Promise<ServiceReport[]> {
    return api.db.all(`
      SELECT 
        service_name_snapshot as service_name,
        category_name_snapshot as category_name,
        SUM(quantity) as quantity,
        SUM(amount) as total_revenue
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE date(b.created_at) >= date(?) AND date(b.created_at) <= date(?) AND b.status = 'COMPLETED'
      GROUP BY service_name_snapshot, category_name_snapshot
      ORDER BY total_revenue DESC
    `, [from, to])
  },

  async getSalesChartData(range: 'day' | 'week' | 'month'): Promise<{ label: string; sales: number }[]> {
    let sql = ''
    if (range === 'day') {
      sql = `
        SELECT strftime('%H:00', created_at) as label, COALESCE(SUM(total), 0) as sales
        FROM bills
        WHERE date(created_at) = date('now') AND status = 'COMPLETED'
        GROUP BY strftime('%H', created_at)
        ORDER BY label
      `
    } else if (range === 'week') {
      sql = `
        SELECT strftime('%Y-%m-%d', created_at) as label, COALESCE(SUM(total), 0) as sales
        FROM bills
        WHERE date(created_at) >= date('now', '-6 days') AND status = 'COMPLETED'
        GROUP BY date(created_at)
        ORDER BY label
      `
    } else {
      sql = `
        SELECT strftime('%Y-%m', created_at) as label, COALESCE(SUM(total), 0) as sales
        FROM bills
        WHERE date(created_at) >= date('now', '-11 months') AND status = 'COMPLETED'
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY label
      `
    }
    return api.db.all(sql, [])
  },

  async backup(backupPath: string) {
    return api.db.backup(backupPath)
  },

  async restore(backupPath: string) {
    return api.db.restore(backupPath)
  },

  async getPath(name: string): Promise<string> {
    return api.app.getPath(name)
  },

  async showOpenDialog(options: any) {
    return api.dialog.showOpenDialog(options)
  },

  async showSaveDialog(options: any) {
    return api.dialog.showSaveDialog(options)
  },

  async printReceipt(html: string, printerName?: string) {
    return api.print.receipt(html, printerName)
  }
}
