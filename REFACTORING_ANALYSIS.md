# 🔍 코드 리팩토링 분석 보고서

**생성일**: 2026-02-09  
**분석 대상**: `e:\anti\okinawa\src` 전체

---

## 📊 코드베이스 현황

### 파일 크기 순위 (Top 15)
| 순위 | 파일 | 라인 수 | 크기(KB) | 상태 |
|------|------|---------|----------|------|
| 1 | `App.tsx` | 1,705 | 70.4 | 🔴 **심각** |
| 2 | `Planner/PlannerStep3.tsx` | 1,053 | 55.2 | 🔴 **심각** |
| 3 | `contexts/PlannerContext.tsx` | 832 | 37.1 | 🟠 **경고** |
| 4 | `LocationBottomSheet.tsx` | 737 | 35.1 | 🟠 **경고** |
| 5 | `Planner/PlannerStep1.tsx` | 642 | 30.2 | 🟠 **경고** |
| 6 | `Ocr_lab/Ocr_labTab.tsx` | 612 | 22.4 | 🟠 **경고** |
| 7 | `Planner/PlannerStep5.tsx` | 606 | 33.0 | 🟠 **경고** |
| 8 | `Planner/PlannerStep4.tsx` | 603 | 31.5 | 🟠 **경고** |
| 9 | `Schedule/ScheduleTab.tsx` | 541 | 17.1 | 🟡 **주의** |
| 10 | `Planner/PlannerStep6.tsx` | 513 | 31.9 | 🟡 **주의** |

### 기준
- 🔴 **심각**: 500+ 라인 (즉시 분할 필요)
- 🟠 **경고**: 300~500 라인 (분할 권장)
- 🟡 **주의**: 200~300 라인 (검토 필요)
- 🟢 **양호**: 200 라인 미만

---

## 🚨 주요 문제점

### 1. 거대 파일 (Giant Files)
**AI_GUIDELINES.md 위반**: "한 파일이 250~300라인을 초과하는 것은 '나쁜 코드'"

| 파일 | 문제 | 권장 조치 |
|------|------|-----------|
| `App.tsx` (1,705줄) | 모든 탭 렌더링, 모달, 상태 관리가 한 파일에 집중 | 탭별 컴포넌트 분리, 모달 분리 |
| `PlannerStep3.tsx` (1,053줄) | 항공편 + 숙소 + 파일업로드가 혼재 | 섹션별 하위 컴포넌트 분리 |
| `PlannerContext.tsx` (832줄) | 너무 많은 상태와 함수 | 도메인별 Context 분리 |

### 2. TypeScript 오류 (2개)
```
1. src/App.tsx:177 - 'cleanupStorage' 선언 후 미사용
2. src/components/Schedule/ScheduleTab.tsx:336 - 'trip' is possibly 'null'
```

### 3. 타입 안정성 부족 (`any` 타입 남용)
`any` 타입 사용 파일: **26개** (거의 전체)

주요 위반 파일:
- `PlannerContext.tsx`: `any` 20+ 사용
- `usePlannerAI.ts`: `any` 15+ 사용
- `useDocumentAnalysis.ts`: `any` 10+ 사용

### 4. 단일 책임 원칙 (SRP) 위반

| 파일 | 현재 책임 | 문제점 |
|------|----------|--------|
| `App.tsx` | UI 렌더링 + 라우팅 + 상태 + 이벤트 + 모달 | 5개 이상의 역할 |
| `PlannerContext.tsx` | 상태 + AI + 파일 + 공유 + 오프라인 | 너무 많은 비즈니스 로직 |
| `PlannerStep3.tsx` | 교통 + 숙소 + 파일분석 + 항공사매핑 | 분리 가능한 기능 혼재 |

### 5. 중복 코드 (DRY 위반)

| 패턴 | 발생 위치 | 중복 횟수 |
|------|----------|----------|
| `onConfirm` 핸들러 | `App.tsx`, `PlannerStep3.tsx` 등 | 10+ |
| `스타일 객체` (inline) | 전역 | 수백 개 |
| `Toast/Modal` 호출 패턴 | 전역 | 50+ |

### 6. 컴포넌트 위치 불일치

| 파일 | 현재 위치 | 권장 위치 |
|------|----------|----------|
| `LocationBottomSheet.tsx` | `components/` (루트) | `components/Common/` |
| `MapComponent.tsx` | `components/` (루트) | `components/Map/` |

---

## 📋 리팩토링 계획

### Phase 1: 긴급 수정 ✅ 완료
**목표**: TypeScript 오류 해결 + 빌드 안정화

1. [x] `cleanupStorage` 미사용 경고 해결 (삭제)
2. [x] `trip` null 체크 추가 (ScheduleTab, DocumentsTab, PhrasebookTab)
3. [x] 기타 미사용 변수 정리 (plannerStep, MapPin, deleteFile 등)
4. [x] Git 커밋: `d5c053e`

### Phase 2: App.tsx 분할 (2시간)
**목표**: 1,705줄 → 500줄 이하

| 추출 대상 | 예상 라인 | 새 파일 |
|----------|----------|---------|
| ErrorBoundary | ~30 | `components/Common/ErrorBoundary.tsx` |
| 탭 렌더링 로직 | ~200 | `components/TabRenderer.tsx` |
| 모달들 | ~150 | `components/Modals/` 폴더 |
| 공유 링크 처리 | ~70 | `hooks/useSharedLink.ts` |
| 드래그 방지 + 에러 핸들링 | ~50 | `hooks/useAppEvents.ts` |

### Phase 3: PlannerStep3 분할 (1.5시간)
**목표**: 1,053줄 → 300줄 이하

| 추출 대상 | 예상 라인 | 새 파일 |
|----------|----------|---------|
| 항공권 섹션 | ~400 | `Planner/FlightSection.tsx` |
| 숙소 섹션 | ~200 | `Planner/AccommodationSection.tsx` |
| 파일 업로드 UI | ~150 | `Planner/FileUploadZone.tsx` |
| 항공사/공항 매핑 | ~100 | `utils/airline-data.ts` |

### Phase 4: Context 분할 (2시간)
**목표**: 832줄 → 각 300줄 이하

| 현재 | 분리 후 |
|------|--------|
| `PlannerContext.tsx` | `PlannerContext.tsx` (상태만) |
| | `hooks/usePlannerActions.ts` (액션) |
| | `hooks/useFileManager.ts` (파일) |
| | `hooks/useOfflineSync.ts` (오프라인) |

### Phase 5: 타입 강화 (1시간)
1. [ ] `any` → 구체적 타입 변환
2. [ ] 공통 인터페이스 `types.ts`에 추가
3. [ ] Props 인터페이스 명시

### Phase 6: 스타일 정리 (30분)
1. [ ] 반복 인라인 스타일 → CSS 클래스
2. [ ] 공통 스타일 `design-system.css` 확장

---

## 📈 예상 결과

| 지표 | 현재 | 목표 |
|------|------|------|
| 최대 파일 크기 | 1,705줄 | 300줄 |
| TypeScript 오류 | 2개 | 0개 |
| `any` 타입 사용 | 100+ | 10 이하 |
| 파일 수 | ~35개 | ~50개 |
| 코드 재사용성 | 낮음 | 높음 |

---

## ⏱️ 총 예상 소요 시간
- **Phase 1**: 1시간
- **Phase 2**: 2시간
- **Phase 3**: 1.5시간
- **Phase 4**: 2시간
- **Phase 5**: 1시간
- **Phase 6**: 0.5시간

**총합**: 약 **8시간** (우선순위에 따라 단계별 진행)

---

## 🎯 권장 실행 순서

1. **오늘**: Phase 1 (긴급 수정) - 빌드 안정화
2. **1차**: Phase 2 (App.tsx) - 가장 큰 효과
3. **2차**: Phase 3 (PlannerStep3) - 두 번째 거대 파일
4. **3차**: Phase 4-6 - 품질 개선

---

## 📝 참고: 자동화 스크립트

이전에 생성된 리팩토링 스크립트가 있습니다:
- `analyze_structure.cjs`
- `extract_component.cjs`
- `update_app.cjs`
- `refactor_all.cjs`

단, 현재 코드 구조가 변경되어 스크립트 업데이트가 필요할 수 있습니다.
