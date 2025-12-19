/**
 * lib/ai/agents.ts
 * COMPLETE REWRITE - Single Unified Sales Agent
 * 
 * CORE PRINCIPLE: One agent, one goal - book the damn appointment.
 */

import { generateObject } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { SALES_AGENT_PROMPT, BOOKING_AGENT_PROMPT, FALLBACK_RESPONSES } from './prompts';
import { agentResponseSchema, type AgentResponse } from './tools';
import { supabaseAdmin } from '@/lib/db';
import { format, addDays } from 'date-fns';

// Initialize DeepSeek
const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY!,
});

const AI_MODEL = deepseek('deepseek-chat');

interface AgentContext {
    leadId: string;
    phoneNumber: string;
    userMessage: string;
    conversationHistory: string;
    currentState: string;
}

/**
 * Main AI Agent - processes messages and returns structured responses
 */
export async function runSalesAgent(ctx: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();
    console.log(`🤖 Sales Agent Start | Lead: ${ctx.leadId} | State: ${ctx.currentState}`);

    try {
        // Pick prompt based on state
        const basePrompt = ctx.currentState === 'qualified' || ctx.currentState === 'booked'
            ? BOOKING_AGENT_PROMPT
            : SALES_AGENT_PROMPT;

        // Inject context
        const systemPrompt = basePrompt
            .replace('{{CURRENT_DATE}}', format(new Date(), 'yyyy-MM-dd'))
            .replace('{{CONVERSATION_HISTORY}}', ctx.conversationHistory || 'Sin historial previo.')
            .replace('{{USER_MESSAGE}}', ctx.userMessage);

        // Generate response
        const { object: response } = await generateObject({
            model: AI_MODEL,
            schema: agentResponseSchema,
            system: systemPrompt,
            prompt: ctx.userMessage,
            temperature: 0.6,
        });

        const latency = Date.now() - startTime;
        console.log(`✅ AI Response (${latency}ms): "${response.message.substring(0, 80)}..."`);

        // Log to audit
        await logAgentDecision({
            leadId: ctx.leadId,
            latencyMs: latency,
            response,
        });

        return applyGuardrails(response);

    } catch (error) {
        console.error('❌ Sales Agent Error:', error);
        return {
            message: FALLBACK_RESPONSES.apiError,
            confidence: 0,
        };
    }
}

/**
 * Agent router - for backwards compatibility
 */
export async function routeToAgent(ctx: AgentContext): Promise<AgentResponse> {
    return runSalesAgent(ctx);
}

/**
 * Guardrails - clean up AI response
 */
function applyGuardrails(response: AgentResponse): AgentResponse {
    let message = response.message;

    // Remove dangerous promises
    const badPatterns = [
        /garantizamos?\s+retorno/gi,
        /prometemos?\s+ganancias?/gi,
        /100%\s+seguro/gi,
    ];

    for (const pattern of badPatterns) {
        message = message.replace(pattern, 'estimamos');
    }

    // Truncate if too long
    if (message.length > 500) {
        message = message.substring(0, 497) + '...';
    }

    return { ...response, message };
}

/**
 * Log AI decision to audit_logs
 */
async function logAgentDecision(params: {
    leadId: string;
    latencyMs: number;
    response: AgentResponse;
}): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabaseAdmin.from('audit_logs').insert({
            lead_id: params.leadId,
            event_type: 'ai_response',
            model_used: 'deepseek-chat',
            latency_ms: params.latencyMs,
            payload: {
                message: params.response.message,
                confidence: params.response.confidence,
                toolCalls: params.response.toolCalls,
                nextState: params.response.nextState,
            },
        } as any);
    } catch (error) {
        console.error('Failed to log:', error);
    }
}

/**
 * Helper to get date suggestions for the AI
 */
export function getNextBusinessDays(count: number = 3): string[] {
    const days: string[] = [];
    let date = new Date();

    while (days.length < count) {
        date = addDays(date, 1);
        const dayOfWeek = date.getDay();
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days.push(format(date, 'yyyy-MM-dd'));
        }
    }

    return days;
}
