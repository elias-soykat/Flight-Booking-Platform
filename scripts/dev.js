#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(prefix, color, message) {
  const lines = message.toString().split('\n');
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${color}${prefix}${colors.reset} ${line}`);
    }
  }
}

console.log(`${colors.green}=== Starting Travel Booking Platform MVP Locally ===${colors.reset}`);
console.log(`${colors.yellow}API Backend: http://127.0.0.1:8787${colors.reset}`);
console.log(`${colors.yellow}Frontend Web: http://localhost:3000${colors.reset}\n`);

const env = {
  ...process.env,
  XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME || '/tmp/.config',
  XDG_CACHE_HOME: process.env.XDG_CACHE_HOME || '/tmp/.cache',
};

// Start Backend API (Cloudflare Worker via Wrangler)
const apiProcess = spawn('npx', ['wrangler', 'dev', '--port', '8787', '--ip', '127.0.0.1'], {
  cwd: path.resolve(rootDir, 'apps/api'),
  env,
  shell: false,
  stdio: ['pipe', 'pipe', 'pipe'],
});

apiProcess.stdout?.on('data', (data) => log('[api]', colors.cyan, data));
apiProcess.stderr?.on('data', (data) => log('[api]', colors.cyan, data));

// Start Frontend Web (Vite Dev Server)
const webProcess = spawn('npx', ['vite', '--port', '3000', '--host'], {
  cwd: path.resolve(rootDir, 'apps/web'),
  env,
  shell: false,
  stdio: ['pipe', 'pipe', 'pipe'],
});

webProcess.stdout?.on('data', (data) => log('[web]', colors.magenta, data));
webProcess.stderr?.on('data', (data) => log('[web]', colors.magenta, data));

let isShuttingDown = false;
function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${colors.yellow}Shutting down all development servers...${colors.reset}`);
  try {
    apiProcess.kill('SIGTERM');
  } catch {}
  try {
    webProcess.kill('SIGTERM');
  } catch {}
  setTimeout(() => process.exit(exitCode), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', () => shutdown(0));

apiProcess.on('exit', (code) => {
  if (!isShuttingDown && code !== 0) {
    console.error(`${colors.red}[api] exited with code ${code}${colors.reset}`);
  }
});

webProcess.on('exit', (code) => {
  if (!isShuttingDown && code !== 0) {
    console.error(`${colors.red}[web] exited with code ${code}${colors.reset}`);
  }
});
