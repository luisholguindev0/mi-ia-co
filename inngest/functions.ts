/**
 * inngest/functions.ts
 * The "Cortex" of the application.
 * Processes incoming WhatsApp events asynchronously.
 * 
 * ARCHITECTURE (v2 - With Memory):
 * 1. Get/Create Lead
 * 2. Save incoming user message to `messages` table
 * 3. Fetch conversation history (last 20 messages)
 * 4. Format history and pass to AI agent
 * 5. Generate AI response with full context
 * 6. Save AI response to `messages` table
 * 7. Send to WhatsApp
 * 8. Handle tool calls / state transitions
 */

import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/db";
import { routeToAgent } from "@/lib/ai/agents";
import { sendWhatsAppMessage } from "@/lib/whatsapp/api";
import { executeToolCalls } from "@/lib/ai/executor";
import {
    BUSINESS_CONFIG,
    sanitizeInput,
    isRateLimited,
    containsPII,
    redactPII
} from "@/lib/config";

// Configuration from centralized config
const MAX_HISTORY_MESSAGES = BUSINESS_CONFIG.ai.maxHistoryMessages;

/**
 * Format messages array into a conversation string for the AI
 */
function formatConversationHistory(messages: Array<{ role: string; content: string }>): string {
    if (!messages || messages.length === 0) {
        return "No hay historial de conversación previo.";
    }

    return messages
        .map((msg) => {
            const roleLabel = msg.role === "user" ? "Usuario" :
                msg.role === "assistant" ? "Asistente (Tú)" :
                    msg.role === "human_agent" ? "Agente Humano" : "Sistema";
            return `${roleLabel}: ${msg.content}`;
        })
        .join("\n\n");
}

export const processWhatsAppMessage = inngest.createFunction(
    {
        id: "process-whatsapp-message",
        // PER-LEAD CONCURRENCY: Only 1 message per phone number at a time
        // This prevents race conditions and ensures message ordering
        concurrency: [
            { limit: 1, key: "event.data.from" }
        ]
    },
    { event: "whatsapp/message.received" },
    async ({ event, step }) => {
        const t0 = Date.now();
        const messageId = event.data.messageId; // Use WhatsApp message ID for idempotency
        console.log(`⏱️ Processing Start: ${t0} | MsgID: ${messageId}`);

        try {
            const { from, name } = event.data;
            const phoneNumber = from;

            // ═══════════════════════════════════════════════════════════════
            // GUARD: Rate limiting
            // ═══════════════════════════════════════════════════════════════
            if (isRateLimited(phoneNumber)) {
                console.log(`🚫 Rate limited: ${phoneNumber}`);
                return { success: false, rateLimited: true, phoneNumber };
            }

            // ═══════════════════════════════════════════════════════════════
            // SANITIZE: Clean and validate input
            // ═══════════════════════════════════════════════════════════════
            const rawText = event.data.text;
            const text = sanitizeInput(rawText);

            // Log PII warning (for audit, not blocking)
            if (containsPII(text)) {
                console.warn(`⚠️ PII detected in message from ${phoneNumber}`);
                // Log redacted version for debugging
                console.log(`📝 Redacted: ${redactPII(text)}`);
            }

            // ═══════════════════════════════════════════════════════════════
            // STEP 1: Get or Create Lead
            const t1Start = Date.now();
            console.log(`⏱️ Step 1 Start (Get/Create Lead): Phone=${phoneNumber}`);

            const lead = await step.run(`get-lead-${messageId}`, async () => {
                const { data: existingLead } = await supabaseAdmin
                    .from("leads")
                    .select("*")
                    .eq("phone_number", phoneNumber)
                    .single();

                if (existingLead) {
                    // Update last_active timestamp
                    await supabaseAdmin
                        .from("leads")
                        .update({ last_active: new Date().toISOString() })
                        .eq("id", existingLead.id);
                    return existingLead;
                }

                // Create new lead
                const { data: newLead, error } = await supabaseAdmin
                    .from("leads")
                    .insert({
                        phone_number: phoneNumber,
                        profile: { name: name || null },
                        status: "new",
                    })
                    .select()
                    .single();

                if (error) throw new Error(`Failed to create lead: ${error.message}`);
                return newLead;
            });
            console.log(`⏱️ Step 1 End. Duration: ${Date.now() - t1Start}ms | LeadID: ${lead.id}`);

            // Check if AI is paused for this lead (God Mode active)
            if (lead.ai_paused) {
                console.log(`⚠️ AI paused for lead ${lead.id}. Saving message but not responding.`);
                // Still save the message even if AI is paused
                await step.run(`save-user-msg-paused-${messageId}`, async () => {
                    await supabaseAdmin.from("messages").insert({
                        lead_id: lead.id,
                        role: "user",
                        content: text,
                    });
                });
                return { success: true, aiPaused: true, leadId: lead.id };
            }

            // ═══════════════════════════════════════════════════════════════
            // GUARD: Skip empty messages (emojis only, media, etc.)
            // ═══════════════════════════════════════════════════════════════
            if (!text || text.trim() === '') {
                console.log(`⚠️ Empty message from ${phoneNumber}, skipping AI processing`);
                return { success: true, skipped: 'empty_message', leadId: lead.id };
            }

            // ═══════════════════════════════════════════════════════════════
            // STEP 2: Save User Message to Database
            // ═══════════════════════════════════════════════════════════════
            const t2Start = Date.now();
            console.log(`⏱️ Step 2 Start (Save User Message)`);

            await step.run(`save-user-msg-${messageId}`, async () => {
                const { error } = await supabaseAdmin.from("messages").insert({
                    lead_id: lead.id,
                    role: "user",
                    content: text,
                });
                if (error) {
                    console.error("Failed to save user message:", error);
                    // Don't throw - we can still try to respond
                }
            });
            console.log(`⏱️ Step 2 End. Duration: ${Date.now() - t2Start}ms`);

            // ═══════════════════════════════════════════════════════════════
            // STEP 3: Fetch Conversation History
            // ═══════════════════════════════════════════════════════════════
            const t3Start = Date.now();
            console.log(`⏱️ Step 3 Start (Fetch History)`);

            const conversationHistory = await step.run(`fetch-history-${messageId}`, async () => {
                const { data: messages, error } = await supabaseAdmin
                    .from("messages")
                    .select("role, content, created_at")
                    .eq("lead_id", lead.id)
                    .order("created_at", { ascending: true })
                    .limit(MAX_HISTORY_MESSAGES);

                if (error) {
                    console.error("Failed to fetch history:", error);
                    return [];
                }
                return messages || [];
            });

            const historyString = formatConversationHistory(conversationHistory);
            console.log(`⏱️ Step 3 End. Duration: ${Date.now() - t3Start}ms | Messages: ${conversationHistory.length}`);

            // ═══════════════════════════════════════════════════════════════
            // STEP 4: AI Processing (The "Brain" with Memory)
            // ═══════════════════════════════════════════════════════════════
            const t4Start = Date.now();
            console.log(`⏱️ Step 4 Start (AI Generation)`);

            const aiResponse = await step.run(`ai-generate-${messageId}`, async () => {
                const innerT = Date.now();
                try {
                    const response = await routeToAgent({
                        leadId: lead.id,
                        phoneNumber: lead.phone_number,
                        userMessage: text,
                        conversationHistory: historyString, // NEW: Inject history
                        conversationSummary: lead.conversation_summary, // NEW: Inject long-term memory
                        currentState: lead.status || "new",
                    });
                    console.log(`⏱️ Inner AI Duration: ${Date.now() - innerT}ms | Confidence: ${response.confidence}`);
                    return response;
                } catch (err: unknown) {
                    console.error(`❌ AI Error after ${Date.now() - innerT}ms:`, err);
                    throw err;
                }
            });
            console.log(`⏱️ Step 4 End. Duration: ${Date.now() - t4Start}ms`);

            // ═══════════════════════════════════════════════════════════════
            // STEP 5: Save AI Response to Database
            // ═══════════════════════════════════════════════════════════════
            const t5Start = Date.now();
            console.log(`⏱️ Step 5 Start (Save AI Response)`);

            await step.run(`save-ai-msg-${messageId}`, async () => {
                const { error } = await supabaseAdmin.from("messages").insert({
                    lead_id: lead.id,
                    role: "assistant",
                    content: aiResponse.message,
                });
                if (error) {
                    console.error("Failed to save AI message:", error);
                }
            });
            console.log(`⏱️ Step 5 End. Duration: ${Date.now() - t5Start}ms`);

            // ═══════════════════════════════════════════════════════════════
            // STEP 6: Send Response to WhatsApp
            // ═══════════════════════════════════════════════════════════════
            const t6Start = Date.now();
            console.log(`⏱️ Step 6 Start (WhatsApp Send)`);

            await step.run(`whatsapp-send-${messageId}`, async () => {
                // Guard: Skip empty AI responses
                if (!aiResponse.message || aiResponse.message.trim() === '') {
                    console.warn(`⚠️ AI returned empty message, skipping WhatsApp send`);
                    return;
                }

                // Guard: Truncate very long messages (WhatsApp limit ~4096)
                let messageToSend = aiResponse.message;
                if (messageToSend.length > 4000) {
                    console.warn(`⚠️ AI message too long (${messageToSend.length}), truncating`);
                    messageToSend = messageToSend.substring(0, 3997) + '...';
                }

                console.log(`📤 Sending to ${phoneNumber}: "${messageToSend.substring(0, 100)}..."`);
                await sendWhatsAppMessage(phoneNumber, messageToSend);
            });
            console.log(`⏱️ Step 6 End. Duration: ${Date.now() - t6Start}ms`);

            // ═══════════════════════════════════════════════════════════════
            // STEP 7: Handle Tool Calls (if any)
            // ═══════════════════════════════════════════════════════════════
            if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
                const t7Start = Date.now();
                console.log(`⏱️ Step 7 Start (Tool Calls): ${aiResponse.toolCalls.length} calls`);

                await step.run(`tools-${messageId}`, async () => {
                    // Execute all tool calls (profile updates, booking, handoff)
                    const results = await executeToolCalls(aiResponse.toolCalls!, lead.id, lead);

                    console.log("📋 Tool execution results:", JSON.stringify(results));

                    // Log to audit for observability
                    await supabaseAdmin.from("audit_logs").insert({
                        lead_id: lead.id,
                        event_type: "tool_execution",
                        payload: {
                            toolCalls: aiResponse.toolCalls,
                            results: results,
                        },
                        latency_ms: Date.now() - t7Start,
                    });
                });
                console.log(`⏱️ Step 7 End. Duration: ${Date.now() - t7Start}ms`);
            }

            // ═══════════════════════════════════════════════════════════════
            // STEP 8: Update Lead Status (if changed)
            // ═══════════════════════════════════════════════════════════════
            if (aiResponse.nextState && aiResponse.nextState !== lead.status) {
                await step.run(`update-status-${messageId}`, async () => {
                    console.log(`📊 Status transition: ${lead.status} → ${aiResponse.nextState}`);
                    await supabaseAdmin
                        .from("leads")
                        .update({ status: aiResponse.nextState })
                        .eq("id", lead.id);
                });
            }



            // ═══════════════════════════════════════════════════════════════
            // STEP 9: Auto-Summarization (Long-term Memory)
            // ═══════════════════════════════════════════════════════════════
            await step.run(`summarize-check-${messageId}`, async () => {
                // Check total message count for this lead
                const { count } = await supabaseAdmin
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("lead_id", lead.id);

                // Run summary every 20 messages
                if (count && count > 0 && count % 20 === 0) {
                    console.log(`🧠 Triggering Auto-Summarization (Count: ${count})`);

                    // Fetch all messages since last summary? 
                    // For simplicity in V1, we fetch the last 20 messages and merge with current summary
                    const { data: recentMessages } = await supabaseAdmin
                        .from("messages")
                        .select("role, content")
                        .eq("lead_id", lead.id)
                        .order("created_at", { ascending: false }) // Get latest
                        .limit(20);

                    // Import dynamically to avoid circular deps if any, or just use the imported one
                    const { summarizeConversation } = await import("@/lib/ai/agents");

                    // Reverse to chronological order for the AI
                    const chronology = (recentMessages || []).reverse();

                    const newSummary = await summarizeConversation(
                        lead.conversation_summary,
                        chronology
                    );

                    console.log(`📝 New Summary Generated: ${newSummary.substring(0, 50)}...`);

                    // Save to leads table
                    await supabaseAdmin
                        .from("leads")
                        .update({ conversation_summary: newSummary })
                        .eq("id", lead.id);

                    // Log event
                    await supabaseAdmin.from("audit_logs").insert({
                        lead_id: lead.id,
                        event_type: "memory_summarization",
                        payload: { old_summary_len: lead.conversation_summary?.length || 0, new_summary_len: newSummary.length },
                        latency_ms: 0,
                    });
                }
            });

            const totalDuration = Date.now() - t0;
            console.log(`✅ COMPLETE: ${totalDuration}ms | Lead: ${lead.id} | History: ${conversationHistory.length} msgs`);

            return {
                success: true,
                leadId: lead.id,
                durationMs: totalDuration,
                historySize: conversationHistory.length,
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;

            console.error("❌ FATAL ERROR:", errorMessage);

            // Log error to audit_logs for debugging
            try {
                await supabaseAdmin.from("audit_logs").insert({
                    event_type: "inngest_error",
                    payload: {
                        error: errorMessage,
                        stack: errorStack,
                        event: event.data
                    },
                    latency_ms: Date.now() - t0,
                });
            } catch (logError) {
                console.error("Failed to log error:", logError);
            }

            return { error: errorMessage };
        }
    }
);
