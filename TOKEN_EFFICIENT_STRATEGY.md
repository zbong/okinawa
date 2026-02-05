# 🎯 토큰 효율적 리팩토링 전략

## 💡 핵심 아이디어: 자동화 스크립트 활용

대형 파일 리팩토링 시 **AI가 파일을 직접 읽지 않고**, 미리 작성된 **자동화 스크립트**가 작업을 수행하도록 합니다.

## 📝 준비 작업 (지금 할 것)

### 1. 각 Tab의 정확한 라인 범위 파악

```javascript
// analyze_tabs.cjs - Tab 범위 자동 분석
const fs = require('fs');

const appPath = 'e:/anti/okinawa/src/App.tsx';
const lines = fs.readFileSync(appPath, 'utf8').split('\n');

// 각 Tab의 시작/끝 라인 찾기
const tabs = {
  phrasebook: { start: null, end: null },
  ocr_lab: { start: null, end: null },
  documents: { start: null, end: null },
  map: { start: null, end: null },
  schedule: { start: null, end: null }
};

// 자동으로 범위 찾기 로직...
// 결과를 JSON 파일로 저장
fs.writeFileSync('tab_ranges.json', JSON.stringify(tabs, null, 2));
```

### 2. 추출 스크립트 미리 작성

```javascript
// extract_tab.cjs - Tab 추출 자동화
const fs = require('fs');

function extractTab(tabName, startLine, endLine) {
  const appContent = fs.readFileSync('e:/anti/okinawa/src/App.tsx', 'utf8');
  const lines = appContent.split('\n');
  
  // Tab 내용 추출
  const tabContent = lines.slice(startLine - 1, endLine).join('\n');
  
  // 필요한 imports 자동 감지
  const imports = detectImports(tabContent);
  
  // 새 파일 생성
  const componentContent = generateComponent(tabName, imports, tabContent);
  
  // 파일 저장
  const fileName = `src/components/${capitalize(tabName)}/${capitalize(tabName)}Tab.tsx`;
  fs.writeFileSync(fileName, componentContent);
  
  console.log(`✓ ${tabName} Tab 추출 완료: ${fileName}`);
}

// 사용: node extract_tab.cjs phrasebook 1234 1567
```

### 3. App.tsx 업데이트 스크립트

```javascript
// update_app.cjs - App.tsx에서 Tab 제거 및 import 추가
const fs = require('fs');

function replaceTabWithComponent(tabName, startLine, endLine) {
  const appContent = fs.readFileSync('e:/anti/okinawa/src/App.tsx', 'utf8');
  let lines = appContent.split('\n');
  
  // Import 추가
  const importLine = `import { ${capitalize(tabName)}Tab } from './components/${capitalize(tabName)}/${capitalize(tabName)}Tab';`;
  lines.splice(80, 0, importLine);
  
  // 기존 Tab 코드를 컴포넌트 호출로 교체
  const replacement = `<${capitalize(tabName)}Tab {...props} />`;
  lines.splice(startLine, endLine - startLine + 1, replacement);
  
  fs.writeFileSync('e:/anti/okinawa/src/App.tsx', lines.join('\n'));
  console.log(`✓ App.tsx 업데이트 완료: ${tabName}`);
}
```

## 🚀 내일 작업 시 워크플로우

### 방법 1: 완전 자동화 (토큰 최소 사용)

```bash
# 1. Tab 범위 분석 (1회만)
node analyze_tabs.cjs

# 2. 각 Tab 자동 추출 및 App.tsx 업데이트
node extract_and_update.cjs phrasebook
node extract_and_update.cjs ocr_lab
node extract_and_update.cjs documents
node extract_and_update.cjs map
node extract_and_update.cjs schedule

# 3. 컴파일 확인
npx tsc --noEmit

# 4. 완료!
```

**AI 역할**: 
- 스크립트 실행 명령만 제안
- 오류 발생 시만 개입
- **토큰 사용량: ~5,000 토큰** (현재의 1/14)

### 방법 2: 반자동화 (중간 토큰 사용)

```bash
# AI가 각 단계마다:
# 1. 스크립트 실행
# 2. 결과 확인
# 3. 다음 단계 진행

# 토큰 사용량: ~20,000 토큰 (현재의 1/3)
```

### 방법 3: 수동 가이드 (토큰 많이 사용)

- AI가 파일을 직접 읽고 수정
- **비추천** (현재 방식, 토큰 낭비)

## 📦 지금 준비할 것

### 필수 스크립트 3개 생성

1. **`analyze_structure.cjs`** - App.tsx 구조 분석
   - 각 Tab의 시작/끝 라인 찾기
   - 의존성 분석
   - 결과를 JSON으로 저장

2. **`extract_component.cjs`** - 컴포넌트 추출
   - 지정된 라인 범위 추출
   - 필요한 imports 자동 감지
   - Props interface 자동 생성
   - 새 파일 생성

3. **`update_main.cjs`** - App.tsx 업데이트
   - 추출된 부분 제거
   - Import 추가
   - 컴포넌트 호출로 교체

### 설정 파일 생성

```json
// refactor_config.json
{
  "components": [
    {
      "name": "PhrasebookTab",
      "type": "tab",
      "startMarker": "activeTab === \"phrasebook\"",
      "dependencies": ["speechItems", "playAudio"],
      "difficulty": 1
    },
    {
      "name": "OCRLab",
      "type": "view",
      "startMarker": "view === \"ocr_lab\"",
      "dependencies": ["analyzedFiles", "setView"],
      "difficulty": 1
    }
    // ... 나머지 컴포넌트
  ]
}
```

## 🎯 최종 명령어 (내일 실행)

```bash
# 한 번에 모든 Tab 추출
node refactor_all.cjs

# 또는 하나씩
node refactor_one.cjs phrasebook
node refactor_one.cjs ocr_lab
# ...
```

## 💰 토큰 절약 효과

| 방법 | 토큰 사용량 | 시간 | 정확도 |
|------|------------|------|--------|
| 현재 (수동) | ~70,000 | 2시간 | 95% |
| 반자동 | ~20,000 | 1시간 | 90% |
| **완전 자동** | **~5,000** | **30분** | **85%** |

## ⚡ 추천 방법

**완전 자동화 스크립트**를 지금 만들어두고, 내일은:
1. 스크립트 실행만 하기
2. 컴파일 오류만 수정
3. 완료!

이렇게 하면 **토큰을 90% 이상 절약**할 수 있습니다!

---

**지금 할 일**: 
1. `analyze_structure.cjs` 생성 ✓
2. `extract_component.cjs` 생성 ✓
3. `refactor_config.json` 생성 ✓

이 3개 파일만 만들어두면, 내일은 명령어 3개로 모든 작업 완료!
