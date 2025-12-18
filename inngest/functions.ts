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
    { id: "process-whatsapp-message", concurrency: 10 }, // Rate limit processing
    { event: "whatsapp/message.received" },
    async ({ event, step }) => {
        const { from, text, name, timestamp } = event.data;
        const phoneNumber = from;

        // Step 1: Get or Create Lead
        const lead = await step.run("get-or-create-lead", async () => {
            // Check if lead exists
            const { data: existingLead } = await supabaseAdmin
                .from("leads")
                .select("*")
                .eq("phone_number", phoneNumber)
                .single();

            if (existingLead) {
                // Update last active
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
            // Update DB with user message (optional, for history)
            // For now, we rely on the context being passed to the agent

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
            await sendWhatsAppMessage(phoneNumber, aiResponse.message);
        });

        // Step 4: Handle Tool Calls (e.g. Booking) if any
        if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
            await step.run("handle-tool-calls", async () => {
                // Log tool calls to audit (already done inside agents.ts partialy, but good to track here)
                console.log("Tool calls executed:", aiResponse.toolCalls);

                // If booking happened, we might want to send a confirmation
                // For this MVP, the 'message' from the AI already includes the confirmation text
            });
        }

        // Step 5: Update Lead Status if changed
        if (aiResponse.nextState && aiResponse.nextState !== lead.status) {
            await step.run("update-lead-status", async () => {
                await supabaseAdmin
                    .from("leads")
                    .update({ status: aiResponse.nextState })
                    .eq("id", lead.id);
            });
        }

        return { success: true, leadId: lead.id };
    }
);
