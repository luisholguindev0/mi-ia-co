'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Lead = {
    id: string;
    phone_number: string;
    status: string;
    profile: {
        name?: string;
        company?: string;
        role?: string;
        [key: string]: unknown;
    };
    lead_score?: number;
    created_at: string;
    last_active?: string;
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.phone_number.includes(search) ||
            lead.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.profile?.company?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const sortedLeads = [...filteredLeads].sort((a, b) => {
        return new Date(b.last_active || b.created_at).getTime() - new Date(a.last_active || a.created_at).getTime()
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search leads..."
                        className="pl-9 bg-zinc-900 border-zinc-800"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="diagnosing">Diagnosing</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="closed_lost">Closed / Lost</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-900/80">
                        <TableRow className="hover:bg-transparent border-zinc-800">
                            <TableHead className="w-[200px]">Lead</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Company / Role</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="text-right">Last Active</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedLeads.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                    No leads found.
                                </TableCell>
                            </TableRow>
                        )}
                        {sortedLeads.map((lead) => (
                            <TableRow
                                key={lead.id}
                                className="cursor-pointer hover:bg-zinc-800/50 border-zinc-800 transition-colors"
                                onClick={() => router.push(`/admin/leads/${lead.id}`)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-white">{lead.profile?.name || 'Unknown'}</span>
                                        <span className="text-xs text-zinc-500">{lead.phone_number}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge status={lead.status} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span className="text-zinc-300">{lead.profile?.company || '-'}</span>
                                        <span className="text-xs text-zinc-500">{lead.profile?.role}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-zinc-800 rounded-full h-1.5 w-16">
                                            <div
                                                className={cn("h-1.5 rounded-full", lead.lead_score && lead.lead_score > 70 ? "bg-emerald-500" : "bg-zinc-600")}
                                                style={{ width: `${Math.min(lead.lead_score || 0, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-zinc-400">{lead.lead_score || 0}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-zinc-400 text-xs">
                                    {new Date(lead.last_active || lead.created_at).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function Badge({ status }: { status: string }) {
    const styles = {
        new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        diagnosing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        booked: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        closed_lost: "bg-red-500/10 text-red-400 border-red-500/20",
        nurture: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    }

    const className = styles[status as keyof typeof styles] || styles.nurture

    return (
        <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize", className)}>
            {status.replace('_', ' ')}
        </span>
    )
}
