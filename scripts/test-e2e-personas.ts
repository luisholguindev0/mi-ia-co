#!/usr/bin/env tsx
/**
 * scripts/test-e2e-personas.ts
 * Main E2E testing script - runs all persona tests
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAllPersonas } from '../lib/testing/personas';
import { runPersonaConversation, type TestResult } from '../lib/testing/orchestrator';
import { sleep } from '../lib/testing/webhook-simulator';
import fs from 'fs';
import path from 'path';

const BATCH_SIZE = 3; // Run 3 personas in parallel
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds

async function main() {
    console.log('🧪 E2E Persona Testing Framework');
    console.log('='.repeat(50));
    console.log('');

    const personas = getAllPersonas();
    console.log(`📋 Loaded ${personas.length} personas`);
    console.log('');

    // Split personas into batches
    const batches: typeof personas[] = [];
    for (let i = 0; i < personas.length; i += BATCH_SIZE) {
        batches.push(personas.slice(i, i + BATCH_SIZE));
    }

    console.log(`🔄 Running ${batches.length} batches (${BATCH_SIZE} parallel per batch)`);
    console.log('');

    const allResults: TestResult[] = [];

    // Run each batch
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📦 Batch ${i + 1}/${batches.length}`);
        console.log('='.repeat(50));

        // Run personas in parallel within batch
        const batchResults = await Promise.all(
            batch.map(persona => runPersonaConversation(persona))
        );

        allResults.push(...batchResults);

        // Print batch summary
        printBatchSummary(batchResults);

        // Wait before next batch (except for last batch)
        if (i < batches.length - 1) {
            console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
            await sleep(DELAY_BETWEEN_BATCHES);
        }
    }

    // Print final summary
    printFinalSummary(allResults);

    // Save detailed report
    saveDetailedReport(allResults);

    // Exit with appropriate code
    const failedCount = allResults.filter(r => !r.success).length;
    process.exit(failedCount > 0 ? 1 : 0);
}

function printBatchSummary(results: TestResult[]) {
    console.log('\n📊 Batch Results:');
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        const duration = (result.duration / 1000).toFixed(1);
        console.log(`   ${icon} ${result.persona.name} (${result.turnCount} turns, ${duration}s)`);

        if (!result.success) {
            Object.entries(result.validations).forEach(([key, val]) => {
                if (!val.passed) {
                    console.log(`      ⚠️  ${key}: ${val.message}`);
                }
            });
        }
    });
}

function printFinalSummary(results: TestResult[]) {
    console.log('\n\n' + '='.repeat(50));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(50));

    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`   📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
        console.log('\n🚨 Failed Tests:');
        results
            .filter(r => !r.success)
            .forEach(result => {
                console.log(`\n   ❌ ${result.persona.name} (${result.persona.id})`);
                console.log(`      Expected: ${result.persona.expectedOutcome}`);

                if (result.error) {
                    console.log(`      Error: ${result.error}`);
                }

                console.log(`      Validations:`);
                Object.entries(result.validations).forEach(([key, val]) => {
                    const icon = val.passed ? '✅' : '❌';
                    console.log(`         ${icon} ${key}: ${val.message}`);
                });
            });
    }

    console.log('\n' + '='.repeat(50));
}

function saveDetailedReport(results: TestResult[]) {
    const reportPath = path.join(process.cwd(), 'test-results.json');

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: results.length,
            passed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
        },
        results: results.map(r => ({
            personaId: r.persona.id,
            personaName: r.persona.name,
            success: r.success,
            turnCount: r.turnCount,
            duration: r.duration,
            expectedOutcome: r.persona.expectedOutcome,
            conversationLog: r.conversationLog,
            validations: r.validations,
            error: r.error,
        })),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
