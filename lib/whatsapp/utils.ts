/**
 * lib/whatsapp/utils.ts
 * Security Utilities for WhatsApp Webhooks
 * Implements HMAC SHA-256 Signature Verification
 */

import crypto from 'crypto';

/**
 * Verify that the webhook request actually came from Meta
 * Compares X-Hub-Signature-256 header with our calculated HMAC
 */
export async function verifySignature(
    payload: string,
    signature: string,
    appSecret: string
): Promise<boolean> {
    if (!signature) {
        console.error('Missing X-Hub-Signature-256 header');
        return false;
    }

    // Signature format: "sha256=..."
    const [method, signatureHash] = signature.split('=');
    if (method !== 'sha256') {
        console.error(`Unsupported signature method: ${method}`);
        return false;
    }

    // Create HMAC SHA-256 hash using our App Secret
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payload);
    const expectedHash = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedHash, 'utf8');
    const signatureBuffer = Buffer.from(signatureHash, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
