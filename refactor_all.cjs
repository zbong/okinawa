const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 자동 리팩토링 시작!\n');

// 1. 구조 분석
console.log('📊 1단계: App.tsx 구조 분석...');
execSync('node analyze_structure.cjs', { stdio: 'inherit' });

// 2. 분석 결과 로드
const analysis = JSON.parse(fs.readFileSync('refactor_analysis.json', 'utf8'));

// 3. 난이도 순으로 정렬 (작은 것부터)
const sortedComponents = analysis.components.sort((a, b) => a.lineCount - b.lineCount);

console.log(`\n🎯 ${sortedComponents.length}개 컴포넌트를 순서대로 추출합니다...\n`);

let totalReduction = 0;

sortedComponents.forEach((comp, index) => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 ${index + 1}/${sortedComponents.length}: ${comp.name} (${comp.lineCount}줄)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
        // 추출
        console.log('   🔧 추출 중...');
        execSync(`node extract_component.cjs ${comp.name}`, { stdio: 'inherit' });

        // App.tsx 업데이트
        console.log('   📝 App.tsx 업데이트 중...');
        execSync(`node update_app.cjs ${comp.name}`, { stdio: 'inherit' });

        totalReduction += (comp.lineCount - 2); // import 1줄 + 호출 1줄

        // 컴파일 확인
        console.log('   ✅ 컴파일 확인 중...');
        try {
            execSync('npx tsc --noEmit', { stdio: 'pipe' });
            console.log('   ✅ 컴파일 성공!');
        } catch (error) {
            console.log('   ⚠️  컴파일 오류 발생 - 수동 수정 필요');
            console.log('   계속 진행합니다...');
        }

    } catch (error) {
        console.error(`   ❌ 오류 발생: ${error.message}`);
        console.log('   다음 컴포넌트로 계속...');
    }
});

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`🎉 자동 리팩토링 완료!`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`📊 총 감소: 약 ${totalReduction}줄`);
console.log(`\n⚠️  다음 단계:`);
console.log(`   1. 각 컴포넌트 파일의 Props 수정`);
console.log(`   2. npx tsc --noEmit 로 최종 확인`);
console.log(`   3. 테스트 실행`);
