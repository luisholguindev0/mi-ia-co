'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4']

interface ChartData {
    name: string
    value: number
    [key: string]: string | number // Index signature for recharts compatibility
}

interface AnalyticsChartsProps {
    statusData: ChartData[]
    industryData: ChartData[]
    painPointsData: ChartData[]
}

export function AnalyticsCharts({ statusData, industryData, painPointsData }: AnalyticsChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pipeline Funnel */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Pipeline Status</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#27272a',
                                    border: '1px solid #3f3f46',
                                    borderRadius: '8px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Industry Distribution */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Industry Distribution</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={industryData} layout="vertical">
                            <XAxis type="number" stroke="#71717a" />
                            <YAxis dataKey="name" type="category" stroke="#71717a" width={100} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#27272a',
                                    border: '1px solid #3f3f46',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pain Points Chart */}
            {painPointsData.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Pain Points (from conversations)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={painPointsData}>
                                <XAxis dataKey="name" stroke="#71717a" angle={-45} textAnchor="end" height={80} />
                                <YAxis stroke="#71717a" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#27272a',
                                        border: '1px solid #3f3f46',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    )
}
