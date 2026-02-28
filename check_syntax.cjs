const fs = require('fs');
const content = fs.readFileSync('e:/anti/okinawa/src/components/Planner/steps/PlannerStep4.tsx', 'utf8');

function checkBalance(text) {
    let stack = [];
    let lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        for (let j = 0; j < line.length; j++) {
            let char = line[j];
            if (char === '{' || char === '(' || char === '[') {
                stack.push({ char, line: i + 1, col: j + 1 });
            } else if (char === '}' || char === ')' || char === ']') {
                if (stack.length === 0) {
                    console.log(`Extra close ${char} at L${i + 1}:C${j + 1}`);
                    return false;
                }
                let open = stack.pop();
                if ((char === '}' && open.char !== '{') ||
                    (char === ')' && open.char !== '(') ||
                    (char === ']' && open.char !== '[')) {
                    console.log(`Mismatch: ${open.char} (L${open.line}) closed by ${char} (L${i + 1})`);
                    return false;
                }
            }
        }
    }
    if (stack.length > 0) {
        let open = stack[0];
        console.log(`Unclosed ${open.char} from L${open.line}`);
        return false;
    }
    return true;
}

if (checkBalance(content)) {
    console.log('Balance check PASSED');
} else {
    console.log('Balance check FAILED');
}
