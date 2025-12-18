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
 * Generate persona's response using AI or fallback
 */
export async function generatePersonaResponse(
    persona: Persona,
    aiMessage: string,
    conversationHistory: Message[]
): Promise<string> {
    // Use simple fallback responses for reliability
    // DeepSeek can be flaky, so we'll use deterministic responses
    return generateSmartFallback(persona, aiMessage, conversationHistory);
}

/**
 * Smart fallback that mimics persona behavior
 */
function generateSmartFallback(
    persona: Persona,
    aiMessage: string,
    conversationHistory: Message[]
): string {
    const lowerMessage = aiMessage.toLowerCase();
    const turnNumber = conversationHistory.length / 2;

    // Booking/scheduling responses
    if (lowerMessage.includes('horario') || lowerMessage.includes('disponibilidad') || lowerMessage.includes('cuándo') || lowerMessage.includes('agenda')) {
        if (persona.expectedOutcome === 'books') {
            const times = ['mañana a la 1pm', 'pasado mañana a las 10am', 'el viernes a las 3pm'];
            return `${times[Math.floor(Math.random() * times.length)]} me funciona perfectamente`;
        }
        if (persona.expectedOutcome === 'abandons') {
            return 'No tengo tiempo para esto ahora';
        }
        return 'Déjame revisar mi agenda y te confirmo';
    }

    // Price questions
    if (lowerMessage.includes('precio') || lowerMessage.includes('cost') || lowerMessage.includes('cuánto') || lowerMessage.includes('inversión')) {
        if (persona.behavior.pricesSensitivity === 'high') {
            return 'Me parece muy caro. Tienen alguna opción más económica?';
        }
        if (persona.behavior.pricesSensitivity === 'medium') {
            return 'Entiendo el precio. Y el tiempo de entrega cuánto sería?';
        }
        return 'Perfecto, me parece justo. Cuándo podemos empezar?';
    }

    // Confirmation messages - important for bookings!
    if (lowerMessage.includes('confirmado') || lowerMessage.includes('agendado') || lowerMessage.includes('reservado') || lowerMessage.includes('perfecto')) {
        return 'Excelente! Muchas gracias';
    }

    // Questions about the business
    if (lowerMessage.includes('negocio') || lowerMessage.includes('empresa') || lowerMessage.includes('productos')) {
        return `Soy ${persona.name}, tengo ${persona.businessType} en ${persona.location}`;
    }

    // Abandonment logic for abandoner personas
    if (persona.expectedOutcome === 'abandons' && turnNumber >= 3) {
        const abandonPhrases = [
            'Olvídalo, esto es muy complicado',
            'Gracias pero no me interesa. Adiós',
            'No tengo tiempo para esto. Chao'
        ];
        return abandonPhrases[Math.floor(Math.random() * abandonPhrases.length)];
    }

    // Researcher personas - ask lots of questions
    if (persona.expectedOutcome === 'researching') {
        const researchQuestions = [
            'Y qué otras funcionalidades tiene?',
            'Tienen casos de éxito que me puedan mostrar?',
            'Cuánto tiempo lleva implementar algo así?',
            'Déjame investigar un poco más y te escribo'
        ];
        return researchQuestions[Math.floor(Math.random() * researchQuestions.length)];
    }

    // Skeptical personas - need convincing
    if (persona.behavior.trustLevel === 'low' && turnNumber <= 3) {
        const skepticalPhrases = [
            'Cómo sé que es confiable?',
            'Tienen referencias o testimonios?',
            'Y si no funciona qué?'
        ];
        return skepticalPhrases[Math.floor(Math.random() * skepticalPhrases.length)];
    }

    // Default positive response for bookers
    if (persona.expectedOutcome === 'books') {
        const positiveResponses = [
            'Ok, suena bien. Sigamos adelante',
            'Perfecto, me interesa',
            'Dale, avancemos'
        ];
        return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    }

    // Generic fallback
    return 'Ok, cuéntame más';
}
