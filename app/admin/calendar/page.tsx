import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { CalendarClient } from './CalendarClient';

export default async function AdminCalendarPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch appointments for initial hydration
    // in client we will subscribe to realtime
    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            *,
            leads (
                profile,
                phone_number
            )
        `)
        .gte('start_time', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()) // Fetch this month
        .order('start_time', { ascending: true });

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Mi IA Calendar</h1>
                        <p className="text-zinc-400 text-sm">Manage your agenda. AI respects these blocks.</p>
                    </div>
                </div>

                <CalendarClient initialAppointments={appointments || []} />
            </div>
        </div>
    );
}
