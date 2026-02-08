import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// During build time, we might not have env vars yet
const isDuringBuild = !supabaseUrl || !supabaseAnonKey;

// Client-side Supabase client for browser usage (deprecated - use getSupabaseClientComponent instead)
export const supabase = isDuringBuild 
  ? null as any
  : createBrowserClient(supabaseUrl, supabaseAnonKey);

// Client component client (for use in 'use client' components)
export const getSupabaseClientComponent = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
