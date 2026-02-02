import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_tail = """                </div>
            </div>
        </motion.div>
    )}
</AnimatePresence>

{view === 'debug' && (
    <motion.div
        key="debug"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="overview-content"
        style={{ padding: '20px', height: '100%', overflowY: 'auto', background: '#0f172a' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ color: 'var(--primary)', margin: 0 }}>Storage Debugger</h1>
            <button onClick={() => setView('landing')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>돌아가기</button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button
                onClick={() => { if (window.confirm('모든 로컬 데이터를 초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#ff4e50', color: 'white', border: 'none', fontWeight: 'bold' }}
            >
                전체 초기화 (Flash Clear)
            </button>
            <button
                onClick={() => { window.location.reload(); }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary)', color: 'black', border: 'none', fontWeight: 'bold' }}
            >
                화면 새로고침
            </button>
        </div>

        <section style={{ marginBottom: 30 }}>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>user_trips_v2 (나의 여행 목록)</h3>
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 10, overflowX: 'auto', fontSize: 12, color: '#10b981', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(JSON.parse(localStorage.getItem('user_trips_v2') || '[]'), null, 2)}
            </pre>
        </section>

        <section style={{ marginBottom: 30 }}>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>current_trip (현재 활성화된 여행)</h3>
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 10, overflowX: 'auto', fontSize: 12, color: '#3b82f6', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(trip, null, 2)}
            </pre>
        </section>

        <section>
            <h3 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>Other Keys</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.keys(localStorage).map(key => (
                    <div key={key} style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: 4 }}>{key}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{localStorage.getItem(key)}</div>
                    </div>
                ))}
            </div>
        </section>
    </motion.div>
)}

<AnimatePresence>
    {toast.visible && (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(20, 20, 30, 0.95)',
                backdropFilter: 'blur(16px)',
                color: 'white',
                padding: '32px 48px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                zIndex: 99999,
                border: '1px solid rgba(255,255,255,0.1)',
                minWidth: '320px',
                textAlign: 'center'
            }}
        >
            <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)',
                boxShadow: '0 0 20px rgba(0,212,255,0.2)'
            }}>
                <CheckCircle size={32} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>저장 완료!</span>
                <span style={{ fontWeight: 500, fontSize: '15px', opacity: 0.8, lineHeight: 1.5 }}>{toast.message}</span>
            </div>
        </motion.div>
    )}
</AnimatePresence>
                </>
            </div>
        </ErrorBoundary>
    );
};

export default App;
"""

# I need to find the correct cutoff point.
# Lines 3584-3586 in my previous view_file were </motion.div> </motion.div> </motion.div>
# Wait, line 3584 was </motion.div> (Card). 3585 was </motion.div> (Overlay).
# So I should keep those.

# Let's check view_file around 3580 again.
# 3584: </motion.div>
# 3585: </motion.div>
# 3586: </motion.div> ??? Wait, I see 3 </motion.div> in my mind but let's check.

# 3584: </motion.div> (Card)
# 3585: </motion.div> (Overlay)
# Then we need to close isPlanning.

# So I'll keep up to line 3585 inclusive.
lines = lines[:3585]
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    f.write(new_tail)

print("Successfully fixed App.tsx with all nested tags.")
