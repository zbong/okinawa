const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 자동 리팩토링 시작!\n');

// 1. 구조 분석
console.log('📊 1단계: App.tsx 구조 분석...');
execSync('node analyze_structure.cjs', { stdio: 'inherit' });

// 2. 루프 시작
let processed = new Set();
let totalReduction = 0;

while (true) {
    // 매번 새로 분석 (라인 변화에 대응)
    execSync('node analyze_structure.cjs', { stdio: 'pipe' });
    const analysis = JSON.parse(fs.readFileSync('refactor_analysis.json', 'utf8'));

    // 아직 처리하지 않은 컴포넌트 찾기
    const comp = analysis.components.find(c => !processed.has(c.name));

    if (!comp) break;

    const index = processed.size;
    const totalCount = analysis.components.length + processed.size;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 ${index + 1}: ${comp.name} (${comp.lineCount}줄)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
        // 추출
        console.log('   🔧 추출 중...');
        execSync(`node extract_component.cjs ${comp.name}`, { stdio: 'inherit' });

        // App.tsx 업데이트
        console.log('   📝 App.tsx 업데이트 중...');
        execSync(`node update_app.cjs ${comp.name}`, { stdio: 'inherit' });

        totalReduction += (comp.lineCount - 2);
        processed.add(comp.name);

        // 컴파일 확인 (선택사항 - 한 번에 하려면 주석 처리 혹은 유지)
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
        processed.add(comp.name); // 오류나도 다음으로 넘어가기 위해 추가
    }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`🎉 자동 리팩토링 완료!`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`📊 총 감소: 약 ${totalReduction}줄`);
console.log(`\n⚠️  다음 단계:`);
console.log(`   1. 각 컴포넌트 파일의 Props 수정`);
console.log(`   2. npx tsc --noEmit 로 최종 확인`);
console.log(`   3. 테스트 실행`);
