#!/usr/bin/env tsx
/**
 * scripts/run-intelligent-tests.ts
 * Main test runner with data cleanup and comprehensive reporting
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/db';
import { getAllScenarios } from '../lib/testing/scenarios';
import { runPersonaConversation, type TestResult } from '../lib/testing/test-orchestrator';
import { sleep } from '../lib/testing/webhook-simulator';
import * as fs from 'fs';
import * as path from 'path';

interface TestSummary {
    timestamp: string;
    totalScenarios: number;
    passed: number;
    failed: number;
    totalDuration: number;
    successRate: string;
    results: TestResult[];
    criticalIssues: string[];
}

async function cleanupTestData() {
    console.log('\n🧹 Cleaning up previous test data...');

    try {
        // Get all test phone numbers
        const testPhoneNumbers = getAllScenarios().map(s => s.phoneNumber);

        // Delete test leads and cascade delete everything
        // First, get lead IDs for these phone numbers to clean up audit_logs
        const { data: leads } = await supabaseAdmin
            .from('leads')
            .select('id')
            .in('phone_number', testPhoneNumbers);

        if (leads && leads.length > 0) {
            const leadIds = leads.map(l => l.id);
            // Delete dependent records first
            await supabaseAdmin.from('messages').delete().in('lead_id', leadIds);
            await supabaseAdmin.from('appointments').delete().in('lead_id', leadIds);
            await supabaseAdmin
                .from('audit_logs')
                .delete()
                .in('lead_id', leadIds);
        }

        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .in('phone_number', testPhoneNumbers);

        if (error) {
            console.error('   ⚠️ Cleanup error:', error.message);
        } else {
            console.log('   ✅ Test data cleaned successfully');
        }

        // Wait for DB to settle
        await sleep(2000);
    } catch (error) {
        console.error('   ❌ Cleanup exception:', error);
    }
}

async function runTests() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║ 🧪 INTELLIGENT E2E TESTING FRAMEWORK                   ║');
    console.log('║    Production-Grade Persona AI with DeepSeek           ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Step 1: Cleanup
    await cleanupTestData();

    // Step 2: Load scenarios
    const scenarios = getAllScenarios();
    console.log(`📋 Loaded ${scenarios.length} test scenarios\n`);

    // Step 3: Run tests sequentially for now (to avoid rate limits)
    console.log('🔄 Running tests SEQUENTIALLY (1 at a time for better observation)\n');

    const results: TestResult[] = [];
    const startTime = Date.now();

    for (const scenario of scenarios) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📦 Scenario: ${scenario.id}`);
        console.log(`${'='.repeat(70)}`);

        const result = await runPersonaConversation(scenario, 15);
        results.push(result);

        // Display result
        const statusIcon = result.success ? '✅' : '❌';
        console.log(`\n${statusIcon} ${scenario.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
        console.log(`   Turns: ${result.turnCount} | Duration: ${(result.duration / 1000).toFixed(1)}s`);

        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }

        // Wait between scenarios to avoid overwhelming system
        if (scenarios.indexOf(scenario) < scenarios.length - 1) {
            console.log('\n⏳ Waiting 10s before next scenario...');
            await sleep(10000);
        }
    }

    const totalDuration = Date.now() - startTime;

    // Step 4: Generate summary
    const summary = generateSummary(results, totalDuration);

    // Step 5: Save results
    saveResults(summary);

    // Step 6: Display summary
    displaySummary(summary);

    return summary;
}

function generateSummary(results: TestResult[], totalDuration: number): TestSummary {
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const successRate = ((passed / results.length) * 100).toFixed(1);

    // Identify critical issues
    const criticalIssues: string[] = [];

    // Check for AI stuck in loops
    const loopIssues = results.filter(r =>
        r.validations.conversationQuality?.details?.metrics?.aiRepetitiveQuestions > 3
    );
    if (loopIssues.length > 0) {
        criticalIssues.push(`AI stuck in loop (${loopIssues.length} scenarios)`);
    }

    // Check for zero bookings on "books" scenarios
    const booksScenarios = results.filter(r => r.expectedOutcome === 'books');
    const successfulBookings = booksScenarios.filter(r => r.validations.appointmentBooked?.passed);
    if (successfulBookings.length === 0 && booksScenarios.length > 0) {
        criticalIssues.push('ZERO successful bookings on all "books" scenarios');
    }

    return {
        timestamp: new Date().toISOString(),
        totalScenarios: results.length,
        passed,
        failed,
        totalDuration,
        successRate: `${successRate}%`,
        results,
        criticalIssues,
    };
}

function saveResults(summary: TestSummary) {
    const reportPath = path.join(process.cwd(), 'test-results-intelligent.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
}

function displaySummary(summary: TestSummary) {
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));
    console.log(`\n📈 Results:`);
    console.log(`   Total Scenarios: ${summary.totalScenarios}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⏱️  Total Duration: ${(summary.totalDuration / 1000).toFixed(1)}s`);
    console.log(`   📊 Success Rate: ${summary.successRate}`);

    if (summary.criticalIssues.length > 0) {
        console.log(`\n🚨 CRITICAL ISSUES:`);
        summary.criticalIssues.forEach(issue => {
            console.log(`   ❌ ${issue}`);
        });
    }

    // Break down by outcome
    const bookingScenarios = summary.results.filter(r => r.expectedOutcome === 'books');
    const abandonScenarios = summary.results.filter(r => r.expectedOutcome === 'abandons');
    const researchScenarios = summary.results.filter(r => r.expectedOutcome === 'researching');

    console.log(`\n📊 By Expected Outcome:`);
    console.log(`   Books (${bookingScenarios.length}): ${bookingScenarios.filter(r => r.success).length} passed`);
    console.log(`   Abandons (${abandonScenarios.length}): ${abandonScenarios.filter(r => r.success).length} passed`);
    console.log(`   Researching (${researchScenarios.length}): ${researchScenarios.filter(r => r.success).length} passed`);

    // Show booking success rate
    const successfulBookings = bookingScenarios.filter(r => r.validations.appointmentBooked?.passed);
    const bookingSuccessRate = bookingScenarios.length > 0
        ? ((successfulBookings.length / bookingScenarios.length) * 100).toFixed(1)
        : '0.0';
    console.log(`\n📅 Booking Success Rate: ${bookingSuccessRate}% (${successfulBookings.length}/${bookingScenarios.length})`);

    console.log('\n' + '='.repeat(70) + '\n');
}

// Run tests
runTests()
    .then(() => {
        console.log('✅ Test suite completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
