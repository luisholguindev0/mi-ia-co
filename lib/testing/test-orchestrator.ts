/**
 * lib/testing/test-orchestrator.ts
 * Enhanced orchestrator with intelligent persona engine integration
 */

import 'dotenv/config';
import { supabaseAdmin } from '@/lib/db';
import type { Persona } from './scenarios';
import { sendWhatsAppMessage, sleep } from './webhook-simulator';
import { PersonaEngine } from './ai-persona-engine';
import {
    validateLeadCreated,
    validateMessagesSaved,
    validateAppointmentBooked,
    validateConversationQuality,
    type ValidationResult,
} from './test-validators';

export interface TestResult {
    persona: Persona;
    success: boolean;
    turnCount: number;
    duration: number;
    expectedOutcome: string;
    conversationLog: Array<{ role: 'user' | 'assistant'; content: string }>;
    validations: {
        leadCreated: ValidationResult;
        messagesSaved: ValidationResult;
        appointmentBooked?: ValidationResult;
        conversationQuality?: ValidationResult;
    };
    error?: string;
}

/**
 * Run a single persona conversation with intelligent AI engine
 */
export async function runPersonaConversation(
    persona: Persona,
    maxTurns: number = 15
): Promise<TestResult> {
    const startTime = Date.now();
    const conversationLog: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    const personaEngine = new PersonaEngine(persona);

    console.log(`\n🤖 Starting intelligent conversation: ${persona.name} (${persona.id})`);
    console.log(`   Expected outcome: ${persona.expectedOutcome}`);

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

        // Wait for initial webhook processing
        await sleep(8000);

        // Step 2: Intelligent conversation loop
        for (let turn = 0; turn < maxTurns; turn++) {
            // Get AI's response from database with retry
            const aiResponse = await getLatestAIResponseWithRetry(persona.phoneNumber, 3);

            if (!aiResponse) {
                console.log(`   ⚠️ No AI response after turn ${turn + 1}`);
                break;
            }

            console.log(`   AI: ${aiResponse.substring(0, 120)}${aiResponse.length > 120 ? '...' : ''}`);
            conversationLog.push({ role: 'assistant', content: aiResponse });

            // Check if persona wants to end conversation
            if (personaEngine.shouldEndConversation()) {
                console.log(`   ✅ Persona ${persona.name} reached goal after ${turn + 1} turns`);
                break;
            }

            // Generate intelligent persona response
            const personaResponse = await personaEngine.generateResponse(aiResponse);

            console.log(`   User: ${personaResponse}`);
            conversationLog.push({ role: 'user', content: personaResponse });

            // Send persona's response
            const sendPersonaResult = await sendWhatsAppMessage(
                persona.phoneNumber,
                personaResponse,
                persona.name
            );

            if (!sendPersonaResult.success) {
                console.log(`   ⚠️ Failed to send persona response: ${sendPersonaResult.error}`);
                break;
            }

            // Wait for AI processing
            await sleep(8000);
        }

        // Step 3: Run validations
        console.log(`   📊 Running validations...`);
        await sleep(3000); // Give DB time to settle

        const validations: TestResult['validations'] = {
            leadCreated: await validateLeadCreated(persona.phoneNumber),
            messagesSaved: await validateMessagesSaved(persona.phoneNumber, conversationLog.length),
            appointmentBooked: await validateAppointmentBooked(persona.phoneNumber),
            conversationQuality: await validateConversationQuality(
                persona.phoneNumber,
                conversationLog,
                persona.expectedOutcome
            ),
        };

        const success = determineSuccess(validations, persona.expectedOutcome);
        const duration = Date.now() - startTime;

        return {
            persona,
            success,
            turnCount: Math.floor(conversationLog.length / 2),
            duration,
            expectedOutcome: persona.expectedOutcome,
            conversationLog,
            validations,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.log(`   ❌ Error: ${errorMessage}`);

        return {
            persona,
            success: false,
            turnCount: Math.floor(conversationLog.length / 2),
            duration,
            expectedOutcome: persona.expectedOutcome,
            conversationLog,
            validations: {
                leadCreated: { passed: false, message: 'Not validated due to error' },
                messagesSaved: { passed: false, message: 'Not validated due to error' },
            },
            error: errorMessage,
        };
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
            return null;
        }

        const { data: messages, error: msgError } = await supabaseAdmin
            .from('messages')
            .select('content')
            .eq('lead_id', lead.id)
            .eq('role', 'assistant')
            .order('created_at', { ascending: false })
            .limit(1);

        if (msgError || !messages || messages.length === 0) {
            return null;
        }

        return messages[0].content;
    } catch (error) {
        console.error(`   Exception in getLatestAIResponse:`, error);
        return null;
    }
}

/**
 * Determine if test was successful based on validations and expected outcome
 */
function determineSuccess(
    validations: TestResult['validations'],
    expectedOutcome: string
): boolean {
    // Lead must be created
    if (!validations.leadCreated.passed) {
        return false;
    }

    // Messages must be saved
    if (!validations.messagesSaved.passed) {
        return false;
    }

    // For "books" outcome, appointment must be created
    if (expectedOutcome === 'books') {
        return validations.appointmentBooked?.passed ?? false;
    }

    // For "abandons" outcome, should NOT have appointment
    if (expectedOutcome === 'abandons') {
        return !(validations.appointmentBooked?.passed ?? false);
    }

    // For "researching", either is ok
    return true;
}
