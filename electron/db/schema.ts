import Database from 'better-sqlite3'

export function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      shop_name TEXT DEFAULT 'RAHMAN XEROX & SIFY IWAY',
      shop_email TEXT DEFAULT 'ammaporur@gmail.com',
      shop_phone TEXT,
      shop_address TEXT,
      bill_prefix TEXT DEFAULT 'RX-',
      starting_number INTEGER DEFAULT 1,
      default_customer TEXT DEFAULT 'Walk-in Customer',
      receipt_paper_size TEXT DEFAULT 'thermal',
      printer_name TEXT,
      show_email_on_receipt INTEGER DEFAULT 1,
      show_customer_on_receipt INTEGER DEFAULT 1,
      pin_enabled INTEGER DEFAULT 0,
      pin_code TEXT,
      theme TEXT DEFAULT 'light',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      unit TEXT DEFAULT 'piece',
      default_rate REAL DEFAULT 0,
      min_rate REAL,
      is_active INTEGER DEFAULT 1,
      is_custom INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES service_categories(id)
    );

    CREATE TABLE IF NOT EXISTS service_price_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      rate REAL NOT NULL,
      is_default INTEGER DEFAULT 0,
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      mobile TEXT,
      email TEXT,
      total_bills INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_visit DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_name TEXT,
      customer_mobile TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      cash_amount REAL DEFAULT 0,
      upi_amount REAL DEFAULT 0,
      card_amount REAL DEFAULT 0,
      other_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'COMPLETED',
      void_reason TEXT,
      voided_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      service_id INTEGER,
      service_name_snapshot TEXT NOT NULL,
      category_name_snapshot TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      expense_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES expense_categories(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(created_at);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
    CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
    CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
  `)
}
