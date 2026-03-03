# Okinawa 여행 가이드 프로젝트 현황

## 📅 최종 업데이트: 2026-02-28

## 🎯 프로젝트 개요
오키나와 여행을 위한 인터랙티브 가이드 웹 애플리케이션

---

## 📊 현재 상태 (Supabase 전환 완료)

### 🏆 주요 성과
- **내비게이션 UI 통일**: 모든 플래너 단계(1~8)의 하단 버튼을 `createPortal`을 이용해 스티키 푸터로 통일.
- **AI 모델 관리 체계 구축**: 현재 `models.json`을 통해 파악된 사용 가능한 AI 모델 풀업데이트

> ### 🤖 사용 가능한 주력 AI 모델 목록 (models.json 기준)
> 1. **`gemini-2.5-flash`** (Gemini 2.5 Flash): 높은 속도와 품질, 100만 토큰 처리 (최신 주력 모델)
> 2. **`gemini-2.5-pro`** (Gemini 2.5 Pro): 복잡한 논리와 고품질의 결과물이 필요할 때 사용하는 최고 성능 모델
> 3. **`gemini-2.0-flash`** (Gemini 2.0 Flash): 빠르고 범용적인 멀티모달 모델
> 4. **`gemini-flash-latest`**: 항상 최신 플래시 모델을 매핑하는 안전한 콜백 모델
> 
> ### ⏱️ 모델 스피드 벤치마크 (2026-02-28 3회 반복 평균)
> - **`gemini-2.0-flash`**: 약 **1.22초** (압도적 속도 우위, 현재 주력)
> - **`gemini-flash-latest`**: 약 3.44초
> - **`gemini-3-flash-preview`**: 약 3.55초
> - **`gemini-pro-latest`**: 약 9.02초 (고품질용 서브 모델)
- **좀비 파일 박멸**: 이중 상태 관리 및 유청 자동 저장 로직 제거.
- **✅ localStorage → Supabase 전면 리팩토링 완료** (2026-02-25)
### 🏆 최근 주요 개선 사항 (2026-02-28)
- **AI 일정 생성 품질 향상 (`usePlannerAI.ts`)**:
  - **숙소 배정 일관성**: 확정된 숙소(`isConfirmed: true`)와 추천 후보 숙소를 명확히 구분하여 프롬프트에 제공.
  - **로지스틱스 여정 보장**: 여행 첫날 공항 출발/도착 및 마지막 날 공항 복귀 여정이 누락되지 않도록 AI 지침(Prompt) 강력 규정.
  - **설명(Description) 깊이 및 구조화**: `desc`(목록용 1~2문장 요약)와 `longDesc`(상세보기용 300자 이상 전문 가이드)를 철저히 분리. 기존에 생성된 고퀄리티 `longDesc`가 있을 경우 AI 결과에 강제로 포팅(Merge)하여 데이터 손실 원천 차단.
- **UI 및 렌더링 최적화**:
  - `AttractionDetailModal`의 중복 텍스트(요약본이 상단에 또 뜨는 현상) 제거.
  - 6단계 등 하단 네비게이션 버튼을 `createPortal`을 사용해 화면 하단 액션바에 고정되도록 모두 통일.
  - **5단계 & 개요(Summary) 탭 체크리스트 UI**: 여행 준비물 체크리스트 메뉴에 가로 스크롤 가능한 '카테고리별 탭'을 추가하여 스크롤 피로도를 줄이고 가독성을 높임.
  - **가이드 데이터 보존 버그 수정**: Supabase DB에 `metadata.checklists` 필드를 확실히 동기화하도록 수정.
- **6단계 최종 검증 로직 강화**:
  - '필수 정보(여행지, 일정 등)'와 '선택적 필수 정보(확정된 숙소 및 항공권 바우처 등 파일)'를 나누어, 서류나 숙소가 누락되었을 때는 재생성 전 사전 경고 모달(Modal) 창을 표시하도록 안전성 상향.

---

## ✅ localStorage → Supabase 리팩토링 완료 내역 (2026-02-25)

### 제거된 localStorage 항목
| 키 | 이전 | 이후 |
|---|---|---|
| `trip_draft_v1` | 단계별 JSON 덮어쓰기 | Supabase `trips` 테이블 (`is_draft: true`) |
| `current_trip_v1` | 전체 TripPlan 저장 | `active_trip_id` (UUID만 유지) |
| 레거시 draft 백업 키들 | 여러 키에 중복 | `useAppCleanup`에서 일회성 정리 |

### 변경 파일 목록

#### 핵심 로직
- **`usePlannerActions.ts`**
  - `saveDraft` → async, Supabase upsert로 교체
  - `draftId` 기반 기존 row 업데이트 vs 신규 INSERT 분기
  - **Optimistic update**: 저장 직후 `setTrips()`로 로컬 상태 즉시 반영
- **`usePlannerState.ts`**
  - `draftId` / `setDraftId` 상태 추가
  - `resetPlannerState`에서 `draftId` 초기화
- **`useTripManager.ts`**
  - `current_trip_v1` 전체 저장 제거
  - `active_trip_id` (UUID)만 localStorage 유지
  - `publishTrip`: 최종 저장 시 `is_draft`, `draft_step` 메타데이터 제거
- **`useAppCleanup.ts`**
  - 레거시 키(`trip_draft_v1`, `current_trip_v1`, `attraction_recommendation_cache`) 마이그레이션 정리

#### 컨텍스트
- **`PlannerContext.tsx`**
  - `saveDraft` 반환 타입 `Promise<string | null>` 으로 업데이트
  - `user`, `setTrips`, `setDraftId`를 `usePlannerActions`에 전달
  - `copyShareLink` 컨텍스트 노출 추가
  - `jpyAmount` → `foreignAmount` 인터페이스 명칭 수정
  - `useMemo` 구문 오류 수정 (`]), [` → `}) as PlannerContextType, [`)

#### UI 컴포넌트
- **`LandingPage.tsx`**
  - draft 목록: `trips.filter(t => t.metadata?.is_draft === true)` DB 기반으로 변경
  - 발행된 trips 목록에서 draft 제외 필터 추가
  - draft 클릭 시 `setDraftId(draft.id)` 복원 → 이후 다시 저장 시 upsert 보장
- **`PlannerStep2` ~ `PlannerStep8`**
  - `if (saveDraft(N))` → `await saveDraft(N)` 비동기 패턴 전면 교체

### 핵심 버그 수정

#### 버그 1: 6단계 저장 → 5단계로 재개되는 문제
- **원인**: `saveDraft(6)` 후 로컬 `trips` 상태가 step 5 데이터 그대로였음
- **수정**: `saveDraft` 완료 후 `setTrips()` optimistic update로 즉시 최신 `draft_step` 반영

#### 버그 2: draft 불러온 후 다시 저장 시 중복 row 생성
- **원인**: 랜딩에서 draft 로드 시 `draftId = null` 유지 → INSERT 실행
- **수정**: `setDraftId(draft.id)` 로 draft 로드 시 ID 복원

### 단계별 저장/재개 동작 (최종)
| 버튼 | DB 저장 step | 재개 위치 |
|---|---|---|
| Step 2 "저장" | 2 | Step 2 ✅ |
| Step 3 "저장" | 3 | Step 3 ✅ |
| Step 4 "저장" | 4 | Step 4 ✅ |
| Step 4 "다음→5" | 4 | Step 4 (의도적) ✅ |
| Step 5 "저장" | 5 | Step 5 ✅ |
| Step 5 "다음→6" | 5 | Step 5 (의도적) ✅ |
| Step 6 "저장" | 6 | Step 6 ✅ |
| Step 8 "저장" | 8 | Step 8 ✅ |

---

## 🚀 다음 단계 (Next Steps)

### 🔮 향후 추가 예정 기능 (Future Features)
- **가계부 / N빵 정산 (Expense Tracker)**: 지출 내역 입력 시 현재 환율을 연동해 한화로 자동 계산 및 일행 간 N빵 정산 기능.
- **"기사님 여기로 가주세요" 택시 카드 (Taxi Card)**: 목적지 일본어 이름/주소를 전체 화면에 큰 글씨로 띄워 택시 기사와의 의사소통을 돕는 기능.

### 남은 정리 사항
- **`useWeather.ts`**: localStorage 날씨 캐시 제거 여부 결정
- **`DebugView.tsx`**: localStorage 대신 Supabase 데이터 표시로 전환
- **오프라인 지원(offline)**: 현 리팩토링 범위 외 → 추후 결정

### 테스트 필요 항목
- [ ] 회화 기능 (TTS + 현지 문장) 집중 테스트
- [ ] 여행 가이드 생성 → 삭제 반복으로 데이터 정합성 최종 확인
- [ ] draft 저장/로드/재저장 전 단계 사용자 테스트

---

## 🔧 기술 스택
- React + TypeScript / Vite
- Framer Motion / Lucide React Icons
- Leaflet (지도)
- Google Gemini AI (메인: `gemini-2.0-flash`, 고품질: `gemini-2.5-pro`)
- **Supabase** (Auth, DB, Storage) ← 현재 모든 데이터 저장소

## 🔗 참고 문서
- `PROJECT_STATUS_AUTH.md` (인증 및 DB 통합 현황)
