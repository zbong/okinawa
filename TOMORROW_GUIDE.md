# 🎯 내일 할 일: 자동 리팩토링

## 📋 준비 완료!

다음 4개의 자동화 스크립트가 준비되었습니다:

1. ✅ `analyze_structure.cjs` - App.tsx 구조 분석
2. ✅ `extract_component.cjs` - 컴포넌트 추출
3. ✅ `update_app.cjs` - App.tsx 업데이트
4. ✅ `refactor_all.cjs` - 전체 자동 실행

## 🚀 내일 실행 방법

### 방법 1: 완전 자동 (추천! 🌟)

```bash
# 한 번에 모든 컴포넌트 추출
node refactor_all.cjs
```

**예상 시간**: 5분  
**토큰 사용**: ~2,000 (AI는 오류 수정만)  
**결과**: ~3,500줄 감소

### 방법 2: 하나씩 수동

```bash
# 1. 구조 분석 (1회만)
node analyze_structure.cjs

# 2. 각 컴포넌트 추출 (작은 것부터)
node extract_component.cjs phrasebook
node update_app.cjs phrasebook
npx tsc --noEmit

node extract_component.cjs ocr_lab
node update_app.cjs ocr_lab
npx tsc --noEmit

# ... 반복
```

**예상 시간**: 30분  
**토큰 사용**: ~5,000  
**장점**: 각 단계 확인 가능

## 📊 예상 결과

| 컴포넌트 | 예상 줄 수 | 난이도 |
|---------|-----------|--------|
| Phrasebook | ~400 | ⭐ |
| OCR Lab | ~200 | ⭐ |
| Documents | ~600 | ⭐⭐ |
| Map | ~800 | ⭐⭐ |
| Schedule | ~1,500 | ⭐⭐⭐ |
| **합계** | **~3,500** | |

**최종 App.tsx**: 10,425줄 → **~6,900줄** (33% 감소)

## ⚠️ 주의사항

### 1. 백업 확인
```bash
# 백업 파일 존재 확인
ls e:\anti\okinawa\src\App.tsx.backup_final
```

### 2. Props 수정 필요
자동 추출 후 각 컴포넌트의 Props를 수동으로 수정해야 합니다:

```tsx
// 예: PhrasebookTab.tsx
interface PhrasebookTabProps {
  speechItems: SpeechItem[];
  playAudio: (text: string) => void;
  // ... 필요한 props 추가
}
```

### 3. 컴파일 오류 수정
```bash
# 오류 확인
npx tsc --noEmit

# 오류가 있으면 해당 파일 수정
```

## 🎯 AI에게 요청할 것

내일 대화 시작 시:

```
"refactor_all.cjs 실행해줘. 오류 나면 수정해줘."
```

**끝!** 이것만 하면 됩니다.

## 📈 토큰 사용량 비교

| 방법 | 토큰 | 시간 |
|------|------|------|
| 오늘 방식 (수동) | ~70,000 | 2시간 |
| **내일 방식 (자동)** | **~2,000** | **5분** |
| **절약** | **97%** | **96%** |

## 🔧 문제 발생 시

### 스크립트 오류
```bash
# 분석 다시 실행
node analyze_structure.cjs

# 특정 컴포넌트만 재추출
node extract_component.cjs <name>
```

### 컴파일 오류
- AI에게 오류 메시지 보여주기
- Props 수정 요청

### 롤백
```bash
# 백업에서 복원
copy e:\anti\okinawa\src\App.tsx.backup_final e:\anti\okinawa\src\App.tsx
```

## ✅ 체크리스트

내일 작업 전:
- [ ] 백업 파일 확인
- [ ] `refactor_analysis.json` 삭제 (새로 생성)
- [ ] Git commit (선택사항)

내일 작업 후:
- [ ] 컴파일 확인
- [ ] 앱 실행 테스트
- [ ] Props 수정
- [ ] 최종 커밋

---

**준비 완료! 내일 5분이면 끝!** 🚀
