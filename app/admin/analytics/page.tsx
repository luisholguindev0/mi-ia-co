import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, TrendingUp, Users, Calendar, Target } from 'lucide-react'
import { AnalyticsCharts } from './AnalyticsCharts'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch aggregated data
    const { data: leads } = await supabase
        .from('leads')
        .select('id, status, profile, lead_score, created_at')

    /* const { count: totalMessages } = */ await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

    const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })

    // Calculate stats
    const totalLeads = leads?.length || 0
    const qualifiedLeads = leads?.filter(l => ['qualified', 'booked'].includes(l.status)).length || 0
    const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0'

    // Group by status
    const statusBreakdown = leads?.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
    }, {} as Record<string, number>) || {}

    // Group by industry
    const industryBreakdown = leads?.reduce((acc, lead) => {
        const profile = lead.profile as { industry?: string } | null
        const industry = profile?.industry || 'unknown'
        acc[industry] = (acc[industry] || 0) + 1
        return acc
    }, {} as Record<string, number>) || {}

    // Group by pain points
    const painPointsBreakdown: Record<string, number> = {}
    leads?.forEach(lead => {
        const profile = lead.profile as { pain_points?: string[] } | null
        const painPoints = profile?.pain_points || []
        painPoints.forEach((pp: string) => {
            painPointsBreakdown[pp] = (painPointsBreakdown[pp] || 0) + 1
        })
    })

    // Prepare chart data
    const statusData = Object.entries(statusBreakdown).map(([name, value]) => ({ name, value }))
    const industryData = Object.entries(industryBreakdown).map(([name, value]) => ({ name, value }))
    const painPointsData = Object.entries(painPointsBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/admin/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Marketing Analytics</h1>
                        <p className="text-zinc-400 text-sm">Lead intelligence & conversion insights</p>
                    </div>
                    <a
                        href="/api/export/leads"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </a>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard icon={Users} label="Total Leads" value={totalLeads} />
                    <KpiCard icon={Target} label="Qualified" value={qualifiedLeads} accent="emerald" />
                    <KpiCard icon={TrendingUp} label="Conversion Rate" value={`${conversionRate}%`} accent="blue" />
                    <KpiCard icon={Calendar} label="Appointments" value={totalAppointments || 0} accent="purple" />
                </div>

                {/* Charts */}
                <AnalyticsCharts
                    statusData={statusData}
                    industryData={industryData}
                    painPointsData={painPointsData}
                />

                {/* Data Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Industry Breakdown */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Industry Breakdown</h3>
                        <div className="space-y-3">
                            {Object.entries(industryBreakdown).map(([industry, count]) => (
                                <div key={industry} className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-300 capitalize">{industry}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${(count / totalLeads) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-zinc-500 w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Pain Points */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Top Pain Points</h3>
                        <div className="space-y-3">
                            {painPointsData.length > 0 ? painPointsData.map(({ name, value }) => (
                                <div key={name} className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-300">{name}</span>
                                    <span className="text-sm text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{value} leads</span>
                                </div>
                            )) : (
                                <p className="text-zinc-500 text-sm">No pain points detected yet. AI will extract these from conversations.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ icon: Icon, label, value, accent = 'indigo' }: {
    icon: React.ComponentType<{ className?: string }>,
    label: string,
    value: string | number,
    accent?: 'indigo' | 'emerald' | 'blue' | 'purple'
}) {
    const accentColors: Record<string, string> = {
        indigo: 'text-indigo-400',
        emerald: 'text-emerald-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
    }

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${accentColors[accent]}`} />
                <dt className="truncate text-sm font-medium text-zinc-400">{label}</dt>
            </div>
            <dd className="text-3xl font-semibold tracking-tight text-white">{value}</dd>
        </div>
    )
}
