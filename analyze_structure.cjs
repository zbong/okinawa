const fs = require('fs');
const path = require('path');

const appPath = 'e:/anti/okinawa/src/App.tsx';
const content = fs.readFileSync(appPath, 'utf8');
const lines = content.split('\n');

console.log('🔍 App.tsx 구조 분석 중...\n');

// Tab/View 마커 찾기
const markers = [
    { name: 'summary', pattern: /\{activeTab === ["']summary["'] && \(/, type: 'tab' },
    { name: 'schedule', pattern: /\{activeTab === ["']schedule["'] && \(/, type: 'tab' },
    { name: 'documents', pattern: /\{activeTab === ["']files["'] && \(/, type: 'tab' },
    { name: 'exchange', pattern: /\{activeTab === ["']exchange["'] && \(/, type: 'tab' },
    { name: 'phrasebook', pattern: /\{activeTab === ["']speech["'] && \(/, type: 'tab' },
    { name: 'ocr_lab', pattern: /\{view === ["']ocr_lab["'] && \(/, type: 'view' },
];

const components = [];

markers.forEach(marker => {
    // 시작 라인 찾기
    const startIdx = lines.findIndex(line => marker.pattern.test(line));

    if (startIdx === -1) {
        console.log(`⚠️  ${marker.name}: 찾을 수 없음`);
        return;
    }

    // 끝 라인 찾기 (다음 마커 또는 큰 블록 끝)
    let endIdx = startIdx;
    let braceCount = 0;
    let started = false;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];

        // 중괄호 카운팅
        for (const char of line) {
            if (char === '{') {
                braceCount++;
                started = true;
            } else if (char === '}') {
                braceCount--;
            }
        }

        // 블록이 완전히 닫히면 종료
        if (started && braceCount === 0) {
            endIdx = i;
            break;
        }

        // 너무 길면 (3000줄 이상) 중단
        if (i - startIdx > 3000) {
            endIdx = i;
            break;
        }
    }

    const lineCount = endIdx - startIdx + 1;

    components.push({
        name: marker.name,
        type: marker.type,
        startLine: startIdx + 1,
        endLine: endIdx + 1,
        lineCount: lineCount,
        pattern: marker.pattern.toString()
    });

    console.log(`✓ ${marker.name.padEnd(15)} | ${String(startIdx + 1).padStart(5)} - ${String(endIdx + 1).padStart(5)} | ${String(lineCount).padStart(5)} 줄`);
});

// 결과 저장
const result = {
    analyzedAt: new Date().toISOString(),
    totalLines: lines.length,
    components: components.sort((a, b) => a.startLine - b.startLine)
};

fs.writeFileSync('refactor_analysis.json', JSON.stringify(result, null, 2));

console.log(`\n✅ 분석 완료! refactor_analysis.json 저장됨`);
console.log(`📊 총 ${components.length}개 컴포넌트 발견`);
console.log(`📄 전체 파일: ${lines.length}줄`);
