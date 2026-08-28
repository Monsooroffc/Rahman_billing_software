export interface Settings {
  id: number
  shop_name: string
  shop_email: string
  shop_phone?: string
  shop_address?: string
  bill_prefix: string
  starting_number: number
  default_customer: string
  receipt_paper_size: string
  printer_name?: string
  show_email_on_receipt: number
  show_customer_on_receipt: number
  pin_enabled: number
  pin_code?: string
  theme: string
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: number
  name: string
  display_order: number
  is_active: number
  created_at: string
}

export interface ServicePriceOption {
  id: number
  service_id: number
  rate: number
  is_default: number
  label?: string
  created_at: string
}

export interface Service {
  id: number
  category_id: number
  category_name?: string
  name: string
  unit: string
  default_rate: number
  min_rate?: number
  is_active: number
  is_custom: number
  display_order: number
  created_at: string
  updated_at: string
  price_options?: ServicePriceOption[]
}

export interface Customer {
  id: number
  name?: string
  mobile?: string
  email?: string
  total_bills: number
  total_spent: number
  last_visit?: string
  created_at: string
  updated_at: string
}

export interface BillItem {
  id?: number
  bill_id?: number
  service_id?: number
  service_name_snapshot: string
  category_name_snapshot?: string
  quantity: number
  rate: number
  amount: number
}

export interface Bill {
  id: number
  bill_number: string
  customer_id?: number
  customer_name?: string
  customer_mobile?: string
  subtotal: number
  discount: number
  total: number
  payment_method: string
  cash_amount: number
  upi_amount: number
  card_amount: number
  other_amount: number
  status: 'COMPLETED' | 'VOID'
  void_reason?: string
  voided_at?: string
  created_at: string
  updated_at: string
  items?: BillItem[]
}

export interface ExpenseCategory {
  id: number
  name: string
  is_active: number
  created_at: string
}

export interface Expense {
  id: number
  category_id?: number
  category_name?: string
  name: string
  amount: number
  payment_method: string
  notes?: string
  expense_date: string
  created_at: string
}

export interface DashboardSummary {
  today_sales: number
  today_bills: number
  today_cash: number
  today_upi: number
  today_card: number
  today_other: number
  today_expenses: number
  net_collection: number
}

export interface PaymentSummary {
  cash: number
  upi: number
  card: number
  other: number
  total: number
}

export interface ServiceReport {
  service_name: string
  category_name: string
  quantity: number
  total_revenue: number
}
