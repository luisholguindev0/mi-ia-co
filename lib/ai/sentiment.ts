/**
 * lib/ai/sentiment.ts
 * Sentiment detection for monitoring lead frustration and abandonment signals
 */

/**
 * Detect negative sentiment in user messages
 * Returns true if message contains frustration/negative language
 */
export function detectNegativeSentiment(message: string): boolean {
    const negativePatterns = [
        /olvídalo/i,
        /pésimo/i,
        /horrible/i,
        /no me sirve/i,
        /adiós/i,
        /olvida(lo|te)/i,
        /no (me )?interesa/i,
        /demasiado caro/i,
        /muy caro/i,
        /mal servicio/i,
        /que mal/i,
        /así funcionas de mal/i,
    ];

    return negativePatterns.some(pattern => pattern.test(message));
}

/**
 * Detect abandonment signals (stronger negative intent)
 * Returns true if user is likely leaving the conversation
 */
export function detectAbandonmentSignal(message: string): boolean {
    const abandonmentPatterns = [
        /gracias.*adiós/i,
        /no.*gracias/i,
        /olvídalo/i,
        /otro.*momento/i,
        /déjalo/i,
        /ya no/i,
    ];

    return abandonmentPatterns.some(pattern => pattern.test(message));
}

/**
 * Get signal type for logging
 */
export function getSentimentSignalType(message: string): 'abandonment' | 'frustration' | null {
    if (detectAbandonmentSignal(message)) return 'abandonment';
    if (detectNegativeSentiment(message)) return 'frustration';
    return null;
}
