// debug-frontend.js
// Script to diagnose frontend issues by checking for common problems

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to promise-based
const execAsync = promisify(exec);

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Print with color
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if a file exists
function fileExists(filePath) {
  return fs.existsSync(path.resolve(__dirname, filePath));
}

// Read a file and return its contents
function readFile(filePath) {
  try {
    return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

// Check for common issues
async function diagnoseIssues() {
  log('🔍 Starting Frontend Diagnosis', colors.cyan);
  log('============================', colors.cyan);
  
  let issues = 0;
  
  // 1. Check for required files
  log('\n1. Checking for required files...', colors.blue);
  
  const requiredFiles = [
    { path: 'index.html', description: 'HTML template' },
    { path: 'src/main.tsx', description: 'Main entry point' },
    { path: 'src/App.tsx', description: 'Root React component' },
    { path: 'vite.config.ts', description: 'Vite configuration' },
    { path: 'api-fallback.js', description: 'API fallback plugin' }
  ];
  
  for (const file of requiredFiles) {
    if (fileExists(file.path)) {
      log(`✅ ${file.description} found: ${file.path}`, colors.green);
    } else {
      log(`❌ ${file.description} missing: ${file.path}`, colors.red);
      issues++;
    }
  }
  
  // 2. Check index.html for root element
  log('\n2. Checking index.html for root element...', colors.blue);
  
  const indexHtml = readFile('index.html');
  if (indexHtml) {
    if (indexHtml.includes('<div id="root"></div>')) {
      log('✅ Root element found in index.html', colors.green);
    } else {
      log('❌ Root element missing in index.html', colors.red);
      log('   Add <div id="root"></div> to the body', colors.yellow);
      issues++;
    }
  }
  
  // 3. Check main.tsx for correct React initialization
  log('\n3. Checking main.tsx for correct React initialization...', colors.blue);
  
  const mainTsx = readFile('src/main.tsx');
  if (mainTsx) {
    if (mainTsx.includes('createRoot') && mainTsx.includes('document.getElementById(\'root\')')) {
      log('✅ React initialization looks correct in main.tsx', colors.green);
    } else {
      log('❌ React initialization may be incorrect in main.tsx', colors.red);
      log('   Make sure you\'re using createRoot with the root element', colors.yellow);
      issues++;
    }
  }
  
  // 4. Check vite.config.ts for correct configuration
  log('\n4. Checking vite.config.ts for correct imports...', colors.blue);
  
  const viteConfig = readFile('vite.config.ts');
  if (viteConfig) {
    if (viteConfig.includes('import { apiFallbackPlugin }') && 
        viteConfig.includes('./api-fallback.js')) {
      log('✅ API Fallback import looks correct', colors.green);
    } else {
      log('❌ API Fallback import may be incorrect', colors.red);
      log('   Make sure you have: import { apiFallbackPlugin } from "./api-fallback.js"', colors.yellow);
      issues++;
    }
    
    if (viteConfig.includes('apiFallbackPlugin()')) {
      log('✅ API Fallback plugin is used', colors.green);
    } else {
      log('❌ API Fallback plugin is not properly used', colors.red);
      log('   Make sure you have: apiFallbackPlugin() in the plugins array', colors.yellow);
      issues++;
    }
    
    if (viteConfig.includes('proxy:') && viteConfig.includes('/api')) {
      log('✅ API proxy configuration found', colors.green);
    } else {
      log('❌ API proxy configuration missing', colors.red);
      log('   Make sure you have configured the API proxy to localhost:5000', colors.yellow);
      issues++;
    }
  }
  
  // 5. Check for dependency issues
  log('\n5. Checking for dependency issues...', colors.blue);
  
  try {
    const packageJson = JSON.parse(readFile('package.json') || '{}');
    const hasDeps = packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0;
    
    if (hasDeps) {
      if (packageJson.dependencies.react && packageJson.dependencies['react-dom']) {
        log('✅ React dependencies found', colors.green);
      } else {
        log('❌ React dependencies missing', colors.red);
        issues++;
      }
      
      if (packageJson.dependencies['react-router-dom']) {
        log('✅ React Router dependency found', colors.green);
      } else {
        log('⚠️ React Router dependency might be missing', colors.yellow);
      }
    } else {
      log('❌ No dependencies found in package.json', colors.red);
      issues++;
    }
  } catch (error) {
    log('❌ Error parsing package.json', colors.red);
    issues++;
  }
  
  // 6. Check node_modules
  log('\n6. Checking node_modules...', colors.blue);
  
  if (fileExists('node_modules')) {
    log('✅ node_modules directory found', colors.green);
    
    if (fileExists('node_modules/react') && fileExists('node_modules/react-dom')) {
      log('✅ React modules installed', colors.green);
    } else {
      log('❌ React modules not installed', colors.red);
      log('   Try running: npm install', colors.yellow);
      issues++;
    }
  } else {
    log('❌ node_modules directory missing', colors.red);
    log('   Run: npm install', colors.yellow);
    issues++;
  }
  
  // 7. Check for TypeScript errors
  log('\n7. Checking for TypeScript errors...', colors.blue);
  
  try {
    const { stdout, stderr } = await execAsync('npx tsc --noEmit');
    log('✅ No TypeScript errors found', colors.green);
  } catch (error) {
    log('❌ TypeScript errors found:', colors.red);
    
    // Format the TypeScript errors to be more readable
    const errorLines = error.stderr.split('\n')
      .filter(line => !line.includes('node_modules'))
      .filter(line => line.trim().length > 0)
      .slice(0, 10); // Show only first 10 errors
      
    errorLines.forEach(line => {
      log(`   ${line}`, colors.yellow);
    });
    
    if (errorLines.length === 10) {
      log('   ...more errors omitted', colors.yellow);
    }
    
    issues++;
  }
  
  // 8. Check if backend is running
  log('\n8. Checking if backend is running...', colors.blue);
  
  try {
    const response = await fetch('http://localhost:5000/api/health', { 
      timeout: 5000 
    }).catch(e => null);
    
    if (response?.ok) {
      log('✅ Backend is running and accessible', colors.green);
    } else {
      log('❌ Backend is not responding', colors.red);
      log('   Make sure your backend server is running at http://localhost:5000', colors.yellow);
      issues++;
    }
  } catch (error) {
    log('❌ Error checking backend: ' + error.message, colors.red);
    issues++;
  }
  
  // 9. Check for common API configuration issues
  log('\n9. Checking API configuration...', colors.blue);
  
  const envFile = readFile('.env');
  if (envFile) {
    if (envFile.includes('VITE_API_URL=') && envFile.includes('http://localhost:5000')) {
      log('✅ API URL correctly configured in .env', colors.green);
    } else {
      log('⚠️ API URL may not be correctly configured in .env', colors.yellow);
      log('   Make sure you have: VITE_API_URL=http://localhost:5000/api/products', colors.yellow);
    }
  } else {
    log('⚠️ .env file not found', colors.yellow);
    log('   Consider creating a .env file with API configuration', colors.yellow);
  }
  
  // Final summary
  log('\n============================', colors.cyan);
  if (issues > 0) {
    log(`❌ Found ${issues} potential issues that might cause your blank page`, colors.red);
    log('Please fix the issues above and try again.', colors.yellow);
  } else {
    log('✅ No critical issues found', colors.green);
    log('If you still see a blank page, check your browser console for errors.', colors.yellow);
    log('Try the following:', colors.yellow);
    log('1. Clear browser cache and hard refresh (Ctrl+Shift+R)', colors.white);
    log('2. Check browser console (F12) for specific errors', colors.white);
    log('3. Try a different browser', colors.white);
    log('4. Restart all services with: npm run start', colors.white);
  }
  
  // Provide some next steps
  log('\nNext steps:', colors.cyan);
  log('1. Run `npm run start` to start all services', colors.white);
  log('2. Access frontend at: http://localhost:8080', colors.white);
  log('3. If needed, check logs for specific error messages', colors.white);
}

// Run the diagnostics
diagnoseIssues().catch(error => {
  log(`❌ Error during diagnosis: ${error.message}`, colors.red);
  console.error(error);
});