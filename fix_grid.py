import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix the broken Voucher part (around line 3206-3220)
# Looking for line 3215: "</div>" followed by empty line and then indented div

start_idx = -1
for i in range(3200, 3230):
    if i < len(lines) and "이메일이나 PDF를 업로드하세요" in lines[i]:
        start_idx = i
        break

if start_idx != -1:
    # Replace the broken part
    # Line 3216 should have been the start of the second card
    lines[start_idx-1] = '                                                <div className="glass-card" style={{ padding: "30px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 15, cursor: "pointer" }} onClick={() => showToast("준비 중인 기능입니다.")}>\n'
    lines[start_idx]   = '                                                    <Upload size={32} color="var(--primary)" />\n'
    lines[start_idx+1] = '                                                    <div style={{ textAlign: "center" }}>\n'
    lines[start_idx+2] = '                                                        <div style={{ fontWeight: 800, fontSize: "16px" }}>바우처/예약확정서 인식</div>\n'
    # Keep '이메일이나 PDF를 업로드하세요' but fix indentation/wrapping
    # Original 3217 was: <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>이메일이나 PDF를 업로드하세요</div>
    # 3218 was: </div>
    # 3219 was: </div>
    # Let's just rewrite a block of lines
    
    # We need to find exactly how many lines to replace
    # Replacing from the empty line after first card till the end of the broken card
    
    # Range: from line index where first card ends (3215) + 1 to 3219
    # line 3215 is at lines[3214] (0-indexed)
    
    # Actually, I'll just find the "AI 숙소 추천받기" block and rewrite the whole grid
    
    grid_start = -1
    for i in range(3200, 3220):
        if "display: 'grid', gridTemplateColumns: '1fr 1fr'" in lines[i]:
            grid_start = i
            break
            
    if grid_start != -1:
        new_grid_content = """                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                                
                                                <div className="glass-card" style={{ padding: '30px', border: '2px dashed rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15, cursor: 'pointer' }} onClick={() => fetchHotelsWithAI(plannerData.destination)}>
                                                    <Sparkles size={32} color="var(--primary)" />
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>AI 숙소 추천받기</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>{plannerData.destination}의 인기 숙소를 추천합니다</div>
                                                    </div>
                                                </div>

                                                <div className="glass-card" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15, cursor: 'pointer' }} onClick={() => showToast("준비 중인 기능입니다.")}>
                                                    <Upload size={32} color="var(--primary)" />
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '16px' }}>바우처/확약서 인식</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>이메일이나 PDF를 업로드하세요</div>
                                                    </div>
                                                </div>
                                            </div>
"""
        # Find the end of this grid
        grid_end = -1
        for i in range(grid_start, grid_start + 40):
            if "직접 숙소 등록" in lines[i]: # This is the NEXT sibling
                # Go back until we find the closing div of the grid
                for j in range(i-1, grid_start, -1):
                    if "</div>" in lines[j]:
                        grid_end = j
                        break
                break
        
        if grid_start != -1 and grid_end != -1:
            # Replace lines[grid_start : grid_end + 1]
            lines[grid_start:grid_end+1] = [new_grid_content]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Successfully fixed Voucher grid.")
