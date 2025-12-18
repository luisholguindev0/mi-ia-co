import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp/api";

/**
 * "The Sheriff"
 * Regular cron job to maintain order in the system:
 * 1. Cancels stale unconfirmed appointments.
 * 2. Sends 24h reminders for confirmed appointments.
 */
export const theSheriff = inngest.createFunction(
    { id: "the-sheriff-cron" },
    { cron: "TZ=America/Bogota 0 * * * *" }, // Runs every hour
    async ({ step }) => {

        // Task 1: Cleanup Unconfirmed Appointments (> 1 hour old)
        const cleanupResult = await step.run("cleanup-unconfirmed", async () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

            // Find appointments that are unconfirmed and older than 1 hour
            const { data: staleAppointments, error: fetchError } = await supabaseAdmin
                .from("appointments")
                .select("id")
                .eq("status", "unconfirmed")
                .lt("created_at", oneHourAgo);

            if (fetchError) throw new Error(fetchError.message);

            if (staleAppointments && staleAppointments.length > 0) {
                const ids = staleAppointments.map(a => a.id);
                // Bulk update
                const { error: updateError } = await supabaseAdmin
                    .from("appointments")
                    .update({ status: "cancelled" })
                    .in("id", ids);

                if (updateError) throw new Error(updateError.message);

                return { cancelled: ids.length, ids };
            }
            return { cancelled: 0 };
        });

        // Task 2: Send Reminders (24h before)
        const remindersResult = await step.run("send-reminders", async () => {
            const now = new Date();
            // Look for appointments starting between 23 and 25 hours from now
            const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
            const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

            const { data: upcoming, error } = await supabaseAdmin
                .from("appointments")
                .select(`
                    id, 
                    start_time, 
                    leads!inner ( phone_number, profile )
                `)
                .eq("status", "confirmed")
                .eq("reminder_sent", false)
                .gte("start_time", windowStart)
                .lte("start_time", windowEnd);

            if (error) throw new Error(error.message);
            if (!upcoming || upcoming.length === 0) return { sent: 0 };

            let count = 0;
            const errors = [];

            for (const appointment of upcoming) {
                try {
                    const leadData = appointment.leads;
                    const lead = Array.isArray(leadData) ? leadData[0] : leadData;

                    const name = lead?.profile?.name || "Hola";
                    const phoneNumber = lead?.phone_number;

                    if (!phoneNumber) continue;

                    // Format time for Colombia
                    const date = new Date(appointment.start_time);
                    const timeStr = date.toLocaleTimeString("es-CO", {
                        timeZone: "America/Bogota",
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });

                    const message = `👋 Hola ${name}, te recordamos tu cita para mañana a las ${timeStr}. ¡Nos vemos pronto!`;

                    await sendWhatsAppMessage(phoneNumber, message);

                    // Mark as reminded
                    await supabaseAdmin
                        .from("appointments")
                        .update({ reminder_sent: true })
                        .eq("id", appointment.id);

                    count++;
                } catch (e: unknown) {
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    console.error(`Failed to send reminder for appointment ${appointment.id}:`, e);
                    errors.push({ id: appointment.id, error: errorMessage });
                }
            }

            return { sent: count, errors };
        });

        return { cleanup: cleanupResult, reminders: remindersResult };
    }
);
