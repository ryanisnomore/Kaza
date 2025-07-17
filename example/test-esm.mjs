/**
 * Test ES Module import for Kaza
 */

import { Kaza, KazagumoPlayer, URLParser, ErrorCode } from '../dist/index.mjs';

console.log('🔥 Testing Kaza ES Module Import');
console.log('=================================');

console.log('✅ ES Module import successful');
console.log('   - Kaza:', typeof Kaza);
console.log('   - KazagumoPlayer:', typeof KazagumoPlayer);
console.log('   - URLParser:', typeof URLParser);
console.log('   - ErrorCode keys:', Object.keys(ErrorCode).length);

// Test URL Parser with ES modules
const parser = new URLParser();
const testUrl = parser.parseURL('https://music.youtube.com/watch?v=dQw4w9WgXcQ');
console.log('   - YouTube Music parsing:', testUrl.platform, testUrl.type);

console.log('🎉 ES Module test completed successfully!');