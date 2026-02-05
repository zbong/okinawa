# 리팩토링 진행 보고서

## ✅ 완료된 작업 (2026-02-05 22:23)

### 1. 디렉토리 구조 생성
```
src/
├── components/
│   ├── Common/
│   │   ├── Toast.tsx ✓
│   │   └── ConfirmModal.tsx ✓
│   ├── Planner/
│   │   ├── types.ts ✓
│   │   ├── PlannerStep1.tsx ✓
│   │   ├── PlannerStep2.tsx ✓
│   │   ├── PlannerStep3.tsx ✓
│   │   ├── PlannerStep4.tsx ✓
│   │   └── PlannerStep5.tsx ✓
│   ├── MapComponent.tsx (기존)
│   └── [Schedule, Map, Documents - 대기]
```

### 2. 코드 분리 성과
- **App.tsx**: 11,022줄 → 7,697줄 (**3,325줄 감소, 30% 축소**)
- **분리된 컴포넌트**: 총 3,605줄
  - Toast: 80줄
  - ConfirmModal: 120줄
  - PlannerStep1: 605줄
  - PlannerStep2: 325줄
  - PlannerStep3: 1,100줄
  - PlannerStep4: 550줄
  - PlannerStep5: 825줄

### 3. 토큰 사용량
- 사용: 109,000 / 200,000 (54.5%)
- 남은 토큰: 91,000

## ⚠️ 남은 문제

### 컴파일 오류
Planner 컴포넌트들이 App.tsx의 많은 state와 함수를 참조합니다:
- `analyzedFiles`, `setAnalyzedFiles`
- `currentUser`
- `isDragging`, `setIsDragging`
- `handleFileAnalysis`, `handleTicketOcr`
- `ticketFileInputRef`
- `fetchAttractionsWithAI`
- 기타 20+ 개의 변수/함수

### 해결 방법 (2가지 옵션)

#### 옵션 A: 모든 props 전달 (권장하지 않음)
- 각 컴포넌트에 20+ 개의 props 전달
- 타입 정의 복잡도 증가
- 유지보수 어려움

#### 옵션 B: Context API 사용 (권장)
```tsx
// PlannerContext.tsx 생성
const PlannerContext = createContext({
  // 모든 state와 함수를 context로 제공
});

// App.tsx에서
<PlannerContext.Provider value={{...}}>
  <PlannerStep1 />
</PlannerContext.Provider>

// 각 Step에서
const { analyzedFiles, handleFileAnalysis } = usePlannerContext();
```

#### 옵션 C: 현재 상태 유지 (가장 실용적)
- Planner 컴포넌트들을 다시 App.tsx에 인라인으로 유지
- 대신 **Tab 컴포넌트들**(Schedule, Map, Documents)을 분리
- 이들은 의존성이 적어 분리가 쉬움

## 📊 현재 상태

### 파일 크기
- `App.tsx`: 7,697줄 (여전히 큼)
- 목표: 5,000줄 이하

### 다음 단계 제안
1. **Tab 컴포넌트 분리** (더 쉬움)
   - ScheduleTab.tsx (~1,500줄)
   - MapTab.tsx (~800줄)
   - DocumentsTab.tsx (~600줄)
   
2. **Planner는 Context로 리팩토링** (나중에)
   - PlannerContext 생성
   - 모든 Planner state를 context로 이동

3. **또는 Planner를 다시 인라인으로** (빠른 해결)
   - 현재 분리된 파일들을 App.tsx에 다시 병합
   - Tab 컴포넌트만 분리

## 권장 사항

**지금 당장**: Planner 컴포넌트를 App.tsx에 다시 병합하고, 대신 Tab 컴포넌트들을 분리하는 것을 권장합니다. 이유:

1. Tab 컴포넌트는 의존성이 적음
2. 분리가 훨씬 쉬움
3. 즉시 컴파일 가능
4. 토큰 절약 효과는 동일

사용자의 선택을 기다립니다:
- A: Planner Context 리팩토링 계속 (복잡, 시간 많이 소요)
- B: Planner 병합 + Tab 분리 (빠르고 실용적)
- C: 현재 상태에서 수동 수정
