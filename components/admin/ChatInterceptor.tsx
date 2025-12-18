'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, ShieldAlert, Power, MessageSquareDashed } from 'lucide-react'
import { sendManualMessage, toggleAiStatus } from '@/lib/actions/chat'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

type Message = {
    id: string
    role: 'user' | 'assistant' | 'system' | 'human_agent'
    content: string
    created_at: string
}

export function ChatInterceptor({
    leadId,
    initialMessages = [],
    aiPaused
}: {
    leadId: string,
    initialMessages: Message[],
    aiPaused: boolean
}) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [input, setInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [paused, setPaused] = useState(aiPaused)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Subscribe to real-time message updates
    useEffect(() => {
        const channel = supabase
            .channel(`chat-${leadId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `lead_id=eq.${leadId}`,
                },
                (payload) => {
                    console.log('🔔 New message received:', payload.new)
                    const newMsg = payload.new as Message
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.find(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [leadId, supabase])

    const handleSend = async () => {
        if (!input.trim()) return
        setIsSending(true)

        // Optimistic update
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            role: 'human_agent',
            content: input,
            created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, optimisticMsg])

        await sendManualMessage(leadId, input)
        setInput('')
        setIsSending(false)
    }

    const handleToggle = async () => {
        const newState = !paused
        setPaused(newState)
        await toggleAiStatus(leadId, newState)
    }

    return (
        <div className="flex flex-col h-[600px] border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Live Interceptor</h3>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {paused ? (
                        <span className="text-[10px] uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                            AI Paused
                        </span>
                    ) : (
                        <span className="text-[10px] uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            AI Active
                        </span>
                    )}
                </div>

                <button
                    onClick={handleToggle}
                    className={cn(
                        "flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-colors border",
                        paused
                            ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                            : "bg-red-900/20 text-red-400 border-red-900/30 hover:bg-red-900/30"
                    )}
                >
                    <Power className="w-3 h-3" />
                    {paused ? "Resume AI" : "Emergency Stop"}
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/30">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs">
                        <MessageSquareDashed className="w-8 h-8 mb-2 opacity-20" />
                        <p>No messages yet</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3 max-w-[85%]",
                            msg.role === 'user' ? "mr-auto" : "ml-auto flex-row-reverse"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                            msg.role === 'user' ? "bg-zinc-800 border-zinc-700" :
                                msg.role === 'human_agent' ? "bg-indigo-900/30 border-indigo-500/30" : "bg-emerald-900/30 border-emerald-500/30"
                        )}>
                            {msg.role === 'user' && <User className="w-4 h-4 text-zinc-400" />}
                            {msg.role === 'assistant' && <Bot className="w-4 h-4 text-emerald-400" />}
                            {msg.role === 'human_agent' && <ShieldAlert className="w-4 h-4 text-indigo-400" />}
                        </div>

                        <div className={cn(
                            "p-3 rounded-2xl text-sm",
                            msg.role === 'user' ? "bg-zinc-800 text-zinc-200 rounded-tl-none" :
                                msg.role === 'human_agent' ? "bg-indigo-600/10 text-indigo-200 border border-indigo-500/20 rounded-tr-none" : "bg-emerald-600/10 text-emerald-200 border border-emerald-500/20 rounded-tr-none"
                        )}>
                            {msg.content}
                            <div className="mt-1 text-[10px] opacity-40 text-right">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={paused ? "Type a manual reply (AI is paused)..." : "Intercept conversation..."}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-600"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 rounded-md text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Messages update in real-time. Manual replies log as 'human_agent'.
                </p>
            </div>
        </div>
    )
}

