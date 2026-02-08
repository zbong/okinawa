import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 앱이 크래시되는 것을 방지하기 위해 빈 값이면 경고만 띄우고 더미 주소를 넣습니다.
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase 설정이 누락되었습니다! Vercel의 Environment Variables를 확인해 주세요.");
}

// createClient 호출 시 URL이 비어있으면 에러가 나므로, 최소한의 형식을 갖춘 더미를 넣거나 예외 처리를 합니다.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
