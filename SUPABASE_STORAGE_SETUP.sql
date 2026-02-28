-- ============================================================
-- Supabase Storage Setup: trip-files 버킷
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- ============================================================

-- 1. 버킷 생성 (Public. 이미지를 URL로 직접 표시하기 위해 public으로 설정)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'trip-files',
    'trip-files',
    true,                        -- Public bucket (URL로 바로 접근 가능)
    10485760,                    -- 10MB 파일 크기 제한
    ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'application/pdf'
    ]
)
ON CONFLICT (id) DO NOTHING;   -- 이미 존재하면 무시

-- ============================================================
-- 2. RLS (Row Level Security) 정책
-- ============================================================

-- 2-1. 자신의 파일 업로드 허용
-- 경로 규칙: {user_id}/{trip_id}/{파일이름}
CREATE POLICY "Users can upload their own trip files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'trip-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2-2. 자신의 파일 조회 허용 (로그인 유저)
CREATE POLICY "Users can view their own trip files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'trip-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2-3. Public 공유 링크로 접근 허용 (비로그인도 URL 알면 볼 수 있음 - 버킷이 public이라 필요)
CREATE POLICY "Public access to trip files for sharing"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'trip-files');

-- 2-4. 자신의 파일 삭제 허용
CREATE POLICY "Users can delete their own trip files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'trip-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- 완료! 이제 앱에서 파일을 업로드하면 자동으로 Storage에 저장됩니다.
-- 저장 경로: trip-files/{user_id}/{trip_id}/{timestamp}_{filename}
-- ============================================================
