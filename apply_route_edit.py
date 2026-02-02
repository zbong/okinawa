import re
import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add deletePoint and addPoint functions after handleReorder
new_functions = """
    const deletePoint = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (window.confirm('이 장소를 일정에서 삭제하시겠습니까?')) {
            const updatedPoints = allPoints.filter(p => p.id !== id);
            setAllPoints(updatedPoints);
            showToast('장소가 삭제되었습니다.');
        }
    };

    const addPoint = (category: 'sightseeing' | 'food' | 'logistics' | 'stay' = 'sightseeing') => {
        const name = window.prompt('장소 이름을 입력해주세요:');
        if (!name) return;

        const newPoint: LocationPoint = {
            id: `point-${Date.now()}`,
            name,
            category,
            coordinates: { lat: 26.2124, lng: 127.6809 }, // Default to Naha
            tips: ['사용자가 직접 추가한 장소입니다.'],
            day: scheduleDay,
            description: ''
        };

        setAllPoints([...allPoints, newPoint]);
        showToast('장소가 추가되었습니다.');
    };
"""

content = re.sub(r'(const handleReorder = .*?\n    };)', r'\1\n' + new_functions, content, flags=re.DOTALL)

# 2. Add Delete button to Schedule list
# Target: next to toggleComplete button
delete_button_html = """
                                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                                        <button
                                                                            onClick={(e) => deletePoint(p.id, e)}
                                                                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 5 }}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => toggleComplete(p.id, e)}
                                                                            style={{ background: 'transparent', border: 'none', color: isDone ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: 5 }}
                                                                        >
                                                                            {isDone ? <CheckCircle size={24} /> : <Circle size={24} />}
                                                                        </button>
                                                                    </div>
"""

# Find the toggleComplete button and replace/wrap it
content = re.sub(r'<button\s+onClick=\{\(e\)\s+=>\s+toggleComplete\(p\.id,\s+e\)\}.*?>\s+\{isDone\s+\?\s+<CheckCircle\s+size=\{24\}\s+/>\s+:\s+<Circle\s+size=\{24\}\s+/>\}\s+</button>', delete_button_html, content, flags=re.DOTALL)

# 3. Add "Add Point" button at the bottom of the list
add_point_button_html = """
                                                    </Reorder.Group>
                                                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                                        <button 
                                                            onClick={() => addPoint('sightseeing')}
                                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                                                        >
                                                            <MapPin size={14} /> 장소 추가
                                                        </button>
                                                        <button 
                                                            onClick={() => addPoint('food')}
                                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                                                        >
                                                            <Utensils size={14} /> 맛집 추가
                                                        </button>
                                                    </div>
"""

content = content.replace('</Reorder.Group>', add_point_button_html)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied route modification edits.")
