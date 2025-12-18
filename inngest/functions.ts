/**
 * inngest/functions.ts
 * The "Cortex" of the application.
 * Processes incoming WhatsApp events asynchronously.
 */

import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/db";
import { routeToAgent } from "@/lib/ai/agents";
import { sendWhatsAppMessage } from "@/lib/whatsapp/api";

export const processWhatsAppMessage = inngest.createFunction(
    { id: "process-whatsapp-message", concurrency: 4 }, // Rate limit processing (Free Tier Max is 5)
    { event: "whatsapp/message.received" },
    async ({ event, step }) => {
        try {
            const { from, text, name, timestamp } = event.data;
            const phoneNumber = from;

            // Step 1: Get or Create Lead
            const lead = await step.run("get-or-create-lead", async () => {
                const { data: existingLead } = await supabaseAdmin
                    .from("leads")
                    .select("*")
                    .eq("phone_number", phoneNumber)
                    .single();

                if (existingLead) {
                    await supabaseAdmin
                        .from("leads")
                        .update({ last_active: new Date().toISOString() })
                        .eq("id", existingLead.id);
                    return existingLead;
                }

                const { data: newLead, error } = await supabaseAdmin
                    .from("leads")
                    .insert({
                        phone_number: phoneNumber,
                        profile: { name: name },
                        status: "new",
                    })
                    .select()
                    .single();

                if (error) throw new Error(`Failed to create lead: ${error.message}`);
                return newLead;
            });

            // Step 2: AI Processing (The "Brain")
            const aiResponse = await step.run("generate-ai-response", async () => {
                const response = await routeToAgent({
                    leadId: lead.id,
                    phoneNumber: lead.phone_number,
                    userMessage: text,
                    currentState: lead.status || "new",
                });
                return response;
            });

            // Step 3: Send Response to WhatsApp
            await step.run("send-whatsapp-reply", async () => {
                console.log(`Sending response to ${phoneNumber}: ${aiResponse.message}`);
                try {
                    await sendWhatsAppMessage(phoneNumber, aiResponse.message);
                } catch (e: any) {
                    // Log potential token/auth errors
                    console.error(`WhatsApp Send Failed: ${e.message}`);
                    throw e;
                }
            });

            // Step 4: Handle Tool Calls
            if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
                await step.run("handle-tool-calls", async () => {
                    console.log("Tool calls executed:", aiResponse.toolCalls);
                });
            }

            // Step 5: Update Lead Status
            if (aiResponse.nextState && aiResponse.nextState !== lead.status) {
                await step.run("update-lead-status", async () => {
                    await supabaseAdmin
                        .from("leads")
                        .update({ status: aiResponse.nextState })
                        .eq("id", lead.id);
                });
            }

            return { success: true, leadId: lead.id };
        } catch (error: any) {
            console.error("FATAL INNGEST ERROR:", error);
            // Optional: Log to audit_logs
            return { error: error.message };
        }
    }
);
