/**
 * lib/utils/date-utils.ts
 * Utility to parse Spanish relative dates into ISO format
 * Used by AI tool executor to handle natural language dates
 */

/**
 * Parse Spanish date expressions into YYYY-MM-DD format
 * Examples:
 *   "mañana" → "2025-12-20"
 *   "jueves" → next Thursday's date
 *   "próximo lunes" → next Monday's date
 *   "miércoles a las 10am" → next Wednesday's date
 *   "2025-12-25" → "2025-12-25" (passthrough)
 */
export function parseSpanishDate(input: string): string | null {
    if (!input) return null;

    const text = input.toLowerCase().trim();
    const today = new Date();

    // Already in ISO format? Return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    // Try to extract YYYY-MM-DD from longer string
    const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
        return isoMatch[1];
    }

    // "hoy" → today
    if (text.includes('hoy')) {
        return formatDate(today);
    }

    // "mañana" → tomorrow
    if (text.includes('mañana') || text.includes('manana')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return formatDate(tomorrow);
    }

    // "pasado mañana" → day after tomorrow
    if (text.includes('pasado mañana') || text.includes('pasado manana')) {
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);
        return formatDate(dayAfter);
    }

    // Spanish day names → find next occurrence
    const dayNames: { [key: string]: number } = {
        'domingo': 0, 'dom': 0,
        'lunes': 1, 'lun': 1,
        'martes': 2, 'mar': 2,
        'miércoles': 3, 'miercoles': 3, 'mie': 3, 'mié': 3,
        'jueves': 4, 'jue': 4,
        'viernes': 5, 'vie': 5,
        'sábado': 6, 'sabado': 6, 'sab': 6, 'sáb': 6,
    };

    for (const [dayName, dayNumber] of Object.entries(dayNames)) {
        if (text.includes(dayName)) {
            return formatDate(getNextDayOfWeek(dayNumber));
        }
    }

    // "próxima semana" or "la siguiente semana" - default to next Monday
    if (text.includes('próxima semana') || text.includes('proxima semana') || text.includes('siguiente semana')) {
        return formatDate(getNextDayOfWeek(1)); // Monday
    }

    // If nothing matched, return null (caller should handle)
    return null;
}

/**
 * Parse Spanish time expressions into HH:MM format (24-hour)
 * Examples:
 *   "10am" → "10:00"
 *   "3pm" → "15:00"
 *   "a las 7" → "07:00"
 *   "7 de la mañana" → "07:00"
 *   "4 de la tarde" → "16:00"
 */
export function parseSpanishTime(input: string): string | null {
    if (!input) return null;

    const text = input.toLowerCase().trim();

    // Already in HH:MM format?
    const hhmmMatch = text.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
        const hour = parseInt(hhmmMatch[1]).toString().padStart(2, '0');
        return `${hour}:${hhmmMatch[2]}`;
    }

    // Try to find hour patterns
    // Pattern: "7am", "10am", "3pm", etc.
    const ampmMatch = text.match(/(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/);
    if (ampmMatch) {
        let hour = parseInt(ampmMatch[1]);
        const isPM = ampmMatch[2].startsWith('p');

        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;

        return `${hour.toString().padStart(2, '0')}:00`;
    }

    // Pattern: "a las 7", "las 10", etc.
    const alasMatch = text.match(/(?:a\s+)?las?\s+(\d{1,2})(?::(\d{2}))?/);
    if (alasMatch) {
        let hour = parseInt(alasMatch[1]);
        const minutes = alasMatch[2] || '00';

        // Assume AM for hours >= 7 and <= 12, PM for others (business hours heuristic)
        if (hour >= 1 && hour <= 6) {
            hour += 12; // Assume PM for 1-6
        }

        // Check for "de la tarde" or "de la mañana"
        if (text.includes('tarde') || text.includes('noche')) {
            if (hour <= 12) hour += 12;
        }
        if (text.includes('mañana') && hour >= 13) {
            hour -= 12;
        }

        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }

    // Pattern: just a number "7", "10" - assume business hours
    const justNumber = text.match(/^(\d{1,2})$/);
    if (justNumber) {
        let hour = parseInt(justNumber[1]);
        // Business hours heuristic: 7-17 are reasonable
        if (hour >= 7 && hour <= 17) {
            return `${hour.toString().padStart(2, '0')}:00`;
        }
    }

    return null;
}

/**
 * Get the next occurrence of a specific day of week
 * @param targetDay 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
function getNextDayOfWeek(targetDay: number): Date {
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntilTarget = targetDay - currentDay;

    // If it's the same day or past, go to next week
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);
    return nextDate;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse a combined date/time string and extract both components
 * Example: "miércoles a las 7am" → { date: "2025-12-25", time: "07:00" }
 */
export function parseDateTimeFromNaturalLanguage(input: string): { date: string | null; time: string | null } {
    const date = parseSpanishDate(input);
    const time = parseSpanishTime(input);
    return { date, time };
}
