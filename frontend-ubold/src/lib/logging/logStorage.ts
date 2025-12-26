/**
 * Almacenamiento en memoria para logs de [LOGGING]
 * Permite capturar y recuperar logs reales de logActivity
 */

interface LogEntry {
  timestamp: string
  level: 'log' | 'error' | 'warn'
  message: string
  data?: any
}

class LogStorage {
  private logs: LogEntry[] = []
  private maxLogs = 200 // Mantener solo los últimos 200 logs

  addLog(level: 'log' | 'error' | 'warn', message: string, data?: any) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    })
    
    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs] // Retornar copia para evitar mutaciones
  }

  getLogsByPrefix(prefix: string): LogEntry[] {
    return this.logs.filter(log => log.message.includes(prefix))
  }

  clearLogs() {
    this.logs = []
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count)
  }
}

// Instancia singleton
export const logStorage = new LogStorage()

// Interceptar console.log, console.error, console.warn para capturar logs de [LOGGING]
if (typeof window === 'undefined') {
  // Solo en el servidor
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...args: any[]) => {
    originalLog(...args)
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    if (message.includes('[LOGGING]')) {
      logStorage.addLog('log', message, args.length > 1 ? args.slice(1) : undefined)
    }
  }

  console.error = (...args: any[]) => {
    originalError(...args)
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    if (message.includes('[LOGGING]')) {
      logStorage.addLog('error', message, args.length > 1 ? args.slice(1) : undefined)
    }
  }

  console.warn = (...args: any[]) => {
    originalWarn(...args)
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    if (message.includes('[LOGGING]')) {
      logStorage.addLog('warn', message, args.length > 1 ? args.slice(1) : undefined)
    }
  }
}

