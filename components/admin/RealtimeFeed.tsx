'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Activity, Circle, Clock, MessageSquare, Phone } from 'lucide-react'
import { format } from 'date-fns'

type AuditEvent = {
    id: string
    created_at: string
    event_type: string
    payload: Record<string, unknown>
    lead_id: string
}

export function RealtimeFeed() {
    const [events, setEvents] = useState<AuditEvent[]>([])
    const supabase = createClient()

    useEffect(() => {
        // Initial fetch of recent logs
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) setEvents(data)
        }

        fetchRecent()

        // Subscribe to new inserts
        const channel = supabase
            .channel('realtime-feed')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'audit_logs',
                },
                (payload) => {
                    console.log('Realtime event:', payload)
                    setEvents((prev) => [payload.new as AuditEvent, ...prev].slice(0, 50))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl h-[600px] flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Live Cortex Activity
                </h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-zinc-500">Connected</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {events.length === 0 && (
                    <div className="text-center text-zinc-500 py-10 text-sm">
                        Waiting for neural activity...
                    </div>
                )}

                {events.map((event) => (
                    <div
                        key={event.id}
                        className="group relative flex gap-4 pl-4 transition-all hover:bg-zinc-800/30 p-3 rounded-lg border border-transparent hover:border-zinc-800"
                    >
                        {/* Timeline Line */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-800 group-hover:bg-zinc-700 ml-1.5" />

                        <div className="relative z-10 mt-1">
                            <div className="flex bg-zinc-900 border border-zinc-700 rounded-full p-1.5">
                                {getIconForEvent(event.event_type)}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-zinc-200 truncate">
                                    {formatEventType(event.event_type)}
                                </p>
                                <span className="text-xs text-zinc-500 whitespace-nowrap">
                                    {format(new Date(event.created_at), 'HH:mm:ss')}
                                </span>
                            </div>

                            <p className="text-xs text-zinc-400 mt-0.5 font-mono truncate">
                                {JSON.stringify(event.payload).slice(0, 60)}...
                            </p>

                            {event.lead_id && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700/50">
                                        LEAD: {event.lead_id.split('-')[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function getIconForEvent(type: string) {
    if (type.includes('webhook')) return <Phone className="w-3 h-3 text-blue-400" />
    if (type.includes('thought')) return <Circle className="w-3 h-3 text-purple-400" />
    if (type.includes('message')) return <MessageSquare className="w-3 h-3 text-green-400" />
    if (type.includes('error')) return <Activity className="w-3 h-3 text-red-400" />
    return <Clock className="w-3 h-3 text-zinc-400" />
}

function formatEventType(type: string) {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
