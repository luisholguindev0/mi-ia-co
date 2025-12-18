'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleAiStatus(leadId: string, paused: boolean) {
    const supabase = await createClient()
    await supabase
        .from('leads')
        .update({ ai_paused: paused })
        .eq('id', leadId)

    revalidatePath(`/admin/leads/${leadId}`)
}

export async function sendManualMessage(leadId: string, content: string) {
    const supabase = await createClient()

    // 1. Log message to DB so UI updates immediately
    const { error } = await supabase.from('messages').insert({
        lead_id: leadId,
        content,
        role: 'human_agent'
    })

    if (error) console.error('Error logging manual message:', error)

    // 2. Call WhatsApp API (TODO: Use the actual implementation from lib/whatsapp/api.ts)
    // For now, we simulate the audit log so the "brain" knows it happened.
    await supabase.from('audit_logs').insert({
        lead_id: leadId,
        event_type: 'human_intervention',
        payload: { content },
        latency_ms: 0,
        input_tokens: 0,
        output_tokens: 0
    })

    // TODO: Actual WhatsApp Send API Call
    /*
    await sendWhatsAppMessage(phoneNumber, content);
    */

    revalidatePath(`/admin/leads/${leadId}`)
}
