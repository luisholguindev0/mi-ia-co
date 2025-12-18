/**
 * lib/whatsapp/api.ts
 * Utility to send messages back to WhatsApp Business API
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'; // Check for latest version
// Using process.env.WHATSAPP_PHONE_NUMBER_ID and process.env.WHATSAPP_ACCESS_TOKEN

export async function sendWhatsAppMessage(to: string, text: string) {
    // 1. Safety check for test numbers (if needed)
    if (!to) return;

    const url = `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
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
