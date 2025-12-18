'use client'

import { useState } from 'react'
import { RealtimeFeed } from '@/components/admin/RealtimeFeed'
import { KanbanBoard } from '@/components/admin/KanbanBoard'
import { LeadsTable } from '@/components/admin/LeadsTable'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Lead {
    id: string;
    phone_number: string;
    status: string;
    profile: {
        name?: string;
        company?: string;
        role?: string;
        [key: string]: unknown;
    };
    created_at: string;
    last_active?: string;
}

export function DashboardClient({ leads }: { leads: Lead[] }) {
    const [view, setView] = useState<'kanban' | 'list'>('kanban')

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <RealtimeFeed />
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Pipeline</h2>
                    <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setView('kanban')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                view === 'kanban' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                view === 'list' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="h-[600px]">
                    {view === 'kanban' ? (
                        <KanbanBoard />
                    ) : (
                        <LeadsTable leads={leads} />
                    )}
                </div>
            </div>
        </div>
    )
}
