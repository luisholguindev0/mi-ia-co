
import dotenv from 'dotenv';
import path from 'path';

import crypto from 'crypto';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const TEST_PHONE = "573181710249";
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

async function testWhatsappSend() {
    console.log("🧪 Testing WhatsApp Send API...");
    console.log(`To: ${TEST_PHONE}`);
    console.log(`Phone ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);

    const token = process.env.WHATSAPP_ACCESS_TOKEN || "";
    const secret = process.env.WHATSAPP_APP_SECRET || "";

    console.log(`Token (First 10): ${token.substring(0, 10)}...`);
    console.log(`Secret Found: ${secret ? "YES" : "NO"}`);

    // Generate appsecret_proof
    const appSecretProof = crypto
        .createHmac('sha256', secret)
        .update(token)
        .digest('hex');

    const url = `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages?appsecret_proof=${appSecretProof}`;

    const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: TEST_PHONE,
        type: 'text',
        text: { body: "🔔 DEBUG TEST: If you see this, the API works." },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        console.log("------------------------------------------------");
        console.log(`Status: ${response.status}`);
        console.log("Response:", JSON.stringify(data, null, 2));
        console.log("------------------------------------------------");

        if (!response.ok) {
            console.error("❌ FAILED. See error above.");
        } else {
            console.log("✅ SUCCESS. Message sent to WhatsApp.");
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR:", error);
    }
}

testWhatsappSend();
