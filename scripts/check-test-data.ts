#!/usr/bin/env tsx
/**
 * scripts/check-test-data.ts
 * Debug script to check what's happening with the test lead
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/db';

async function check() {
    // Get the test lead
    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, status, profile')
        .eq('phone_number', '5799999999')
        .single();

    if (!lead) {
        console.log('❌ No test lead found');
        return;
    }

    console.log('📋 Lead:');
    console.log(`   ID: ${lead.id}`);
    console.log(`   Status: ${lead.status}`);
    console.log(`   Profile: ${JSON.stringify(lead.profile, null, 2)}`);

    // Get AI responses
    const { data: logs } = await supabaseAdmin
        .from('audit_logs')
        .select('event_type, payload, created_at')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('\n📊 Audit Logs (last 10):');
    logs?.forEach((log, i) => {
        console.log(`\n${i + 1}. Event: ${log.event_type}`);
        const payload = log.payload as Record<string, unknown>;
        if (payload) {
            console.log(`   Message: ${String(payload.message || '').substring(0, 60)}...`);
            console.log(`   ToolCalls: ${JSON.stringify(payload.toolCalls || [])}`);
            console.log(`   NextState: ${payload.nextState || 'none'}`);
        }
    });

    // Check appointments
    const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('lead_id', lead.id);

    console.log('\n📅 Appointments:', appointments?.length || 0);
    appointments?.forEach(apt => {
        console.log(`   - ${apt.start_time} | Status: ${apt.status}`);
    });

    // Check tool execution logs
    const { data: toolLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('payload, created_at')
        .eq('lead_id', lead.id)
        .eq('event_type', 'tool_execution')
        .order('created_at', { ascending: false });

    console.log('\n🔧 Tool Executions:', toolLogs?.length || 0);
    toolLogs?.forEach(log => {
        const p = log.payload as Record<string, unknown>;
        console.log(`   Tools: ${JSON.stringify(p.toolCalls)}`);
        console.log(`   Results: ${JSON.stringify(p.results)}`);
    });
}

check().catch(console.error);
