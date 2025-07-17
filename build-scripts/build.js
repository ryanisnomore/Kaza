/**
 * Build script for dual module support (CommonJS + ES Module)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building Kaza with dual module support...');

// Clean previous builds
console.log('Cleaning previous builds...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Create dist directories
fs.mkdirSync('dist', { recursive: true });
fs.mkdirSync('dist/cjs', { recursive: true });
fs.mkdirSync('dist/esm', { recursive: true });
fs.mkdirSync('dist/types', { recursive: true });

try {
  // Build CommonJS
  console.log('Building CommonJS version...');
  execSync('npx tsc -p tsconfig.cjs.json', { stdio: 'inherit' });
  
  // Build ES Module
  console.log('Building ES Module version...');
  execSync('npx tsc -p tsconfig.esm.json', { stdio: 'inherit' });
  
  // Build type definitions
  console.log('Building TypeScript definitions...');
  execSync('npx tsc -p tsconfig.json --declaration --emitDeclarationOnly --outDir dist/types', { stdio: 'inherit' });
  
  // Run post-build tasks
  console.log('Running post-build tasks...');
  execSync('node build-scripts/post-build.js', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
                          }
