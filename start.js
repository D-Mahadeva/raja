// start.js
// Comprehensive startup script for the application

import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for all services
const services = [
  {
    name: 'Backend Server',
    command: 'node',
    args: ['server.js'],
    color: '\x1b[32m', // Green
    critical: true
  },
  {
    name: 'Frontend Dev Server',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[36m', // Cyan
    critical: true
  },
  {
    name: 'Blinkit Clone',
    command: 'node',
    args: ['blinkit-clone/index.js'],
    color: '\x1b[35m', // Magenta
    optional: true
  },
  {
    name: 'Zepto Clone',
    command: 'node',
    args: ['zepto-clone/index.js'],
    color: '\x1b[33m', // Yellow
    optional: true
  }
];

// ASCII art banner
const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗ ██╗ ██████╗███████╗██╗    ██╗██╗███████╗   ║
║   ██╔══██╗██╔══██╗██║██╔════╝██╔════╝██║    ██║██║██╔════╝   ║
║   ██████╔╝██████╔╝██║██║     █████╗  ██║ █╗ ██║██║███████╗   ║
║   ██╔═══╝ ██╔══██╗██║██║     ██╔══╝  ██║███╗██║██║╚════██║   ║
║   ██║     ██║  ██║██║╚██████╗███████╗╚███╔███╔╝██║███████║   ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝ ╚══╝╚══╝ ╚═╝╚══════╝   ║
║                                                               ║
║   Compare prices across multiple grocery delivery platforms   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Check for required files
const checkRequiredFiles = () => {
  const requiredFiles = [
    { path: 'server.js', message: 'Backend server file not found' },
    { path: 'src/main.tsx', message: 'Frontend entry point not found' },
    { path: 'api-fallback.js', message: 'API fallback plugin not found' },
    { path: 'vite.config.ts', message: 'Vite configuration not found' },
    { path: 'index.html', message: 'HTML template not found' }
  ];
  
  let allFound = true;
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file.path))) {
      console.error('\x1b[31m%s\x1b[0m', `❌ ${file.message}: ${file.path}`);
      allFound = false;
    }
  }
  
  return allFound;
};

// Check for platform clone directories
const checkPlatformClones = () => {
  const blinkit = fs.existsSync(path.join(__dirname, 'blinkit-clone'));
  const zepto = fs.existsSync(path.join(__dirname, 'zepto-clone'));
  
  if (!blinkit || !zepto) {
    console.log('\x1b[33m%s\x1b[0m', 'Running platform clone setup...');
    try {
      exec('node setup-clones.js', (error, stdout, stderr) => {
        if (error) {
          console.error('\x1b[31m%s\x1b[0m', `❌ Error setting up platform clones: ${error.message}`);
        } else {
          console.log('\x1b[32m%s\x1b[0m', '✅ Platform clones setup complete');
        }
      });
    } catch (err) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Error executing platform clone setup: ${err.message}`);
    }
  }
};

// Print ASCII banner
console.log('\x1b[34m%s\x1b[0m', banner); // Blue color

// Print startup information
console.log('\x1b[36m%s\x1b[0m', '🚀 Starting PriceWise application...');
console.log('\x1b[37m%s\x1b[0m', 'Press Ctrl+C to stop all services\n');

// Check required files
const filesOk = checkRequiredFiles();
if (!filesOk) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Some required files are missing. Please fix the issues before continuing.');
  process.exit(1);
}

// Check platform clones
checkPlatformClones();

// Start all services
const processes = [];

services.forEach((service) => {
  try {
    // Skip optional services if directories don't exist
    if (service.optional) {
      const servicePath = service.args[0].split('/')[0];
      if (!fs.existsSync(path.join(__dirname, servicePath))) {
        console.log('\x1b[33m%s\x1b[0m', `⚠️ Skipping ${service.name} - directory not found`);
        return;
      }
    }
    
    console.log(`${service.color}%s\x1b[0m`, `Starting ${service.name}...`);
    
    const proc = spawn(service.command, service.args, {
      stdio: 'pipe',
      shell: true
    });
    
    // Add color-coded prefix to output
    const prefix = `[${service.name}] `;
    
    proc.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`${service.color}${prefix}\x1b[0m ${line.trim()}`);
        }
      });
    });
    
    proc.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`${service.color}${prefix}\x1b[31m${line.trim()}\x1b[0m`);
        }
      });
    });
    
    proc.on('error', (err) => {
      console.error(`${service.color}${prefix}\x1b[31mProcess error: ${err.message}\x1b[0m`);
      if (service.critical) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Critical service ${service.name} failed to start. Exiting...`);
        terminateAllProcesses();
        process.exit(1);
      }
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        console.log(`${service.color}${prefix}\x1b[31m exited with code ${code}\x1b[0m`);
        if (service.critical) {
          console.error('\x1b[31m%s\x1b[0m', `❌ Critical service ${service.name} exited abnormally. Exiting...`);
          terminateAllProcesses();
          process.exit(1);
        }
      } else {
        console.log(`${service.color}${prefix} exited successfully\x1b[0m`);
      }
    });
    
    processes.push(proc);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Failed to start ${service.name}: ${err.message}`);
    if (service.critical) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Critical service ${service.name} failed to start. Exiting...`);
      terminateAllProcesses();
      process.exit(1);
    }
  }
});

// Terminate all processes
const terminateAllProcesses = () => {
  console.log('\n\x1b[36m%s\x1b[0m', '🛑 Shutting down all services...');
  
  // Kill all child processes
  processes.forEach(proc => {
    if (!proc.killed) {
      proc.kill('SIGINT');
    }
  });
  
  console.log('\x1b[32m%s\x1b[0m', '✅ All services stopped');
};

// Handle SIGINT to gracefully shut down all services
process.on('SIGINT', () => {
  terminateAllProcesses();
  process.exit(0);
});

// Display URLs after startup
setTimeout(() => {
  console.log('\n\x1b[36m%s\x1b[0m', '📡 Services running at:');
  console.log('\x1b[37m%s\x1b[0m', '- Frontend: http://localhost:8080');
  console.log('\x1b[37m%s\x1b[0m', '- Backend API: http://localhost:5000/api');
  console.log('\x1b[37m%s\x1b[0m', '- Blinkit Clone: http://localhost:3001');
  console.log('\x1b[37m%s\x1b[0m', '- Zepto Clone: http://localhost:3002');
  console.log('\n\x1b[33m%s\x1b[0m', '🔍 If you see a blank page, try refreshing or check the console for errors');
}, 5000);  // Show URLs after 5 seconds to allow services to start