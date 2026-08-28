import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { createSchema } from './schema'
import { seedData } from './seed'

export class DatabaseManager {
  private db: Database.Database
  private dbPath: string

  constructor(userDataPath: string) {
    const dbDir = path.join(userDataPath, 'database')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    this.dbPath = path.join(dbDir, 'rahman_xerox.db')
    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    this.initialize()
  }

  private initialize() {
    const isNew = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get() === undefined
    createSchema(this.db)
    if (isNew) {
      seedData(this.db)
    }
  }

  query(sql: string, params?: any[]) {
    const stmt = this.db.prepare(sql)
    if (sql.trim().toLowerCase().startsWith('select')) {
      return params ? stmt.all(...params) : stmt.all()
    }
    return params ? stmt.run(...params) : stmt.run()
  }

  run(sql: string, params?: any[]) {
    const stmt = this.db.prepare(sql)
    return params ? stmt.run(...params) : stmt.run()
  }

  get(sql: string, params?: any[]) {
    const stmt = this.db.prepare(sql)
    return params ? stmt.get(...params) : stmt.get()
  }

  all(sql: string, params?: any[]) {
    const stmt = this.db.prepare(sql)
    return params ? stmt.all(...params) : stmt.all()
  }

  transaction(statements: { sql: string; params?: any[] }[]) {
    const transaction = this.db.transaction((stmts) => {
      const results: any[] = []
      for (const { sql, params } of stmts) {
        const stmt = this.db.prepare(sql)
        results.push(params ? stmt.run(...params) : stmt.run())
      }
      return results
    })
    return transaction(statements)
  }

  backup(backupPath: string) {
    this.db.backup(backupPath)
    return { success: true, path: backupPath }
  }

  restore(backupPath: string) {
    this.db.close()
    fs.copyFileSync(backupPath, this.dbPath)
    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    return { success: true }
  }

  close() {
    this.db.close()
  }
}
