'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay, addDays, getHours, setHours, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Lock, User, CheckCircle, XCircle } from 'lucide-react';
import { getBusinessSettings } from '@/lib/settings'; // We might need to fetch this or pass it down

interface Appointment {
    id: string;
    start_time: string;
    end_time: string;
    status: 'unconfirmed' | 'confirmed' | 'cancelled' | 'completed' | 'blocked';
    leads?: {
        profile: any;
        phone_number: string;
    } | null;
    notes?: string;
}

export function CalendarClient({ initialAppointments }: { initialAppointments: any[] }) {
    const supabase = createClient();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [view, setView] = useState<'month' | 'week'>('week');
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

    // Subscribe to realtime changes
    useEffect(() => {
        const channel = supabase
            .channel('calendar-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                (payload) => {
                    console.log('Calendar update:', payload);
                    // Optimized refresh: In a real app we'd merge the payload, 
                    // but fetching fresh is safer for consistency for now.
                    refreshAppointments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const refreshAppointments = async () => {
        const { data } = await supabase
            .from('appointments')
            .select(`*, leads(profile, phone_number)`)
            .gte('start_time', startOfMonth(currentDate).toISOString())
            .lte('end_time', endOfMonth(currentDate).toISOString());

        if (data) setAppointments(data as any);
    };

    // Navigation
    const nextPeriod = () => setCurrentDate(addDays(currentDate, view === 'week' ? 7 : 30));
    const prevPeriod = () => setCurrentDate(addDays(currentDate, view === 'week' ? -7 : -30));

    // Time Grid Generation (Work hours 8am - 6pm generally, strictly 8-18 for view)
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 to 18
    const days = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
    });

    const getAppointmentForSlot = (day: Date, hour: number) => {
        // Simple overlap check
        const slotStart = setHours(startOfDay(day), hour);
        return appointments.find(apt => {
            const aptStart = new Date(apt.start_time);
            return isSameDay(aptStart, day) && getHours(aptStart) === hour && apt.status !== 'cancelled';
        });
    };

    const handleSlotClick = async (day: Date, hour: number, existingApt?: Appointment) => {
        if (existingApt) {
            if (existingApt.status === 'blocked') {
                // Unblock (delete)
                if (confirm('Unblock this slot?')) {
                    await supabase.from('appointments').delete().eq('id', existingApt.id);
                }
            } else {
                // View details (mock for now)
                alert(`Appointment with: ${existingApt.leads?.profile?.name || existingApt.leads?.phone_number}\nStatus: ${existingApt.status}`);
            }
            return;
        }

        // Block logic
        // If empty, click creates a BLOCK by default for "God Mode"
        // In future can add modal to choose "Block" vs "Book"
        const slotStart = setHours(startOfDay(day), hour);
        const slotEnd = setHours(startOfDay(day), hour + 1); // 1 hour default

        // Optimistic UI to come later, for now direct mutation
        const { error } = await supabase.from('appointments').insert({
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString(),
            status: 'blocked',
            notes: 'Manual block by Admin'
        });

        if (error) {
            console.error('Error blocking slot:', error);
            alert('Failed to block slot.');
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-xl">
            {/* Toolbar */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <div className="flex items-center rounded-md border border-zinc-700 bg-zinc-800/50">
                        <button onClick={prevPeriod} className="p-1 hover:bg-zinc-700 rounded-l-md"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={nextPeriod} className="p-1 hover:bg-zinc-700 rounded-r-md"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('week')}
                        className={cn("px-3 py-1 text-sm rounded-md transition", view === 'week' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800")}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setView('month')}
                        className={cn("px-3 py-1 text-sm rounded-md transition", view === 'month' ? "bg-indigo-600 text-white" : "hover:bg-zinc-800")}
                    >
                        Month
                    </button>
                </div>
            </div>

            {/* Week View Grid */}
            {view === 'week' && (
                <div className="grid grid-cols-8 divide-x divide-zinc-800 text-sm">
                    {/* Time Header Column */}
                    <div className="bg-zinc-900/80">
                        <div className="h-12 border-b border-zinc-800"></div> {/* Spacer */}
                        {hours.map(hour => (
                            <div key={hour} className="h-20 border-b border-zinc-800 flex items-center justify-center text-zinc-500">
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {days.map(day => (
                        <div key={day.toString()} className="flex-1 min-w-0">
                            {/* Header */}
                            <div className={cn("h-12 border-b border-zinc-800 flex flex-col items-center justify-center font-medium", isSameDay(day, new Date()) ? "bg-indigo-900/20 text-indigo-400" : "")}>
                                <span className="capitalize">{format(day, 'EEE', { locale: es })}</span>
                                <span className="text-xs text-zinc-500">{format(day, 'd')}</span>
                            </div>

                            {/* Hours */}
                            {hours.map(hour => {
                                const apt = getAppointmentForSlot(day, hour);
                                const isBlocked = apt?.status === 'blocked';
                                const isConfirmed = apt?.status === 'confirmed';

                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        onClick={() => handleSlotClick(day, hour, apt)}
                                        className={cn(
                                            "h-20 border-b border-zinc-800 relative transition-all cursor-pointer group hover:bg-zinc-800/30",
                                            isBlocked && "bg-zinc-800/80 stripe-pattern", // We need a stripe pattern class or just solid
                                            isConfirmed && "bg-emerald-900/20 border-l-4 border-l-emerald-500",
                                            apt?.status === 'unconfirmed' && "bg-amber-900/20 border-l-4 border-l-amber-500"
                                        )}
                                    >
                                        {/* Content */}
                                        {apt ? (
                                            <div className="p-2 text-xs truncate">
                                                {isBlocked ? (
                                                    <div className="flex items-center justify-center h-full text-zinc-500">
                                                        <Lock className="w-5 h-5" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-white/90">
                                                            {apt.leads?.profile?.name?.split(' ')[0] || 'Lead'}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-70">
                                                            {isConfirmed ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <User className="w-3 h-3 text-amber-400" />}
                                                            {format(new Date(apt.start_time), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Empty State - Show "Block" on hover
                                            <div className="hidden group-hover:flex items-center justify-center h-full text-zinc-600">
                                                <Lock className="w-4 h-4 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Month View Placeholder */}
            {view === 'month' && (
                <div className="p-12 text-center text-zinc-500">
                    Month view coming soon. Use week view for granular control.
                </div>
            )}
        </div>
    );
}
