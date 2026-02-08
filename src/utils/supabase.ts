import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isMissingKey = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined';

if (isMissingKey) {
    console.error("❌ [Supabase 설정 오류] 아래 항목을 확인하세요:");
    if (!supabaseUrl || supabaseUrl === 'undefined') console.error("- VITE_SUPABASE_URL 이 비어있습니다.");
    if (!supabaseAnonKey || supabaseAnonKey === 'undefined') console.error("- VITE_SUPABASE_ANON_KEY 가 비어있습니다.");
    console.log("힌트: Vercel Settings -> Environment Variables에서 VITE_ 접두사를 포함해 등록했는지 확인하세요.");
} else {
    console.log("✅ Supabase 연결 시도 (URL: " + supabaseUrl.substring(0, 15) + "...)");
}

export const supabase = createClient(
    (supabaseUrl && supabaseUrl !== 'undefined') ? supabaseUrl : 'https://placeholder.supabase.co',
    (supabaseAnonKey && supabaseAnonKey !== 'undefined') ? supabaseAnonKey : 'placeholder'
);
