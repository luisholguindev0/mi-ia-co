/**
 * lib/booking.ts
 * Pure booking logic for appointment management
 * Business hours: Mon-Fri, 9 AM - 5 PM Colombia Time (UTC-5)
 */

import { supabaseAdmin } from '@/lib/db';

const BUSINESS_HOURS = {
    start: 9, // 9 AM
    end: 17,  // 5 PM
    slotDuration: 60, // minutes
    timezone: 'America/Bogota',
};

const WORKING_DAYS = [1, 2, 3, 4, 5]; // Monday = 1, Friday = 5

interface TimeSlot {
    date: string;
    startTime: string;
    endTime: string;
    available: boolean;
}

interface Appointment {
    id: string;
    leadId: string;
    startTime: string;
    endTime: string;
    status: string;
}

/**
 * Get available time slots for a given date
 * Checks against existing appointments in the database
 */
export async function getAvailableSlots(date: string): Promise<TimeSlot[]> {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    // Check if it's a working day
    if (!WORKING_DAYS.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
        return []; // Weekend or non-working day
    }

    // Get existing appointments for this date
    const startOfDay = `${date}T00:00:00-05:00`;
    const endOfDay = `${date}T23:59:59-05:00`;

    const { data: existingAppointments, error } = await supabaseAdmin
        .from('appointments')
        .select('start_time, end_time')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .in('status', ['unconfirmed', 'confirmed']);

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    // Generate all possible slots
    const slots: TimeSlot[] = [];
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

        // Check if slot conflicts with existing appointments
        const slotStart = new Date(`${date}T${startTime}:00-05:00`);
        const slotEnd = new Date(`${date}T${endTime}:00-05:00`);

        const isBooked = existingAppointments?.some((apt) => {
            const aptStart = new Date(apt.start_time);
            const aptEnd = new Date(apt.end_time);
            return slotStart < aptEnd && slotEnd > aptStart;
        });

        slots.push({
            date,
            startTime,
            endTime,
            available: !isBooked,
        });
    }

    return slots;
}

/**
 * Book a specific time slot for a lead
 * Returns the created appointment or null if slot is taken
 */
export async function bookSlot(
    leadId: string,
    date: string,
    startTime: string,
    notes?: string
): Promise<Appointment | null> {
    const startDateTime = `${date}T${startTime}:00-05:00`;
    const endDateTime = `${date}T${parseInt(startTime.split(':')[0]) + 1}:00:00-05:00`;

    // Use upsert with conflict detection (leverages the no_overlap constraint)
    const { data, error } = await supabaseAdmin
        .from('appointments')
        .insert({
            lead_id: leadId,
            start_time: startDateTime,
            end_time: endDateTime,
            status: 'unconfirmed',
            notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Booking error:', error);
        return null; // Likely a constraint violation (overlap)
    }

    return {
        id: data.id,
        leadId: data.lead_id,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status,
    };
}

/**
 * Confirm an appointment
 */
export async function confirmAppointment(appointmentId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

    return !error;
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(appointmentId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

    return !error;
}

/**
 * Get next available slot (useful for quick suggestions)
 */
export async function getNextAvailableSlot(): Promise<TimeSlot | null> {
    const today = new Date();

    // Check next 14 days
    for (let i = 0; i < 14; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);

        const dateStr = checkDate.toISOString().split('T')[0];
        const slots = await getAvailableSlots(dateStr);
        const available = slots.find((s) => s.available);

        if (available) {
            return available;
        }
    }

    return null;
}
