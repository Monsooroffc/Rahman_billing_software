/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    db: {
      query: (sql: string, params?: any[]) => Promise<any>
      run: (sql: string, params?: any[]) => Promise<any>
      get: (sql: string, params?: any[]) => Promise<any>
      all: (sql: string, params?: any[]) => Promise<any[]>
      transaction: (statements: { sql: string; params?: any[] }[]) => Promise<any>
      backup: (path: string) => Promise<any>
      restore: (path: string) => Promise<any>
    }
    app: {
      getPath: (name: string) => Promise<string>
    }
    dialog: {
      showOpenDialog: (options: any) => Promise<any>
      showSaveDialog: (options: any) => Promise<any>
    }
    shell: {
      openExternal: (url: string) => Promise<void>
    }
    print: {
      receipt: (html: string, printerName?: string) => Promise<any>
    }
  }
}
