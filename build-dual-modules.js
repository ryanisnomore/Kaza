#!/usr/bin/env node

/**
 * Build script for dual module support (CommonJS + ES Modules)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Building Kaza with dual module support...');

// Step 1: Build CommonJS version
console.log('📦 1. Building CommonJS version...');
execSync('npx tsc', { stdio: 'inherit' });

// Step 2: Build ES Module version
console.log('📦 2. Building ES Module version...');
execSync('npx tsc -p tsconfig.esm.json', { stdio: 'inherit' });

// Step 3: Create index.mjs for ES module support
console.log('📦 3. Creating ES module entry point...');
const esmIndexContent = fs.readFileSync('./dist/esm/index.js', 'utf8');
fs.writeFileSync('./dist/index.mjs', esmIndexContent);

// Step 4: Rename .js files in ESM to .mjs for proper module detection
console.log('📦 4. Converting ES module files to .mjs...');

function convertJsToMjs(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      convertJsToMjs(filePath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Update relative imports to use .mjs
      const updatedContent = content.replace(
        /from\s+['"]\.\/([^'"]+)\.js['"]/g,
        "from './$1.mjs'"
      ).replace(
        /from\s+['"]\.\.\/([^'"]+)\.js['"]/g,
        "from '../$1.mjs'"
      );
      
      const mjsPath = filePath.replace('.js', '.mjs');
      fs.writeFileSync(mjsPath, updatedContent);
      fs.unlinkSync(filePath);
    }
  });
}

convertJsToMjs('./dist/esm');

// Step 5: Copy package.json with dual export support
console.log('📦 5. Creating package.json with dual exports...');

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Add dual module support
packageJson.main = 'dist/index.js';
packageJson.module = 'dist/index.mjs';
packageJson.types = 'dist/index.d.ts';
packageJson.exports = {
  '.': {
    'import': './dist/index.mjs',
    'require': './dist/index.js',
    'types': './dist/index.d.ts'
  }
};

// Create a build info file
const buildInfo = {
  buildDate: new Date().toISOString(),
  version: packageJson.version,
  nodeVersion: process.version,
  modules: {
    commonjs: 'dist/index.js',
    esmodule: 'dist/index.mjs',
    types: 'dist/index.d.ts'
  },
  features: [
    'CommonJS support',
    'ES Module support',
    'TypeScript definitions',
    'Shoukaku v4.1.1 compatibility',
    'LavaSrc platform support',
    'Intelligent search fallback',
    'Plugin system',
    'Error handling',
    'URL parsing',
    'Queue management'
  ]
};

fs.writeFileSync('./dist/build-info.json', JSON.stringify(buildInfo, null, 2));

console.log('✅ Dual module build complete!');
console.log('📊 Build Summary:');
console.log('   - CommonJS: dist/index.js');
console.log('   - ES Module: dist/index.mjs');
console.log('   - TypeScript: dist/index.d.ts');
console.log('   - Build Info: dist/build-info.json');
console.log('🚀 Ready for npm publication!');