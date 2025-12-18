import { createClient } from '@/utils/supabase/server'
import { RealtimeFeed } from '@/components/admin/RealtimeFeed'
import { KanbanBoard } from '@/components/admin/KanbanBoard'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Force dynamic behavior so the server client logic (cookies) runs on every request
// or we can just rely on middleware protection.
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Summary Stats
    const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
    const { count: appointmentCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
    const { count: activeLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).neq('status', 'closed_lost')

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Mission Control</h1>
                        <p className="text-zinc-400 text-sm">Welcome back, {user.email}</p>
                    </div>
                    <div className="flex gap-4">
                        <form action="/auth/signout" method="post">
                            <button className="text-sm text-zinc-500 hover:text-white transition-colors">Sign Out</button>
                        </form>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard label="Total Leads" value={leadCount || 0} trend="+12%" />
                    <KpiCard label="Active Conversations" value={activeLeads || 0} trend="+5%" />
                    <KpiCard label="Appointments" value={appointmentCount || 0} trend="+2%" />
                    <KpiCard label="Conversion Rate" value="3.2%" trend="+0.4%" />
                </div>

                {/* Main Grid: Feed + Chat Interceptor (Mock) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <RealtimeFeed />
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-[600px]">
                            <KanbanBoard />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ label, value, trend }: { label: string, value: string | number, trend: string }) {
    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
            <dt className="truncate text-sm font-medium text-zinc-400">{label}</dt>
            <dd className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight text-white">{value}</span>
                <span className="text-sm font-medium text-emerald-400">{trend}</span>
            </dd>
        </div>
    )
}
