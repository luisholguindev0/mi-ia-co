/**
 * lib/testing/ai-persona-engine.ts
 * Intelligent persona AI that maintains context, personality, and natural conversation flow
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

interface PersonaState {
    personality: Persona;
    conversationHistory: Message[];
    sharedInformation: Set<string>; // Track what info was already shared
    emotionalState: 'curious' | 'skeptical' | 'eager' | 'frustrated' | 'decided';
    turnsSinceProgress: number;
    goalProgress: number; // 0-100
    askedQuestions: Set<string>; // Questions persona has asked
}

export class PersonaEngine {
    private state: PersonaState;

    constructor(persona: Persona) {
        this.state = {
            personality: persona,
            conversationHistory: [],
            sharedInformation: new Set(),
            emotionalState: this.getInitialEmotion(persona),
            turnsSinceProgress: 0,
            goalProgress: 0,
            askedQuestions: new Set(),
        };
    }

    private getInitialEmotion(persona: Persona): PersonaState['emotionalState'] {
        if (persona.behavior.patienceLevel === 'low') return 'frustrated';
        if (persona.expectedOutcome === 'abandons') return 'skeptical';
        if (persona.expectedOutcome === 'books') return 'eager';
        return 'curious';
    }

    async generateResponse(aiMessage: string): Promise<string> {
        // Add AI message to history
        this.state.conversationHistory.push({
            role: 'assistant',
            content: aiMessage,
        });

        // Update emotional state based on conversation
        this.updateEmotionalState(aiMessage);

        // Generate context-aware prompt
        const systemPrompt = this.buildSystemPrompt(aiMessage);

        try {
            const result = await generateText({
                model: deepseek('deepseek-chat'),
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `AI's latest message: "${aiMessage}"\n\nRespond naturally as ${this.state.personality.name}:` },
                ],
                temperature: 0.9, // High creativity to avoid repetition
            });

            const response = result.text.trim();

            // Track what information was shared
            this.extractSharedInformation(response);

            // Add to conversation history
            this.state.conversationHistory.push({
                role: 'user',
                content: response,
            });

            // Update progress
            this.updateGoalProgress(aiMessage, response);

            return response;
        } catch (error) {
            console.error('PersonaEngine error:', error);
            // Fallback to simple response
            return this.generateEmergencyFallback(aiMessage);
        }
    }

    private buildSystemPrompt(aiMessage: string): string {
        const { personality, sharedInformation, emotionalState, turnsSinceProgress } = this.state;

        return `You are ${personality.name}, a ${personality.businessType} owner in ${personality.location}.

BACKSTORY & PERSONALITY:
${personality.backstory}

YOUR TRAITS:
- Patience Level: ${personality.behavior.patienceLevel}
- Price Sensitivity: ${personality.behavior.pricesSensitivity}
- Trust Level: ${personality.behavior.trustLevel}
- Tech Savviness: ${personality.behavior.techSavvy}

YOUR CURRENT GOAL:
${this.getGoalDescription()}

YOUR EMOTIONAL STATE: ${emotionalState}
${turnsSinceProgress > 3 ? '⚠️ WARNING: AI keeps asking questions without progress - you are getting impatient!' : ''}

INFORMATION YOU'VE ALREADY SHARED:
${Array.from(sharedInformation).join(', ') || 'Nothing yet'}

CONVERSATION SO FAR:
${this.formatConversationHistory()}

CRITICAL RULES:
1. NEVER repeat information you've already shared
2. Respond DIRECTLY to the AI's question - be specific
3. Act like a REAL human - use natural language, emotions
4. If AI asks the same question twice, say "Ya te dije eso antes..."
5. If you're ${emotionalState}, show it in your tone
6. Vary your language - use different words each time
7. Progress toward your goal naturally (don't rush or stall)
8. ${this.getEmotionalGuidance()}

RESPONSE GUIDELINES:
- Keep it 1-3 sentences
- Be conversational (WhatsApp style)
- Use Colombian Spanish naturally
- Show your personality
- Make decisions when it feels right

Respond as ${personality.name}:`;
    }

    private getGoalDescription(): string {
        const { personality } = this.state;

        switch (personality.expectedOutcome) {
            case 'books':
                return `You WANT this service and plan to book an appointment. You'll ask relevant questions, but once your concerns are addressed, you'll commit. Your pain points are: ${personality.frustrationTriggers.join(', ')}`;
            case 'abandons':
                return `You're interested initially but will abandon due to: ${personality.frustrationTriggers[0]}. You'll engage a bit but ultimately decide it's not for you.`;
            case 'researching':
                return `You're researching options for your business. You'll ask detailed questions and want to think it over. You won't book immediately but might schedule a follow-up.`;
            default:
                return 'You want to learn about the service';
        }
    }

    private getEmotionalGuidance(): string {
        switch (this.state.emotionalState) {
            case 'frustrated':
                return 'Show frustration - use phrases like "ya te dije...", "entiendo pero...", "esto es muy complicado"';
            case 'skeptical':
                return 'Be cautious - ask "¿cómo sé que...?", "¿tienen referencias?", "¿por qué debería...?"';
            case 'eager':
                return 'Show enthusiasm - use "perfecto!", "me interesa mucho", "cuándo podemos empezar?"';
            case 'decided':
                return 'You\'ve made your decision - either commit fully or politely decline';
            default:
                return 'Be naturally curious and engaged';
        }
    }

    private formatConversationHistory(): string {
        const last3Turns = this.state.conversationHistory.slice(-6); // Last 3 exchanges
        return last3Turns.map((msg, i) =>
            `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`
        ).join('\n');
    }

    private updateEmotionalState(aiMessage: string): void {
        const lowerMsg = aiMessage.toLowerCase();

        // Check for repetitive questions
        if (this.state.turnsSinceProgress > 3) {
            this.state.emotionalState = 'frustrated';
            return;
        }

        // Detect booking attempt
        if (lowerMsg.includes('agenda') || lowerMsg.includes('horario') || lowerMsg.includes('cita')) {
            if (this.state.personality.expectedOutcome === 'books' && this.state.goalProgress > 60) {
                this.state.emotionalState = 'decided';
            }
        }

        // Detect value proposition
        if (lowerMsg.includes('beneficio') || lowerMsg.includes('ayudar') || lowerMsg.includes('solución')) {
            if (this.state.emotionalState === 'skeptical') {
                this.state.emotionalState = 'curious';
            }
        }

        // Price discussion
        if (lowerMsg.includes('precio') || lowerMsg.includes('costo') || lowerMsg.includes('inversión')) {
            if (this.state.personality.behavior.pricesSensitivity === 'high') {
                this.state.emotionalState = 'skeptical';
            }
        }
    }

    private extractSharedInformation(response: string): void {
        const lowerResponse = response.toLowerCase();

        // Extract key info shared
        if (lowerResponse.includes(this.state.personality.name.toLowerCase())) {
            this.state.sharedInformation.add('name');
        }
        if (lowerResponse.includes(this.state.personality.location.toLowerCase())) {
            this.state.sharedInformation.add('location');
        }
        if (lowerResponse.includes('negocio') || lowerResponse.includes('empresa')) {
            this.state.sharedInformation.add('business_type');
        }
        if (lowerResponse.includes('necesito') || lowerResponse.includes('quiero')) {
            this.state.sharedInformation.add('needs');
        }
    }

    private updateGoalProgress(aiMessage: string, response: string): void {
        const lowerAiMsg = aiMessage.toLowerCase();
        const lowerResponse = response.toLowerCase();

        let progressMade = false;

        // Progress indicators
        if (lowerAiMsg.includes('?')) {
            // AI asked a clarifying question
            if (lowerResponse.length > 20 && !this.isRepetitive(response)) {
                progressMade = true;
                this.state.goalProgress += 10;
            }
        }

        // Booking flow progress
        if (lowerAiMsg.includes('agenda') || lowerAiMsg.includes('horario')) {
            if (this.state.personality.expectedOutcome === 'books') {
                progressMade = true;
                this.state.goalProgress += 25;
            }
        }

        // Value demonstration
        if (lowerAiMsg.includes('beneficio') || lowerAiMsg.includes('ayudar')) {
            progressMade = true;
            this.state.goalProgress += 15;
        }

        // Update turns since progress
        if (progressMade) {
            this.state.turnsSinceProgress = 0;
        } else {
            this.state.turnsSinceProgress++;
        }

        // Cap at 100
        this.state.goalProgress = Math.min(100, this.state.goalProgress);
    }

    private isRepetitive(response: string): boolean {
        // Check if this response is too similar to previous ones
        const recentResponses = this.state.conversationHistory
            .filter(m => m.role === 'user')
            .slice(-3)
            .map(m => m.content.toLowerCase());

        const responseLower = response.toLowerCase();
        return recentResponses.some(prev =>
            prev === responseLower || this.calculateSimilarity(prev, responseLower) > 0.8
        );
    }

    private calculateSimilarity(str1: string, str2: string): number {
        // Simple similarity check
        const words1 = new Set(str1.split(' '));
        const words2 = new Set(str2.split(' '));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        return intersection.size / Math.max(words1.size, words2.size);
    }

    private generateEmergencyFallback(aiMessage: string): string {
        const { personality, emotionalState } = this.state;

        if (emotionalState === 'frustrated') {
            return 'Esto es muy complicado. Déjame pensarlo y te escribo después.';
        }

        if (personality.expectedOutcome === 'books' && aiMessage.toLowerCase().includes('horario')) {
            return 'Mañana en la tarde me funciona bien. Agendemos.';
        }

        return 'Ok, entiendo. Cuéntame más.';
    }

    public shouldEndConversation(): boolean {
        // End if goal is achieved
        if (this.state.goalProgress >= 100) {
            return true;
        }

        // End if abandoner and frustrated
        if (this.state.personality.expectedOutcome === 'abandons' &&
            this.state.emotionalState === 'frustrated' &&
            this.state.conversationHistory.length >= 8) {
            return true;
        }

        // End if too many turns without progress
        if (this.state.turnsSinceProgress > 5) {
            return true;
        }

        return false;
    }

    public getState(): PersonaState {
        return { ...this.state };
    }
}
