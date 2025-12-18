'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppMessage } from '@/lib/whatsapp/api'

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

    // 1. Get the lead's phone number
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('phone_number')
        .eq('id', leadId)
        .single()

    if (leadError || !lead) {
        console.error('Error fetching lead for manual message:', leadError)
        return { error: 'Lead not found' }
    }

    // 2. Log message to DB so UI updates immediately
    const { error: msgError } = await supabase.from('messages').insert({
        lead_id: leadId,
        content,
        role: 'human_agent'
    })

    if (msgError) console.error('Error logging manual message:', msgError)

    // 3. Send to WhatsApp
    try {
        await sendWhatsAppMessage(lead.phone_number, content)
        console.log(`✅ Manual message sent to ${lead.phone_number}`)
    } catch (whatsappError: unknown) {
        const errorMessage = whatsappError instanceof Error ? whatsappError.message : String(whatsappError);
        console.error('WhatsApp send failed:', whatsappError)
        // Still log the attempt
        await supabase.from('audit_logs').insert({
            lead_id: leadId,
            event_type: 'whatsapp_send_failed',
            payload: { content, error: errorMessage },
            latency_ms: 0,
        })
        return { error: 'WhatsApp send failed' }
    }

    // 4. Log audit trail
    await supabase.from('audit_logs').insert({
        lead_id: leadId,
        event_type: 'human_intervention',
        payload: { content, phone: lead.phone_number },
        latency_ms: 0,
    })

    revalidatePath(`/admin/leads/${leadId}`)
    return { success: true }
}

