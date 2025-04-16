// setup-clones.js
// Updated script to set up platform clones for the price comparison app

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clone folder paths
const BLINKIT_CLONE_PATH = path.join(__dirname, 'blinkit-clone');
const ZEPTO_CLONE_PATH = path.join(__dirname, 'zepto-clone');

// Function to create directory if it doesn't exist
function createDirIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to create file with content
function createFile(filePath, content) {
  console.log(`Creating file: ${filePath}`);
  fs.writeFileSync(filePath, content);
}

// Setup Blinkit Clone
function setupBlinkitClone() {
  console.log('Setting up Blinkit Clone...');
  
  // Create clone directory
  createDirIfNotExists(BLINKIT_CLONE_PATH);
  createDirIfNotExists(path.join(BLINKIT_CLONE_PATH, 'public'));
  
  // Create index.js with content directly
  const indexJsContent = fs.readFileSync(path.join(__dirname, 'blinkit-clone-index.js'), 'utf8');
  createFile(path.join(BLINKIT_CLONE_PATH, 'index.js'), indexJsContent);
  
  // Create index.html
  const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'blinkit-index-html.html'), 'utf8');
  createFile(path.join(BLINKIT_CLONE_PATH, 'public', 'index.html'), indexHtmlContent);
  
  // Create checkout.html
  const checkoutHtmlContent = fs.readFileSync(path.join(__dirname, 'blinkit-checkout-html.html'), 'utf8');
  createFile(path.join(BLINKIT_CLONE_PATH, 'public', 'checkout.html'), checkoutHtmlContent);
  
  // Create package.json
  const packageJsonContent = `{
  "name": "blinkit-clone",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2"
  }
}`;
  createFile(path.join(BLINKIT_CLONE_PATH, 'package.json'), packageJsonContent);
  
  console.log('Blinkit Clone setup complete.');
}

// Setup Zepto Clone
function setupZeptoClone() {
  console.log('Setting up Zepto Clone...');
  
  // Create clone directory
  createDirIfNotExists(ZEPTO_CLONE_PATH);
  createDirIfNotExists(path.join(ZEPTO_CLONE_PATH, 'public'));
  
  // Create index.js
  const indexJsContent = fs.readFileSync(path.join(__dirname, 'zepto-clone-index.js'), 'utf8');
  createFile(path.join(ZEPTO_CLONE_PATH, 'index.js'), indexJsContent);
  
  // Create index.html
  const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'zepto-index-html.html'), 'utf8');
  createFile(path.join(ZEPTO_CLONE_PATH, 'public', 'index.html'), indexHtmlContent);
  
  // Create checkout.html
  const checkoutHtmlContent = fs.readFileSync(path.join(__dirname, 'zepto-checkout-html.html'), 'utf8');
  createFile(path.join(ZEPTO_CLONE_PATH, 'public', 'checkout.html'), checkoutHtmlContent);
  
  // Create package.json
  const packageJsonContent = `{
  "name": "zepto-clone",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2"
  }
}`;
  createFile(path.join(ZEPTO_CLONE_PATH, 'package.json'), packageJsonContent);
  
  console.log('Zepto Clone setup complete.');
}

// Install dependencies for clones
function installDependencies() {
  console.log('Installing dependencies for Blinkit Clone...');
  try {
    execSync('cd blinkit-clone && npm install', { stdio: 'inherit' });
    console.log('Blinkit Clone dependencies installed successfully');
    
    console.log('Installing dependencies for Zepto Clone...');
    execSync('cd zepto-clone && npm install', { stdio: 'inherit' });
    console.log('Zepto Clone dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Setting up platform clones for PriceWise...');
  
  try {
    // First, check if the source files exist
    if (!fs.existsSync(path.join(__dirname, 'blinkit-clone-index.js'))) {
      console.log('Creating source files first...');
      
      // Create Blinkit source files
      createFile(path.join(__dirname, 'blinkit-clone-index.js'), fs.readFileSync(path.join(__dirname, 'blinkit-clone/index.js'), 'utf8'));
      createFile(path.join(__dirname, 'blinkit-index-html.html'), fs.readFileSync(path.join(__dirname, 'blinkit-clone/public/index.html'), 'utf8'));
      createFile(path.join(__dirname, 'blinkit-checkout-html.html'), fs.readFileSync(path.join(__dirname, 'blinkit-clone/public/checkout.html'), 'utf8'));
      
      // Create Zepto source files
      createFile(path.join(__dirname, 'zepto-clone-index.js'), fs.readFileSync(path.join(__dirname, 'zepto-clone/index.js'), 'utf8'));
      createFile(path.join(__dirname, 'zepto-index-html.html'), fs.readFileSync(path.join(__dirname, 'zepto-clone/public/index.html'), 'utf8'));
      createFile(path.join(__dirname, 'zepto-checkout-html.html'), fs.readFileSync(path.join(__dirname, 'zepto-clone/public/checkout.html'), 'utf8'));
    } else {
      console.log('Source files found, proceeding with setup...');
    }
    
    // Set up Blinkit Clone
    setupBlinkitClone();
    
    // Set up Zepto Clone
    setupZeptoClone();
    
    // Install dependencies
    installDependencies();
    
    console.log('\n✅ Setup complete! You can now run the platform clones with:');
    console.log('npm run blinkit-clone     # Starts the Blinkit clone on port 3001');
    console.log('npm run zepto-clone       # Starts the Zepto clone on port 3002');
    console.log('npm run start:full        # Starts the main app along with all platform clones');
  } catch (error) {
    console.error('Setup failed:', error);
    
    // Provide alternative setup instructions
    console.log('\n⚠️ Automated setup failed. Please follow these manual steps:');
    console.log('1. Create folders "blinkit-clone" and "zepto-clone"');
    console.log('2. Create a "public" subfolder in each clone folder');
    console.log('3. Copy the index.js, index.html, and checkout.html files to their respective locations');
    console.log('4. Run "npm install" in each clone folder');
    console.log('5. Run "npm run start:full" to start all services');
  }
}

// Run the main function
main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});