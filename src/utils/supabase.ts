import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isMissingKey = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined';

if (isMissingKey) {
    console.error("❌ SUPABASE CONFIG MISSING: Check Vercel Environment Variables!");
    console.error("URL:", supabaseUrl, "Key:", supabaseAnonKey);
}

export const supabase = createClient(
    (supabaseUrl && supabaseUrl !== 'undefined') ? supabaseUrl : 'https://placeholder.supabase.co',
    (supabaseAnonKey && supabaseAnonKey !== 'undefined') ? supabaseAnonKey : 'placeholder'
);
