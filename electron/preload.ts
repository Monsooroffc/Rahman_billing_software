import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params),
    get: (sql: string, params?: any[]) => ipcRenderer.invoke('db:get', sql, params),
    all: (sql: string, params?: any[]) => ipcRenderer.invoke('db:all', sql, params),
    transaction: (statements: { sql: string; params?: any[] }[]) => ipcRenderer.invoke('db:transaction', statements),
    backup: (backupPath: string) => ipcRenderer.invoke('db:backup', backupPath),
    restore: (backupPath: string) => ipcRenderer.invoke('db:restore', backupPath),
  },
  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  },
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  print: {
    receipt: (html: string, printerName?: string) => ipcRenderer.invoke('print:receipt', html, printerName),
  },
})
