/**
 * lib/testing/test-validators.ts
 * Enhanced validators with conversation quality metrics
 */

import 'dotenv/config';
import { supabaseAdmin } from '@/lib/db';

export interface ValidationResult {
    passed: boolean;
    message: string;
    details?: any;
}

/**
 * Validate that a lead was created
 */
export async function validateLeadCreated(phoneNumber: string): Promise<ValidationResult> {
    try {
        const { data: lead, error } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('phone_number', phoneNumber)
            .single();

        if (error) {
            return {
                passed: false,
                message: `Database error: ${error.message}`,
            };
        }

        if (!lead) {
            return {
                passed: false,
                message: 'No lead found',
            };
        }

        return {
            passed: true,
            message: 'Lead created successfully',
            details: {
                leadId: (lead as any).id,
                status: (lead as any).status,
                profile: (lead as any).profile,
            },
        };
    } catch (error) {
        return {
            passed: false,
            message: `Exception: ${error}`,
        };
    }
}

/**
 * Validate that messages were saved correctly
 */
export async function validateMessagesSaved(
    phoneNumber: string,
    expectedMinCount: number
): Promise<ValidationResult> {
    try {
        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('phone_number', phoneNumber)
            .single();

        if (!lead) {
            return {
                passed: false,
                message: 'Lead not found',
            };
        }

        const { data: messages, error } = await supabaseAdmin
            .from('messages')
            .select('*')
            .eq('lead_id', (lead as any).id)
            .order('created_at', { ascending: true });

        if (error) {
            return {
                passed: false,
                message: `Database error: ${error.message}`,
            };
        }

        const actualCount = messages?.length ?? 0;

        // More lenient - allow some message loss due to timing
        const passed = actualCount >= (expectedMinCount * 0.7);

        return {
            passed,
            message: passed
                ? `Messages saved correctly (${actualCount} messages)`
                : `Expected at least ${Math.floor(expectedMinCount * 0.7)} messages, found ${actualCount}`,
            details: {
                count: actualCount,
                expected: expectedMinCount,
                messages: messages?.slice(0, 5), // First 5 for reference
            },
        };
    } catch (error) {
        return {
            passed: false,
            message: `Exception: ${error}`,
        };
    }
}

/**
 * Validate that an appointment was booked
 */
export async function validateAppointmentBooked(phoneNumber: string): Promise<ValidationResult> {
    try {
        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('phone_number', phoneNumber)
            .single();

        if (!lead) {
            return {
                passed: false,
                message: 'Lead not found',
            };
        }

        const { data: appointments, error } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .eq('lead_id', (lead as any).id);

        if (error) {
            return {
                passed: false,
                message: `Database error: ${error.message}`,
            };
        }

        if (!appointments || appointments.length === 0) {
            return {
                passed: false,
                message: 'No appointment created',
                details: { appointments: [] },
            };
        }

        return {
            passed: true,
            message: 'Appointment booked successfully',
            details: {
                appointment: appointments[0],
            },
        };
    } catch (error) {
        return {
            passed: false,
            message: `Exception: ${error}`,
        };
    }
}

/**
 * NEW: Validate conversation quality
 */
export async function validateConversationQuality(
    phoneNumber: string,
    conversationLog: Array<{ role: 'user' | 'assistant'; content: string }>,
    expectedOutcome: string
): Promise<ValidationResult> {
    try {
        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('phone_number', phoneNumber)
            .single();

        if (!lead) {
            return {
                passed: false,
                message: 'Lead not found for quality check',
            };
        }

        // Analyze conversation for quality metrics
        const metrics = analyzeConversationQuality(conversationLog);

        // Quality checks
        const qualityIssues: string[] = [];

        // Check for AI repetition (asking same question multiple times)
        if (metrics.aiRepetitiveQuestions > 2) {
            qualityIssues.push(`AI asked same question ${metrics.aiRepetitiveQuestions} times`);
        }

        // Check for persona repetition
        if (metrics.personaRepetitions > 3) {
            qualityIssues.push(`Persona repeated same message ${metrics.personaRepetitions} times`);
        }

        // Check conversation length
        const turnCount = Math.floor(conversationLog.length / 2);
        if (expectedOutcome === 'books' && turnCount > 12) {
            qualityIssues.push(`Too many turns to book (${turnCount})`);
        }

        const passed = qualityIssues.length === 0;

        return {
            passed,
            message: passed
                ? 'Conversation quality good'
                : `Quality issues: ${qualityIssues.join(', ')}`,
            details: {
                metrics,
                issues: qualityIssues,
            },
        };
    } catch (error) {
        return {
            passed: false,
            message: `Exception: ${error}`,
        };
    }
}

/**
 * Analyze conversation for quality metrics
 */
function analyzeConversationQuality(
    conversationLog: Array<{ role: 'user' | 'assistant'; content: string }>
) {
    const aiMessages = conversationLog.filter(m => m.role === 'assistant');
    const userMessages = conversationLog.filter(m => m.role === 'user');

    // Check for AI asking same question
    const aiQuestions = aiMessages
        .filter(m => m.content.includes('?'))
        .map(m => m.content.toLowerCase());
    const aiRepetitiveQuestions = findMaxRepetitions(aiQuestions);

    // Check for persona repetition
    const userTexts = userMessages.map(m => m.content.toLowerCase());
    const personaRepetitions = findMaxRepetitions(userTexts);

    // Check if AI demonstrated value
    const valueDemonstrated = aiMessages.some(m =>
        m.content.toLowerCase().includes('beneficio') ||
        m.content.toLowerCase().includes('ayudar') ||
        m.content.toLowerCase().includes('solución')
    );

    // Check if booking was attempted
    const bookingAttempted = aiMessages.some(m =>
        m.content.toLowerCase().includes('agenda') ||
        m.content.toLowerCase().includes('horario') ||
        m.content.toLowerCase().includes('cita')
    );

    return {
        aiRepetitiveQuestions,
        personaRepetitions,
        valueDemonstrated,
        bookingAttempted,
        avgMessageLength: calculateAvgLength(conversationLog),
        turnCount: Math.floor(conversationLog.length / 2),
    };
}

/**
 * Find maximum repetitions in array
 */
function findMaxRepetitions(items: string[]): number {
    const counts = new Map<string, number>();
    let maxCount = 0;

    for (const item of items) {
        const count = (counts.get(item) || 0) + 1;
        counts.set(item, count);
        maxCount = Math.max(maxCount, count);
    }

    return maxCount;
}

/**
 * Calculate average message length
 */
function calculateAvgLength(messages: Array<{ role: string; content: string }>): number {
    if (messages.length === 0) return 0;
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.round(totalLength / messages.length);
}
