/**
 * lib/settings.ts
 * Dynamic Business Settings Service
 * Reads configuration from database instead of env vars
 * Includes caching for performance
 */

import { supabaseAdmin } from '@/lib/db';

// Cache settings for 30 seconds to balance DB load and real-time responsiveness
const CACHE_TTL_MS = 30 * 1000;
const settingsCache: Map<string, { value: unknown; expiresAt: number }> = new Map();

// Type definitions for settings
export interface DaySchedule {
    enabled: boolean;
    start: string; // "09:00"
    end: string;   // "17:00"
}

export interface BusinessHours {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

export interface BusinessSettings {
    businessHours: BusinessHours;
    slotDuration: number;    // minutes
    timezone: string;
    bookingBuffer: number;   // hours in advance
    maxDailyAppointments: number;
}

// Default fallback values (used if DB is unavailable)
const DEFAULT_SETTINGS: BusinessSettings = {
    businessHours: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '13:00' },
        sunday: { enabled: false, start: '00:00', end: '00:00' },
    },
    slotDuration: 60,
    timezone: 'America/Bogota',
    bookingBuffer: 2,
    maxDailyAppointments: 8,
};

/**
 * Get a single setting from the database with caching
 */
async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const now = Date.now();
    const cached = settingsCache.get(key);

    if (cached && cached.expiresAt > now) {
        return cached.value as T;
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('business_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) {
            console.warn(`Setting '${key}' not found, using default`);
            return defaultValue;
        }

        const value = data.value as T;
        settingsCache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
        return value;
    } catch (error) {
        console.error(`Error fetching setting '${key}':`, error);
        return defaultValue;
    }
}

/**
 * Get all business settings
 */
export async function getBusinessSettings(): Promise<BusinessSettings> {
    const [businessHours, slotDuration, timezone, bookingBuffer, maxDaily] = await Promise.all([
        getSetting<BusinessHours>('business_hours', DEFAULT_SETTINGS.businessHours),
        getSetting<{ minutes: number }>('slot_duration', { minutes: DEFAULT_SETTINGS.slotDuration }),
        getSetting<{ value: string }>('timezone', { value: DEFAULT_SETTINGS.timezone }),
        getSetting<{ hours: number }>('booking_buffer', { hours: DEFAULT_SETTINGS.bookingBuffer }),
        getSetting<{ value: number }>('max_daily_appointments', { value: DEFAULT_SETTINGS.maxDailyAppointments }),
    ]);

    return {
        businessHours,
        slotDuration: slotDuration.minutes,
        timezone: timezone.value,
        bookingBuffer: bookingBuffer.hours,
        maxDailyAppointments: maxDaily.value,
    };
}

/**
 * Update a business setting
 */
export async function updateSetting(key: string, value: unknown, userId?: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('business_settings')
        .update({
            value,
            updated_at: new Date().toISOString(),
            updated_by: userId || null,
        })
        .eq('key', key);

    if (error) {
        console.error(`Failed to update setting '${key}':`, error);
        return false;
    }

    // Invalidate cache
    settingsCache.delete(key);
    return true;
}

/**
 * Clear all cached settings (useful after bulk updates)
 */
export function clearSettingsCache(): void {
    settingsCache.clear();
}

/**
 * Get business hours for a specific day
 */
export async function getDaySchedule(date: Date): Promise<DaySchedule> {
    const settings = await getBusinessSettings();
    const days: (keyof BusinessHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    return settings.businessHours[dayName];
}

/**
 * Check if a specific date/time is within business hours
 */
export async function isWithinBusinessHours(date: Date): Promise<boolean> {
    const schedule = await getDaySchedule(date);

    if (!schedule.enabled) {
        return false;
    }

    const timeString = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: (await getBusinessSettings()).timezone,
    });

    return timeString >= schedule.start && timeString < schedule.end;
}

/**
 * Format business hours for AI prompt injection
 */
export async function formatBusinessHoursForAI(): Promise<string> {
    const settings = await getBusinessSettings();
    const dayNames: { [key: string]: string } = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo',
    };

    const lines: string[] = [];
    for (const [day, schedule] of Object.entries(settings.businessHours)) {
        if (schedule.enabled) {
            lines.push(`- ${dayNames[day]}: ${schedule.start} - ${schedule.end}`);
        } else {
            lines.push(`- ${dayNames[day]}: Cerrado`);
        }
    }

    return `Horario de Atención (Zona: ${settings.timezone}):\n${lines.join('\n')}`;
}
