#!/usr/bin/env tsx
/**
 * scripts/test-booking.ts
 * 
 * CLEAN 1-PERSONA TEST
 * AI customer books an appointment with the sales bot
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';
import { supabaseAdmin } from '../lib/db';
import { format, addDays } from 'date-fns';

const TEST_PHONE = '5700000001';
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mi-ia-co-blush.vercel.app';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY!,
});

// Simple customer - wants to book ASAP
const CUSTOMER_GOAL = `
Eres Carlos, dueño de una panadería. Quieres agendar una demo AHORA.

REGLAS ESTRICTAS:
1. Si te preguntan sobre tu negocio: "Tengo una panadería, pierdo pedidos"
2. Si te preguntan tu nombre: "Carlos"
3. Cuando mencionen agendar: "Quiero agendar para el lunes a las 10am"
4. Si confirman la cita: "Perfecto, gracias"
5. RESPUESTAS DE 1 LINEA MÁXIMO

Historial:
{{HISTORY}}

Tu respuesta (1 línea):
`;

async function cleanup() {
    console.log('\n🧹 Limpiando datos de prueba...');

    const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('id')
        .like('phone_number', '570000000%');

    if (leads && leads.length > 0) {
        for (const lead of leads) {
            await supabaseAdmin.from('audit_logs').delete().eq('lead_id', lead.id);
            await supabaseAdmin.from('messages').delete().eq('lead_id', lead.id);
            await supabaseAdmin.from('appointments').delete().eq('lead_id', lead.id);
            await supabaseAdmin.from('leads').delete().eq('id', lead.id);
        }
        console.log(`   ✅ Eliminados ${leads.length} leads de prueba`);
    } else {
        console.log('   ℹ️  Sin datos previos');
    }
}

async function sendMessage(text: string): Promise<void> {
    const payload = {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'test',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { phone_number_id: 'test' },
                    messages: [{
                        id: `test_${Date.now()}`,
                        from: TEST_PHONE,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        type: 'text',
                        text: { body: text }
                    }],
                    contacts: [{ profile: { name: 'Carlos Test' }, wa_id: TEST_PHONE }]
                },
                field: 'messages'
            }]
        }]
    };

    const response = await fetch(`${WEBHOOK_URL}/api/webhook/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
    }
}

async function waitForAIResponse(lastContent?: string): Promise<string | null> {
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 6000));

        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('phone_number', TEST_PHONE)
            .single();

        if (!lead) continue;

        const { data: messages } = await supabaseAdmin
            .from('messages')
            .select('content')
            .eq('lead_id', lead.id)
            .eq('role', 'assistant')
            .order('created_at', { ascending: false })
            .limit(1);

        if (messages?.[0]?.content && messages[0].content !== lastContent) {
            return messages[0].content;
        }
    }
    return null;
}

async function generateCustomerResponse(history: string[]): Promise<string> {
    const historyText = history.join('\n');
    const prompt = CUSTOMER_GOAL.replace('{{HISTORY}}', historyText || 'Inicio');

    const { text } = await generateText({
        model: deepseek('deepseek-chat'),
        prompt,
        temperature: 0.5,
    });

    return text.trim().split('\n')[0]; // Only first line
}

async function verifyBooking(): Promise<{ success: boolean; appointment?: unknown }> {
    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, status')
        .eq('phone_number', TEST_PHONE)
        .single();

    if (!lead) return { success: false };

    const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('lead_id', lead.id)
        .eq('status', 'confirmed');

    if (appointments && appointments.length > 0) {
        return { success: true, appointment: appointments[0] };
    }

    // Check for any appointment (even unconfirmed/cancelled for debugging)
    const { data: allApt } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('lead_id', lead.id);

    if (allApt && allApt.length > 0) {
        console.log('   ⚠️  Appointment found but not confirmed:', allApt[0].status);
        return { success: false, appointment: allApt[0] };
    }

    return { success: false };
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║ 🧪 CLEAN BOOKING TEST - 1 PERSONA                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log(`📍 Target: ${WEBHOOK_URL}`);
    console.log(`📱 Test Phone: ${TEST_PHONE}`);

    await cleanup();

    const history: string[] = [];
    let lastAI = '';

    // Turn 1: Initial message
    const msg1 = 'Hola, necesito ayuda con mi negocio';
    console.log(`\n👤 Carlos: ${msg1}`);
    history.push(`Carlos: ${msg1}`);
    await sendMessage(msg1);

    // Get AI response
    const ai1 = await waitForAIResponse();
    if (!ai1) { console.log('❌ No AI response 1'); return; }
    console.log(`🤖 Sofia: ${ai1}`);
    history.push(`Sofia: ${ai1}`);
    lastAI = ai1;

    // Turn 2: Customer responds
    const msg2 = await generateCustomerResponse(history);
    console.log(`\n👤 Carlos: ${msg2}`);
    history.push(`Carlos: ${msg2}`);
    await sendMessage(msg2);

    const ai2 = await waitForAIResponse(lastAI);
    if (!ai2) { console.log('❌ No AI response 2'); return; }
    console.log(`🤖 Sofia: ${ai2}`);
    history.push(`Sofia: ${ai2}`);
    lastAI = ai2;

    // Turn 3: Customer books
    const msg3 = await generateCustomerResponse(history);
    console.log(`\n👤 Carlos: ${msg3}`);
    history.push(`Carlos: ${msg3}`);
    await sendMessage(msg3);

    const ai3 = await waitForAIResponse(lastAI);
    if (!ai3) { console.log('❌ No AI response 3'); return; }
    console.log(`🤖 Sofia: ${ai3}`);
    history.push(`Sofia: ${ai3}`);
    lastAI = ai3;

    // Turn 4: If needed
    if (!ai3.toLowerCase().includes('agendad') && !ai3.toLowerCase().includes('confirmad')) {
        const msg4 = await generateCustomerResponse(history);
        console.log(`\n👤 Carlos: ${msg4}`);
        history.push(`Carlos: ${msg4}`);
        await sendMessage(msg4);

        const ai4 = await waitForAIResponse(lastAI);
        if (ai4) {
            console.log(`🤖 Sofia: ${ai4}`);
            history.push(`Sofia: ${ai4}`);
        }
    }

    // Wait for tools to execute
    console.log('\n⏳ Esperando ejecución de herramientas...');
    await new Promise(r => setTimeout(r, 5000));

    // Verify
    console.log('\n📋 VERIFICACIÓN:');

    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, status, profile')
        .eq('phone_number', TEST_PHONE)
        .single();

    if (lead) {
        console.log(`   Lead ID: ${lead.id}`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Profile: ${JSON.stringify(lead.profile)}`);
    }

    const result = await verifyBooking();

    console.log('\n' + '═'.repeat(60));
    if (result.success) {
        const apt = result.appointment as { start_time: string; status: string };
        console.log('✅ ÉXITO: CITA AGENDADA Y CONFIRMADA');
        console.log(`📅 Fecha: ${apt.start_time}`);
        console.log(`📌 Estado: ${apt.status}`);
    } else {
        console.log('❌ FALLO: No se encontró cita confirmada');
        if (result.appointment) {
            const apt = result.appointment as { start_time: string; status: string };
            console.log(`   Cita encontrada: ${apt.start_time} - Estado: ${apt.status}`);
        }
    }
    console.log('═'.repeat(60) + '\n');

    return result.success;
}

main()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
