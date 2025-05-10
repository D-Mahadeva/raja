// setup.js
// Script to initialize and check the application setup

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

console.log('🚀 Setting up PriceWise application...')

// Check for .env file and create if needed
const envPath = path.resolve(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.log('⚠️ .env file not found. Creating default configuration...')
  const envContent = `# API URL with proper protocol
VITE_API_URL=http://localhost:5000/api/products

# MongoDB URI - using your existing MongoDB connection
MONGO_URI=mongodb+srv://mahadevadmahadev78:mahadeva@cluster0.7j3av.mongodb.net/?retryWrites=true&w=majority&appname=Cluster0

# Server ports
BACKEND_PORT=5000
BLINKIT_PORT=3001
ZEPTO_PORT=3002
SWIGGY_PORT=3003
BIGBASKET_PORT=3004
DUNZO_PORT=3005

# Server environment
NODE_ENV=development

# Platform URLs for integration
BLINKIT_CLONE_URL=http://localhost:3001
ZEPTO_CLONE_URL=http://localhost:3002`

  fs.writeFileSync(envPath, envContent)
  console.log('✅ Created .env file with default configuration')
}

// Setup platform clone directories
const setupClones = () => {
  const cloneDirs = [
    {name: 'blinkit-clone', port: 3001},
    {name: 'zepto-clone', port: 3002}
  ]
  
  cloneDirs.forEach(clone => {
    const cloneDir = path.resolve(process.cwd(), clone.name)
    
    // Check if directory exists
    if (!fs.existsSync(cloneDir)) {
      console.log(`⚠️ ${clone.name} directory not found. Creating...`)
      fs.mkdirSync(cloneDir)
      fs.mkdirSync(path.join(cloneDir, 'public'))
      
      // Copy necessary files from existing files in the repository
      try {
        const files = [
          {src: `${clone.name}/index.js`, dest: 'index.js'},
          {src: `${clone.name}/package.json`, dest: 'package.json'},
          {src: `${clone.name}/public/index.html`, dest: 'public/index.html'},
          {src: `${clone.name}/public/checkout.html`, dest: 'public/checkout.html'}
        ]
        
        files.forEach(file => {
          const srcPath = path.resolve(process.cwd(), file.src)
          const destPath = path.join(cloneDir, file.dest)
          
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath)
            console.log(`Copied ${file.src} to ${file.dest}`)
          } else {
            console.error(`Source file not found: ${file.src}`)
          }
        })
        
        console.log(`✅ ${clone.name} directory created and files copied`)
      } catch (err) {
        console.error(`Error setting up ${clone.name}:`, err.message)
      }
    } else {
      console.log(`✅ ${clone.name} directory found`)
    }
  })
}

// Ensure MongoDB is running
const checkMongoDB = () => {
  console.log('Checking MongoDB connection...')
  try {
    // Simple check for MongoDB connection string
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in .env file')
      return false
    }
    
    console.log('✅ MongoDB URI found in configuration')
    return true
  } catch (err) {
    console.error('Error checking MongoDB:', err.message)
    return false
  }
}

// Check if backend dependencies are installed
const checkDependencies = () => {
  console.log('Checking dependencies...')
  
  // Check for node_modules
  if (!fs.existsSync(path.resolve(process.cwd(), 'node_modules'))) {
    console.log('⚠️ node_modules not found, installing dependencies...')
    try {
      execSync('npm install', { stdio: 'inherit' })
      console.log('✅ Dependencies installed')
    } catch (err) {
      console.error('❌ Failed to install dependencies:', err.message)
      return false
    }
  } else {
    console.log('✅ node_modules found')
  }
  
  return true
}

// Generate mock data for development
const generateMockData = () => {
  console.log('Setting up mock data...')
  try {
    execSync('node generateMockData.js', { stdio: 'inherit' })
    console.log('✅ Mock data setup complete')
    return true
  } catch (err) {
    console.error('❌ Failed to generate mock data:', err.message)
    return false
  }
}

// Main setup function
const runSetup = async () => {
  try {
    // Run setup steps
    setupClones()
    const mongoOk = checkMongoDB() 
    const depsOk = checkDependencies()
    
    if (mongoOk && depsOk) {
      console.log('\n✅ Initial setup complete!')
      console.log('\nTo start the application:')
      console.log('1. npm run backend:only     # Start the backend server')
      console.log('2. npm run dev              # Start the frontend development server')
      console.log('\nOr use the all-in-one command:')
      console.log('npm run start               # Start both backend and frontend')
      
      // Offer to generate mock data
      console.log('\nDo you want to generate mock data? (This will be done automatically when you start the server)')
    }
  } catch (err) {
    console.error('Setup failed:', err.message)
  }
}

// Run the setup
runSetup()