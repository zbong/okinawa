import re
import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add accommodation management functions
acc_functions = """
    const addAccommodation = () => {
        const name = window.prompt('숙소 이름을 입력해주세요:');
        if (!name) return;
        const startDate = window.prompt('시작 날짜 (YYYY-MM-DD):', trip.metadata.startDate);
        if (!startDate) return;
        const endDate = window.prompt('종료 날짜 (YYYY-MM-DD):', startDate);
        if (!endDate) return;

        const newAcc = { name, startDate, endDate };
        const updatedTrip = {
            ...trip,
            metadata: {
                ...trip.metadata,
                accommodations: [...(trip.metadata.accommodations || []), newAcc]
            }
        };

        setTrip(updatedTrip);
        setTrips(prev => prev.map(t => t.id === trip.id ? updatedTrip : t));
        showToast('숙소가 추가되었습니다.');
    };

    const deleteAccommodation = (index: number) => {
        if (!window.confirm('이 숙소 정보를 삭제하시겠습니까?')) return;
        
        const updatedAccs = (trip.metadata.accommodations || []).filter((_, i) => i !== index);
        const updatedTrip = {
            ...trip,
            metadata: {
                ...trip.metadata,
                accommodations: updatedAccs
            }
        };

        setTrip(updatedTrip);
        setTrips(prev => prev.map(t => t.id === trip.id ? updatedTrip : t));
        showToast('숙소 정보가 삭제되었습니다.');
    };
"""

content = re.sub(r'(const addPoint = .*?\n    };)', r'\1\n' + acc_functions, content, flags=re.DOTALL)

# 2. Update Summary UI
# Replace line 1651-1665 approx (Key Items section)
new_acc_section = """
                                                {/* Accommodation Management */}
                                                <section className="overview-section">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Hotel size={18} color="var(--primary)" /> 숙소 관리
                                                        </h3>
                                                        <button 
                                                            onClick={addAccommodation}
                                                            style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--primary)', border: 'none', color: 'black', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}
                                                        >
                                                            숙소 추가
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {(!trip.metadata.accommodations || trip.metadata.accommodations.length === 0) ? (
                                                            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', opacity: 0.6, fontSize: '13px', background: 'rgba(255,255,255,0.02)' }}>
                                                                등록된 숙소가 없습니다. 상단의 '추가' 버튼으로 등록하세요.
                                                            </div>
                                                        ) : (
                                                            trip.metadata.accommodations.map((acc, idx) => (
                                                                <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '15px' }}>{acc.name}</div>
                                                                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>{acc.startDate} ~ {acc.endDate}</div>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => deleteAccommodation(idx)}
                                                                        style={{ background: 'rgba(255,78,80,0.1)', border: 'none', color: '#ff4e50', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </section>

                                                {/* Logistics/Key Info */}
                                                <section className="overview-section">
                                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 10, marginBottom: 15 }}>📋 주요 정보 (교통)</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {trip.points.filter(p => ['logistics'].includes(p.category)).map(p => (
                                                            <div key={p.id} className="glass-card" onClick={() => { setSelectedPoint(p); setSelectedWeatherLocation(p); }} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                                                                    <div style={{ fontSize: 12, color: 'var(--primary)' }}>{p.category.toUpperCase()}</div>
                                                                </div>
                                                                {p.phone && <Phone size={16} style={{ color: 'var(--text-secondary)' }} />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
"""

# Targets line 1651 section
content = re.sub(r'\{\/\* Key Items List \(Logistics & Stay\) \*\/\}\s+<section className="overview-section">.*?</section>', new_acc_section, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied accommodation management edits.")
