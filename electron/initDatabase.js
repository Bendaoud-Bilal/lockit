const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

/**
 * Initialize database on first run or if database doesn't exist
 */
async function initDatabase() {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    console.log('Development mode: Using server/prisma/lockit.db')
    return
  }

  // Production: Database in user data folder
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'lockit.db')
  
  console.log('=== Database Initialization ===')
  console.log('User data path:', userDataPath)
  console.log('Database path:', dbPath)

  // Check if database exists
  if (fs.existsSync(dbPath)) {
    console.log('Database already exists')
    return
  }

  console.log('First run detected - initializing database...')

  // Ensure user data directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
    console.log('Created user data directory')
  }

  // Determine correct paths
  const isPortable = process.env.PORTABLE_EXECUTABLE_DIR !== undefined
  let serverPath, prismaPath, schemaPath
  
  if (isPortable) {
    serverPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'resources', 'server')
  } else {
    serverPath = path.join(process.resourcesPath, 'server')
  }
  
  prismaPath = path.join(serverPath, 'node_modules', '.bin', 'prisma.cmd')
  schemaPath = path.join(serverPath, 'prisma', 'schema.prisma')
  
  console.log('Server path:', serverPath)
  console.log('Prisma path:', prismaPath)
  console.log('Schema path:', schemaPath)
  console.log('Prisma exists:', fs.existsSync(prismaPath))
  console.log('Schema exists:', fs.existsSync(schemaPath))

  // Check if prisma exists, if not try alternative paths
  if (!fs.existsSync(prismaPath)) {
    // Try without .cmd extension (for non-Windows or different setup)
    prismaPath = path.join(serverPath, 'node_modules', '.bin', 'prisma')
    console.log('Trying alternative prisma path:', prismaPath)
    console.log('Alternative exists:', fs.existsSync(prismaPath))
  }

  if (!fs.existsSync(prismaPath)) {
    console.error('ERROR: Prisma binary not found!')
    console.error('Cannot initialize database. Please report this issue.')
    return
  }

  return new Promise((resolve, reject) => {
    const prismaProcess = spawn(prismaPath, ['db', 'push', '--skip-generate'], {
      cwd: serverPath,
      env: {
        ...process.env,
        DATABASE_URL: `file:${dbPath}`
      },
      stdio: 'inherit',
      shell: true // Use shell to handle .cmd files on Windows
    })

    prismaProcess.on('error', (err) => {
      console.error('Failed to initialize database:', err)
      reject(err)
    })

    prismaProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Database initialized successfully!')
        resolve()
      } else {
        console.error(`Prisma process exited with code ${code}`)
        reject(new Error(`Prisma process exited with code ${code}`))
      }
    })
  })
}

module.exports = { initDatabase }