import re
import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isEditingPoint state and savePointEdit function
edit_state_func = """
    const [isEditingPoint, setIsEditingPoint] = useState(false);

    const savePointEdit = (id: string, updates: Partial<LocationPoint>) => {
        const updatedPoints = allPoints.map(p => p.id === id ? { ...p, ...updates } : p);
        setAllPoints(updatedPoints);
        if (selectedPoint && selectedPoint.id === id) {
            setSelectedPoint({ ...selectedPoint, ...updates });
        }
        setIsEditingPoint(false);
        showToast('정보가 수정되었습니다.');
    };
"""
content = re.sub(r'(const \[isSearchingHotels, setIsSearchingHotels\] = useState\(false\);)', edit_state_func + r'\1', content)

# 2. Update Bottom Sheet UI to support Editing
# Header area: add "Edit" icon next to title
new_header = """
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedPoint.name}</h3>
                                                    <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedPoint.category.toUpperCase()}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setIsEditingPoint(!isEditingPoint)}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: isEditingPoint ? 'var(--primary)' : 'white', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            </div>
"""

# Replace lines 2307-2310
content = re.sub(r'<div style=\{\{ marginBottom: \'20px\' \}\}>\s+<h3 style=\{\{ fontSize: \'24px\', fontWeight: 800, color: \'var\(--text-primary\)\' \}\}>\{selectedPoint\.name\}<\/h3>\s+<p style=\{\{ color: \'var\(--primary\)\', fontWeight: 600 \}\}>\{selectedPoint\.category\.toUpperCase\(\)\}<\/p>\s+<\/div>', new_header, content, flags=re.DOTALL)

# 3. Add Edit Form in Bottom Sheet (when isEditingPoint is true)
edit_form_ui = """
                                            {isEditingPoint ? (
                                                <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>장소 이름</label>
                                                        <input 
                                                            id="edit-name" 
                                                            defaultValue={selectedPoint.name} 
                                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>전화번호</label>
                                                        <input 
                                                            id="edit-phone" 
                                                            defaultValue={selectedPoint.phone || ''} 
                                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', display: 'block' }}>맵코드</label>
                                                        <input 
                                                            id="edit-mapcode" 
                                                            defaultValue={selectedPoint.mapcode || ''} 
                                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                        <button 
                                                            onClick={() => setIsEditingPoint(false)} 
                                                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 600 }}
                                                        >
                                                            취소
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const name = (document.getElementById('edit-name') as HTMLInputElement).value;
                                                                const phone = (document.getElementById('edit-phone') as HTMLInputElement).value;
                                                                const mapcode = (document.getElementById('edit-mapcode') as HTMLInputElement).value;
                                                                savePointEdit(selectedPoint.id, { name, phone, mapcode });
                                                            }} 
                                                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: 800 }}
                                                        >
                                                            저장하기
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
"""

# Replace the beginning of the button grid
content = content.replace('<div style={{ display: \'grid\', gridTemplateColumns: \'1fr 1fr\', gap: \'12px\', marginBottom: \'24px\' }}>', edit_form_ui)

# Add closing parenthesis for the conditional
# Need to find where the grid ends
grid_end = '                                                {selectedPoint.mapcode && (\n                                                    <div className="glass-card" style={{ padding: \'12px\', textAlign: \'center\', margin: 0 }}>\n                                                        <div style={{ fontSize: \'10px\', opacity: 0.5 }}>맵코드</div>\n                                                        <div style={{ fontWeight: 700, color: \'var(--text-primary)\' }}>{selectedPoint.mapcode}</div>\n                                                    </div>\n                                                )}\n                                            </div>'
content = content.replace(grid_end, grid_end + '\n                                            )}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied point editing edits.")
