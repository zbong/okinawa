import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Hotel, Plane, Info
} from 'lucide-react';
import type { TripPlan, LocationPoint } from '../types';

interface ScheduleTabProps {
  trip: TripPlan;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ trip }) => {
  const [activeDay, setActiveDay] = useState(1);

  // Group points by day
  const pointsByDay = trip.points.reduce((acc: Record<number, LocationPoint[]>, p) => {
    if (!acc[p.day]) acc[p.day] = [];
    acc[p.day].push(p);
    return acc;
  }, {});

  const days = Object.keys(pointsByDay).map(Number).sort((a, b) => a - b);
  const currentPoints = pointsByDay[activeDay] || [];

  return (
    <div className="list-view">
      {/* Day Selector */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        overflowX: "auto",
        paddingBottom: "8px",
        whiteSpace: "nowrap"
      }}>
        {days.length > 0 ? days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              border: "none",
              background: activeDay === day ? "var(--primary)" : "rgba(255,255,255,0.05)",
              color: activeDay === day ? "black" : "var(--text-secondary)",
              fontWeight: 800,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            Day {day}
          </button>
        )) : <div style={{ opacity: 0.5, fontSize: 13 }}>일정 데이터가 없습니다.</div>}
      </div>

      {/* Points List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentPoints.map((p) => {
          const category = p.category || 'sightseeing';
          const isStay = category === 'stay';
          const isLogistics = category === 'logistics';
          const isFood = category === 'food';

          let accentColor = "var(--primary)";
          let icon = <MapPin size={18} />;

          if (isStay) { accentColor = "#818cf8"; icon = <Hotel size={18} />; }
          else if (isLogistics) { accentColor = "#10b981"; icon = <Plane size={18} />; }
          else if (isFood) { accentColor = "#fbbf24"; icon = <Info size={18} />; }

          return (
            <motion.div
              layout
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card"
              style={{
                padding: "16px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
                borderLeft: `4px solid ${accentColor}`,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "10px",
                background: accentColor, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <div style={{ fontWeight: 800, fontSize: "16px" }}>{p.name}</div>
                  {/* p.time if available */}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.6, lineHeight: 1.4 }}>
                  {p.description || (p.tips && p.tips[0]) || '상세 정보 없음'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
