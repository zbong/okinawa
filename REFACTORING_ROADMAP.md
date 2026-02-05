# App.tsx 대규모 리팩토링 계획

## 📊 현재 상태 (2026-02-05 22:41)

- **현재 줄 수**: 10,425줄
- **완료된 작업**: Toast (78줄), ConfirmModal (94줄), 한국어 텍스트 수정
- **총 감소**: 165줄 (11,025줄 → 10,860줄)

## 🎯 다음 단계: 대규모 컴포넌트 분리

### Phase 1: Tab 컴포넌트 분리 (예상 ~3,500줄 감소)

#### 1.1 Schedule Tab 분리
- **예상 크기**: ~1,500줄
- **파일**: `src/components/Schedule/ScheduleTab.tsx`
- **의존성**:
  - `trip`, `setTrip`
  - `activeTab`, `setActiveTab`
  - `scheduleViewMode`, `setScheduleViewMode`
  - `weatherData`, `weatherIndex`
  - `selectedDay`, `setSelectedDay`
  - `showToast`
- **난이도**: ⭐⭐⭐ (중간)

#### 1.2 Map Tab 분리
- **예상 크기**: ~800줄
- **파일**: `src/components/Map/MapTab.tsx`
- **의존성**:
  - `trip`
  - `allPoints`
  - `MapComponent`
- **난이도**: ⭐⭐ (쉬움)

#### 1.3 Documents Tab 분리
- **예상 크기**: ~600줄
- **파일**: `src/components/Documents/DocumentsTab.tsx`
- **의존성**:
  - `customFiles`, `setCustomFiles`
  - `selectedPoint`
  - `showToast`
- **난이도**: ⭐⭐ (쉬움)

#### 1.4 Phrasebook Tab 분리
- **예상 크기**: ~400줄
- **파일**: `src/components/Phrasebook/PhrasebookTab.tsx`
- **의존성**:
  - `speechItems`
  - `playAudio` 함수
- **난이도**: ⭐ (매우 쉬움)

#### 1.5 OCR Lab 분리
- **예상 크기**: ~200줄
- **파일**: `src/components/OCR/OCRLab.tsx`
- **의존성**:
  - `analyzedFiles`
  - `setView`
- **난이도**: ⭐ (매우 쉬움)

### Phase 2: Planner 컴포넌트 Context 리팩토링 (예상 ~3,400줄 감소)

#### 2.1 PlannerContext 생성
- **파일**: `src/contexts/PlannerContext.tsx`
- **포함 내용**:
  - 모든 Planner state
  - Planner 관련 함수들
  - Provider 컴포넌트

#### 2.2 Planner Steps 분리
- `PlannerStep1.tsx` (~600줄)
- `PlannerStep2.tsx` (~325줄)
- `PlannerStep3.tsx` (~1,100줄)
- `PlannerStep4.tsx` (~550줄)
- `PlannerStep5.tsx` (~825줄)

**난이도**: ⭐⭐⭐⭐⭐ (매우 어려움 - Context 설계 필요)

### Phase 3: Hooks 분리 (예상 ~800줄 감소)

#### 3.1 Custom Hooks 추출
- `src/hooks/useToast.ts` (~50줄)
- `src/hooks/useWeather.ts` (~150줄)
- `src/hooks/useOCR.ts` (~200줄)
- `src/hooks/useTrips.ts` (~300줄)
- `src/hooks/usePlanner.ts` (~100줄)

**난이도**: ⭐⭐⭐ (중간)

### Phase 4: 유틸리티 함수 분리 (예상 ~300줄 감소)

#### 4.1 Helper Functions
- `src/utils/tripHelpers.ts` - 여행 관련 유틸
- `src/utils/dateHelpers.ts` - 날짜 계산
- `src/utils/routeHelpers.ts` - 경로 최적화

**난이도**: ⭐⭐ (쉬움)

## 📈 예상 최종 결과

| 단계 | 감소 줄 수 | 남은 줄 수 | 진행률 |
|------|-----------|-----------|--------|
| 현재 | 165 | 10,425 | 1.6% |
| Phase 1 완료 | 3,500 | ~6,900 | 35% |
| Phase 2 완료 | 3,400 | ~3,500 | 68% |
| Phase 3 완료 | 800 | ~2,700 | 76% |
| Phase 4 완료 | 300 | ~2,400 | 79% |

**최종 목표**: App.tsx를 **2,400줄 이하**로 축소 (약 77% 감소)

## 🚀 실행 순서

1. **Phase 1 우선** (가장 효과적, 비교적 쉬움)
   - Phrasebook → OCR Lab → Documents → Map → Schedule 순서
   
2. **Phase 3 다음** (Hooks는 독립적)
   
3. **Phase 4 그 다음** (유틸리티 함수)

4. **Phase 2 마지막** (가장 복잡, Context 설계 필요)

## ⚠️ 주의사항

1. **각 Phase마다 백업 필수**
2. **컴파일 확인 후 다음 단계 진행**
3. **Phase 1만 완료해도 큰 효과** (3,500줄 감소)
4. **Phase 2는 별도 세션 권장** (복잡도 높음)

## 📅 예상 소요 시간

- Phase 1: 1-2시간
- Phase 2: 2-3시간 (Context 설계 포함)
- Phase 3: 30분-1시간
- Phase 4: 30분

**총 예상 시간**: 4-7시간

---

**다음 작업 시작 시**: Phase 1부터 시작 (Phrasebook → OCR Lab → Documents → Map → Schedule)
