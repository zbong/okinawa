# 오프라인 지원 개선 계획

> 목표: 여행 중 인터넷이 없어도 가이드를 최대한 활용할 수 있도록 한다.
> 범위: **읽기 전용 오프라인** (오프라인 중 수정사항의 DB 동기화는 포함하지 않음)

---

## 현재 상태 요약

| 항목 | 상태 |
|---|---|
| 앱 자체 (JS/CSS/HTML) | ✅ Service Worker 캐싱 완료 |
| 구글 지도 타일 | ✅ CacheFirst 캐싱 설정 완료 |
| 오프라인 지도 준비 버튼 | ✅ SummaryTab에 구현됨 |
| TTS 오디오 | ✅ IndexedDB 캐싱 완료 |
| 여행 데이터 (일정/장소) | ✅ IndexedDB 캐싱 완료 |
| PDF / 이미지 파일 | ✅ IndexedDB Blob 캐싱 완료 |
| Supabase API 응답 | ✅ NetworkFirst 캐싱 완료 |
| 오프라인 상태 UI 안내 | ✅ 배너 컴포넌트 완료 |
| AI 상세 설명 자동 보충 | ✅ 가이드 생성 시 자동 처리 |
| 일정 논리 (호텔 출발) | ✅ 2일차부터 숙소 출발 적용 |
| TTS 언어 정규화 | ✅ 오키나와 방언 TTS 에러 해결 |

---

## 작업 목록

---

### 1. 여행 데이터 로컬 저장 (IndexedDB) ⭐ 최우선
- **파일**: `src/utils/tripCache.ts` 신규 생성
- **내용**:
  - 여행 일정, 장소 정보, 텍스트 전체를 IndexedDB에 저장하는 유틸리티
  - Supabase에서 데이터 로드 완료 시 자동으로 로컬 스냅샷 저장
  - 오프라인 감지 시 IndexedDB에서 읽기 fallback
- **효과**: 일정/장소 정보를 오프라인에서 완전히 볼 수 있음
- **상태**: ✅ 완료 (2026-02-25)

---

### 2. PDF 파일 오프라인 저장 (IndexedDB Blob)
- **파일**: `src/utils/fileCache.ts` 신규 생성
- **내용**:
  - PDF 파일을 Supabase URL에서 blob으로 받아 IndexedDB에 저장
  - "오프라인 준비" 버튼 누를 때 일괄 캐싱 (지도와 통합)
  - 오프라인 시 IndexedDB blob으로 `window.open()` 처리
- **효과**: 항공권, 숙소 바우처 등 PDF를 오프라인에서 열 수 있음
- **상태**: ✅ 완료 (2026-02-25)

---

### 3. 이미지 파일 오프라인 저장 (IndexedDB Blob)
- **파일**: `src/utils/fileCache.ts` (2번과 통합)
- **내용**:
  - 기본 파일(호텔, 항공, 관광지 사진 등) Supabase URL을 blob으로 캐싱
  - 2번과 동일한 방식, 파일 타입만 분기
- **효과**: 저장된 이미지를 오프라인에서 미리보기 가능
- **상태**: ✅ 완료 (2026-02-25, 2번과 통합)

---

### 4. Supabase API 응답 캐싱 (Service Worker NetworkFirst)
- **파일**: `vite.config.ts` 수정
- **내용**:
  - Supabase REST API → `NetworkFirst` (5초 타임아웃, 7일 보관)
  - Supabase Storage → `CacheFirst` (30일 보관)
  - Supabase Auth → `NetworkFirst` (1시간 보관)
- **효과**: Supabase 응답 자체를 캐싱하여 추가 오프라인 보호막 역할
- **상태**: ✅ 완료 (2026-02-25)

---

### 5. 오프라인 상태 감지 UI
- **파일**: `src/hooks/useOnlineStatus.ts` 신규 생성 + 상단 배너 UI 추가
- **내용**:
  - `navigator.onLine` + `online`/`offline` 이벤트 감지
  - 오프라인 시 상단에 배너 표시: "오프라인 모드 - 저장된 데이터를 사용 중입니다"
  - 온라인 복귀 시 배너 자동 제거
- **효과**: 사용자가 현재 오프라인 상태임을 명확히 인지
- **상태**: ✅ 완료 (2026-02-25)

---

### 6. AI 상세 설명 자동 보충
- **파일**: `src/hooks/planner/usePlannerActions.ts`, `src/components/Planner/AttractionDetailModal.tsx`
- **내용**:
  - 가이드 생성 시 `description`이 비어있거나 짧은 장소는 AI가 자동 보충
  - 최대 3개씩 병렬 처리로 속도 최적화
  - 상세 모달에서 `longDesc`가 없어도 `description`을 대신 표시하도록 수정
- **효과**: 오프라인에서도 모든 장소에 대해 풍성한 설명 제공
- **상태**: ✅ 완료 (2026-02-25)

---

### 7. 일정 논리 고도화 (호텔 출발 적용)
- **파일**: `src/hooks/usePlannerAI.ts`
- **내용**:
  - 2일차 이후 일정이 시작될 때 전날 묵었던 숙소에서 출발하도록 AI 프롬프트 수정
- **효과**: 보다 자연스럽고 현실적인 여행 동선 제공
- **상태**: ✅ 완료 (2026-02-26)

---

### 8. TTS 언어 코드 정규화 (BCP-47)
- **파일**: `src/hooks/planner/usePlannerActions.ts`
- **내용**:
  - AI가 `ja-JP-okinawa` 등 비표준 코드를 반환해도 `ja-JP`로 정규화하여 Google TTS 에러(400) 방지
- **효과**: 어떤 지역이든 안정적인 음성 가이드 제공
- **상태**: ✅ 완료 (2026-02-26)

---

## 진행 기록

| 번호 | 작업 | 완료일 |
|---|---|---|
| 1 | 여행 데이터 로컬 저장 | 2026-02-25 |
| 2 | PDF 오프라인 저장 | 2026-02-25 |
| 3 | 이미지 오프라인 저장 | 2026-02-25 (통합) |
| 4 | Supabase API 캐싱 | 2026-02-25 |
| 5 | 오프라인 상태 UI | 2026-02-25 |
| 6 | AI 상세 설명 자동 보충 | 2026-02-25 |
| 7 | 일정 논리 개선 (호텔 출발) | 2026-02-26 |
| 8 | TTS 언어 코드 정규화 | 2026-02-26 |
