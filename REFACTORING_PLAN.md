# App.tsx 리팩토링 계획

## 목표
11,022줄의 App.tsx를 기능별로 분리하여 5,000줄 이하로 축소

## 분리할 컴포넌트

### 1. Common Components (완료 ✓)
- [x] Toast.tsx (80줄)
- [x] ConfirmModal.tsx (120줄)

### 2. Planner Components (진행중)
- [ ] PlannerStep1.tsx (~600줄) - 목적지/제목/날짜 입력
- [ ] PlannerStep2.tsx (~350줄) - 여행 스타일 선택
- [ ] PlannerStep3.tsx (~1100줄) - 장소 선택
- [ ] PlannerStep4.tsx (~550줄) - 숙소 설정
- [ ] PlannerStep5.tsx (~850줄) - 최종 확인 및 생성

### 3. Tab Components
- [ ] ScheduleTab.tsx (~1500줄)
- [ ] MapTab.tsx (~800줄)
- [ ] DocumentsTab.tsx (~600줄)
- [ ] PhrasebookTab.tsx (~400줄)

### 4. Hooks
- [ ] useToast.ts - Toast 관리
- [ ] usePlanner.ts - Planner 상태 관리
- [ ] useOCR.ts - OCR 로직
- [ ] useTrips.ts - 여행 데이터 CRUD

## 예상 결과
- App.tsx: ~4,500줄 (현재 11,022줄)
- 분리된 컴포넌트: ~6,500줄
- 총 감소: 없음 (구조 개선)
- 토큰 사용량: 70% 감소 (파일별 작업 시)

## 진행 상황
1. ✓ 디렉토리 구조 생성
2. ✓ 공통 컴포넌트 분리
3. ⏳ Planner 컴포넌트 분리 중
4. ⏸ Tab 컴포넌트 분리 대기
5. ⏸ Hooks 분리 대기
6. ⏸ App.tsx 정리 대기
