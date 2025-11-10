#!/usr/bin/env node

/**
 * Verification script for asterisk parsing fix
 * 
 * This script demonstrates that the formatAIResponse function correctly handles:
 * 1. Multiple asterisks at the end (word*** -> **word**)
 * 2. Missing opening asterisks (word** -> **word**)
 * 3. Properly formatted words (no changes)
 * 
 * Run with: node scripts/verify-asterisk-fix.js
 */

// Simple implementation matching the fixed version
function formatAIResponse(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove numbering from start
      return line.replace(/^(?:[\d]+[).\s]+|[-*]\s+)/, '');
    })
    .map(line => {
      // First fix: **part**rest** -> **partrest**
      line = line.replace(/\*\*([^*\s]+)\*\*([^\s*]+)\*\*/g, '**$1$2**');
      
      // Second fix: part**rest** -> partrest
      line = line.replace(/([^\s*])\*\*([^\s*]+)\*\*/g, '$1$2');
      
      // Third fix: normalize multiple asterisks (3+) to exactly 2
      line = line.replace(/([^\s*]+)\*{3,}/g, '$1**');
      
      // Fourth fix: add opening ** to words that only have closing **
      line = line.replace(/([^\s*]+)\*\*/g, (match, word, offset) => {
        const before = line.substring(Math.max(0, offset - 2), offset);
        if (before === '**' || word.startsWith('**')) {
          return match;
        }
        return `**${word}**`;
      });
      
      return line;
    });
}

// Test cases
const testCases = [
  { 
    name: 'Multiple asterisks (3)',
    input: 'The word*** is here',
    expected: 'The **word** is here'
  },
  { 
    name: 'Multiple asterisks (4+)',
    input: 'word****',
    expected: '**word**'
  },
  { 
    name: 'Missing opening asterisks',
    input: 'They visit** many countries',
    expected: 'They **visit** many countries'
  },
  { 
    name: 'Properly formatted (no change)',
    input: 'They **visit** many countries',
    expected: 'They **visit** many countries'
  },
  { 
    name: 'Multiple words with issues',
    input: 'I think** she knows**',
    expected: 'I **think** she **knows**'
  },
  { 
    name: 'With translation',
    input: 'I think** she knows** - Я думаю, она знает',
    expected: 'I **think** she **knows** - Я думаю, она знает'
  },
  { 
    name: 'With hints',
    input: 'They visited** (visit, visited)',
    expected: 'They **visited** (visit, visited)'
  }
];

console.log('🔍 Verifying Asterisk Parsing Fix\n');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = formatAIResponse(testCase.input);
  const actual = result[0];
  const success = actual === testCase.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${testCase.name}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${testCase.name}`);
    console.log(`   Input:    "${testCase.input}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Actual:   "${actual}"`);
  }
});

console.log('='.repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('✨ All tests passed! The fix is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
