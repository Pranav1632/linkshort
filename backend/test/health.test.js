const assert = require('assert');
const { generateShortCode } = require('../src/utils/codeGenerator');

console.log('🧪 Running LinkShort Automated Test Suite...\n');

// Test 1: Code Generator Length
console.log('Test 1: Code generator length matches requested length');
const code6 = generateShortCode(6);
assert.strictEqual(code6.length, 6, 'Generated code should be 6 characters');
console.log('  ✅ Passed (Length = 6)');

// Test 2: Code Generator Uniqueness
console.log('Test 2: Code generator produces unique values');
const codeA = generateShortCode(8);
const codeB = generateShortCode(8);
assert.notStrictEqual(codeA, codeB, 'Consecutive generated codes should be unique');
console.log(`  ✅ Passed (${codeA} !== ${codeB})`);

// Test 3: Base62 Character Range
console.log('Test 3: Code generator contains valid base62 characters');
assert.match(codeA, /^[a-zA-Z0-9]+$/, 'Codes must only contain alphanumeric characters');
console.log('  ✅ Passed (Alphanumeric regex satisfied)');

console.log('\n🎉 All unit tests passed successfully!\n');
process.exit(0);
