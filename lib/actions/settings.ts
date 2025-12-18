'use server';

import { supabaseAdmin } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { clearSettingsCache } from '@/lib/settings';

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
        throw new Error(`Failed to update setting: ${error.message}`);
    }

    // Clear cache so next reads get fresh data
    clearSettingsCache();

    // Revalidate the settings page
    revalidatePath('/admin/settings');

    return true;
}
