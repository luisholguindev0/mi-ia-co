/**
 * lib/ai/agents.ts
 * AI Agent Definitions: DoctorAgent (R1) & CloserAgent (V3)
 * Uses Vercel AI SDK with DeepSeek models
 * 
 * v2: Now with conversation history injection for multi-turn context
 */

import { generateText, generateObject } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import {
    DOCTOR_SYSTEM_PROMPT,
    CLOSER_SYSTEM_PROMPT,
    FALLBACK_RESPONSES
} from './prompts';
import { retrieveContext } from './rag';
import { agentResponseSchema, type AgentResponse } from './tools';
import { supabaseAdmin } from '@/lib/db';

// Initialize DeepSeek clients
const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY!,
});

// Model selection per EDD spec
// CAUTION: Switched R1 -> V3 for production latency (40s -> 2s)
const REASONING_MODEL = deepseek('deepseek-chat'); // Was 'deepseek-reasoner'
const CONVERSATIONAL_MODEL = deepseek('deepseek-chat'); // V3 for chat

interface AgentContext {
    leadId: string;
    phoneNumber: string;
    userMessage: string;
    conversationHistory: string; // NEW: Full conversation history string
    currentState: string;
}

/**
 * DoctorAgent: Uses DeepSeek-R1 for complex diagnosis with RAG
 * Implements the full RAG pipeline from EDD Section 2.1
 * Now with conversation history for multi-turn context
 */
export async function runDoctorAgent(ctx: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();
    console.log(`⏱️ DoctorAgent Start: ${startTime}`);

    try {
        // Step 1: Retrieve relevant context from knowledge_base
        const tRag = Date.now();
        const ragContext = await retrieveContext(ctx.userMessage);
        console.log(`⏱️ RAG Retrieval Duration: ${Date.now() - tRag}ms`);

        // Step 2: Build prompt with retrieved context AND conversation history
        const systemPrompt = DOCTOR_SYSTEM_PROMPT
            .replace('{{RETRIEVED_CONTEXT}}', ragContext)
            .replace('{{CONVERSATION_HISTORY}}', ctx.conversationHistory)
            .replace('{{USER_MESSAGE}}', ctx.userMessage);

        // Step 3: Generate structured response using R1
        const tGen = Date.now();
        const { object: response } = await generateObject({
            model: REASONING_MODEL,
            schema: agentResponseSchema,
            system: systemPrompt,
            prompt: ctx.userMessage,
            temperature: 0.7,
        });
        console.log(`⏱️ AI Generation Duration (V3): ${Date.now() - tGen}ms`);

        // Step 4: Log to audit_logs
        await logAgentDecision({
            leadId: ctx.leadId,
            eventType: 'ai_thought',
            model: 'deepseek-v3',
            latencyMs: Date.now() - startTime,
            payload: {
                input: ctx.userMessage,
                output: response,
                ragContext,
                historyLength: ctx.conversationHistory.length
            },
        });

        // Step 5: Apply guardrails
        return applyGuardrails(response);

    } catch (error) {
        console.error('DoctorAgent error:', error);

        // Graceful degradation per EDD
        return {
            message: FALLBACK_RESPONSES.apiError,
            confidence: 0,
        };
    }
}

/**
 * CloserAgent: Uses DeepSeek-V3 for fast conversational booking
 * Optimized for <200ms latency
 * Now with conversation history for multi-turn context
 */
export async function runCloserAgent(ctx: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
        const systemPrompt = CLOSER_SYSTEM_PROMPT
            .replace('{{CURRENT_DATETIME}}', new Date().toISOString())
            .replace('{{CONVERSATION_HISTORY}}', ctx.conversationHistory)
            .replace('{{USER_MESSAGE}}', ctx.userMessage);

        const { object: response } = await generateObject({
            model: CONVERSATIONAL_MODEL,
            schema: agentResponseSchema,
            system: systemPrompt,
            prompt: ctx.userMessage,
            temperature: 0.5, // Lower temp for more predictable booking flow
        });

        await logAgentDecision({
            leadId: ctx.leadId,
            eventType: 'ai_thought',
            model: 'deepseek-v3',
            latencyMs: Date.now() - startTime,
            payload: {
                input: ctx.userMessage,
                output: response,
                historyLength: ctx.conversationHistory.length
            },
        });

        return applyGuardrails(response);

    } catch (error) {
        console.error('CloserAgent error:', error);
        return {
            message: FALLBACK_RESPONSES.apiError,
            confidence: 0,
        };
    }
}

/**
 * Agent Router: Selects which agent to use based on lead state
 */
export async function routeToAgent(ctx: AgentContext): Promise<AgentResponse> {
    switch (ctx.currentState) {
        case 'new':
        case 'diagnosing':
            return runDoctorAgent(ctx);
        case 'qualified':
        case 'booked':
            return runCloserAgent(ctx);
        default:
            return runDoctorAgent(ctx);
    }
}

/**
 * Guardrails Layer: Promise Firewall + PII Redaction
 * Per EDD Section 2.2
 */
function applyGuardrails(response: AgentResponse): AgentResponse {
    let message = response.message;

    // Promise Firewall: Rewrite dangerous commitments
    const promisePatterns = [
        { pattern: /garantizamos?\s+retorno/gi, replacement: 'estimamos un potencial retorno' },
        { pattern: /prometemos?\s+ganancias?/gi, replacement: 'nuestro objetivo es generar' },
        { pattern: /100%\s+seguro/gi, replacement: 'con alta probabilidad' },
        { pattern: /sin\s+riesgo/gi, replacement: 'con riesgo minimizado' },
    ];

    for (const { pattern, replacement } of promisePatterns) {
        message = message.replace(pattern, replacement);
    }

    // PII Redaction: Remove credit card patterns
    message = message.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED]');

    // Low confidence check
    if (response.confidence < 0.7) {
        console.warn('Low confidence response detected:', response.confidence);
        // Could trigger handoff here
    }

    return {
        ...response,
        message,
    };
}

/**
 * Log agent decisions to audit_logs for observability
 */
async function logAgentDecision(params: {
    leadId: string;
    eventType: string;
    model: string;
    latencyMs: number;
    payload: Record<string, unknown>;
}): Promise<void> {
    try {
        await supabaseAdmin.from('audit_logs').insert({
            lead_id: params.leadId,
            event_type: params.eventType,
            model_used: params.model,
            latency_ms: params.latencyMs,
            payload: params.payload,
        });
    } catch (error) {
        console.error('Failed to log agent decision:', error);
    }
}
