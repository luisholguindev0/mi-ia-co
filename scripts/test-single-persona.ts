#!/usr/bin/env tsx
/**
 * scripts/test-single-persona.ts
 * Run a single persona test for debugging booking flow
 * Usage: npx tsx scripts/test-single-persona.ts [scenario-id]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/db';
import { getAllScenarios } from '../lib/testing/scenarios';
import { runPersonaConversation, type TestResult } from '../lib/testing/test-orchestrator';
import { sleep } from '../lib/testing/webhook-simulator';

async function cleanupSingleTestData(phoneNumber: string) {
    console.log(`\n🧹 Cleaning up test data for ${phoneNumber}...`);

    try {
        // Get lead ID for this phone number
        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('phone_number', phoneNumber)
            .single();

        if (lead) {
            // Delete dependent records first
            await supabaseAdmin.from('audit_logs').delete().eq('lead_id', lead.id);
            await supabaseAdmin.from('messages').delete().eq('lead_id', lead.id);
            await supabaseAdmin.from('appointments').delete().eq('lead_id', lead.id);
            await supabaseAdmin.from('leads').delete().eq('id', lead.id);
            console.log(`   ✅ Cleaned lead ${lead.id} and all related data`);
        } else {
            console.log(`   ℹ️  No existing data found for ${phoneNumber}`);
        }

        await sleep(1000);
    } catch (error) {
        console.error('   ❌ Cleanup exception:', error);
    }
}

async function runSingleTest(scenarioId: string) {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║ 🧪 SINGLE PERSONA TEST - DEBUGGING MODE                  ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Find the scenario
    const scenarios = getAllScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (!scenario) {
        console.error(`❌ Scenario "${scenarioId}" not found`);
        console.log('\nAvailable scenarios:');
        scenarios.forEach(s => console.log(`   - ${s.id}: ${s.name}`));
        process.exit(1);
    }

    console.log(`📋 Running scenario: ${scenario.id}`);
    console.log(`   Name: ${scenario.name}`);
    console.log(`   Phone: ${scenario.phoneNumber}`);
    console.log(`   Expected: ${scenario.expectedOutcome}`);

    // Step 1: Cleanup
    await cleanupSingleTestData(scenario.phoneNumber);

    // Step 2: Run the test with more turns for observation
    console.log('\n🚀 Starting conversation...\n');
    console.log('─'.repeat(70));

    const result = await runPersonaConversation(scenario, 20);

    console.log('─'.repeat(70));

    // Step 3: Display detailed results
    console.log('\n\n📊 DETAILED RESULTS');
    console.log('═'.repeat(70));

    console.log(`\n✅ Success: ${result.success}`);
    console.log(`📝 Turns: ${result.turnCount}`);
    console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`🎯 Expected Outcome: ${result.expectedOutcome}`);

    if (result.error) {
        console.log(`❌ Error: ${result.error}`);
    }

    // Validations
    console.log('\n📋 VALIDATIONS:');
    console.log(`   Lead Created: ${result.validations.leadCreated?.passed ? '✅' : '❌'} ${result.validations.leadCreated?.message}`);
    console.log(`   Messages Saved: ${result.validations.messagesSaved?.passed ? '✅' : '❌'} ${result.validations.messagesSaved?.message}`);
    console.log(`   Appointment Booked: ${result.validations.appointmentBooked?.passed ? '✅' : '❌'} ${result.validations.appointmentBooked?.message}`);
    console.log(`   Conversation Quality: ${result.validations.conversationQuality?.passed ? '✅' : '❌'} ${result.validations.conversationQuality?.message}`);

    // Show conversation log
    console.log('\n📜 CONVERSATION LOG:');
    console.log('─'.repeat(70));
    result.conversationLog.forEach((msg, i) => {
        const icon = msg.role === 'user' ? '👤' : '🤖';
        console.log(`${icon} [${msg.role.toUpperCase()}]: ${msg.content}`);
        console.log('');
    });

    // Check database for actual results
    console.log('\n🔍 DATABASE VERIFICATION:');
    console.log('─'.repeat(70));

    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, status, profile, lead_score')
        .eq('phone_number', scenario.phoneNumber)
        .single();

    if (lead) {
        console.log(`   Lead ID: ${lead.id}`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Lead Score: ${lead.lead_score}`);
        console.log(`   Profile: ${JSON.stringify(lead.profile, null, 2)}`);

        // Check messages
        const { count: msgCount } = await supabaseAdmin
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('lead_id', lead.id);
        console.log(`   Messages in DB: ${msgCount}`);

        // Check appointments
        const { data: appointments } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .eq('lead_id', lead.id);
        console.log(`   Appointments: ${appointments?.length || 0}`);
        if (appointments && appointments.length > 0) {
            appointments.forEach(apt => {
                console.log(`      📅 ${apt.start_time} - ${apt.status}`);
            });
        }

        // Check audit logs for tool calls
        const { data: toolLogs } = await supabaseAdmin
            .from('audit_logs')
            .select('event_type, payload, created_at')
            .eq('lead_id', lead.id)
            .eq('event_type', 'tool_execution')
            .order('created_at', { ascending: true });

        console.log(`   Tool Executions: ${toolLogs?.length || 0}`);
        if (toolLogs && toolLogs.length > 0) {
            toolLogs.forEach(log => {
                const payload = log.payload as { toolCalls?: { tool: string }[], results?: { tool: string, success: boolean }[] };
                const tools = payload?.toolCalls?.map((t: { tool: string }) => t.tool).join(', ') || 'none';
                const results = payload?.results?.map((r: { tool: string, success: boolean }) => `${r.tool}:${r.success ? '✓' : '✗'}`).join(', ') || 'none';
                console.log(`      🔧 Tools: ${tools} → ${results}`);
            });
        }
    } else {
        console.log('   ❌ No lead found in database!');
    }

    console.log('\n' + '═'.repeat(70));
    console.log(result.success ? '✅ TEST PASSED' : '❌ TEST FAILED');
    console.log('═'.repeat(70) + '\n');

    return result;
}

// Get scenario ID from command line or default to happy-path-eager
const scenarioId = process.argv[2] || 'happy-path-eager';

runSingleTest(scenarioId)
    .then((result) => {
        process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
