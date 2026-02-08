import React from 'react';
import {
  Calendar, MapPin, Hotel, Sparkles, Plane, Clock, Info, ChevronRight, Download, Upload, RefreshCw
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
    prepareOfflineMap
  } = usePlanner();

  if (activeTab !== "summary") return null;

  const isLight = theme === 'light';
  const displayPoints = trip?.points || [];

  return (
    <div className="overview-content" style={{ padding: '20px', paddingBottom: '60px' }}>
      {/* Trip Header Card */}
      <div className="glass-card" style={{
        padding: '24px',
        marginBottom: '28px',
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
                  지도 데이터 준비 중... ({offlineProgress}%)
                </>
              ) : (
                <>
                  <Sparkles size={14} /> 오프라인 지도 자동 준비하기
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
          <Sparkles size={20} color="var(--primary)" /> 전체 일정 프리뷰
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayPoints.length > 0 ? (
            displayPoints.map((item: any, i: number) => {
              const category = item.category || item.type || 'sightseeing';
              const isStay = category === 'stay';
              const isLogistics = category === 'logistics';
              const isFood = category === 'food';

              let accentColor = "var(--primary)";
              let icon = <MapPin size={20} />;
              let shadow = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(0, 212, 255, 0.1)";

              if (isStay) {
                accentColor = "#818cf8";
                icon = <Hotel size={20} />;
                shadow = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(129, 140, 248, 0.1)";
              } else if (isLogistics) {
                accentColor = "#10b981";
                icon = <Plane size={20} />;
                shadow = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(16, 185, 129, 0.1)";
              } else if (isFood) {
                accentColor = "#fbbf24";
                icon = <Info size={20} />;
                shadow = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(251, 191, 36, 0.1)";
              }

              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    gap: "18px",
                    alignItems: "center",
                    borderLeft: `4px solid ${accentColor}`,
                    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
                    boxShadow: `0 4px 15px ${shadow}`,
                    borderTop: isLight ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    borderRight: isLight ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    borderBottom: isLight ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: accentColor,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 10px ${shadow}`
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: "17px", color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        color: 'var(--text-dim)',
                        border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
                      }}>
                        DAY {item.day}
                      </div>
                      {item.time && (
                        <div style={{ fontSize: '12px', color: accentColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {item.time}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}>
                      {item.desc || item.description || (item.tips && item.tips[0]) || '일정 설명이 없습니다.'}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-dim)" opacity={0.5} />
                </div>
              );
            })
          ) : (
            <div className="glass-card" style={{
              textAlign: 'center',
              padding: '60px 20px',
              opacity: 0.5,
              border: isLight ? '2px dashed rgba(0,0,0,0.1)' : '2px dashed rgba(255,255,255,0.1)',
              background: 'transparent'
            }}>
              일정 데이터가 없습니다. 플래너를 통해 여행을 계획해보세요.
            </div>
          )}
        </div>
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
