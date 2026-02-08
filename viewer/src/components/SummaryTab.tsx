import React from 'react';
import {
  Calendar, MapPin, Hotel, Sparkles, Plane, Info
} from 'lucide-react';
import type { TripPlan } from '../types';

interface SummaryTabProps {
  trip: TripPlan;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ trip }) => {
  const displayPoints = trip?.points || [];

  return (
    <div className="overview-content" style={{ padding: '0px', paddingBottom: '60px' }}>
      {/* Trip Header Card */}
      <div className="glass-card" style={{
        padding: '24px',
        marginBottom: '28px',
        border: '1px solid var(--primary)',
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--primary)',
          fontWeight: 800,
          marginBottom: '8px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase'
        }}>Trip Intelligence Summary</div>
        <h3 style={{
          fontSize: '26px',
          fontWeight: 900,
          marginBottom: '16px',
          color: 'var(--text-primary)',
          lineHeight: 1.2
        }}>{trip?.metadata?.title || '나의 여행 가이드'}</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', opacity: 0.9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <Calendar size={16} color="var(--primary)" />
            <span>{trip?.metadata?.period || '기간 미설정'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <MapPin size={16} color="var(--primary)" />
            <span>{trip?.metadata?.destination || '목적지 미설정'}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Sparkles size={18} color="var(--primary)" /> 전체 일정 프리뷰
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayPoints.length > 0 ? (
            displayPoints.map((item: any, i: number) => {
              const category = item.category || 'sightseeing';
              const isStay = category === 'stay';
              const isLogistics = category === 'logistics';
              const isFood = category === 'food';

              let accentColor = "var(--primary)";
              let icon = <MapPin size={18} />;

              if (isStay) {
                accentColor = "#818cf8";
                icon = <Hotel size={18} />;
              } else if (isLogistics) {
                accentColor = "#10b981";
                icon = <Plane size={18} />;
              } else if (isFood) {
                accentColor = "#fbbf24";
                icon = <Info size={18} />;
              }

              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    padding: "16px",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    borderLeft: `4px solid ${accentColor}`,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: accentColor,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: "16px", color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: '20px',
                        color: 'var(--text-dim)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        DAY {item.day}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      opacity: 0.7
                    }}>
                      {item.description || (item.tips && item.tips[0]) || '상세 정보가 없습니다.'}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>일정이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
};
