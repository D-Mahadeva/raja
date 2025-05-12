// kill-port.js
// This script helps you identify and optionally kill processes using a specific port

import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);
const PORT = process.env.PORT || 5000;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to find process using a specific port
async function findProcessUsingPort(port) {
  try {
    let command;
    let processInfo = null;
    
    // Different commands based on operating system
    if (process.platform === 'win32') {
      // Windows
      command = `netstat -ano | findstr :${port}`;
      const { stdout } = await execAsync(command);
      
      if (stdout) {
        // Parse the output to extract PID
        const lines = stdout.split('\n').filter(Boolean);
        const lineWithPort = lines.find(line => line.includes(`:${port}`));
        
        if (lineWithPort) {
          const parts = lineWithPort.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          // Get the process name using the PID
          const { stdout: processStdout } = await execAsync(`tasklist /fi "PID eq ${pid}" /fo list`);
          const processName = processStdout.match(/Image Name:\s+(.+)/)?.[1] || 'Unknown';
          
          processInfo = { pid, name: processName };
        }
      }
    } else {
      // Unix-like (macOS, Linux)
      command = `lsof -i :${port} -P -n`;
      const { stdout } = await execAsync(command);
      
      if (stdout) {
        const lines = stdout.split('\n').filter(Boolean);
        if (lines.length > 1) { // Skip header line
          const parts = lines[1].split(/\s+/);
          const processName = parts[0];
          const pid = parts[1];
          
          processInfo = { pid, name: processName };
        }
      }
    }
    
    return processInfo;
  } catch (error) {
    console.error(`Error finding process: ${error.message}`);
    return null;
  }
}

// Function to kill process by PID
async function killProcess(pid) {
  try {
    let command;
    
    if (process.platform === 'win32') {
      // Windows
      command = `taskkill /F /PID ${pid}`;
    } else {
      // Unix-like
      command = `kill -9 ${pid}`;
    }
    
    await execAsync(command);
    console.log(`Process with PID ${pid} has been terminated.`);
    return true;
  } catch (error) {
    console.error(`Error killing process: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`Checking which process is using port ${PORT}...`);
  
  const processInfo = await findProcessUsingPort(PORT);
  
  if (processInfo) {
    console.log(`Found process using port ${PORT}:`);
    console.log(`  Process Name: ${processInfo.name}`);
    console.log(`  Process ID (PID): ${processInfo.pid}`);
    
    rl.question('Do you want to terminate this process? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        const success = await killProcess(processInfo.pid);
        if (success) {
          console.log(`You can now use port ${PORT} for your application.`);
        } else {
          console.log('Failed to terminate the process. You may need administrator privileges.');
        }
      } else {
        console.log('Process not terminated.');
      }
      rl.close();
    });
  } else {
    console.log(`No process found using port ${PORT}.`);
    rl.close();
  }
}

main();