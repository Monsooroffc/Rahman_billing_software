import Database from 'better-sqlite3'

export function seedData(db: Database.Database) {
  db.exec(`
    INSERT INTO settings (shop_name, shop_email, bill_prefix, starting_number, default_customer, receipt_paper_size, theme)
    VALUES ('RAHMAN XEROX & SIFY IWAY', 'ammaporur@gmail.com', 'RX-', 1, 'Walk-in Customer', 'thermal', 'light');
  `)

  const categories = [
    'Xerox', 'Printout', 'ID Card', 'Lamination', 'Scanning',
    'Photo', 'Binding', 'Online Services', 'Government Services', 'Other'
  ]

  const catStmt = db.prepare('INSERT INTO service_categories (name, display_order) VALUES (?, ?)')
  categories.forEach((cat, i) => catStmt.run(cat, i))

  const getCatId = (name: string) => {
    const row = db.prepare('SELECT id FROM service_categories WHERE name = ?').get(name) as any
    return row?.id
  }

  const insertService = (catName: string, name: string, unit: string, defaultRate: number, options?: number[], minRate?: number) => {
    const catId = getCatId(catName)
    const serviceResult = db.prepare(
      'INSERT INTO services (category_id, name, unit, default_rate, min_rate) VALUES (?, ?, ?, ?, ?)'
    ).run(catId, name, unit, defaultRate, minRate ?? defaultRate)
    const serviceId = serviceResult.lastInsertRowid

    if (options && options.length > 0) {
      const optStmt = db.prepare('INSERT INTO service_price_options (service_id, rate, is_default) VALUES (?, ?, ?)')
      options.forEach((rate, i) => {
        optStmt.run(serviceId, rate, i === 0 ? 1 : 0)
      })
    } else {
      db.prepare('INSERT INTO service_price_options (service_id, rate, is_default) VALUES (?, ?, 1)')
        .run(serviceId, defaultRate)
    }
    return serviceId
  }

  insertService('Xerox', 'A4 B/W Single Side', 'page', 2)
  insertService('Xerox', 'A4 B/W Front & Back', 'page', 3)
  insertService('Xerox', 'A4 Color Single Side', 'page', 10)
  insertService('Xerox', 'A4 Color Front & Back', 'page', 15, [15, 20])
  insertService('Xerox', 'A3 B/W Single Side', 'page', 10)
  insertService('Xerox', 'A3 B/W Front & Back', 'page', 20)
  insertService('Xerox', 'A3 Color Single Side', 'page', 30, [30, 40])
  insertService('Xerox', 'A3 Color Front & Back', 'page', 60, [60, 70])
  insertService('Xerox', 'ID Card B/W', 'copy', 4)
  insertService('Xerox', 'ID Card Color', 'copy', 10)
  insertService('Xerox', 'DL / Smart Card Duplicate', 'service', 80)

  insertService('Printout', 'B/W Single Side', 'page', 3)
  insertService('Printout', 'B/W Front & Back', 'page', 2.5)
  insertService('Printout', 'Color Single Side', 'page', 10)
  insertService('Printout', 'Color Front & Back', 'page', 15, [15, 20])

  insertService('Lamination', 'A4 Lamination', 'piece', 35)
  insertService('Lamination', 'A3 Lamination', 'piece', 70)
  insertService('Lamination', 'A5 Lamination', 'piece', 20)
  insertService('Lamination', 'ID Card Lamination', 'piece', 20, [20, 10])

  insertService('Scanning', 'B/W Scan', 'page', 6)
  insertService('Scanning', 'Color Scan', 'page', 10)

  insertService('Photo', 'Passport Photo - 8 Copies', 'set', 80)

  insertService('Binding', 'Soft Binding', 'service', 30, undefined, 30)
  insertService('Binding', 'Spiral Binding', 'service', 40, undefined, 40)

  insertService('Online Services', 'Online Service', 'service', 350, [200, 250, 300, 350, 400, 450, 500, 550, 600])
  insertService('Online Services', 'Email / Document Send', 'service', 10)

  insertService('Government Services', 'Aadhaar Address Update', 'service', 50, [50, 75])
  insertService('Government Services', 'PAN Card Service', 'service', 260)
  insertService('Government Services', 'TNEGA Community Certificate', 'service', 260)
  insertService('Government Services', 'TNEGA Income Certificate', 'service', 260)
  insertService('Government Services', 'TNEGA OBC Certificate', 'service', 260)
  insertService('Government Services', 'TNEGA Nativity Certificate', 'service', 260)
  insertService('Government Services', 'TNEGA First Graduate Certificate', 'service', 360)
  insertService('Government Services', 'TNEGA Legal Heir Certificate', 'service', 360)
  insertService('Government Services', 'Passport Service', 'service', 300, [300])

  insertService('Other', 'Custom Service', 'custom', 0)

  const expenseCats = ['Paper', 'Ink/Toner', 'Electricity', 'Stationery', 'Rent', 'Maintenance', 'Other']
  const expStmt = db.prepare('INSERT INTO expense_categories (name) VALUES (?)')
  expenseCats.forEach(cat => expStmt.run(cat))
}
