import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isMissingKey = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined';

if (isMissingKey) {
    console.error("❌ SUPABASE CONFIG MISSING!");
    console.log("Current URL Value:", supabaseUrl);
    console.log("Current Key Value:", supabaseAnonKey ? (supabaseAnonKey.substring(0, 5) + "...") : "MISSING");
} else {
    console.log("✅ Supabase initialized with URL:", supabaseUrl?.substring(0, 20) + "...");
}

export const supabase = createClient(
    (supabaseUrl && supabaseUrl !== 'undefined') ? supabaseUrl : 'https://placeholder.supabase.co',
    (supabaseAnonKey && supabaseAnonKey !== 'undefined') ? supabaseAnonKey : 'placeholder'
);
