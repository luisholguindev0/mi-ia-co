'use client'

import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

type Lead = {
    id: string;
    phone_number: string;
    status: string;
    profile: any;
    created_at: string;
};

const COLUMNS = [
    { id: 'new', title: 'New Leads' },
    { id: 'diagnosing', title: 'Diagnosing' },
    { id: 'qualified', title: 'Qualified' },
    { id: 'booked', title: 'Booked' },
    { id: 'closed_lost', title: 'Closed / Lost' },
];

export function KanbanBoard() {
    const [items, setItems] = useState<Record<string, Lead[]>>({
        new: [],
        diagnosing: [],
        qualified: [],
        booked: [],
        closed_lost: [],
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch initial data
    useEffect(() => {
        const fetchLeads = async () => {
            const { data } = await supabase.from('leads').select('*');
            if (data) {
                const grouped = COLUMNS.reduce((acc, col) => {
                    acc[col.id] = data.filter((l) => l.status === col.id);
                    return acc;
                }, {} as Record<string, Lead[]>);
                setItems(grouped);
            }
        };
        fetchLeads();

        // Subscribe to changes (simple refresh for now)
        const channel = supabase
            .channel('kanban-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                fetchLeads();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    function findContainer(id: string) {
        if (id in items) return id;
        return Object.keys(items).find((key) => items[key].find((i) => i.id === id));
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex((i) => i.id === active.id);
            const overIndex = overItems.findIndex((i) => i.id === overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    items[activeContainer][activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            };
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over?.id as string);

        if (
            !activeContainer ||
            !overContainer ||
            (activeContainer === overContainer &&
                active.id === over?.id)
        ) {
            setActiveId(null);
            return;
        }

        // Update DB Status
        await supabase.from('leads').update({ status: overContainer }).eq('id', active.id);

        // Optimistic UI Update (if moved within same container)
        // If moved between containers, dragOver handled it partly, but we finalize here.
        setActiveId(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <div key={col.id} className="flex-shrink-0 w-80 flex flex-col rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                        <div className="p-3 border-b border-zinc-800/50 flex items-center justify-between">
                            <h3 className="font-medium text-sm text-zinc-300">{col.title}</h3>
                            <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{items[col.id]?.length || 0}</span>
                        </div>
                        <div className="flex-1 p-2 overflow-y-auto min-h-[100px]">
                            <SortableContext
                                items={items[col.id]?.map(i => i.id) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                <AnimatePresence>
                                    {items[col.id]?.map((lead) => (
                                        <motion.div
                                            key={lead.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <SortableItem id={lead.id} lead={lead} onClick={() => router.push(`/admin/leads/${lead.id}`)} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </SortableContext>
                        </div>
                    </div>
                ))}
            </div>
            <DragOverlay>
                {activeId ? <div className="p-4 bg-zinc-800 rounded shadow-xl ring-2 ring-indigo-500 opacity-80 rotate-3 cursor-grabbing w-72 h-20 text-white">Dragging...</div> : null}
            </DragOverlay>
        </DndContext>
    );
}

function SortableItem(props: { id: string; lead: Lead; onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="touch-none mb-2">
            <div
                onClick={props.onClick}
                className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-600 cursor-pointer group shadow-sm"
            >
                <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">
                        {props.lead.profile?.name || props.lead.phone_number}
                    </span>
                    <span {...attributes} {...listeners} className="text-zinc-600 cursor-grab hover:text-zinc-400">
                        ⠿
                    </span>
                </div>

                <div className="text-xs text-zinc-500 flex flex-wrap gap-1 mt-2">
                    {props.lead.profile?.company && (
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[120px]">
                            {props.lead.profile.company}
                        </span>
                    )}
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                        Warn: {Math.floor(Math.random() * 5)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
