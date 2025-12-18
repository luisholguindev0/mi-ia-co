/**
 * lib/ai/tools.ts
 * Zod-validated Tool Definitions for AI Agents
 * Used with Vercel AI SDK generateObject/generateText
 */

import { z } from 'zod';

// Tool: Check appointment availability
export const checkAvailabilitySchema = z.object({
    date: z.string().describe('Date to check in ISO format (YYYY-MM-DD)'),
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

// Tool: Book a time slot
export const bookSlotSchema = z.object({
    date: z.string().describe('Date in ISO format (YYYY-MM-DD)'),
    startTime: z.string().describe('Start time in 24h format (HH:MM)'),
    leadName: z.string().describe('Name of the person booking'),
    leadPhone: z.string().describe('Phone number of the lead'),
    notes: z.string().optional().describe('Optional notes about the meeting'),
});

export type BookSlotInput = z.infer<typeof bookSlotSchema>;

// Tool: Handoff to human
export const handoffToHumanSchema = z.object({
    reason: z.string().describe('Why the lead needs human assistance'),
    urgency: z.enum(['low', 'medium', 'high']).describe('Urgency level'),
    summary: z.string().describe('Brief conversation summary for Luis'),
});

export type HandoffToHumanInput = z.infer<typeof handoffToHumanSchema>;

// Tool: Update lead profile (progressive profiling)
// This is called by the AI to extract and save lead information during conversation
export const updateLeadProfileSchema = z.object({
    name: z.string().optional().describe('Lead\'s name'),
    company: z.string().optional().describe('Business/company name'),
    role: z.string().optional().describe('Their role: dueño, gerente, empleado, etc.'),
    industry: z.enum([
        'retail', 'technology', 'health', 'law', 'food',
        'services', 'manufacturing', 'real_estate', 'education', 'other'
    ]).optional().describe('Business industry category'),
    location: z.string().optional().describe('City or region in Colombia'),
    painPoints: z.array(z.string()).optional().describe('Specific problems they describe'),
    contactReason: z.string().optional().describe('Why they reached out'),
    leadScore: z.number().min(0).max(100).optional().describe('Quality score based on signals'),
});

export type UpdateLeadProfileInput = z.infer<typeof updateLeadProfileSchema>;

// Agent response schema (structured output)
export const agentResponseSchema = z.object({
    message: z.string().describe('The message to send to the user'),
    toolCalls: z.array(z.object({
        tool: z.enum(['checkAvailability', 'bookSlot', 'handoffToHuman', 'updateLeadProfile']),
        args: z.record(z.string(), z.unknown()),
    })).optional(),
    nextState: z.enum(['new', 'diagnosing', 'qualified', 'booked', 'nurture', 'closed_lost']).optional(),
    confidence: z.number().min(0).max(1).describe('Confidence score for the response'),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;
