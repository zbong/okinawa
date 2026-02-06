const fs = require('fs');

// 사용법: node update_app.cjs <componentName>
const componentName = process.argv[2];

if (!componentName) {
    console.error('❌ 사용법: node update_app.cjs <componentName>');
    console.error('   예: node update_app.cjs phrasebook');
    process.exit(1);
}

// 분석 결과 로드
const analysis = JSON.parse(fs.readFileSync('refactor_analysis.json', 'utf8'));
const component = analysis.components.find(c => c.name === componentName);

if (!component) {
    console.error(`❌ ${componentName}을(를) 찾을 수 없습니다.`);
    process.exit(1);
}

console.log(`🔧 App.tsx 업데이트 중...`);
console.log(`   ${componentName}: ${component.startLine} - ${component.endLine} 제거`);

// App.tsx 읽기
const appPath = 'e:/anti/okinawa/src/App.tsx';
const appContent = fs.readFileSync(appPath, 'utf8');
let lines = appContent.split('\n');

// 컴포넌트 이름 생성
const componentFileName = componentName.charAt(0).toUpperCase() + componentName.slice(1) + 'Tab';
const folderName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

// 1. Import 추가 (기존 imports 뒤에)
const importLine = `import { ${componentFileName} } from './components/${folderName}/${componentFileName}';`;
let importInsertIndex = -1;

// MapComponent import 찾기 (그 다음에 추가)
for (let i = 0; i < 100; i++) {
    if (lines[i].includes('import') && lines[i].includes('MapComponent')) {
        importInsertIndex = i + 1;
        break;
    }
}

if (importInsertIndex === -1) {
    // 못 찾으면 첫 번째 빈 줄 다음에
    importInsertIndex = lines.findIndex((l, i) => i > 10 && l.trim() === '') + 1;
}

lines.splice(importInsertIndex, 0, importLine);

// 2. 기존 컴포넌트 코드 제거하고 새 컴포넌트 호출로 교체
// 분석 결과의 패턴을 사용하여 정확한 위치를 다시 찾음 (import 추가 등으로 라인이 밀릴 수 있음)
const patternStr = component.pattern;
const pattern = new RegExp(patternStr.substring(1, patternStr.length - 1));

const actualStartIdx = lines.findIndex(line => pattern.test(line));

if (actualStartIdx === -1) {
    console.error(`❌ App.tsx에서 ${componentName} 패턴을 찾을 수 없습니다.`);
    process.exit(1);
}

// 끝 라인 찾기 (brace counting 다시 실행)
let actualEndIdx = actualStartIdx;
let braceCount = 0;
let started = false;

for (let i = actualStartIdx; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '{') { braceCount++; started = true; }
        else if (char === '}') { braceCount--; }
    }
    if (started && braceCount === 0) {
        actualEndIdx = i;
        break;
    }
}

const indentation = lines[actualStartIdx].match(/^\s*/)[0];
const replacement = `${indentation}<${componentFileName} {...props} />`;

// 교체
const linesToRemove = actualEndIdx - actualStartIdx + 1;
lines.splice(actualStartIdx, linesToRemove, replacement);

// 3. 파일 저장
fs.writeFileSync(appPath, lines.join('\n'));

const removedLines = component.lineCount;
const addedLines = 2; // import 1줄 + 컴포넌트 호출 1줄
const netReduction = removedLines - addedLines;

console.log(`✅ App.tsx 업데이트 완료!`);
console.log(`   제거: ${removedLines}줄`);
console.log(`   추가: ${addedLines}줄`);
console.log(`   순 감소: ${netReduction}줄`);
console.log(`\n⚠️  다음 단계:`);
console.log(`   1. npx tsc --noEmit 로 컴파일 확인`);
console.log(`   2. 오류 있으면 Props 수정`);
console.log(`   3. 다음 컴포넌트 추출`);
