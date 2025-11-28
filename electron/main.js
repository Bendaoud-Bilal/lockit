const { app, BrowserWindow, session, dialog, ipcMain } = require('electron')
const path = require('path')
const { fork } = require('child_process')
const fs = require('fs')

let mainWindow
let serverProcess
let logger
let serverUrl = 'http://localhost:3000' // Default fallback

// Simple logger that writes to file
function initLogger() {
  const logDir = app.getPath('userData')
  const logPath = path.join(logDir, 'lockit-debug.log')
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  
  fs.writeFileSync(logPath, `=== Lockit Debug Log ===\nStarted: ${new Date().toISOString()}\n\n`)
  
  return {
    logPath,
    log: (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      console.log(...args)
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`)
    },
    error: (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      console.error(...args)
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ERROR: ${message}\n`)
    }
  }
}

async function initDatabase() {
  // In development, we check if the server directory exists in the project root
  // This is more reliable than checking app.isPackaged
  const serverDir = path.join(__dirname, '../server')
  const isDev = fs.existsSync(serverDir)
  
  if (isDev) {
    logger.log('Development mode detected: server directory exists at', serverDir)
    logger.log('Using server/prisma/lockit.db')
    return
  }

  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'lockit.db')
  
  logger.log('=== Database Initialization ===')
  logger.log('Database path:', dbPath)

  if (fs.existsSync(dbPath)) {
    logger.log('Database already exists')
    return
  }

  logger.log('First run detected - initializing database...')

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  // Create empty database file - let server handle migrations
  fs.writeFileSync(dbPath, '')
  logger.log('Created empty database file')
}

function startServer() {
  return new Promise((resolve, reject) => {
    // Check if the server directory exists in the project root (development mode)
    const serverDir = path.join(__dirname, '../server')
    const isDev = fs.existsSync(serverDir)
    
    logger.log('Checking for development mode...')
    logger.log('Server directory path:', serverDir)
    logger.log('Server directory exists:', isDev)
    
    if (isDev) {
      logger.log('✅ Development mode: Using external server on port 3000')
      serverUrl = 'http://localhost:3000'
      resolve(serverUrl)
      return
    }
    
    logger.log('📦 Production mode: Starting bundled server with dynamic port...')

    // Use process.resourcesPath for both installed and unpacked versions
    const basePath = process.resourcesPath
    const serverPath = path.join(basePath, 'server', 'index.js')
    
    logger.log('=== Packaging Info ===')
    logger.log('Is Packaged:', app.isPackaged)

    logger.log('=== Server Startup Debug Info ===')
    logger.log('Process resourcesPath:', process.resourcesPath)
    logger.log('Base path:', basePath)
    logger.log('Server path:', serverPath)
    logger.log('Server exists:', fs.existsSync(serverPath))
    
    if (!fs.existsSync(serverPath)) {
      logger.error('ERROR: Server file not found at:', serverPath)
      const resourcesDir = path.dirname(serverPath)
      if (fs.existsSync(resourcesDir)) {
        logger.log('Resources dir contents:', fs.readdirSync(resourcesDir))
      } else {
        logger.error('Resources directory does not exist:', resourcesDir)
        const parentDir = path.dirname(resourcesDir)
        if (fs.existsSync(parentDir)) {
          logger.log('Parent dir contents:', fs.readdirSync(parentDir))
        }
      }
      
      dialog.showErrorBox(
        'Server Error',
        `Cannot find server files. Please check log file at:\n${logger.logPath}`
      )
      reject(new Error('Server files not found'))
      return
    }

    logger.log('Starting bundled server...')
    
    const dbPath = path.join(app.getPath('userData'), 'lockit.db')
    logger.log('Database path:', dbPath)
    
    // Set a timeout for server startup
    const startupTimeout = setTimeout(() => {
      logger.error('Server startup timeout - no response after 30 seconds')
      reject(new Error('Server startup timeout'))
    }, 30000)
    
    serverProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3000', // Preferred port
        HOST: 'localhost',
        DATABASE_URL: `file:${dbPath}`
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      execPath: process.execPath,
      execArgv: []
    })

    // Listen for messages from server process
    serverProcess.on('message', (message) => {
      if (message.type === 'SERVER_READY') {
        clearTimeout(startupTimeout)
        serverUrl = message.url || `http://${message.host}:${message.port}`
        logger.log('Server ready at:', serverUrl)
        
        // Update window CSP with actual server URL
        updateCSP(message.port)
        
        resolve(serverUrl)
      } else if (message.type === 'SERVER_ERROR') {
        clearTimeout(startupTimeout)
        logger.error('Server startup error:', message.error)
        reject(new Error(message.error))
      }
    })

    serverProcess.stdout?.on('data', (data) => {
      logger.log('[SERVER]', data.toString().trim())
    })

    serverProcess.stderr?.on('data', (data) => {
      logger.error('[SERVER ERROR]', data.toString().trim())
    })

    serverProcess.on('error', (err) => {
      clearTimeout(startupTimeout)
      logger.error('Failed to start server:', err.message)
      logger.error('Error stack:', err.stack)
      reject(err)
    })

    serverProcess.on('exit', (code, signal) => {
      logger.log(`Server exited with code ${code}, signal ${signal}`)
      if (code !== 0 && code !== null) {
        dialog.showErrorBox(
          'Server Crashed',
          `The backend server has stopped unexpectedly. Exit code: ${code}`
        )
      }
    })

    logger.log('Server process started with PID:', serverProcess.pid)
  })
}

function updateCSP(serverPort) {
  const serverOrigin = `http://localhost:${serverPort}`
  
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          `connect-src 'self' http://localhost:5173 ${serverOrigin}; ` +
          "img-src 'self' data: https:;"
        ]
      }
    })
  })
}

async function createWindow() {
  // Check if the server directory exists in the project root (development mode)
  const serverDir = path.join(__dirname, '../server')
  const isDev = fs.existsSync(serverDir)

  // Set default CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' http://localhost:5173 http://localhost:3000 http://localhost:3001 http://localhost:3002 http://localhost:3003 http://localhost:3004 http://localhost:3005 http://localhost:3010 http://localhost:3020 http://localhost:3030 http://localhost:3040 http://localhost:3050 http://localhost:3100; " +
          "img-src 'self' data: https:;"
        ]
      }
    })
  })

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--server-url=${serverUrl}`]
    },
    icon: path.join(__dirname, '../client/public/icons/icon.png'),
    show: false
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = ['http://localhost:5173', serverUrl, 'file://']
    if (!allowed.some(origin => url.startsWith(origin))) {
      event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
    mainWindow.show()
  } else {
    const clientPath = path.join(__dirname, '../client/dist/index.html')
    logger.log('Loading client from:', clientPath)
    logger.log('Client exists:', fs.existsSync(clientPath))
    
    mainWindow.loadFile(clientPath)
    
    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
      logger.log('Application started successfully')
      logger.log('Backend server:', serverUrl)
      logger.log('Log file location:', logger.logPath)
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Expose server URL to renderer via IPC
ipcMain.handle('get-server-url', () => {
  return serverUrl
})

// Print handler for recovery keys
ipcMain.handle('print-recovery-key', async (event, content) => {
  logger.log('Print recovery key requested');
  
  try {
    const { dialog } = require('electron');
    const os = require('os');
    const tempPath = path.join(os.tmpdir(), `lockit-recovery-${Date.now()}.html`);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lockit Recovery Key</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              padding: 40px;
              line-height: 1.6;
              background: white;
            }
            h1 { 
              color: #4A5FE5; 
              margin-bottom: 10px;
              font-size: 28px;
            }
            h2 {
              color: #333;
              margin-top: 0;
              margin-bottom: 20px;
              font-size: 20px;
            }
            h3 {
              margin: 0 0 10px 0;
              color: #92400e;
              font-size: 16px;
            }
            .key { 
              font-size: 24px; 
              letter-spacing: 3px; 
              background: #f3f4f6; 
              padding: 20px; 
              margin: 20px 0; 
              border: 2px dashed #9ca3af;
              word-break: break-all;
              text-align: center;
              font-weight: bold;
            }
            .warning { 
              background: #fef3c7; 
              border-left: 4px solid #f59e0b; 
              padding: 15px; 
              margin: 20px 0; 
            }
            .warning ul {
              margin: 10px 0 0 20px;
              padding: 0;
            }
            .warning li {
              margin: 8px 0;
              color: #78350f;
            }
            p {
              margin: 10px 0;
            }
            strong {
              font-weight: bold;
            }
            small {
              font-size: 12px;
              color: #666;
            }
            .info-row {
              margin: 10px 0;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            // Auto-print when loaded
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    // Write HTML to temp file
    fs.writeFileSync(tempPath, html, 'utf8');
    logger.log('Created temp print file:', tempPath);

    // Create print window with the temp file
    const printWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: true, // Show the window so user can see print dialog
      parent: mainWindow,
      modal: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Allow loading local file
      }
    });

    // Load the temp file
    await printWindow.loadFile(tempPath);

    logger.log('Print window loaded');

    // The window will auto-print via the script tag
    // Wait for user to finish printing
    return new Promise((resolve) => {
      // Clean up when window closes
      printWindow.on('closed', () => {
        // Delete temp file
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
            logger.log('Cleaned up temp file');
          }
        } catch (err) {
          logger.error('Error cleaning temp file:', err);
        }
        
        resolve({ success: true, error: null });
      });
    });

  } catch (error) {
    logger.error('Print error:', error.message);
    logger.error('Print error stack:', error.stack);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(async () => {
  logger = initLogger()
  
  logger.log('=== App Startup ===')
  logger.log('App name:', app.getName())
  logger.log('App version:', app.getVersion())
  logger.log('App path:', app.getAppPath())
  logger.log('User data path:', app.getPath('userData'))
  logger.log('Exe path:', app.getPath('exe'))
  logger.log('Resources path:', process.resourcesPath)
  logger.log('NODE_ENV:', process.env.NODE_ENV)
  
  const dbPath = path.join(app.getPath('userData'), 'lockit.db')
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath)
    logger.log('Database file size:', stats.size, 'bytes')
    logger.log('Database modified:', stats.mtime)
  }
  
  try {
    await initDatabase()
  } catch (err) {
    logger.error('Database initialization failed:', err.message)
  }
  
  try {
    await startServer()
    logger.log('Server started successfully at:', serverUrl)
  } catch (err) {
    logger.error('Failed to start server:', err.message)
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start the backend server.\n\nError: ${err.message}\n\nPlease check the log file at:\n${logger.logPath}`
    )
    app.quit()
    return
  }
  
  const delay = process.env.NODE_ENV === 'production' ? 2000 : 0
  setTimeout(createWindow, delay)
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})