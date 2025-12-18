/**
 * lib/testing/webhook-simulator.ts
 * Simulates WhatsApp webhook requests to test the ASOS
 */

const WEBHOOK_URL = 'https://mi-ia-co-blush.vercel.app/api/webhook/whatsapp';

interface WhatsAppMessage {
    from: string;
    id: string;
    timestamp: string;
    text: {
        body: string;
    };
    type: 'text';
}

interface WhatsAppWebhookPayload {
    object: 'whatsapp_business_account';
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: 'whatsapp';
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages: WhatsAppMessage[];
            };
            field: 'messages';
        }>;
    }>;
}

/**
 * Send a message to the WhatsApp webhook
 */
export async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    senderName: string = 'Test User'
): Promise<{ success: boolean; error?: string }> {
    const messageId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: 'test-entry-id',
                changes: [
                    {
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '573001234567',
                                phone_number_id: 'test-phone-id',
                            },
                            contacts: [
                                {
                                    profile: {
                                        name: senderName,
                                    },
                                    wa_id: phoneNumber,
                                },
                            ],
                            messages: [
                                {
                                    from: phoneNumber,
                                    id: messageId,
                                    timestamp: new Date().toISOString(),
                                    text: {
                                        body: message,
                                    },
                                    type: 'text',
                                },
                            ],
                        },
                        field: 'messages',
                    },
                ],
            },
        ],
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Wait for a specific duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
