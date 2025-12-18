/**
 * lib/testing/persona-ai.ts
 * AI engine to generate realistic persona responses using Deepseek
 */

import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';
import type { Persona } from './personas';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY!,
});

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Generate persona's response to AI message
 */
export async function generatePersonaResponse(
    persona: Persona,
    aiMessage: string,
    conversationHistory: Message[]
): Promise<string> {
    const systemPrompt = buildPersonaPrompt(persona, conversationHistory.length);

    try {
        const result = await generateText({
            model: deepseek('deepseek-chat'),
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
                    content: m.content,
                })),
                { role: 'assistant', content: aiMessage },
            ],
            temperature: 0.8,
        });

        return result.text.trim();
    } catch (error) {
        console.error('Error generating persona response:', error);
        // Fallback response
        return generateFallbackResponse(persona, aiMessage);
    }
}

/**
 * Build the system prompt for the persona
 */
function buildPersonaPrompt(persona: Persona, turnNumber: number): string {
    return `You are roleplaying as ${persona.name}, a ${persona.businessType} owner in ${persona.location}.

BACKSTORY:
${persona.backstory}

YOUR GOALS:
${persona.goals.map(g => `- ${g}`).join('\n')}

YOUR PERSONALITY:
- Patience: ${persona.behavior.patienceLevel}
- Price Sensitivity: ${persona.behavior.pricesSensitivity}
- Trust Level: ${persona.behavior.trustLevel}
- Tech Savvy: ${persona.behavior.techSavvy}

FRUSTRATION TRIGGERS:
${persona.frustrationTriggers.length > 0 ? persona.frustrationTriggers.map(t => `- ${t}`).join('\n') : 'None'}

INSTRUCTIONS:
1. You are chatting with an AI assistant about your business needs
2. Respond naturally in Colombian Spanish (use "tú" informal)
3. Keep responses SHORT (1-2 sentences max)
4. Stay in character based on your personality traits
5. If you encounter a frustration trigger, show frustration
6. Turn ${turnNumber + 1} of conversation

${getPersonaBehaviorInstructions(persona, turnNumber)}

CRITICAL: Respond ONLY as ${persona.name}. Do not break character. Max 2 sentences.`;
}

/**
 * Get behavior instructions based on persona and turn number
 */
function getPersonaBehaviorInstructions(persona: Persona, turnNumber: number): string {
    if (persona.expectedOutcome === 'abandons' && turnNumber >= 3) {
        return `IMPORTANT: You are getting FRUSTRATED. If the AI asks too many questions or doesn't answer your question directly, say something like "Olvídalo, qué pésimo servicio" and end the conversation.`;
    }

    if (persona.expectedOutcome === 'books' && turnNumber >= 5) {
        return `IMPORTANT: You are ready to book. If the AI suggests a time, accept it immediately with "Perfecto, agenda para [time]" or similar.`;
    }

    if (persona.expectedOutcome === 'researching') {
        return `IMPORTANT: You are just gathering information, not ready to commit. Ask detailed questions but politely decline booking.`;
    }

    return '';
}

/**
 * Fallback response if AI generation fails
 */
function generateFallbackResponse(persona: Persona, aiMessage: string): string {
    if (aiMessage.toLowerCase().includes('horario') || aiMessage.toLowerCase().includes('disponibilidad')) {
        return 'Mañana a la 1pm me funciona';
    }

    if (aiMessage.toLowerCase().includes('precio') || aiMessage.toLowerCase().includes('costo')) {
        if (persona.behavior.pricesSensitivity === 'high') {
            return 'Me parece muy caro. Tienen algo más económico?';
        }
        return 'Entiendo. Cuánto tiempo tomaría el proyecto?';
    }

    return 'Ok, cuéntame más';
}
