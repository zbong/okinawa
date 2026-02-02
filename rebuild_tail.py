import os

path = r'e:\anti\okinawa\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    full_content = f.read()

# Step 1: Find the start of plannerStep === 7.5
# We want to replace everything from here till the end of isPlanning blocks.

# Locate plannerStep === 7.5
step_7_5_start_pattern = "{plannerStep === 7.5 && ("
step_7_5_idx = full_content.find(step_7_5_start_pattern)

if step_7_5_idx == -1:
    print("Could not find plannerStep 7.5")
    exit(1)

# Keep everything before step 7.5
head = full_content[:step_7_5_idx]

# Now define all subsequent steps and modal logic.
# I'll also include step 8 and 9 and the Review Modal and activePlannerDetail modal.

new_parts = r"""{plannerStep === 7.5 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '800px', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 7 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 7 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>어디서 주무시나요?</h2>
                                            <p style={{ opacity: 0.6, marginBottom: '32px', textAlign: 'center' }}>이미 예약한 숙소가 있다면 여러 개 등록할 수 있습니다.</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
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

                                            <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: 15, marginBottom: '30px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <Hotel size={24} color="var(--primary)" />
                                                    <span style={{ fontWeight: 800 }}>직접 숙소 등록</span>
                                                </div>
                                                <input id="acc-name" type="text" placeholder="숙소 이름 (예: 힐튼 나하)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <input id="acc-start" type="date" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '12px' }} />
                                                    <input id="acc-end" type="date" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '12px' }} />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const name = (document.getElementById('acc-name') as HTMLInputElement).value;
                                                        const start = (document.getElementById('acc-start') as HTMLInputElement).value;
                                                        const end = (document.getElementById('acc-end') as HTMLInputElement).value;
                                                        if (!name || !start || !end) return alert('숙소 이름과 날짜를 모두 입력해 주세요.');
                                                        setPlannerData({ ...plannerData, accommodations: [...plannerData.accommodations, { name, startDate: start, endDate: end }] });
                                                        (document.getElementById('acc-name') as HTMLInputElement).value = '';
                                                        (document.getElementById('acc-start') as HTMLInputElement).value = '';
                                                        (document.getElementById('acc-end') as HTMLInputElement).value = '';
                                                    }}
                                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                                                >
                                                    숙소 추가하기
                                                </button>
                                            </div>

                                            {recommendedHotels.length > 0 && (
                                                <div style={{ marginBottom: '30px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                        <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>AI 추천 숙소</h4>
                                                        <button onClick={() => setRecommendedHotels([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer' }}>닫기</button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                                        {recommendedHotels.map((h, i) => (
                                                            <div key={i} onClick={() => { const nameInput = document.getElementById('acc-name') as HTMLInputElement; if (nameInput) nameInput.value = h.name; showToast(`${h.name}를 선택했습니다. 날짜를 입력하고 추가 버튼을 누르세요.`); }} className="glass-card" style={{ minWidth: '200px', padding: '15px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                                                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>{h.name}</div>
                                                                <div style={{ fontSize: '11px', opacity: 0.6 }}>{h.desc}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {plannerData.accommodations.length > 0 && (
                                                <div style={{ marginBottom: '30px' }}>
                                                    <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '15px', paddingLeft: '5px' }}>등록된 숙소 리스트 ({plannerData.accommodations.length})</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {plannerData.accommodations.map((acc: any, idx: number) => (
                                                            <div key={idx} className="glass-card" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{acc.name}</div>
                                                                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: 4 }}>{acc.startDate} ~ {acc.endDate}</div>
                                                                </div>
                                                                <button onClick={() => setPlannerData({ ...plannerData, accommodations: plannerData.accommodations.filter((_: any, i: number) => i !== idx) })} style={{ background: 'rgba(255,78,80,0.1)', border: 'none', color: '#ff4e50', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><X size={16} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(7)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>이전 (장소 수정)</button>
                                                <button onClick={() => { showToast("임시 저장되었습니다. 목록에서 언제든 이어서 작성하세요."); setTimeout(() => setIsPlanning(false), 1500); }} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Save size={18} /> 저장</button>
                                                <button onClick={() => setIsReviewModalOpen(true)} disabled={selectedPlaceIds.length === 0 || isSearchingAttractions} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: (selectedPlaceIds.length > 0 && !isSearchingAttractions) ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: (selectedPlaceIds.length > 0 && !isSearchingAttractions) ? 'black' : 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: '18px' }}>최종 검토 및 생성</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {plannerStep === 8 && (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '40px', justifyContent: 'center' }}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 8 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', opacity: i < 8 ? 0.3 : 1 }} />
                                                ))}
                                            </div>
                                            <Loader2 size={100} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '32px', display: 'block', margin: '0 auto' }} />
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, textAlign: 'center' }}>AI가 최적의 동선을 설계 중입니다...</h2>
                                            <p style={{ opacity: 0.6, marginTop: '16px', textAlign: 'center' }}>사용자의 취향과 명소 간의 실시간 거리를 분석하고 있습니다.</p>
                                        </motion.div>
                                    )}

                                    {plannerStep === 9 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>설계된 맞춤 코스 프리뷰</h2>
                                            <p style={{ opacity: 0.6, marginBottom: '32px', textAlign: 'center' }}>발행 전 마지막으로 코스를 확인해 주세요.</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                                                {dynamicAttractions.filter(a => selectedPlaceIds.includes(a.id)).map((rec, i) => (
                                                    <div key={rec.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{i + 1}</div>
                                                        <div style={{ textAlign: 'left' }}>
                                                            <div style={{ fontWeight: 800, fontSize: '18px' }}>{rec.name}</div>
                                                            <div style={{ fontSize: '14px', opacity: 0.6 }}>{rec.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setPlannerStep(7)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontWeight: 800 }}>장소 수정</button>
                                                <button onClick={() => {
                                                    if (!trip || !trip.points || trip.points.length === 0) {
                                                        showToast('여행 데이터가 충분히 생성되지 않았습니다. 다시 시도해 주세요.');
                                                        return;
                                                    }
                                                    const publishedTrip = {
                                                        ...trip,
                                                        title: trip.metadata.title,
                                                        period: trip.metadata.period,
                                                        destination: trip.metadata.destination,
                                                        color: trip.metadata.primaryColor || '#00d4ff',
                                                        id: `trip-${Date.now()}`,
                                                        progress: 0
                                                    };
                                                    setTrips(prevTrips => [publishedTrip, ...prevTrips]);
                                                    localStorage.removeItem('trip_draft_v1');
                                                    setIsPlanning(false);
                                                    setPlannerStep(0);
                                                    setView('landing');
                                                    showToast('여행 가이드 발행이 완료되었습니다! 목록에서 확인해 보세요.');
                                                }} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: 900, fontSize: '18px' }}>가이드 발행하기</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* 상세 정보 모달 (Review Modal) */}
                            {isReviewModalOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(20, 20, 25, 0.95)', backdropFilter: 'blur(20px)', zIndex: 100,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                                    }}
                                >
                                    <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', textAlign: 'left' }}>
                                        <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <CheckCircle color="var(--primary)" size={32} /> 경로 검토 및 요청
                                        </h2>

                                        {(() => {
                                            const start = new Date(plannerData.startDate);
                                            const end = new Date(plannerData.endDate);
                                            const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
                                            const placeCount = selectedPlaceIds.length;
                                            let minPerDay = 3; let maxPerDay = 6;
                                            if (plannerData.pace === 'slow') { minPerDay = 1; maxPerDay = 3; }
                                            if (plannerData.pace === 'fast') { minPerDay = 5; maxPerDay = 8; }
                                            const minTotal = Math.floor(days * minPerDay);
                                            const maxTotal = Math.ceil(days * maxPerDay);
                                            let color = '#4ade80'; let msg = '여행 기간과 선택한 장소의 비율이 적절합니다!'; let subMsg = 'AI가 최적의 동선을 짤 수 있습니다.';
                                            if (placeCount < minTotal) { color = '#fbbf24'; msg = `여행 기간(${days}일)에 비해 장소가 조금 부족해 보여요.`; subMsg = `(${minTotal}곳 이상 권장, 현재 ${placeCount}곳) 남는 시간은 어떻게 보낼까요?`; }
                                            else if (placeCount > maxTotal) { color = '#f87171'; msg = `여행 기간(${days}일)에 비해 장소가 너무 많습니다.`; subMsg = `(${maxTotal}곳 이하 권장, 현재 ${placeCount}곳) 일부 장소는 제외될 수 있습니다.`; }

                                            return (
                                                <div style={{ marginBottom: '32px', padding: '20px', borderRadius: '16px', background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', gap: '16px' }}>
                                                    <div style={{ width: 4, background: color, borderRadius: '4px' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '18px', color: color, marginBottom: '4px' }}>{msg}</div>
                                                        <div style={{ fontSize: '14px', opacity: 0.8 }}>{subMsg}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '12px', fontSize: '16px' }}>AI에게 특별히 요청할 사항이 있나요?</label>
                                        <textarea
                                            placeholder="예: 맛집 위주로 짜줘 등..."
                                            value={customAiPrompt}
                                            onChange={(e) => setCustomAiPrompt(e.target.value)}
                                            style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '15px', resize: 'none', marginBottom: '32px' }}
                                        />

                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <button onClick={() => setIsReviewModalOpen(false)} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>취소</button>
                                            <button onClick={() => { setIsReviewModalOpen(false); generatePlanWithAI(); }} style={{ flex: 2, padding: '18px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: 'black', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Sparkles size={20} /> AI 코스 생성 시작</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Attraction Detail Modal */}
                <AnimatePresence>
                    {activePlannerDetail && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                            onClick={() => setActivePlannerDetail(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                                className="glass-card"
                                style={{ width: '100%', maxWidth: '800px', height: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.15)' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div style={{ padding: '40px 40px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <button onClick={() => setActivePlannerDetail(null)} style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', zIndex: 10 }}><X size={24} /></button>
                                    <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '14px', letterSpacing: '2px', marginBottom: '12px' }}>ATTRACTION REPORT</div>
                                    <h3 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px' }}>{activePlannerDetail.name}</h3>
                                    <p style={{ fontSize: '18px', opacity: 0.7, fontWeight: 500 }}>{activePlannerDetail.desc}</p>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
                                    <section>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px', color: 'var(--primary)' }}><FileText size={20} /><h4 style={{ fontSize: '20px', fontWeight: 800 }}>장소 개요</h4></div>
                                        <p style={{ lineHeight: 1.8, fontSize: '16px', opacity: 0.9, whiteSpace: 'pre-wrap' }}>{activePlannerDetail.longDesc}</p>
                                    </section>
                                    {activePlannerDetail.history && (
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px', color: 'var(--primary)' }}><Clock size={20} /><h4 style={{ fontSize: '20px', fontWeight: 800 }}>역사와 유래</h4></div>
                                            <p style={{ lineHeight: 1.8, fontSize: '16px', opacity: 0.9, whiteSpace: 'pre-wrap' }}>{activePlannerDetail.history}</p>
                                        </section>
                                    )}
                                    {activePlannerDetail.attractions && (
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px', color: 'var(--primary)' }}><Camera size={20} /><h4 style={{ fontSize: '20px', fontWeight: 800 }}>주요 볼거리</h4></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {activePlannerDetail.attractions.map((item: string, i: number) => (
                                                    <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '3px solid var(--primary)', fontSize: '15px', lineHeight: 1.6 }}>{item}</div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    <section style={{ padding: '24px', background: 'rgba(0,212,255,0.05)', borderRadius: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '12px' }}><MapPin size={20} color="var(--primary)" /><h4 style={{ fontSize: '18px', fontWeight: 800 }}>찾아가는 법</h4></div>
                                        <p style={{ fontSize: '15px', opacity: 0.8 }}>{activePlannerDetail.access}</p>
                                    </section>
                                </div>
                                <div style={{ padding: '30px 40px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <a href={activePlannerDetail.link} target="_blank" rel="noreferrer" style={{ padding: '18px 24px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><ExternalLink size={20} /> 공식 정보</a>
                                    <button
                                        onClick={() => { const isSelected = selectedPlaceIds.includes(activePlannerDetail.id); setSelectedPlaceIds(isSelected ? selectedPlaceIds.filter(id => id !== activePlannerDetail.id) : [...selectedPlaceIds, activePlannerDetail.id]); setActivePlannerDetail(null); }}
                                        style={{ flex: 1, padding: '18px', borderRadius: '16px', background: selectedPlaceIds.includes(activePlannerDetail.id) ? 'rgba(255,255,255,0.2)' : 'var(--primary)', color: selectedPlaceIds.includes(activePlannerDetail.id) ? 'white' : 'black', fontWeight: 900, border: 'none', fontSize: '18px', cursor: 'pointer' }}
                                    >
                                        {selectedPlaceIds.includes(activePlannerDetail.id) ? '이미 선택됨 (취소하기)' : '이 장소를 코스에 추가'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        </div>
    )}

    {view === 'debug' && (
        <motion.div
            key="debug"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="overview-content"
            style={{ padding: '20px', height: '100%', overflowY: 'auto', background: '#0f172a' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ color: 'var(--primary)', margin: 0 }}>Storage Debugger</h1>
                <button onClick={() => setView('landing')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>돌아가기</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button onClick={() => { if (window.confirm('초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#ff4e50', color: 'white', border: 'none' }}>전체 초기화</button>
                <button onClick={() => window.location.reload()} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary)', color: 'black', border: 'none' }}>새로고침</button>
            </div>
            <section style={{ marginBottom: 30 }}>
                <h3 style={{ color: 'white' }}>user_trips_v2</h3>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 10, overflowX: 'auto', fontSize: 12, color: '#10b981' }}>{JSON.stringify(JSON.parse(localStorage.getItem('user_trips_v2') || '[]'), null, 2)}</pre>
            </section>
        </motion.div>
    )}

    <AnimatePresence>
        {toast.visible && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
                style={{ position: 'fixed', top: '50%', left: '50%', background: 'rgba(20, 20, 30, 0.95)', backdropFilter: 'blur(16px)', color: 'white', padding: '32px 48px', borderRadius: '24px', zIndex: 99999, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}
            >
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 20px' }}><CheckCircle size={32} /></div>
                <div style={{ fontWeight: 800, fontSize: '18px' }}>저장 완료!</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>{toast.message}</div>
            </motion.div>
        )}
    </AnimatePresence>
</div>
</ErrorBoundary>
);
};

export default App;
"""

# Find where to start replacing.
# We want to replace from plannerStep === 7.5 onwards.
# But wait, isPlaying starts much earlier.

# Actually, let's keep everything up to the line BEFORE plannerStep === 7.5 starts.
# head is already set.

with open(path, 'w', encoding='utf-8') as f:
    f.write(head)
    f.write(new_parts)

print("Successfully rebuilt App.tsx tail.")
