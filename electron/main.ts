import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { DatabaseManager } from './db'

let mainWindow: BrowserWindow | null = null
let dbManager: DatabaseManager | null = null

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'RAHMAN XEROX & SIFY IWAY',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData')
  dbManager = new DatabaseManager(userDataPath)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('db:query', async (_, sql: string, params?: any[]) => {
  if (!dbManager) throw new Error('Database not initialized')
  return dbManager.query(sql, params)
})

ipcMain.handle('db:run', async (_, sql: string, params?: any[]) => {
  if (!dbManager) throw new Error('Database not initialized')
  return dbManager.run(sql, params)
})

ipcMain.handle('db:get', async (_, sql: string, params?: any[]) => {
  if (!dbManager) throw new Error('Database not initialized')
  return dbManager.get(sql, params)
})

ipcMain.handle('db:all', async (_, sql: string, params?: any[]) => {
  if (!dbManager) throw new Error('Database not initialized')
  return dbManager.all(sql, params)
})

ipcMain.handle('db:transaction', async (_, statements: { sql: string; params?: any[] }[]) => {
  if (!dbManager) throw new Error('Database not initialized')
  return dbManager.transaction(statements)
})

ipcMain.handle('db:backup', async (_, backupPath: string) => {
  if (!dbManager) throw new Error('Database not initialized')
  return dbManager.backup(backupPath)
})

ipcMain.handle('db:restore', async (_, backupPath: string) => {
  if (!dbManager) throw new Error('Database not initialized')
  return dbManager.restore(backupPath)
})

ipcMain.handle('app:getPath', async (_, name: string) => {
  return app.getPath(name as any)
})

ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options)
  return result
})

ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options)
  return result
})

ipcMain.handle('shell:openExternal', async (_, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('print:receipt', async (_, html: string, printerName?: string) => {
  const printWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  
  await printWindow.loadURL(`data:text/html,${encodeURIComponent(html)}`)
  const printers = await printWindow.webContents.getPrintersAsync()
  
  const selectedPrinter = printerName && printers.some(printer => printer.name === printerName)
    ? printerName
    : printers[0]?.name

  printWindow.webContents.print(
    {
      silent: false,
      printBackground: true,
      deviceName: selectedPrinter,
    },
    (success, failureReason) => {
      if (!success) console.error('Print failed:', failureReason)
      printWindow.close()
    }
  )
  
  return { success: true }
})
