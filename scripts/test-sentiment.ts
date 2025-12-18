/**
 * scripts/test-sentiment.ts
 * Unit tests for sentiment detection
 */

import { detectNegativeSentiment, detectAbandonmentSignal, getSentimentSignalType } from '../lib/ai/sentiment';

console.log('🧪 Running Sentiment Detection Tests...\n');

// Test 1: Negative Sentiment Detection
console.log('Test 1: Negative Sentiment Detection');
const negativeMessages = [
    'Olvídalo, que pésimo servicio',
    'Si así funcionas de mal no serían capaces',
    'No me sirve',
    'Muy caro',
];

negativeMessages.forEach(msg => {
    const result = detectNegativeSentiment(msg);
    console.log(`  "${msg}" → ${result ? '✅ DETECTED' : '❌ MISSED'}`);
});

// Test 2: Abandonment Signal Detection
console.log('\nTest 2: Abandonment Signal Detection');
const abandonmentMessages = [
    'Gracias y adiós',
    'No gracias',
    'Olvídalo',
    'Otro momento quizás',
];

abandonmentMessages.forEach(msg => {
    const result = detectAbandonmentSignal(msg);
    console.log(`  "${msg}" → ${result ? '✅ ABANDONMENT' : '❌ NOT ABANDONMENT'}`);
});

// Test 3: Signal Type Classification
console.log('\nTest 3: Signal Type Classification');
const testMessages = [
    { msg: 'Olvídalo, adiós', expected: 'abandonment' },
    { msg: 'Pésimo servicio', expected: 'frustration' },
    { msg: 'Hola, necesito ayuda', expected: null },
];

testMessages.forEach(({ msg, expected }) => {
    const result = getSentimentSignalType(msg);
    const pass = result === expected;
    console.log(`  "${msg}" → ${result} ${pass ? '✅' : '❌'} (expected: ${expected})`);
});

console.log('\n✅ Sentiment detection tests complete!');
