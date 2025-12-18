/**
 * lib/testing/orchestrator.ts
 * Orchestrates persona conversations with the AI
 */

import 'dotenv/config';
import { supabaseAdmin } from '@/lib/db';
import type { Persona } from './personas';
import { sendWhatsAppMessage, sleep } from './webhook-simulator';
import { generatePersonaResponse } from './persona-ai';
import {
    validateLeadCreated,
    validateMessagesSaved,
    validateAppointmentBooked,
    validateSentimentLogged,
    validateProfileUpdated,
    type ValidationResult,
} from './validators';

export interface TestResult {
    persona: Persona;
    success: boolean;
    turnCount: number;
    duration: number;
    conversationLog: Array<{ role: 'user' | 'assistant'; content: string }>;
    validations: {
        leadCreated: ValidationResult;
        messagesSaved: ValidationResult;
        appointmentBooked?: ValidationResult;
        sentimentLogged?: ValidationResult;
        profileUpdated: ValidationResult;
    };
    error?: string;
}

/**
 * Run a full conversation for a persona
 */
export async function runPersonaConversation(
    persona: Persona,
    maxTurns: number = 20
): Promise<TestResult> {
    const startTime = Date.now();
    const conversationLog: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    console.log(`\n🤖 Starting conversation: ${persona.name} (${persona.id})`);

    try {
        // Step 1: Send initial message
        console.log(`   User: ${persona.initialMessage}`);
        conversationLog.push({ role: 'user', content: persona.initialMessage });

        const sendResult = await sendWhatsAppMessage(
            persona.phoneNumber,
            persona.initialMessage,
            persona.name
        );

        if (!sendResult.success) {
            throw new Error(`Failed to send initial message: ${sendResult.error}`);
        }

        // Wait for webhook processing (Inngest takes ~5-10s)
        await sleep(8000);

        // Step 2: Conversation loop
        for (let turn = 0; turn < maxTurns; turn++) {
            // Get AI's response from database (with retry)
            const aiResponse = await getLatestAIResponseWithRetry(persona.phoneNumber, 3);

            if (!aiResponse) {
                console.log(`   ⚠️ No AI response after turn ${turn + 1} (tried 3 times)`);
                break;
            }

            console.log(`   AI: ${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}`);
            conversationLog.push({ role: 'assistant', content: aiResponse });

            // Check if conversation should end
            const shouldEnd = await shouldEndConversation(persona, conversationLog);
            if (shouldEnd) {
                console.log(`   ✅ Conversation ended naturally after ${turn + 1} turns`);
                break;
            }

            // Generate persona's response using AI
            let personaResponse: string;
            try {
                personaResponse = await generatePersonaResponse(
                    persona,
                    aiResponse,
                    conversationLog
                );
            } catch (error) {
                console.error(`   ❌ Error generating persona response:`, error);
                throw error;
            }

            console.log(`   User: ${personaResponse}`);
            conversationLog.push({ role: 'user', content: personaResponse });

            // Send persona's response
            const sendResult = await sendWhatsAppMessage(
                persona.phoneNumber,
                personaResponse,
                persona.name
            );

            if (!sendResult.success) {
                console.log(`   ⚠️ Failed to send message: ${sendResult.error}`);
                break;
            }

            // Wait for processing (increased from 4s to 8s)
            await sleep(8000);
        }

        // Step 3: Validate results
        console.log(`   📊 Running validations...`);
        const validations = await runValidations(persona, conversationLog);

        const duration = Date.now() - startTime;
        const success = determineSuccess(persona, validations);

        return {
            persona,
            success,
            turnCount: Math.ceil(conversationLog.length / 2),
            duration,
            conversationLog,
            validations,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);

        return {
            persona,
            success: false,
            turnCount: Math.ceil(conversationLog.length / 2),
            duration,
            conversationLog,
            validations: {
                leadCreated: { passed: false, message: 'Not validated due to error' },
                messagesSaved: { passed: false, message: 'Not validated due to error' },
                profileUpdated: { passed: false, message: 'Not validated due to error' },
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get the latest AI response from the database
 */
async function getLatestAIResponse(phoneNumber: string): Promise<string | null> {
    try {
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('phone_number', phoneNumber)
            .single();

        if (leadError || !lead) {
            console.error(`   DB Error fetching lead:`, leadError?.message || 'No lead found');
            return null;
        }

        const { data: messages, error: msgError } = await supabaseAdmin
            .from('messages')
            .select('content')
            .eq('lead_id', lead.id)
            .eq('role', 'assistant')
            .order('created_at', { ascending: false })
            .limit(1) as { data: Array<{ content: string }> | null; error: any };

        if (msgError) {
            console.error(`   DB Error fetching messages:`, msgError.message);
            return null;
        }

        if (!messages || messages.length === 0) {
            return null;
        }

        return messages[0].content;
    } catch (error) {
        console.error(`   Exception in getLatestAIResponse:`, error);
        return null;
    }
}

/**
 * Get latest AI response with retry logic
 */
async function getLatestAIResponseWithRetry(
    phoneNumber: string,
    maxRetries: number = 3
): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const response = await getLatestAIResponse(phoneNumber);

        if (response) {
            return response;
        }

        if (attempt < maxRetries) {
            console.log(`   ⏳ Retry ${attempt}/${maxRetries} - waiting 3s for AI response...`);
            await sleep(3000);
        }
    }

    return null;
}

/**
 * Determine if conversation should end
 */
async function shouldEndConversation(
    persona: Persona,
    conversationLog: Array<{ role: string; content: string }>
): Promise<boolean> {
    const lastUserMessage = conversationLog
        .slice()
        .reverse()
        .find(m => m.role === 'user')?.content || '';

    // Check for abandonment signals
    const abandonmentKeywords = ['olvídalo', 'olvida', 'adiós', 'gracias.*no', 'pésimo'];
    if (abandonmentKeywords.some(kw => new RegExp(kw, 'i').test(lastUserMessage))) {
        return true;
    }

    // Check if appointment was booked
    const result = await validateAppointmentBooked(persona.phoneNumber);
    if (result.passed) {
        return true;
    }

    // Researcher personas end after 10+ turns without booking
    if (persona.expectedOutcome === 'researching' && conversationLog.length >= 20) {
        return true;
    }

    return false;
}

/**
 * Run all validations for a persona
 */
async function runValidations(
    persona: Persona,
    conversationLog: Array<{ role: string; content: string }>
): Promise<TestResult['validations']> {
    const leadCreated = await validateLeadCreated(persona.phoneNumber);
    const messagesSaved = await validateMessagesSaved(persona.phoneNumber, conversationLog.length);
    const profileUpdated = await validateProfileUpdated(persona.phoneNumber);

    const validations: TestResult['validations'] = {
        leadCreated,
        messagesSaved,
        profileUpdated,
    };

    // Validate appointment if persona should book
    if (persona.expectedOutcome === 'books') {
        validations.appointmentBooked = await validateAppointmentBooked(persona.phoneNumber);
    }

    // Validate sentiment logging if persona should abandon
    if (persona.expectedOutcome === 'abandons') {
        validations.sentimentLogged = await validateSentimentLogged(persona.phoneNumber, 'abandonment');
    }

    return validations;
}

/**
 * Determine if test was successful
 */
function determineSuccess(persona: Persona, validations: TestResult['validations']): boolean {
    // Core validations must pass
    if (!validations.leadCreated.passed || !validations.messagesSaved.passed) {
        return false;
    }

    // Outcome-specific validations
    if (persona.expectedOutcome === 'books' && !validations.appointmentBooked?.passed) {
        return false;
    }

    if (persona.expectedOutcome === 'abandons' && !validations.sentimentLogged?.passed) {
        return false;
    }

    return true;
}
