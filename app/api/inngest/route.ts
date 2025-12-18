import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processWhatsAppMessage } from "@/inngest/functions";
import { theSheriff } from "@/inngest/sheriff";

export const maxDuration = 60; // Allow 60s for AI processing (DeepSeek R1)

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        processWhatsAppMessage,
        theSheriff,
    ],
});
