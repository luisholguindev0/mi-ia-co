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
        const t0 = Date.now();
        console.log(`⏱️ Processing Start: ${t0}`);

        try {
            const { from, text, name, timestamp } = event.data;
            const phoneNumber = from;

            // Step 1: Get or Create Lead
            const t1Start = Date.now();
            console.log(`⏱️ Step 1 Start (Get/Create Lead): ${t1Start} - Phone: ${phoneNumber}`);
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
            console.log(`⏱️ Step 1 End. Duration: ${Date.now() - t1Start}ms`);

            // Step 2: AI Processing (The "Brain")
            const t2Start = Date.now();
            console.log(`⏱️ Step 2 Start (AI Gen): ${t2Start}`);
            const aiResponse = await step.run("generate-ai-response", async () => {
                const innerT = Date.now();
                try {
                    const response = await routeToAgent({
                        leadId: lead.id,
                        phoneNumber: lead.phone_number,
                        userMessage: text,
                        currentState: lead.status || "new",
                    });
                    console.log(`⏱️ Inner AI Gen Duration: ${Date.now() - innerT}ms`);
                    return response;
                } catch (err: any) {
                    console.error(`❌ AI Gen Failed after ${Date.now() - innerT}ms:`, err);
                    throw err;
                }
            });
            console.log(`⏱️ Step 2 End. Duration: ${Date.now() - t2Start}ms`);

            // Step 3: Send Response to WhatsApp
            const t3Start = Date.now();
            console.log(`⏱️ Step 3 Start (WhatsApp Send): ${t3Start}`);
            await step.run("send-whatsapp-reply", async () => {
                console.log(`Sending response to ${phoneNumber}: ${aiResponse.message}`);
                try {
                    await sendWhatsAppMessage(phoneNumber, aiResponse.message);
                } catch (e: any) {
                    console.error(`WhatsApp Send Failed: ${e.message}`);
                    throw e;
                }
            });
            console.log(`⏱️ Step 3 End. Duration: ${Date.now() - t3Start}ms`);

            // Step 4: Handle Tool Calls
            if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
                const t4Start = Date.now();
                await step.run("handle-tool-calls", async () => {
                    console.log("Tool calls executed:", aiResponse.toolCalls);
                });
                console.log(`⏱️ Step 4 (Tools) Duration: ${Date.now() - t4Start}ms`);
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

            console.log(`⏱️ TOTAL PROCESS DURATION: ${Date.now() - t0}ms`);
            return { success: true, leadId: lead.id };
        } catch (error: any) {
            console.error("FATAL INNGEST ERROR:", error);
            // Optional: Log to audit_logs
            return { error: error.message };
        }
    }
);
