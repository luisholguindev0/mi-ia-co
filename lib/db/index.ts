import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Lazy initialization to ensure env vars are loaded first
let _supabaseAdmin: SupabaseClient<Database> | null = null;
let _supabase: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin() {
    if (!_supabaseAdmin) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        }

        _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);
    }
    return _supabaseAdmin;
}

export function getSupabase() {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
        }

        _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

// For backward compatibility with existing code
// These will be initialized on first access
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
    get(target, prop) {
        const client = getSupabaseAdmin();
        return client[prop as keyof SupabaseClient<Database>];
    }
});

export const supabase = new Proxy({} as SupabaseClient<Database>, {
    get(target, prop) {
        const client = getSupabase();
        return client[prop as keyof SupabaseClient<Database>];
    }
});
