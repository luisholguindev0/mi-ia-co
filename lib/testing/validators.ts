/**
 * lib/testing/validators.ts
 * Validation logic for E2E tests
 */

import 'dotenv/config';
import { supabaseAdmin } from '@/lib/db';

export interface ValidationResult {
    passed: boolean;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Validate that a lead was created
 */
export async function validateLeadCreated(phoneNumber: string): Promise<ValidationResult> {
    const { data: lead, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

    if (error || !lead) {
        return {
            passed: false,
            message: `Lead not created for ${phoneNumber}`,
            details: { error },
        };
    }

    return {
        passed: true,
        message: `Lead created successfully`,
        details: { leadId: lead.id, status: lead.status },
    };
}

/**
 * Validate that messages were saved
 */
export async function validateMessagesSaved(
    phoneNumber: string,
    expectedMinCount: number
): Promise<ValidationResult> {
    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single();

    if (!lead) {
        return {
            passed: false,
            message: 'Lead not found for message validation',
        };
    }

    const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('lead_id', lead.id);

    if (error) {
        return {
            passed: false,
            message: 'Error fetching messages',
            details: { error },
        };
    }

    const count = messages?.length || 0;

    if (count < expectedMinCount) {
        return {
            passed: false,
            message: `Expected at least ${expectedMinCount} messages, found ${count}`,
            details: { count, messages },
        };
    }

    return {
        passed: true,
        message: `Messages saved correctly (${count} messages)`,
        details: { count },
    };
}

/**
 * Validate that an appointment was booked
 */
export async function validateAppointmentBooked(phoneNumber: string): Promise<ValidationResult> {
    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single();

    if (!lead) {
        return {
            passed: false,
            message: 'Lead not found for appointment validation',
        };
    }

    const { data: appointments, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('lead_id', lead.id);

    if (error) {
        return {
            passed: false,
            message: 'Error fetching appointments',
            details: { error },
        };
    }

    if (!appointments || appointments.length === 0) {
        return {
            passed: false,
            message: 'No appointment created',
            details: { appointments },
        };
    }

    const appointment = appointments[0];

    if (appointment.status !== 'confirmed') {
        return {
            passed: false,
            message: `Appointment status is '${appointment.status}', expected 'confirmed'`,
            details: { appointment },
        };
    }

    return {
        passed: true,
        message: `Appointment booked successfully`,
        details: {
            appointmentId: appointment.id,
            startTime: appointment.start_time,
            status: appointment.status,
        },
    };
}

/**
 * Validate sentiment logging for abandonment
 */
export async function validateSentimentLogged(
    phoneNumber: string,
    expectedSignalType: 'frustration' | 'abandonment'
): Promise<ValidationResult> {
    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single();

    if (!lead) {
        return {
            passed: false,
            message: 'Lead not found for sentiment validation',
        };
    }

    const { data: logs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('lead_id', lead.id)
        .eq('event_type', 'negative_sentiment_detected');

    if (error) {
        return {
            passed: false,
            message: 'Error fetching audit logs',
            details: { error },
        };
    }

    if (!logs || logs.length === 0) {
        return {
            passed: false,
            message: 'No sentiment logging found',
        };
    }

    const log = logs[logs.length - 1]; // Get most recent
    const signalType = log.payload?.signal_type;

    if (signalType !== expectedSignalType) {
        return {
            passed: false,
            message: `Expected signal type '${expectedSignalType}', got '${signalType}'`,
            details: { log },
        };
    }

    return {
        passed: true,
        message: `Sentiment logged correctly (${signalType})`,
        details: { signalType },
    };
}

/**
 * Validate lead profile was updated
 */
export async function validateProfileUpdated(phoneNumber: string): Promise<ValidationResult> {
    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('profile')
        .eq('phone_number', phoneNumber)
        .single();

    if (!lead) {
        return {
            passed: false,
            message: 'Lead not found for profile validation',
        };
    }

    const profile = lead.profile as Record<string, unknown>;

    if (!profile || Object.keys(profile).length === 0) {
        return {
            passed: false,
            message: 'Profile not updated',
            details: { profile },
        };
    }

    return {
        passed: true,
        message: 'Profile updated with data',
        details: { profileKeys: Object.keys(profile) },
    };
}
