/**
 * scripts/simulate-webhook.ts
 * Simulates an incoming WhatsApp message to the local webhook
 * 
 * Usage: npx tsx scripts/simulate-webhook.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Helper to load .env.local without 'dotenv' package
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars: Record<string, string> = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                envVars[key] = value;
            }
        });
        return envVars;
    } catch (e) {
        console.error('Could not read .env.local', e);
        return {};
    }
}

const env = loadEnv();
const WHATSAPP_APP_SECRET = env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET;

async function main() {
    console.log('🧪 Simulating WhatsApp Webhook...');

    const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp';
    const SECRET = WHATSAPP_APP_SECRET;

    // Mock Payload (Lead asking for availability)
    const payload = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{
            id: 'WHATSAPP_BUSINESS_ID',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { display_phone_number: '123456789', phone_number_id: '123456' },
                    contacts: [{ profile: { name: 'Luis Test' }, wa_id: '573001234567' }],
                    messages: [{
                        from: '573001234567', // Simulate a Colombian number
                        id: `wamid.test.${Date.now()}`,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: 'Hola, quisiera agendar una cita para revisar mi inventario.' },
                        type: 'text',
                    }]
                },
                field: 'messages'
            }]
        }]
    });

    // Calculate HMAC Signature (if secret exists)
    let signature = '';
    if (SECRET) {
        const hmac = crypto.createHmac('sha256', SECRET);
        const digest = hmac.update(payload).digest('hex');
        signature = `sha256=${digest}`;
        console.log('🔐 Generated HMAC signature');
    } else {
        console.log('⚠️  No WHATSAPP_APP_SECRET found, sending without signature (ensure webhook allows this)');
    }

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WhatsApp/2.21.10',
                ...(signature ? { 'X-Hub-Signature-256': signature } : {}),
            },
            body: payload,
        });

        console.log(`📡 Request sent to ${WEBHOOK_URL}`);
        console.log(`Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log('Response:', text);

        if (response.ok) {
            console.log('\n✅ Webhook accepted the message!');
            console.log('👉 Check your Inngest Dev Server (http://localhost:8288) to see the function execution.');
        } else {
            console.error('❌ Webhook rejected the message.');
        }

    } catch (error) {
        console.error('❌ Connection failed:', error);
        console.log('💡 Tip: Ensure your local server is running (npm run dev)');
    }
}

main();
