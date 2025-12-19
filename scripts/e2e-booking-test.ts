#!/usr/bin/env tsx
/**
 * scripts/e2e-booking-test.ts
 * 
 * SIMPLE E2E TEST: AI talks to AI until booking happens
 * 
 * This test simulates a customer wanting to book an appointment.
 * It uses DeepSeek to generate customer responses.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';
import { supabaseAdmin } from '../lib/db';
import { parseSpanishDate, parseSpanishTime } from '../lib/utils/date-utils';
import { format, addDays } from 'date-fns';

const TEST_PHONE = '5799999999';
const MAX_TURNS = 15;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mi-ia-co-blush.vercel.app';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY!,
});

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Simple customer persona
const CUSTOMER_PROMPT = `
Eres Carlos, dueño de una panadería en Bogotá. Quieres un sistema para recibir pedidos por WhatsApp.

OBJETIVO: Agendar una cita de demostración lo más rápido posible.

TU COMPORTAMIENTO:
- Respuestas MUY cortas (1-2 oraciones máximo)
- Si te preguntan sobre tu negocio: "Tengo una panadería, pierdo pedidos porque no contesto rápido"
- Cuando mencionen agendar: Di que quieres agendar para MAÑANA A LAS 10AM
- Si confirman la cita: Di "Perfecto, gracias!"
- NO repitas información que ya dijiste

HISTORIAL:
{{HISTORY}}

Responde como Carlos (1-2 oraciones máximo):
`;

async function cleanup() {
    console.log('\n🧹 Limpiando datos de prueba...');

    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone_number', TEST_PHONE)
        .single();

    if (lead) {
        await supabaseAdmin.from('audit_logs').delete().eq('lead_id', lead.id);
        await supabaseAdmin.from('messages').delete().eq('lead_id', lead.id);
        await supabaseAdmin.from('appointments').delete().eq('lead_id', lead.id);
        await supabaseAdmin.from('leads').delete().eq('id', lead.id);
        console.log('   ✅ Datos eliminados');
    } else {
        console.log('   ℹ️  No había datos previos');
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

async function getLatestAIResponse(excludeContent?: string): Promise<string | null> {
    // Wait for Inngest to process
    await sleep(8000);

    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone_number', TEST_PHONE)
        .single();

    if (!lead) return null;

    const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('content, role')
        .eq('lead_id', lead.id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!messages || messages.length === 0) return null;

    const content = messages[0].content;
    if (content === excludeContent) return null;

    return content;
}

async function generateCustomerResponse(history: Message[]): Promise<string> {
    const historyText = history.map(m => `${m.role === 'user' ? 'Carlos' : 'Sofia'}: ${m.content}`).join('\n');

    const prompt = CUSTOMER_PROMPT.replace('{{HISTORY}}', historyText || 'Inicio de conversación');

    const { text } = await generateText({
        model: deepseek('deepseek-chat'),
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 100,
    });

    return text.trim();
}

async function checkBookingSuccess(): Promise<{ booked: boolean; appointmentTime?: string }> {
    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, status')
        .eq('phone_number', TEST_PHONE)
        .single();

    if (!lead) return { booked: false };

    const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('start_time, status')
        .eq('lead_id', lead.id);

    if (appointments && appointments.length > 0) {
        return {
            booked: true,
            appointmentTime: appointments[0].start_time
        };
    }

    return { booked: false };
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║ 🧪 E2E BOOKING TEST - AI vs AI                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log(`📍 Target: ${WEBHOOK_URL}`);
    console.log(`📱 Test Phone: ${TEST_PHONE}`);
    console.log(`🔄 Max Turns: ${MAX_TURNS}\n`);

    await cleanup();

    const history: Message[] = [];
    let lastAIResponse = '';

    // Initial message
    const initialMessage = 'Hola! Necesito ayuda con mi panadería';
    console.log(`\n👤 Carlos: ${initialMessage}`);
    history.push({ role: 'user', content: initialMessage });

    await sendMessage(initialMessage);

    for (let turn = 1; turn <= MAX_TURNS; turn++) {
        console.log(`\n--- Turno ${turn}/${MAX_TURNS} ---`);

        // Get AI response
        const aiResponse = await getLatestAIResponse(lastAIResponse);

        if (!aiResponse) {
            console.log('   ⏳ Esperando respuesta del AI...');
            await sleep(5000);
            continue;
        }

        lastAIResponse = aiResponse;
        console.log(`🤖 Sofia: ${aiResponse}`);
        history.push({ role: 'assistant', content: aiResponse });

        // Check if booking happened
        const { booked, appointmentTime } = await checkBookingSuccess();
        if (booked) {
            console.log('\n✅ ¡CITA AGENDADA EXITOSAMENTE!');
            console.log(`📅 Fecha/Hora: ${appointmentTime}`);
            return true;
        }

        // Check for booking confirmation in message
        if (aiResponse.toLowerCase().includes('confirmad') ||
            aiResponse.toLowerCase().includes('agendad') ||
            aiResponse.toLowerCase().includes('cita quedó')) {
            console.log('\n🔍 Verificando cita en base de datos...');
            await sleep(3000);
            const result = await checkBookingSuccess();
            if (result.booked) {
                console.log('\n✅ ¡CITA AGENDADA EXITOSAMENTE!');
                console.log(`📅 Fecha/Hora: ${result.appointmentTime}`);
                return true;
            }
        }

        // Generate customer response
        const customerResponse = await generateCustomerResponse(history);
        console.log(`👤 Carlos: ${customerResponse}`);
        history.push({ role: 'user', content: customerResponse });

        await sendMessage(customerResponse);

        // Stop if customer says goodbye
        if (customerResponse.toLowerCase().includes('gracias') &&
            customerResponse.toLowerCase().includes('perfecto')) {
            console.log('\n📋 Conversación terminada por el cliente');
            break;
        }
    }

    // Final check
    const { booked, appointmentTime } = await checkBookingSuccess();

    console.log('\n' + '═'.repeat(60));
    if (booked) {
        console.log('✅ RESULTADO: ÉXITO');
        console.log(`📅 Cita agendada: ${appointmentTime}`);
    } else {
        console.log('❌ RESULTADO: FALLO - No se agendó cita');

        // Show conversation summary
        console.log('\n📜 Resumen de conversación:');
        history.forEach((m, i) => {
            console.log(`   ${i + 1}. [${m.role}]: ${m.content.substring(0, 60)}...`);
        });
    }
    console.log('═'.repeat(60) + '\n');

    return booked;
}

// Run the test
runTest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
