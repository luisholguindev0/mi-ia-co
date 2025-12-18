/**
 * scripts/test-tools-harden.ts
 * Verifies that tools don't crash on invalid input
 */

import dotenv from 'dotenv';
import path from 'path';

// Load env BEFORE imports that use it
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { executeToolCalls } from '../lib/ai/executor';

// Mock lead
const mockLead = {
    id: 'test-lead-id',
    phone_number: '573000000000',
    profile: { name: 'Test User' },
    status: 'new',
    lead_score: 50,
    ai_paused: false
};

async function testHarden() {
    console.log('🧪 Testing Tool Hardening...');

    // Test 1: checkAvailability without date
    console.log('\n--- Test 1: Missing Date ---');
    const res1 = await executeToolCalls([{
        tool: 'checkAvailability',
        args: {} // Missing date
    }], mockLead.id, mockLead);
    console.log('Result 1:', JSON.stringify(res1, null, 2));

    if (res1[0].success === false && res1[0].error?.includes('proporciona una fecha')) {
        console.log('✅ Test 1 Passed: Handled missing date gracefully');
    } else {
        console.error('❌ Test 1 Failed: Did not return expected error');
    }

    // Test 2: checkAvailability with invalid date
    console.log('\n--- Test 2: Invalid Date ---');
    const res2 = await executeToolCalls([{
        tool: 'checkAvailability',
        args: { date: 'tomorrow' } // Invalid format
    }], mockLead.id, mockLead);
    console.log('Result 2:', JSON.stringify(res2, null, 2));

    if (res2[0].success === false && res2[0].error?.includes('Formato de fecha inválido')) {
        console.log('✅ Test 2 Passed: Handled invalid date gracefully');
    } else {
        console.error('❌ Test 2 Failed: Did not return expected error');
    }
}

testHarden();
