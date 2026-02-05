const fs = require('fs');
const path = require('path');

// 사용법: node extract_component.cjs <componentName>
const componentName = process.argv[2];

if (!componentName) {
    console.error('❌ 사용법: node extract_component.cjs <componentName>');
    console.error('   예: node extract_component.cjs phrasebook');
    process.exit(1);
}

// 분석 결과 로드
const analysis = JSON.parse(fs.readFileSync('refactor_analysis.json', 'utf8'));
const component = analysis.components.find(c => c.name === componentName);

if (!component) {
    console.error(`❌ ${componentName}을(를) 찾을 수 없습니다.`);
    process.exit(1);
}

console.log(`🔧 ${componentName} 추출 중...`);
console.log(`   라인: ${component.startLine} - ${component.endLine} (${component.lineCount}줄)`);

// App.tsx 읽기
const appContent = fs.readFileSync('e:/anti/okinawa/src/App.tsx', 'utf8');
const lines = appContent.split('\n');

// 컴포넌트 내용 추출
const componentLines = lines.slice(component.startLine - 1, component.endLine);
let componentCode = componentLines.join('\n');

// 들여쓰기 제거 (첫 줄 기준)
const firstLineIndent = componentLines[0].match(/^\s*/)[0].length;
componentCode = componentLines.map(line => {
    return line.substring(Math.min(firstLineIndent, line.search(/\S/)));
}).join('\n');

// 필요한 imports 감지
const imports = new Set();
const importPatterns = [
    { pattern: /motion\./g, import: "import { motion } from 'framer-motion';" },
    { pattern: /useState|useEffect|useRef|useMemo|useCallback/g, import: "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';" },
    { pattern: /<(Calendar|Clock|MapPin|Search|Plus|Trash|Edit|Check|X|ChevronLeft|ChevronRight|Play|Volume|Download|Upload|File|Image)\s/g, import: "import { Calendar, Clock, MapPin, Search, Plus, Trash2, Edit3, Check, X, ChevronLeft, ChevronRight, Play, Volume2, Download, Upload, FileText, Image } from 'lucide-react';" },
];

importPatterns.forEach(({ pattern, import: importStatement }) => {
    if (pattern.test(componentCode)) {
        imports.add(importStatement);
    }
});

// 컴포넌트 이름 생성
const componentFileName = componentName.charAt(0).toUpperCase() + componentName.slice(1) + 'Tab';
const folderName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

// Props interface 생성 (기본)
const propsInterface = `
interface ${componentFileName}Props {
  // TODO: Add required props based on dependencies
  [key: string]: any;
}
`;

// 최종 컴포넌트 파일 생성
const finalComponent = `${Array.from(imports).join('\n')}

${propsInterface}

export const ${componentFileName}: React.FC<${componentFileName}Props> = (props) => {
  return (
${componentCode}
  );
};
`;

// 디렉토리 생성
const componentDir = `e:/anti/okinawa/src/components/${folderName}`;
if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
}

// 파일 저장
const outputPath = path.join(componentDir, `${componentFileName}.tsx`);
fs.writeFileSync(outputPath, finalComponent);

console.log(`✅ 추출 완료: ${outputPath}`);
console.log(`📝 ${component.lineCount}줄 추출됨`);
console.log(`\n⚠️  다음 단계:`);
console.log(`   1. ${outputPath} 파일 열기`);
console.log(`   2. Props interface 수정`);
console.log(`   3. 필요한 imports 추가/제거`);
console.log(`   4. node update_app.cjs ${componentName} 실행`);
