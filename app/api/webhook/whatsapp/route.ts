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
    console.log('📥 Webhook POST received');
    try {
        const bodyText = await req.text();
        console.log('📦 Raw Body:', bodyText.substring(0, 200) + '...');

        const body = JSON.parse(bodyText);

        // Extract phone number to check if this is a test
        const phoneNumber = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
        const isTestNumber = phoneNumber?.startsWith('5799999') ?? false;

        // Skip signature verification for test phone numbers (5799999XXX)
        if (!isTestNumber) {
            if (process.env.WHATSAPP_APP_SECRET) {
                const signature = req.headers.get('x-hub-signature-256');
                console.log(`🔐 Verifying Signature: ${signature ? 'Present' : 'MISSING'}`);

                if (!signature) {
                    console.error('❌ Missing Signature');
                    return new NextResponse('Unauthorized', { status: 401 });
                }

                const isValid = await verifySignature(bodyText, signature, process.env.WHATSAPP_APP_SECRET);
                console.log(`🔐 Signature Valid? ${isValid ? 'YES' : 'NO'}`);

                if (!isValid) {
                    console.error('❌ Signature Mismatch');
                    return new NextResponse('Unauthorized', { status: 401 });
                }
            } else {
                console.error('❌ CRITICAL: WHATSAPP_APP_SECRET not set. Gateway closed.');
                return new NextResponse('Internal Configuration Error', { status: 500 });
            }
        } else {
            console.log('🧪 Test phone number detected - bypassing signature verification');
        }

        // 2. Parse Message (Extract what we need)
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            // 3. Async Handoff (The "Traffic Controller")
            // We push the event to Inngest and respond 200 OK immediately
            try {
                const ids = await inngest.send({
                    name: "whatsapp/message.received",
                    data: {
                        messageId: message.id,
                        from: message.from, // Phone number
                        text: message.text?.body || '', // Text content
                        timestamp: message.timestamp,
                        name: value?.contacts?.[0]?.profile?.name || 'Unknown',
                    },
                });
                console.log(`🚀 Event sent to Inngest: ${JSON.stringify(ids)}`);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(`❌ Inngest Send Failed: ${errorMessage}`);
                // We typically still want to return 200 to WhatsApp to avoid retries of a broken handler
            }
        }

        return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
