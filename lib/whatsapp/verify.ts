import crypto from 'crypto';

/**
 * Verifies the X-Audit-Log-Signature header from standard webhooks
 * Adapted for WhatsApp Business API signature verification
 */
export async function verifySignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    if (!signature || !secret) return false;

    // WhatsApp sends 'sha256=...'
    const [algo, sig] = signature.split('=');
    if (algo !== 'sha256') return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    // Constant time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(digest)
    );
}
