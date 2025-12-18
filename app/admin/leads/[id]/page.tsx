
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ChatInterceptor } from '@/components/admin/ChatInterceptor'
import { Phone, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Define the correct params type for Next.js 15+
type LeadPageProps = {
    params: Promise<{ id: string }>
}

export default async function LeadPage({ params }: LeadPageProps) {
    // Await params FIRST in Next.js 15
    const { id } = await params

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Fetch Lead Data
    const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

    if (!lead) return notFound()

    // 2. Fetch Messages (Union of 'messages' table and potentially 'audit_logs' if we wanted to mix them, 
    // but for now we stick to 'messages' source of truth + audit logs just for debug)
    // Actually, we need to populate 'messages' table from existing history if we want to see it here.
    // For now, let's fetch from 'messages' table.
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: true })

    // 3. Fetch Appointments
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('lead_id', id)

    // Type assertion for profile
    const profile = lead.profile as { name: string, company: string, role: string, pain_points: string[] }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Breadcrumb */}
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm w-fit">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">{profile.name || lead.phone_number}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="inline-flex items-center rounded-md bg-indigo-400/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/30 uppercase">
                                {lead.status}
                            </span>
                            <span className="text-zinc-500 text-sm flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {lead.phone_number}
                            </span>
                            <span className="text-zinc-500 text-sm flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Created: {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div>
                        {/* Actions like Edit or Archive could go here */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">

                    {/* Left Column: Context & CRM Data */}
                    <div className="space-y-6 overflow-y-auto pr-2">
                        {/* Profile Card */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                            <h3 className="text-sm font-semibold text-white mb-4">Lead Profile</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs text-zinc-500 uppercase">Company</dt>
                                    <dd className="text-sm text-zinc-200">{profile.company || 'Not identified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-zinc-500 uppercase">Role</dt>
                                    <dd className="text-sm text-zinc-200">{profile.role || 'Not identified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-zinc-500 uppercase">Pain Points</dt>
                                    <dd className="mt-1 flex flex-wrap gap-2">
                                        {profile.pain_points?.length > 0 ? profile.pain_points.map((p, i) => (
                                            <span key={i} className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                                                {p}
                                            </span>
                                        )) : <span className="text-xs text-zinc-600 italic">None detected yet</span>}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Appointments Card */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                            <h3 className="text-sm font-semibold text-white mb-4">Appointments</h3>
                            {appointments && appointments.length > 0 ? (
                                <ul className="space-y-3">
                                    {appointments.map(apt => (
                                        <li key={apt.id} className="text-sm border-l-2 border-emerald-500 pl-3">
                                            <div className="text-emerald-400 font-medium">
                                                {new Date(apt.start_time).toLocaleString()}
                                            </div>
                                            <div className="text-zinc-500 text-xs uppercase">{apt.status}</div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-zinc-500 text-sm">No bookings yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: God Mode Chat */}
                    <div className="lg:col-span-2 h-full">
                        <ChatInterceptor
                            leadId={id}
                            initialMessages={messages || []}
                            aiPaused={lead.ai_paused || false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
