#!/usr/bin/env tsx
/**
 * scripts/init-business-settings.ts
 * Initialize business_settings table with default values
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/db';

async function initSettings() {
    console.log('🔧 Initializing business settings...\n');

    const settings = [
        {
            key: 'business_hours',
            value: {
                monday: { enabled: true, start: '09:00', end: '17:00' },
                tuesday: { enabled: true, start: '09:00', end: '17:00' },
                wednesday: { enabled: true, start: '09:00', end: '17:00' },
                thursday: { enabled: true, start: '09:00', end: '17:00' },
                friday: { enabled: true, start: '09:00', end: '17:00' },
                saturday: { enabled: true, start: '09:00', end: '13:00' }, // Enable Saturday for testing
                sunday: { enabled: false, start: '00:00', end: '00:00' },
            },
        },
        { key: 'slot_duration', value: { minutes: 60 } },
        { key: 'timezone', value: { value: 'America/Bogota' } },
        { key: 'booking_buffer', value: { hours: 1 } }, // Reduced to 1 hour for testing
        { key: 'max_daily_appointments', value: { value: 8 } },
    ];

    for (const setting of settings) {
        // Upsert each setting
        const { error } = await supabaseAdmin
            .from('business_settings')
            .upsert(
                { key: setting.key, value: setting.value } as any,
                { onConflict: 'key' }
            );

        if (error) {
            console.log(`❌ ${setting.key}: ${error.message}`);
        } else {
            console.log(`✅ ${setting.key}: initialized`);
        }
    }

    console.log('\n📋 Current settings:');
    const { data } = await supabaseAdmin.from('business_settings').select('*');
    data?.forEach(s => {
        console.log(`   ${s.key}: ${JSON.stringify(s.value)}`);
    });

    // Test getAvailableSlots for tomorrow
    console.log('\n🧪 Testing getAvailableSlots...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    console.log(`   Date: ${dateStr} (${tomorrow.toLocaleDateString('es-CO', { weekday: 'long' })})`);

    const { getAvailableSlots } = await import('../lib/booking');
    const slots = await getAvailableSlots(dateStr);

    console.log(`   Total slots: ${slots.length}`);
    console.log(`   Available slots: ${slots.filter(s => s.available).length}`);
    slots.slice(0, 5).forEach(slot => {
        console.log(`     - ${slot.startTime}-${slot.endTime}: ${slot.available ? '✓' : '✗'}`);
    });
}

initSettings().catch(console.error);
