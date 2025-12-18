/**
 * lib/ai/executor.ts
 * Tool Execution Engine
 * Executes tool calls returned by the AI agents
 */

import { supabaseAdmin } from '@/lib/db';
import { getAvailableSlots, bookSlot } from '@/lib/booking';
import type { AgentResponse } from './tools';

interface Lead {
    id: string;
    phone_number: string;
    profile: Record<string, unknown>;
    status: string;
    lead_score: number;
    ai_paused: boolean;
}

interface ToolExecutionResult {
    tool: string;
    success: boolean;
    result?: unknown;
    error?: string;
}

/**
 * Execute all tool calls from an AI response
 * Returns results that can be used in follow-up messages
 */
export async function executeToolCalls(
    toolCalls: NonNullable<AgentResponse['toolCalls']>,
    leadId: string,
    lead: Lead
): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const call of toolCalls) {
        console.log(`🔧 Executing tool: ${call.tool}`, JSON.stringify(call.args));

        try {
            switch (call.tool) {
                case 'updateLeadProfile': {
                    const args = call.args as {
                        name?: string;
                        company?: string;
                        role?: string;
                        industry?: string;
                        location?: string;
                        painPoints?: string[];
                        contactReason?: string;
                        leadScore?: number;
                    };

                    // Merge new profile data with existing
                    const currentProfile = (lead.profile || {}) as Record<string, unknown>;
                    const newProfile: Record<string, unknown> = {
                        ...currentProfile,
                        ...(args.name && { name: args.name }),
                        ...(args.company && { company: args.company }),
                        ...(args.role && { role: args.role }),
                        ...(args.industry && { industry: args.industry }),
                        ...(args.location && { location: args.location }),
                        ...(args.contactReason && { contact_reason: args.contactReason }),
                    };

                    // Merge pain points (don't replace, append unique)
                    if (args.painPoints && args.painPoints.length > 0) {
                        const existingPainPoints = (currentProfile.pain_points as string[]) || [];
                        const allPainPoints = [...new Set([...existingPainPoints, ...args.painPoints])];
                        newProfile.pain_points = allPainPoints;
                    }

                    // Update database
                    const { error } = await supabaseAdmin
                        .from('leads')
                        .update({
                            profile: newProfile as any,
                            ...(args.leadScore !== undefined && { lead_score: args.leadScore }),
                        })
                        .eq('id', leadId);

                    if (error) throw new Error(error.message);

                    console.log(`✅ Lead profile updated:`, newProfile);
                    results.push({ tool: 'updateLeadProfile', success: true, result: newProfile });
                    break;
                }

                case 'checkAvailability': {
                    const args = call.args as { date?: string };

                    if (!args.date) {
                        console.warn('⚠️ checkAvailability called without date. Asking user for date.');
                        results.push({
                            tool: 'checkAvailability',
                            success: false,
                            error: 'Por favor, proporciona una fecha específica (YYYY-MM-DD) para verificar la disponibilidad.'
                        });
                        break;
                    }

                    // Validate date format
                    if (isNaN(new Date(args.date).getTime())) {
                        results.push({
                            tool: 'checkAvailability',
                            success: false,
                            error: 'Formato de fecha inválido. Usa YYYY-MM-DD.'
                        });
                        break;
                    }

                    try {
                        const slots = await getAvailableSlots(args.date);
                        const availableSlots = slots.filter(s => s.available);

                        console.log(`✅ Found ${availableSlots.length} available slots for ${args.date}`);
                        results.push({ tool: 'checkAvailability', success: true, result: availableSlots });
                    } catch (err) {
                        console.error('Error in getAvailableSlots:', err);
                        results.push({ tool: 'checkAvailability', success: false, error: 'Error interno verificando disponibilidad.' });
                    }
                    break;
                }

                case 'bookSlot': {
                    const args = call.args as {
                        date: string;
                        startTime: string;
                        leadName: string;
                        notes?: string;
                    };

                    const appointment = await bookSlot(
                        leadId,
                        args.date,
                        args.startTime,
                        args.notes
                    );

                    if (appointment) {
                        console.log(`✅ Appointment booked:`, appointment);
                        results.push({ tool: 'bookSlot', success: true, result: appointment });
                    } else {
                        results.push({ tool: 'bookSlot', success: false, error: 'Slot unavailable or conflict' });
                    }
                    break;
                }

                case 'handoffToHuman': {
                    const args = call.args as {
                        reason: string;
                        urgency: 'low' | 'medium' | 'high';
                        summary: string;
                    };

                    // Pause AI for this lead
                    await supabaseAdmin
                        .from('leads')
                        .update({ ai_paused: true })
                        .eq('id', leadId);

                    // Log the handoff request
                    await supabaseAdmin.from('audit_logs').insert({
                        lead_id: leadId,
                        event_type: 'handoff_requested',
                        payload: {
                            reason: args.reason,
                            urgency: args.urgency,
                            summary: args.summary,
                        },
                        latency_ms: 0,
                    });

                    // TODO: Send notification to Luis (email, push, etc.)
                    console.log(`🚨 HANDOFF REQUESTED for lead ${leadId}:`, args);
                    results.push({ tool: 'handoffToHuman', success: true, result: args });
                    break;
                }

                default:
                    console.warn(`⚠️ Unknown tool: ${call.tool}`);
                    results.push({ tool: call.tool, success: false, error: 'Unknown tool' });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Tool execution failed (${call.tool}):`, error);
            results.push({ tool: call.tool, success: false, error: errorMessage });
        }
    }

    return results;
}
