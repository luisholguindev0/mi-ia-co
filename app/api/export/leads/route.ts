import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all leads with relevant data
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert to CSV
    const headers = [
        'Phone',
        'Name',
        'Company',
        'Industry',
        'Location',
        'Role',
        'Pain Points',
        'Contact Reason',
        'Status',
        'Lead Score',
        'Created At',
        'Last Active'
    ]

    const rows = leads?.map(lead => {
        const profile = lead.profile as any || {}
        return [
            lead.phone_number || '',
            profile.name || '',
            profile.company || '',
            profile.industry || '',
            profile.location || '',
            profile.role || '',
            (profile.pain_points || []).join('; '),
            profile.contact_reason || '',
            lead.status || '',
            lead.lead_score || 0,
            lead.created_at || '',
            lead.last_active || ''
        ]
    }) || []

    // Build CSV string
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Return as downloadable file
    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
    })
}
