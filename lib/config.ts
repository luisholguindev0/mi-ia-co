/**
 * lib/config.ts
 * Centralized configuration and environment validation
 * Validates all required env vars on startup
 */

// Required environment variables
const REQUIRED_ENV = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'DEEPSEEK_API_KEY',
] as const;

// Optional but recommended
const OPTIONAL_ENV = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_APP_SECRET',
    'WHATSAPP_VERIFY_TOKEN',
    'INNGEST_EVENT_KEY',
] as const;

interface ConfigValidation {
    valid: boolean;
    missing: string[];
    warnings: string[];
}

/**
 * Validate all required environment variables
 * Call this on app startup to fail fast
 */
export function validateEnvironment(): ConfigValidation {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required vars
    for (const key of REQUIRED_ENV) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    // Check optional vars
    for (const key of OPTIONAL_ENV) {
        if (!process.env[key]) {
            warnings.push(key);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings,
    };
}

/**
 * Log environment status (safe for production - no values exposed)
 */
export function logEnvironmentStatus(): void {
    const result = validateEnvironment();

    if (result.valid) {
        console.log('✅ Environment validated: All required vars present');
    } else {
        console.error('❌ MISSING REQUIRED ENV VARS:', result.missing.join(', '));
    }

    if (result.warnings.length > 0) {
        console.warn('⚠️ Optional env vars missing:', result.warnings.join(', '));
    }
}

// ═══════════════════════════════════════════════════════════════
// Business Configuration
// ═══════════════════════════════════════════════════════════════

export const BUSINESS_CONFIG = {
    // Business hours (Colombia time UTC-5)
    hours: {
        start: parseInt(process.env.BUSINESS_HOURS_START || '9'),
        end: parseInt(process.env.BUSINESS_HOURS_END || '17'),
        timezone: process.env.BUSINESS_TIMEZONE || 'America/Bogota',
    },

    // Working days (1=Monday, 5=Friday)
    workingDays: (process.env.WORKING_DAYS || '1,2,3,4,5').split(',').map(Number),

    // Slot duration in minutes
    slotDuration: parseInt(process.env.SLOT_DURATION || '60'),

    // AI configuration
    ai: {
        maxHistoryMessages: parseInt(process.env.MAX_HISTORY_MESSAGES || '20'),
        maxResponseLength: parseInt(process.env.MAX_RESPONSE_LENGTH || '4000'),
        ragSimilarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.6'),
    },

    // Rate limiting (per lead per minute)
    rateLimit: {
        maxMessagesPerMinute: parseInt(process.env.RATE_LIMIT_MESSAGES || '10'),
    },
} as const;

// ═══════════════════════════════════════════════════════════════
// Input Sanitization
// ═══════════════════════════════════════════════════════════════

const DANGEROUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, etc.
    /data:text\/html/i,
];

const PII_PATTERNS = [
    /\b\d{10,16}\b/,  // Credit card-like numbers
    /\b\d{3}-\d{2}-\d{4}\b/,  // SSN format
    /\b[A-Z]{2}\d{6,10}\b/i,  // ID documents
];

/**
 * Sanitize user input to prevent XSS and log injection
 */
export function sanitizeInput(text: string): string {
    if (!text) return '';

    let sanitized = text
        // Remove null bytes
        .replace(/\0/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Limit length (prevent overflow)
        .substring(0, 10000)
        .trim();

    // Check for dangerous patterns (log but don't block)
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(sanitized)) {
            console.warn('⚠️ Potentially dangerous input detected:', pattern.source);
        }
    }

    return sanitized;
}

/**
 * Check for PII in text (for audit logging)
 */
export function containsPII(text: string): boolean {
    return PII_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Redact PII from text for safe logging
 */
export function redactPII(text: string): string {
    let redacted = text;
    for (const pattern of PII_PATTERNS) {
        redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
}

// ═══════════════════════════════════════════════════════════════
// Rate Limiting Helper
// ═══════════════════════════════════════════════════════════════

// In-memory rate limit store (for Edge/serverless, use Upstash Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if a lead is rate limited
 * Returns true if request should be blocked
 */
export function isRateLimited(leadPhone: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const limit = BUSINESS_CONFIG.rateLimit.maxMessagesPerMinute;

    const entry = rateLimitStore.get(leadPhone);

    if (!entry || entry.resetAt < now) {
        // New window
        rateLimitStore.set(leadPhone, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (entry.count >= limit) {
        console.warn(`⚠️ Rate limit exceeded for ${leadPhone}: ${entry.count}/${limit}`);
        return true;
    }

    entry.count++;
    return false;
}

/**
 * Clear rate limit for a specific lead (admin action)
 */
export function clearRateLimit(leadPhone: string): void {
    rateLimitStore.delete(leadPhone);
}
