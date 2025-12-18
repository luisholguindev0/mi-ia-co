import { createClient } from '@supabase/supabase-js';

// Lazy initialization to ensure env vars are loaded first
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
    if (!_supabaseAdmin) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        }

        _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
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

        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

// For backward compatibility with existing code
// These will be initialized on first access
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
    get(target, prop) {
        return getSupabaseAdmin()[prop as keyof ReturnType<typeof createClient>];
    }
});

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
    get(target, prop) {
        return getSupabase()[prop as keyof ReturnType<typeof createClient>];
    }
});
