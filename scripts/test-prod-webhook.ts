
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PROD_URL = 'https://mi-ia-co-blush.vercel.app/api/webhook/whatsapp';
const TEST_PHONE = "573181710249";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

if (!APP_SECRET) {
    console.error("❌ Error: WHATSAPP_APP_SECRET is missing in .env.local");
    process.exit(1);
}

const payload = {
    object: "whatsapp_business_account",
    entry: [{
        id: "123456789",
        changes: [{
            value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "123", phone_number_id: "123" },
                contacts: [{ profile: { name: "Probe Tester" }, wa_id: TEST_PHONE }],
                messages: [{
                    from: TEST_PHONE,
                    id: `wamid.probe.${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000),
                    text: { body: "🚑 PROBE TEST: Are you alive?" },
                    type: "text"
                }]
            },
            field: "messages"
        }]
    }]
};

async function sendProbe() {
    console.log(`🚀 Sending Probe to: ${PROD_URL}`);

    // Generate Signature
    const body = JSON.stringify(payload);
    const signature = crypto
        .createHmac('sha256', APP_SECRET!)
        .update(body)
        .digest('hex');

    try {
        const response = await fetch(PROD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hub-signature-256': `sha256=${signature}`
            },
            body: body
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Response: ${text}`);

        if (response.ok) {
            console.log("✅ Probe Accepted by Vercel.");
            console.log("👉 Now check Vercel Logs for '📥 Webhook POST received'");
            console.log("👉 And check Inngest for 'process-whatsapp-message'");
        } else {
            console.error("❌ Probe Rejected.");
        }

    } catch (e) {
        console.error("❌ Network Error:", e);
    }
}

sendProbe();
