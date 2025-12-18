/**
 * lib/whatsapp/api.ts
 * Utility to send messages back to WhatsApp Business API
 */

import crypto from 'crypto';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export async function sendWhatsAppMessage(to: string, text: string) {
    if (!to) return;

    const token = process.env.WHATSAPP_ACCESS_TOKEN || '';
    const secret = process.env.WHATSAPP_APP_SECRET || '';

    // Generate appsecret_proof = HMAC-SHA256(access_token, app_secret)
    // This is required because your App has "Require App Secret" enabled.
    const appSecretProof = crypto
        .createHmac('sha256', secret)
        .update(token)
        .digest('hex');

    // We pass appsecret_proof as a query param, NOT in the body
    const url = `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages?appsecret_proof=${appSecretProof}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: { body: text },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('WhatsApp API Error:', JSON.stringify(error, null, 2));
            throw new Error(`WhatsApp API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        // Don't throw here to avoid crashing the whole Inngest function if just one send fails?
        // Actually, throwing allows Inngest to retry.
        throw error;
    }
}
