/**
 * app/api/webhook/whatsapp/route.ts
 * The Gateway: Secure entry point for WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import { verifySignature } from '@/lib/whatsapp/verify';

// GET: Verification Challenge (Meta verifies ownership)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify against our secret token (set in .env.local)
    const myVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === myVerifyToken) {
        console.log('WEBHOOK_VERIFIED');
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

// POST: Message Reception
export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();

        // 1. Security Check (HMAC)
        // NOTE: Enabled only if WHATSAPP_APP_SECRET is present to allow easier local testing
        if (process.env.WHATSAPP_APP_SECRET) {
            const signature = req.headers.get('x-hub-signature-256');
            if (!signature || !(await verifySignature(bodyText, signature, process.env.WHATSAPP_APP_SECRET))) {
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        const body = JSON.parse(bodyText);

        // 2. Parse Message (Extract what we need)
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            // 3. Async Handoff (The "Traffic Controller")
            // We push the event to Inngest and respond 200 OK immediately
            await inngest.send({
                name: "whatsapp/message.received",
                data: {
                    messageId: message.id,
                    from: message.from, // Phone number
                    text: message.text?.body || '', // Text content
                    timestamp: message.timestamp,
                    name: value?.contacts?.[0]?.profile?.name || 'Unknown',
                },
            });
        }

        return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
