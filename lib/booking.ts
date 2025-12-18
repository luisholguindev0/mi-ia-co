/**
 * lib/booking.ts
 * Pure booking logic for appointment management
 * Business hours are now loaded dynamically from database
 */

import { supabaseAdmin } from '@/lib/db';
import { getBusinessSettings, getDaySchedule } from '@/lib/settings';

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
 * Now uses dynamic business hours from database
 */
export async function getAvailableSlots(date: string): Promise<TimeSlot[]> {
    const targetDate = new Date(date);
    const settings = await getBusinessSettings();
    const daySchedule = await getDaySchedule(targetDate);

    // Check if it's a working day
    if (!daySchedule.enabled) {
        return []; // Day is disabled
    }

    // Parse hours from schedule
    const startHour = parseInt(daySchedule.start.split(':')[0]);
    const endHour = parseInt(daySchedule.end.split(':')[0]);

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

    // Generate all possible slots based on dynamic hours
    const slots: TimeSlot[] = [];
    const slotDuration = settings.slotDuration / 60; // Convert to hours

    for (let hour = startHour; hour < endHour; hour += slotDuration) {
        const startTime = `${String(Math.floor(hour)).padStart(2, '0')}:${String((hour % 1) * 60).padStart(2, '0').slice(0, 2) || '00'}`;
        const endHourCalc = hour + slotDuration;
        const endTime = `${String(Math.floor(endHourCalc)).padStart(2, '0')}:${String((endHourCalc % 1) * 60).padStart(2, '0').slice(0, 2) || '00'}`;

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
    const settings = await getBusinessSettings();
    const daySchedule = await getDaySchedule(new Date(date));

    // Guard: Day must be enabled
    if (!daySchedule.enabled) {
        console.error(`Cannot book: ${date} is not a working day`);
        return null;
    }

    // Parse and validate times
    const startHour = parseInt(startTime.split(':')[0]);
    const slotDurationHours = settings.slotDuration / 60;
    const endHour = startHour + slotDurationHours;

    const scheduleStartHour = parseInt(daySchedule.start.split(':')[0]);
    const scheduleEndHour = parseInt(daySchedule.end.split(':')[0]);

    // Guard: End time must be within business hours
    if (endHour > scheduleEndHour) {
        console.error(`Cannot book slot: end time ${endHour}:00 exceeds business hours (${scheduleEndHour}:00)`);
        return null;
    }

    // Guard: Start time must be within business hours
    if (startHour < scheduleStartHour) {
        console.error(`Cannot book slot: start time ${startHour}:00 is before business hours (${scheduleStartHour}:00)`);
        return null;
    }

    // Guard: Cannot book in the past
    const bookingDate = new Date(`${date}T${startTime}:00-05:00`);
    const now = new Date();
    const bufferMs = settings.bookingBuffer * 60 * 60 * 1000;

    if (bookingDate.getTime() < now.getTime() + bufferMs) {
        console.error(`Cannot book slot: must be at least ${settings.bookingBuffer} hours in advance`);
        return null;
    }

    const startDateTime = `${date}T${startTime}:00-05:00`;
    const endDateTime = `${date}T${String(Math.floor(endHour)).padStart(2, '0')}:00:00-05:00`;

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
        leadId: data.lead_id as string,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status as string,
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
