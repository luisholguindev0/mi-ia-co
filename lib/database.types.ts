export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            appointments: {
                Row: {
                    created_at: string | null
                    end_time: string
                    google_calendar_id: string | null
                    id: string
                    lead_id: string | null
                    notes: string | null
                    reminder_sent: boolean | null
                    start_time: string
                    status: string | null
                }
                Insert: {
                    created_at?: string | null
                    end_time: string
                    google_calendar_id?: string | null
                    id?: string
                    lead_id?: string | null
                    notes?: string | null
                    reminder_sent?: boolean | null
                    start_time: string
                    status?: string | null
                }
                Update: {
                    created_at?: string | null
                    end_time?: string
                    google_calendar_id?: string | null
                    id?: string
                    lead_id?: string | null
                    notes?: string | null
                    reminder_sent?: boolean | null
                    start_time?: string
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_lead_id_fkey"
                        columns: ["lead_id"]
                        isOneToOne: false
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            audit_logs: {
                Row: {
                    created_at: string | null
                    event_type: string | null
                    id: string
                    input_tokens: number | null
                    latency_ms: number | null
                    lead_id: string | null
                    model_used: string | null
                    output_tokens: number | null
                    payload: Json | null
                }
                Insert: {
                    created_at?: string | null
                    event_type?: string | null
                    id?: string
                    input_tokens?: number | null
                    latency_ms?: number | null
                    lead_id?: string | null
                    model_used?: string | null
                    output_tokens?: number | null
                    payload?: Json | null
                }
                Update: {
                    created_at?: string | null
                    event_type?: string | null
                    id?: string
                    input_tokens?: number | null
                    latency_ms?: number | null
                    lead_id?: string | null
                    model_used?: string | null
                    output_tokens?: number | null
                    payload?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_lead_id_fkey"
                        columns: ["lead_id"]
                        isOneToOne: false
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            knowledge_base: {
                Row: {
                    category: string | null
                    content: string
                    embedding: string | null
                    id: string
                    metadata: Json | null
                }
                Insert: {
                    category?: string | null
                    content: string
                    embedding?: string | null
                    id?: string
                    metadata?: Json | null
                }
                Update: {
                    category?: string | null
                    content?: string
                    embedding?: string | null
                    id?: string
                    metadata?: Json | null
                }
                Relationships: []
            }
            leads: {
                Row: {
                    ai_paused: boolean | null
                    context_embedding: string | null
                    conversation_summary: string | null
                    created_at: string | null
                    id: string
                    last_active: string | null
                    lead_score: number | null
                    phone_number: string
                    profile: Json | null
                    status: string | null
                }
                Insert: {
                    ai_paused?: boolean | null
                    context_embedding?: string | null
                    conversation_summary?: string | null
                    created_at?: string | null
                    id?: string
                    last_active?: string | null
                    lead_score?: number | null
                    phone_number: string
                    profile?: Json | null
                    status?: string | null
                }
                Update: {
                    ai_paused?: boolean | null
                    context_embedding?: string | null
                    conversation_summary?: string | null
                    created_at?: string | null
                    id?: string
                    last_active?: string | null
                    lead_score?: number | null
                    phone_number?: string
                    profile?: Json | null
                    status?: string | null
                }
                Relationships: []
            }
            messages: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    lead_id: string | null
                    role: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    lead_id?: string | null
                    role: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    lead_id?: string | null
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_lead_id_fkey"
                        columns: ["lead_id"]
                        isOneToOne: false
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            business_settings: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    key: string
                    updated_at: string | null
                    updated_by: string | null
                    value: Json | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    key: string
                    updated_at?: string | null
                    updated_by?: string | null
                    value?: Json | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    key?: string
                    updated_at?: string | null
                    updated_by?: string | null
                    value?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "business_settings_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            match_knowledge: {
                Args: {
                    query_embedding: string
                    match_threshold: number
                    match_count: number
                    filter_category?: string
                }
                Returns: {
                    id: string
                    content: string
                    metadata: Json
                    category: string
                    similarity: number
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
