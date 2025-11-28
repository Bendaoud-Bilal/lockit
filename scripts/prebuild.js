const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Starting pre-build process...\n')

// Step 1: Build client
console.log('📦 Building client...')
try {
  execSync('cd client && npm run build', { stdio: 'inherit' })
  console.log('✅ Client built successfully\n')
} catch (err) {
  console.error('❌ Client build failed')
  process.exit(1)
}

// Step 2: Install server production dependencies
console.log('📦 Installing server dependencies...')
try {
  execSync('cd server && npm install --production=false', { stdio: 'inherit' })
  console.log('✅ Server dependencies installed\n')
} catch (err) {
  console.error('❌ Server dependency installation failed')
  process.exit(1)
}

// Step 3: Generate Prisma client
console.log('🔧 Generating Prisma client...')
try {
  execSync('cd server && npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated\n')
} catch (err) {
  console.error('❌ Prisma client generation failed')
  process.exit(1)
}

// Step 4: Verify icon files exist
console.log('🎨 Checking icon files...')
const iconDir = path.join(__dirname, '..', 'client', 'public', 'icons')
const requiredIcons = {
  'icon.ico': 'Windows installer icon',
  'icon.png': 'Linux icon'
}

let iconWarnings = false
for (const [filename, description] of Object.entries(requiredIcons)) {
  const iconPath = path.join(iconDir, filename)
  if (!fs.existsSync(iconPath)) {
    console.warn(`⚠️  Missing: ${filename} (${description})`)
    iconWarnings = true
  } else {
    console.log(`✅ Found: ${filename}`)
  }
}

if (iconWarnings) {
  console.warn('\n⚠️  Some icon files are missing. Build will continue but icons may not display correctly.')
  console.warn('   Place icon files in: client/public/icons/')
} else {
  console.log('✅ All icon files found\n')
}

// Step 5: Create build directory if it doesn't exist
const buildDir = path.join(__dirname, '..', 'build')
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true })
  console.log('✅ Build directory created\n')
}

console.log('✨ Pre-build completed successfully!\n')
console.log('You can now run: npm run build')
console.log('or: npm run build:win (Windows only)')
console.log('or: npm run build:linux (Linux only)\n')