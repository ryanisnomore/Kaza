/**
 * Post-build script to fix module imports and add package.json files
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running post-build tasks...');

/**
 * Add package.json files for proper module resolution
 */
function addPackageJsonFiles() {
  // Add package.json for CommonJS
  const cjsPackage = {
    "type": "commonjs"
  };
  
  fs.writeFileSync(
    path.join('dist', 'cjs', 'package.json'),
    JSON.stringify(cjsPackage, null, 2)
  );
  
  // Add package.json for ES Module
  const esmPackage = {
    "type": "module"
  };
  
  fs.writeFileSync(
    path.join('dist', 'esm', 'package.json'),
    JSON.stringify(esmPackage, null, 2)
  );
  
  console.log('📄 Added package.json files for module resolution');
}

/**
 * Fix file extensions for ES modules
 */
function fixEsModuleExtensions() {
  const esmDir = path.join('dist', 'esm');
  
  function processDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        processDirectory(itemPath);
      } else if (item.endsWith('.js')) {
        let content = fs.readFileSync(itemPath, 'utf8');
        
        // Fix relative imports to include .js extension
        content = content.replace(
          /from\s+['"](\.\.?\/[^'"]*?)(?<!\.js)['"]/g,
          'from "$1.js"'
        );
        
        content = content.replace(
          /import\s+['"](\.\.?\/[^'"]*?)(?<!\.js)['"]/g,
          'import "$1.js"'
        );
        
        fs.writeFileSync(itemPath, content);
      }
    }
  }
  
  if (fs.existsSync(esmDir)) {
    processDirectory(esmDir);
    console.log('🔧 Fixed ES module file extensions');
  }
}

/**
 * Copy additional files
 */
function copyAdditionalFiles() {
  const filesToCopy = [
    'README.md',
    'LICENCE.md'
  ];
  
  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
      console.log(`📄 Copied ${file}`);
    }
  }
}

/**
 * Validate build output
 */
function validateBuild() {
  const requiredFiles = [
    'dist/cjs/index.js',
    'dist/esm/index.js',
    'dist/types/index.d.ts',
    'dist/cjs/package.json',
    'dist/esm/package.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  console.log('✅ Build validation passed');
}

/**
 * Generate build info
 */
function generateBuildInfo() {
  const buildInfo = {
    buildTime: new Date().toISOString(),
    version: require('../package.json').version,
    modules: {
      commonjs: 'dist/cjs/index.js',
      esmodule: 'dist/esm/index.js',
      types: 'dist/types/index.d.ts'
    }
  };
  
  fs.writeFileSync(
    path.join('dist', 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  console.log('📊 Generated build info');
}

try {
  addPackageJsonFiles();
  fixEsModuleExtensions();
  copyAdditionalFiles();
  validateBuild();
  generateBuildInfo();
  
  console.log('✅ Post-build tasks completed successfully!');
  
} catch (error) {
  console.error('❌ Post-build tasks failed:', error.message);
  process.exit(1);
}
