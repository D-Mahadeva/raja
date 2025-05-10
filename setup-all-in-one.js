// setup-clones.js
// All-in-One script to setup platform clones for the price comparison app

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
const SWIGGY_CLONE_PATH = path.join(__dirname, 'swiggy-clone');
const BIGBASKET_CLONE_PATH = path.join(__dirname, 'bigbasket-clone');
const DUNZO_CLONE_PATH = path.join(__dirname, 'dunzo-clone');

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

// Function to generate basic index.js for platform clone
function generateIndexJs(platformName, platformId, portEnvVar) {
  return `// ${platformId}-clone/index.js
// Entry point for the ${platformName} clone app

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.${portEnvVar} || ${platformId === 'blinkit' ? '3001' : platformId === 'zepto' ? '3002' : platformId === 'swiggy' ? '3003' : platformId === 'bigbasket' ? '3004' : '3005'};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*', // In production, restrict this to your main app domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(path.join(__dirname, 'public')));

// Sample data storage (in-memory for demo)
const orders = new Map();
const sessions = new Map();

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Checkout page
app.get('/checkout', (req, res) => {
  const { sessionId, cart, returnUrl } = req.query;
  
  if (!sessionId || !cart) {
    return res.status(400).send('Invalid checkout parameters');
  }
  
  // Store session data
  try {
    const cartData = JSON.parse(decodeURIComponent(cart));
    sessions.set(sessionId, {
      cartData,
      returnUrl: returnUrl || '/',
      timestamp: new Date()
    });
    
    // Render checkout page
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
  } catch (error) {
    console.error('Error parsing cart data:', error);
    res.status(400).send('Invalid cart data format');
  }
});

// API to fetch cart data for a session
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

// API for creating an order
app.post('/api/orders', (req, res) => {
  const { sessionId, paymentDetails, deliveryAddress } = req.body;
  
  if (!sessionId || !paymentDetails || !deliveryAddress) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Create new order
  const orderId = \`${platformId.substring(0, 2).toUpperCase()}\${Date.now().toString().slice(-6)}\${Math.floor(Math.random() * 1000)}\`;
  const order = {
    id: orderId,
    sessionId,
    cartData: session.cartData,
    paymentDetails,
    deliveryAddress,
    status: 'confirmed',
    estimatedDelivery: ${platformId === 'blinkit' ? "'10-15 minutes'" : platformId === 'zepto' ? "'8-12 minutes'" : platformId === 'swiggy' ? "'15-25 minutes'" : platformId === 'bigbasket' ? "'30-45 minutes'" : "'20-30 minutes'"},
    createdAt: new Date(),
    platform: '${platformId}'
  };
  
  // Store order
  orders.set(orderId, order);
  
  // Return order data
  res.status(201).json(order);
});

// API to get order status
app.get('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

// API to update order status (simulated delivery updates)
app.post('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status, message } = req.body;
  
  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // Update order status
  order.status = status;
  order.statusMessage = message;
  order.updatedAt = new Date();
  
  // Return updated order
  res.json(order);
});

// Start the server
app.listen(PORT, () => {
  console.log(\`${platformName} clone running on http://localhost:\${PORT}\`);
});`;
}

// Function to generate basic package.json for platform clone
function generatePackageJson(platformName, platformId) {
  return `{
  "name": "${platformId}-clone",
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
}

// Function to generate basic index.html for platform clone
function generateIndexHtml(platformName, platformId, primaryColor) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${platformName} Clone</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    :root {
      --${platformId}-primary: ${primaryColor};
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f9f9f9;
    }
    .${platformId}-primary {
      color: var(--${platformId}-primary);
    }
    .bg-${platformId}-primary {
      background-color: var(--${platformId}-primary);
    }
  </style>
</head>
<body>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="h-8">
        <span class="text-2xl font-bold ${platformId}-primary">${platformName.toLowerCase()}</span>
      </div>
      <div class="text-sm font-medium">${platformName} Clone</div>
    </div>
  </header>

  <main class="container mx-auto py-8 px-4">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <h1 class="text-2xl font-bold mb-6 text-center">${platformName} Clone Demo</h1>
      
      <div class="mb-6 text-center">
        <p class="${platformId}-primary font-medium mb-2">Platform Clone Integration</p>
        <p class="text-gray-500">This is a simplified clone of ${platformName} for demonstrating checkout integration with PriceWise.</p>
      </div>
      
      <div class="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 class="font-semibold mb-2">How it works</h2>
        <ol class="list-decimal pl-5 space-y-2 text-sm">
          <li>PriceWise sends cart data to this ${platformName} clone when a user chooses to checkout</li>
          <li>The user completes payment process on this platform</li>
          <li>Order status is sent back to PriceWise in real-time</li>
          <li>The user can track their order from either platform</li>
        </ol>
      </div>
      
      <div class="border border-gray-200 rounded-lg p-4">
        <h2 class="font-semibold mb-2">Test this integration</h2>
        <p class="text-sm text-gray-500 mb-4">Add items to your cart in PriceWise, then select ${platformName} as your checkout platform.</p>
        <button class="w-full py-3 px-4 bg-${platformId}-primary text-white rounded-md font-medium hover:opacity-90 transition">
          Go to PriceWise
        </button>
      </div>
    </div>
  </main>

  <footer class="bg-white border-t border-gray-200 py-6 mt-8">
    <div class="container mx-auto px-4">
      <div class="text-center text-sm text-gray-500">
        <p>&copy; 2025 ${platformName} Clone. This is a demo app for educational purposes only.</p>
        <p class="mt-1">Not affiliated with the real ${platformName}.</p>
      </div>
    </div>
  </footer>

  <script>
    document.querySelector('button').addEventListener('click', () => {
      window.location.href = 'http://localhost:8080';
    });
  </script>
</body>
</html>`;
}

// Function to generate basic checkout.html skeleton for platform clone
function generateBasicCheckoutHtml(platformName, platformId, primaryColor) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Checkout | ${platformName}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    :root {
      --${platformId}-primary: ${primaryColor};
      --${platformId}-light: ${lightenColor(primaryColor, 0.9)};
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f9f9f9;
    }
    
    .${platformId}-primary {
      color: var(--${platformId}-primary);
    }
    
    .bg-${platformId}-primary {
      background-color: var(--${platformId}-primary);
    }
    
    .bg-${platformId}-light {
      background-color: var(--${platformId}-light);
    }
    
    .border-${platformId} {
      border-color: var(--${platformId}-primary);
    }
  </style>
</head>
<body>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="h-8">
        <span class="text-2xl font-bold ${platformId}-primary">${platformName.toLowerCase()}</span>
      </div>
      <div class="timer px-2 py-1 rounded bg-${platformId}-light ${platformId}-primary font-semibold text-sm">
        ${platformId === 'blinkit' ? '10' : platformId === 'zepto' ? '8' : platformId === 'swiggy' ? '15' : platformId === 'bigbasket' ? '30' : '20'} min delivery
      </div>
    </div>
  </header>

  <main class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Checkout</h1>
    
    <!-- Placeholder for checkout form, will be filled properly later -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <p class="text-center py-6">Basic checkout functionality will be implemented here.</p>
      <div class="flex justify-center">
        <button id="demo-checkout-btn" class="px-6 py-3 bg-${platformId}-primary text-white rounded-md">
          Demo Checkout
        </button>
      </div>
    </div>
  </main>

  <footer class="bg-white border-t border-gray-200 py-6 mt-8">
    <div class="container mx-auto px-4">
      <div class="text-center text-sm text-gray-500">
        <p>&copy; 2025 ${platformName} Clone. This is a demo app for educational purposes only.</p>
        <p class="mt-1">Not affiliated with the real ${platformName}.</p>
      </div>
    </div>
  </footer>

  <script>
    // Basic script to simulate checkout 
    document.getElementById('demo-checkout-btn').addEventListener('click', () => {
      alert('This is a placeholder for the full checkout experience that will be implemented.');
    });
  </script>
</body>
</html>`;
}

// Helper function to lighten a hex color
function lightenColor(hex, factor) {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  // Lighten
  r = Math.min(255, Math.round(r + (255 - r) * factor));
  g = Math.min(255, Math.round(g + (255 - g) * factor));
  b = Math.min(255, Math.round(b + (255 - b) * factor));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Setup Blinkit Clone (with full implementation)
function setupBlinkitClone() {
  console.log('Setting up Blinkit Clone...');
  
  // Create clone directory
  createDirIfNotExists(BLINKIT_CLONE_PATH);
  createDirIfNotExists(path.join(BLINKIT_CLONE_PATH, 'public'));
  
  // Create index.js
  createFile(
    path.join(BLINKIT_CLONE_PATH, 'index.js'),
    generateIndexJs('Blinkit', 'blinkit', 'BLINKIT_PORT')
  );
  
  // Create package.json
  createFile(
    path.join(BLINKIT_CLONE_PATH, 'package.json'),
    generatePackageJson('Blinkit', 'blinkit')
  );
  
  // Create index.html
  createFile(
    path.join(BLINKIT_CLONE_PATH, 'public', 'index.html'),
    generateIndexHtml('Blinkit', 'blinkit', '#0c831f')
  );
  
  // For Blinkit, we'll use the full checkout.html file
  const blinkitCheckoutPath = path.join(__dirname, 'blinkit-checkout.html');
  
  if (fs.existsSync(blinkitCheckoutPath)) {
    // Use existing file if available
    const blinkitCheckoutContent = fs.readFileSync(blinkitCheckoutPath, 'utf8');
    createFile(
      path.join(BLINKIT_CLONE_PATH, 'public', 'checkout.html'),
      blinkitCheckoutContent
    );
  } else {
    // Create basic checkout HTML if the full file is not available
    createFile(
      path.join(BLINKIT_CLONE_PATH, 'public', 'checkout.html'), 
      fs.readFileSync(path.join(__dirname, 'blinkit-clone/public/checkout.html'), 'utf8') ||
      generateBasicCheckoutHtml('Blinkit', 'blinkit', '#0c831f')
    );
    
    console.log('⚠️ Using basic checkout.html for Blinkit. For the full checkout experience, please copy the complete checkout.html');
  }
  
  console.log('Blinkit Clone setup complete.');
}

// Setup Zepto Clone (with full implementation)
function setupZeptoClone() {
  console.log('Setting up Zepto Clone...');
  
  // Create clone directory
  createDirIfNotExists(ZEPTO_CLONE_PATH);
  createDirIfNotExists(path.join(ZEPTO_CLONE_PATH, 'public'));
  
  // Create index.js
  createFile(
    path.join(ZEPTO_CLONE_PATH, 'index.js'),
    generateIndexJs('Zepto', 'zepto', 'ZEPTO_PORT')
  );
  
  // Create package.json
  createFile(
    path.join(ZEPTO_CLONE_PATH, 'package.json'),
    generatePackageJson('Zepto', 'zepto')
  );
  
  // Create index.html
  createFile(
    path.join(ZEPTO_CLONE_PATH, 'public', 'index.html'),
    generateIndexHtml('Zepto', 'zepto', '#8025fb')
  );
  
  // For Zepto, we'll use the full checkout.html file
  const zeptoCheckoutPath = path.join(__dirname, 'zepto-checkout.html');
  
  if (fs.existsSync(zeptoCheckoutPath)) {
    // Use existing file if available
    const zeptoCheckoutContent = fs.readFileSync(zeptoCheckoutPath, 'utf8');
    createFile(
      path.join(ZEPTO_CLONE_PATH, 'public', 'checkout.html'),
      zeptoCheckoutContent
    );
  } else {
    // Create basic checkout HTML if the full file is not available
    createFile(
      path.join(ZEPTO_CLONE_PATH, 'public', 'checkout.html'),
      fs.readFileSync(path.join(__dirname, 'zepto-clone/public/checkout.html'), 'utf8') ||
      generateBasicCheckoutHtml('Zepto', 'zepto', '#8025fb')
    );
    
    console.log('⚠️ Using basic checkout.html for Zepto. For the full checkout experience, please copy the complete checkout.html');
  }
  
  console.log('Zepto Clone setup complete.');
}

// Setup Swiggy Clone (basic implementation)
function setupSwiggyClone() {
  console.log('Setting up Swiggy Instamart Clone...');
  
  // Create clone directory
  createDirIfNotExists(SWIGGY_CLONE_PATH);
  createDirIfNotExists(path.join(SWIGGY_CLONE_PATH, 'public'));
  
  // Create index.js
  createFile(
    path.join(SWIGGY_CLONE_PATH, 'index.js'),
    generateIndexJs('Swiggy Instamart', 'swiggy', 'SWIGGY_PORT')
  );
  
  // Create package.json
  createFile(
    path.join(SWIGGY_CLONE_PATH, 'package.json'),
    generatePackageJson('Swiggy Instamart', 'swiggy')
  );
  
  // Create index.html
  createFile(
    path.join(SWIGGY_CLONE_PATH, 'public', 'index.html'),
    generateIndexHtml('Swiggy Instamart', 'swiggy', '#fc8019')
  );
  
  // Create basic checkout.html
  createFile(
    path.join(SWIGGY_CLONE_PATH, 'public', 'checkout.html'),
    generateBasicCheckoutHtml('Swiggy Instamart', 'swiggy', '#fc8019')
  );
  
  console.log('Swiggy Instamart Clone setup complete (basic implementation).');
}

// Setup BigBasket Clone (basic implementation)
function setupBigBasketClone() {
  console.log('Setting up Big Basket Clone...');
  
  // Create clone directory
  createDirIfNotExists(BIGBASKET_CLONE_PATH);
  createDirIfNotExists(path.join(BIGBASKET_CLONE_PATH, 'public'));
  
  // Create index.js
  createFile(
    path.join(BIGBASKET_CLONE_PATH, 'index.js'),
    generateIndexJs('Big Basket', 'bigbasket', 'BIGBASKET_PORT')
  );
  
  // Create package.json
  createFile(
    path.join(BIGBASKET_CLONE_PATH, 'package.json'),
    generatePackageJson('Big Basket', 'bigbasket')
  );
  
  // Create index.html
  createFile(
    path.join(BIGBASKET_CLONE_PATH, 'public', 'index.html'),
    generateIndexHtml('Big Basket', 'bigbasket', '#84c225')
  );
  
  // Create basic checkout.html
  createFile(
    path.join(BIGBASKET_CLONE_PATH, 'public', 'checkout.html'),
    generateBasicCheckoutHtml('Big Basket', 'bigbasket', '#84c225')
  );
  
  console.log('Big Basket Clone setup complete (basic implementation).');
}

// Setup Dunzo Clone (basic implementation)
function setupDunzoClone() {
  console.log('Setting up Dunzo Daily Clone...');
  
  // Create clone directory
  createDirIfNotExists(DUNZO_CLONE_PATH);
  createDirIfNotExists(path.join(DUNZO_CLONE_PATH, 'public'));
  
  // Create index.js
  createFile(
    path.join(DUNZO_CLONE_PATH, 'index.js'),
    generateIndexJs('Dunzo Daily', 'dunzo', 'DUNZO_PORT')
  );
  
  // Create package.json
  createFile(
    path.join(DUNZO_CLONE_PATH, 'package.json'),
    generatePackageJson('Dunzo Daily', 'dunzo')
  );
  
  // Create index.html
  createFile(
    path.join(DUNZO_CLONE_PATH, 'public', 'index.html'),
    generateIndexHtml('Dunzo Daily', 'dunzo', '#00d290')
  );
  
  // Create basic checkout.html
  createFile(
    path.join(DUNZO_CLONE_PATH, 'public', 'checkout.html'),
    generateBasicCheckoutHtml('Dunzo Daily', 'dunzo', '#00d290')
  );
  
  console.log('Dunzo Daily Clone setup complete (basic implementation).');
}

// Install dependencies for clones
async function installDependencies() {
  const cloneFolders = [
    { path: BLINKIT_CLONE_PATH, name: 'Blinkit' },
    { path: ZEPTO_CLONE_PATH, name: 'Zepto' }
  ];
  
  // Optionally install dependencies for other clones if they are set up
  if (fs.existsSync(SWIGGY_CLONE_PATH)) {
    cloneFolders.push({ path: SWIGGY_CLONE_PATH, name: 'Swiggy Instamart' });
  }
  
  if (fs.existsSync(BIGBASKET_CLONE_PATH)) {
    cloneFolders.push({ path: BIGBASKET_CLONE_PATH, name: 'Big Basket' });
  }
  
  if (fs.existsSync(DUNZO_CLONE_PATH)) {
    cloneFolders.push({ path: DUNZO_CLONE_PATH, name: 'Dunzo Daily' });
  }
  
  for (const clone of cloneFolders) {
    try {
      console.log(`Installing dependencies for ${clone.name} Clone...`);
      execSync(`cd ${clone.path} && npm install`, { stdio: 'inherit' });
      console.log(`${clone.name} Clone dependencies installed successfully`);
    } catch (error) {
      console.error(`Error installing dependencies for ${clone.name} Clone:`, error);
    }
  }
}

// Create npm scripts for the main package.json
function updateMainPackageJson() {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('⚠️ Main package.json not found. Skipping script updates.');
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add scripts for running platform clones
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['blinkit-clone'] = 'node blinkit-clone/index.js';
    packageJson.scripts['zepto-clone'] = 'node zepto-clone/index.js';
    
    if (fs.existsSync(SWIGGY_CLONE_PATH)) {
      packageJson.scripts['swiggy-clone'] = 'node swiggy-clone/index.js';
    }
    
    if (fs.existsSync(BIGBASKET_CLONE_PATH)) {
      packageJson.scripts['bigbasket-clone'] = 'node bigbasket-clone/index.js';
    }
    
    if (fs.existsSync(DUNZO_CLONE_PATH)) {
      packageJson.scripts['dunzo-clone'] = 'node dunzo-clone/index.js';
    }
    
    // Add script to run all clones together with the main app
    const cloneScripts = ['blinkit-clone', 'zepto-clone'];
    
    if (fs.existsSync(SWIGGY_CLONE_PATH)) {
      cloneScripts.push('swiggy-clone');
    }
    
    if (fs.existsSync(BIGBASKET_CLONE_PATH)) {
      cloneScripts.push('bigbasket-clone');
    }
    
    if (fs.existsSync(DUNZO_CLONE_PATH)) {
      cloneScripts.push('dunzo-clone');
    }
    
    // Add start:full command to start all services
    packageJson.scripts['start:full'] = `concurrently \"npm run backend:only\" ${cloneScripts.map(script => `\"npm run ${script}\"`).join(' ')} \"npm run dev\"`;
    
    // Add setup-clones script
    packageJson.scripts['setup-clones'] = 'node setup-clones.js';
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Updated main package.json with platform clone scripts.');
  } catch (error) {
    console.error('Error updating main package.json:', error);
  }
}

// Update .env file with platform clone URLs
function updateEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('⚠️ .env file not found. Creating new .env file...');
      createFile(envPath, '# PriceWise Environment Variables\n\n');
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Add platform URLs if they don't exist
    if (!envContent.includes('BLINKIT_CLONE_URL')) {
      envContent += '\n# Platform clone URLs\n';
      envContent += 'BLINKIT_CLONE_URL=http://localhost:3001\n';
      envContent += 'ZEPTO_CLONE_URL=http://localhost:3002\n';
      
      if (fs.existsSync(SWIGGY_CLONE_PATH)) {
        envContent += 'SWIGGY_CLONE_URL=http://localhost:3003\n';
      }
      
      if (fs.existsSync(BIGBASKET_CLONE_PATH)) {
        envContent += 'BIGBASKET_CLONE_URL=http://localhost:3004\n';
      }
      
      if (fs.existsSync(DUNZO_CLONE_PATH)) {
        envContent += 'DUNZO_CLONE_URL=http://localhost:3005\n';
      }
    }
    
    // Add platform ports if they don't exist
    if (!envContent.includes('BLINKIT_PORT')) {
      envContent += '\n# Platform clone ports\n';
      envContent += 'BLINKIT_PORT=3001\n';
      envContent += 'ZEPTO_PORT=3002\n';
      
      if (fs.existsSync(SWIGGY_CLONE_PATH)) {
        envContent += 'SWIGGY_PORT=3003\n';
      }
      
      if (fs.existsSync(BIGBASKET_CLONE_PATH)) {
        envContent += 'BIGBASKET_PORT=3004\n';
      }
      
      if (fs.existsSync(DUNZO_CLONE_PATH)) {
        envContent += 'DUNZO_PORT=3005\n';
      }
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('Updated .env file with platform clone URLs and ports.');
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Setting up platform clones for PriceWise...');
  
  try {
    // Setup Blinkit Clone (full implementation)
    setupBlinkitClone();
    
    // Setup Zepto Clone (full implementation)
    setupZeptoClone();
    
    // Ask if we should set up other clones
    const setupOthers = process.argv.includes('--all') || process.env.SETUP_ALL_CLONES === 'true';
    
    if (setupOthers) {
      console.log('Setting up additional platform clones...');
      
      // Setup Swiggy Clone (basic implementation)
      setupSwiggyClone();
      
      // Setup BigBasket Clone (basic implementation)
      setupBigBasketClone();
      
      // Setup Dunzo Clone (basic implementation)
      setupDunzoClone();
    }
    
    // Update main package.json with platform clone scripts
    updateMainPackageJson();
    
    // Update .env file with platform clone URLs and ports
    updateEnvFile();
    
    // Install dependencies for platform clones
    await installDependencies();
    
    console.log('\n✅ Setup complete! You can now run the platform clones with:');
    console.log('npm run blinkit-clone     # Starts the Blinkit clone on port 3001');
    console.log('npm run zepto-clone       # Starts the Zepto clone on port 3002');
    
    if (setupOthers) {
      console.log('npm run swiggy-clone      # Starts the Swiggy clone on port 3003');
      console.log('npm run bigbasket-clone   # Starts the BigBasket clone on port 3004');
      console.log('npm run dunzo-clone       # Starts the Dunzo clone on port 3005');
    }
    
    console.log('npm run start:full        # Starts the main app along with all platform clones');
  } catch (error) {
    console.error('Setup failed:', error);
    
    console.log('\n⚠️ Automated setup failed. Please follow these manual steps:');
    console.log('1. Create folders "blinkit-clone" and "zepto-clone"');
    console.log('2. Create a "public" subfolder in each clone folder');
    console.log('3. Copy the necessary files (index.js, package.json, index.html, checkout.html)');
    console.log('4. Run "npm install" in each clone folder');
    console.log('5. Run "npm run start:full" to start all services');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error during setup:', error);
  process.exit(1);
});