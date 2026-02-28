import React from 'react';
import {
  Calendar, MapPin, Sparkles, Info, Download, RefreshCw, ListChecks, CheckSquare, Square, Trash2, Plus, Upload
} from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

export const SummaryTab: React.FC = () => {
  const {
    activeTab,
    theme,
    trip,
    calculateProgress,
    exportTrip,
    importTrip,
    isPreparingOffline,
    offlineProgress,
    offlinePhase,
    prepareOfflineMap,
    setTrip,
    saveTripToSupabase
  } = usePlanner();

  if (activeTab !== "summary") return null;

  const isLight = theme === 'light';

  const [newItemText, setNewItemText] = React.useState("");
  const [newItemCategory, setNewItemCategory] = React.useState("기타");
  const [activeChecklistCategory, setActiveChecklistCategory] = React.useState<string | "all">("all");

  const checklists = trip?.checklists || [];

  const handleToggleChecklistItem = (id: string) => {
    if (!trip || !setTrip) return;
    const newList = (trip.checklists || []).map((c: any) =>
      c.id === id ? { ...c, isChecked: !c.isChecked } : c
    );
    const updatedTrip = { ...trip, checklists: newList };
    setTrip(updatedTrip);
    if (saveTripToSupabase) saveTripToSupabase(updatedTrip, true);
  };

  const handleRemoveChecklistItem = (id: string) => {
    if (!trip || !setTrip) return;
    const newList = (trip.checklists || []).filter((c: any) => c.id !== id);
    const updatedTrip = { ...trip, checklists: newList };
    setTrip(updatedTrip);
    if (saveTripToSupabase) saveTripToSupabase(updatedTrip, true);
  };

  const handleAddChecklistItem = () => {
    if (!newItemText.trim() || !trip || !setTrip) return;
    const newList = [...(trip.checklists || [])];
    newList.push({
      id: 'chk-' + Math.random().toString(36).substr(2, 9),
      category: newItemCategory,
      text: newItemText,
      isChecked: false,
      isCustom: true
    });
    const updatedTrip = { ...trip, checklists: newList };
    setTrip(updatedTrip);
    if (saveTripToSupabase) saveTripToSupabase(updatedTrip, true);
    setNewItemText("");
  };

  const checklistCategories = React.useMemo(() => {
    const categories = new Set<string>();
    checklists.forEach((c: any) => categories.add(c.category));
    return Array.from(categories);
  }, [checklists]);


  return (
    <div className="overview-content" style={{ padding: '20px', paddingBottom: '60px' }}>
      {/* Trip Header Card */}
      <div className="glass-card" style={{
        padding: '24px',
        marginTop: '8px',
        marginBottom: '16px',
        border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid var(--primary)',
        background: isLight
          ? 'linear-gradient(135deg, #ffffff 0%, #f0f2f5 100%)'
          : 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
        borderRadius: '20px',
        boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.05)' : '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--primary)',
          fontWeight: 800,
          marginBottom: '8px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase'
        }}>Trip Intelligence Summary</div>
        <h3 style={{
          fontSize: '28px',
          fontWeight: 900,
          marginBottom: '16px',
          color: 'var(--text-primary)',
          lineHeight: 1.2
        }}>{trip?.metadata?.title || '나의 여행 가이드'}</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', opacity: 0.9, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <Calendar size={16} color="var(--primary)" />
            <span>{trip?.metadata?.period || '기간 미설정'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <MapPin size={16} color="var(--primary)" />
            <span>{trip?.metadata?.destination || '목적지 미설정'}</span>
          </div>
        </div>

        {/* Progress Section */}
        <div style={{
          background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
          padding: '16px',
          borderRadius: '14px',
          border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>체크리스트 달성률</span>
            <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary)' }}>{calculateProgress()}%</span>
          </div>
          <div style={{ width: "100%", height: 8, background: isLight ? 'rgba(0,0,0,0.05)' : "rgba(255,255,255,0.05)", borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${calculateProgress()}%`,
              height: "100%",
              background: "linear-gradient(90deg, var(--primary) 0%, #00f2fe 100%)",
              borderRadius: 4,
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            }} />
          </div>
        </div>

        {/* Offline usage Tip Card */}
        <div style={{
          marginTop: '20px',
          padding: '14px',
          background: isLight ? 'rgba(14, 165, 233, 0.05)' : 'rgba(0, 212, 255, 0.05)',
          borderRadius: '12px',
          border: '1px dashed var(--primary)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <Info size={18} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <strong style={{ display: 'block', marginBottom: 4, color: 'var(--primary)' }}>💡 오프라인 활용 팁</strong>
            현지에서 인터넷이 안 될 때를 대비해, 폰의 <b>'홈 화면에 추가'</b> 기능을 꼭 사용하세요.
            또한, 지도를 한 번씩 훑어두시면 오프라인에서도 지도를 보실 수 있습니다.

            <button
              onClick={prepareOfflineMap}
              disabled={isPreparingOffline}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: isPreparingOffline ? 'rgba(0,0,0,0.1)' : 'var(--primary)',
                color: isPreparingOffline ? 'var(--text-dim)' : 'var(--text-on-primary)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isPreparingOffline ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {isPreparingOffline ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  {offlinePhase === 'files'
                    ? `파일 저장 중... (${offlineProgress}%)`
                    : `지도 준비 중... (${offlineProgress}%)`}
                </>
              ) : (
                <>
                  <Sparkles size={14} /> 오프라인 전체 준비하기
                </>
              )}
            </button>

            {isPreparingOffline && (
              <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${offlineProgress}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  transition: 'width 0.3s'
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <ListChecks size={24} color="var(--primary)" /> 여행 준비물 체크리스트
        </h3>

        {!(checklists && checklists.length > 0) ? (
          <div className="glass-card" style={{
            textAlign: 'center',
            padding: '60px 20px',
            opacity: 0.5,
            border: isLight ? '2px dashed rgba(0,0,0,0.1)' : '2px dashed rgba(255,255,255,0.1)',
            background: 'transparent'
          }}>
            등록된 준비물 체크리스트가 없습니다. 플래너 5단계에서 AI 추천을 받거나 직접 추가해보세요.
          </div>
        ) : (
          <div>
            {/* 탭 헤더 */}
            <div style={{
              display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px',
              scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}>
              <button
                onClick={() => setActiveChecklistCategory("all")}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: activeChecklistCategory === "all" ? 'var(--primary)' : isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                  color: activeChecklistCategory === "all" ? '#000' : isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                  border: '1px solid',
                  borderColor: activeChecklistCategory === "all" ? 'var(--primary)' : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                전체 보기
              </button>
              {checklistCategories.map(cat => (
                <button
                  key={`summary-tab-${cat}`}
                  onClick={() => setActiveChecklistCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: activeChecklistCategory === cat ? (isLight ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 212, 255, 0.15)') : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
                    color: activeChecklistCategory === cat ? 'var(--primary)' : (isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'),
                    border: '1px solid',
                    borderColor: activeChecklistCategory === cat ? 'var(--primary)' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 리스트 본문 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {checklists
                .filter((c: any) => activeChecklistCategory === "all" || c.category === activeChecklistCategory)
                .map((item: any) => (
                  <div key={item.id} className="glass-card" style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }} onClick={() => handleToggleChecklistItem(item.id)}>
                      {item.isChecked ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)"} />}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '14px', textDecoration: item.isChecked ? 'line-through' : 'none', opacity: item.isChecked ? 0.5 : 1, color: isLight ? '#000' : '#fff' }}>
                          {item.text}
                        </span>
                        {activeChecklistCategory === "all" && (
                          <span style={{ fontSize: '10px', color: 'var(--primary)', opacity: 0.8, fontWeight: 700 }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      style={{ background: "transparent", border: "none", color: "#ff4e50", cursor: "pointer", opacity: 0.7 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>

            {/* 직접 추가하기 영역 */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)',
                  color: isLight ? '#000' : 'white',
                  fontSize: '14px',
                  outline: 'none',
                  width: '120px'
                }}
              >
                <option value="기타" style={{ color: 'black' }}>기타</option>
                {checklistCategories.map(cat => (
                  <option key={cat} value={cat} style={{ color: 'black' }}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                placeholder="추가할 준비물을 입력하세요"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)',
                  color: isLight ? '#000' : 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleAddChecklistItem}
                style={{
                  padding: '0 20px',
                  borderRadius: '12px',
                  background: isLight ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  border: isLight ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  color: isLight ? '#fff' : 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Sync & Backup Section */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--primary)" /> 데이터 동기화 및 백업
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={exportTrip}
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Download size={20} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>파일로 내보내기</span>
          </button>

          <label
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Upload size={20} color="#10b981" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>파일 불러오기</span>
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importTrip(file);
                }
              }}
            />
          </label>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'center', lineHeight: 1.5 }}>
          PC에서 만든 일정을 파일로 저장한 뒤,<br />폰에서 '파일 불러오기'를 하면 그대로 옮겨집니다.
        </p>
      </div>

      <div style={{ height: "40px" }} /> {/* Bottom Spacer */}
    </div>
  );
};
