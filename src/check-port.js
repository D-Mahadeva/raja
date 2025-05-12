// check-port.js
import net from 'net';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Default port from environment or fallback
const DEFAULT_PORT = parseInt(process.env.PORT) || 5000;
const MAX_PORT_TO_TRY = DEFAULT_PORT + 10; // Try up to 10 ports higher if needed

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying another...`);
        resolve(false);
      } else {
        console.log(`Error checking port ${port}: ${err.message}`);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      // Close the server immediately
      server.close(() => {
        resolve(true);
      });
    });
    
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Find an available port starting from the given port
 * @param {number} startPort - Starting port to check from
 * @param {number} endPort - Last port to try
 * @returns {Promise<number|null>} - Available port or null if none found
 */
async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Update .env file with new port
 * @param {number} port - New port to set
 */
function updateEnvFile(port) {
  try {
    const envPath = './.env';
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if PORT is already defined
      if (envContent.includes('PORT=')) {
        // Replace existing PORT line
        envContent = envContent.replace(/PORT=\d+/g, `PORT=${port}`);
      } else {
        // Add PORT line at the end
        envContent += `\nPORT=${port}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`Updated .env file with new PORT=${port}`);
    } else {
      // Create new .env file with PORT only
      fs.writeFileSync(envPath, `PORT=${port}\n`);
      console.log(`Created .env file with PORT=${port}`);
    }
  } catch (error) {
    console.error(`Error updating .env file: ${error.message}`);
  }
}

async function checkAndUpdatePort() {
  console.log(`Checking availability of default port ${DEFAULT_PORT}...`);
  
  let availablePort;
  
  // First check if the default port is available
  if (await isPortAvailable(DEFAULT_PORT)) {
    console.log(`Default port ${DEFAULT_PORT} is available`);
    return DEFAULT_PORT;
  }
  
  // If not, search for an available port
  console.log(`Default port ${DEFAULT_PORT} is not available, searching for an alternative...`);
  availablePort = await findAvailablePort(DEFAULT_PORT + 1, MAX_PORT_TO_TRY);
  
  if (availablePort) {
    console.log(`Found available port: ${availablePort}`);
    
    // Update .env file with the new port
    updateEnvFile(availablePort);
    
    return availablePort;
  } else {
    console.error(`No available ports found in range ${DEFAULT_PORT + 1}-${MAX_PORT_TO_TRY}`);
    return null;
  }
}

// Run the check if this file is executed directly
if (process.argv[1].includes('check-port.js')) {
  checkAndUpdatePort()
    .then(port => {
      if (port) {
        console.log(`✅ Port check completed. Use PORT=${port}`);
        process.exit(0);
      } else {
        console.error('❌ Failed to find an available port');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

export default checkAndUpdatePort;