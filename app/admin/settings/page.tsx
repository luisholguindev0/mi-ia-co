import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/db';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch current settings
    const { data: settings, error } = await supabaseAdmin
        .from('business_settings')
        .select('*')
        .order('key');

    if (error) {
        console.error('Failed to fetch settings:', error);
    }

    // Transform to a more usable format
    const settingsMap: Record<string, { value: unknown; description: string; updatedAt: string }> = {};
    if (settings) {
        for (const setting of settings) {
            settingsMap[setting.key] = {
                value: setting.value,
                description: setting.description || '',
                updatedAt: setting.updated_at || new Date().toISOString(),
            };
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        ⚙️ Business Settings
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Configure business hours, appointment slots, and availability
                    </p>
                </header>

                <SettingsForm settings={settingsMap} userId={user.id} />
            </div>
        </div>
    );
}
