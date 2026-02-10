import React from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  MapPin, Trash2,
  CloudSun, Droplets, Utensils, CheckCircle, Circle
} from 'lucide-react';
import MapComponent from '../MapComponent';
import { usePlanner } from '../../contexts/PlannerContext';

interface ScheduleTabProps {
  ErrorBoundary: any;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  ErrorBoundary
}) => {
  const {
    activeTab,
    scheduleViewMode,
    setScheduleViewMode,
    theme,
    weatherIndex,
    setWeatherIndex,
    getFormattedDate,
    getWeatherForDay,
    trip,
    scheduleDay,
    setScheduleDay,
    setActivePlannerDetail,
    setSelectedPoint,
    setSelectedWeatherLocation,
    getPoints,
    completedItems,
    isDraggingRef,
    deletePoint,
    toggleComplete,
    addPoint,
    handleReorder
  } = usePlanner();

  if (activeTab !== "schedule") return null;

  return (
    <div className="list-view">
      {/* View Mode Toggle */}
      <div
        style={{
          display: "flex",
          background:
            theme === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.08)",
          padding: 4,
          borderRadius: 24,
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setScheduleViewMode("map")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 20,
            border: "none",
            background:
              scheduleViewMode === "map"
                ? "var(--primary)"
                : "transparent",
            color:
              scheduleViewMode === "map"
                ? "var(--text-on-primary)"
                : "var(--text-secondary)",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          지도 보기
        </button>
        <button
          onClick={() => setScheduleViewMode("list")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 20,
            border: "none",
            background:
              scheduleViewMode === "list"
                ? "var(--primary)"
                : "transparent",
            color:
              scheduleViewMode === "list"
                ? "var(--text-on-primary)"
                : "var(--text-secondary)",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          목록 보기
        </button>
      </div>

      <section
        style={{
          marginBottom: 16,
          display: scheduleViewMode === "list" ? "block" : "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "72px",
          }}
        >
          <motion.div
            key={`schedule-weather-${weatherIndex}`}
            className="glass-card"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            whileTap={{ cursor: "grabbing" }}
            whileDrag={{ scale: 0.98, cursor: "grabbing" }}
            onDragEnd={(_, info) => {
              const threshold = 40;
              if (info.offset.x > threshold) {
                setWeatherIndex((prev) => (prev - 1 + 3) % 3);
              } else if (info.offset.x < -threshold) {
                setWeatherIndex((prev) => (prev + 1) % 3);
              }
            }}
            animate={{ x: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            style={{
              background:
                weatherIndex === 0
                  ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  : weatherIndex === 1
                    ? "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)"
                    : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
              border: "none",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "100%",
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              cursor: "grab",
              touchAction: "pan-y",
            }}
          >
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                color: "white",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  minWidth: "60px",
                }}
              >
                {getFormattedDate(weatherIndex).split(" ")[1]}{" "}
                {getFormattedDate(weatherIndex).split(" ")[2]}
              </div>

              <div
                style={{
                  width: 1,
                  height: 24,
                  background: "rgba(255,255,255,0.4)",
                }}
              ></div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {getWeatherForDay(weatherIndex).location}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CloudSun size={24} color="white" />
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {getWeatherForDay(weatherIndex).temp}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  opacity: 0.9,
                  background: "rgba(0,0,0,0.1)",
                  padding: "4px 8px",
                  borderRadius: "12px",
                }}
              >
                <Droplets size={12} />
                <span>
                  {getWeatherForDay(weatherIndex).humidity}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 12,
            padding: "8px 0",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              onClick={() => {
                setWeatherIndex(i);
              }}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background:
                  weatherIndex === i
                    ? "var(--primary)"
                    : "rgba(255,255,255,0.3)",
                transition: "all 0.3s",
                cursor: "pointer",
                border:
                  weatherIndex === i ? "2px solid white" : "none",
              }}
            />
          ))}
        </div>
      </section>

      <div
        className="day-tabs"
        ref={(el) => {
          if (!el) return;
          let isDown = false;
          let startX: number;
          let scrollLeft: number;

          el.onmousedown = (e) => {
            isDown = true;
            el.style.cursor = "grabbing";
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
          };
          el.onmouseleave = () => {
            isDown = false;
            el.style.cursor = "grab";
          };
          el.onmouseup = () => {
            isDown = false;
            el.style.cursor = "grab";
          };
          el.onmousemove = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 2;
            el.scrollLeft = scrollLeft - walk;
          };
        }}
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          overflowX: "auto",
          paddingBottom: "8px",
          paddingRight: "40px",
          whiteSpace: "nowrap",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        {(() => {
          let dayCount = 0;
          if (trip?.days && trip.days.length > 0) {
            let maxDayWithPoints = 0;
            for (let i = 0; i < trip.days.length; i++) {
              if (trip.days[i].points && trip.days[i].points.length > 0) {
                maxDayWithPoints = i + 1;
              }
            }
            // If there's a day with points far later than the array length (shouldn't happen but safe)
            // Or if all days are empty, use the full list length
            dayCount = Math.max(maxDayWithPoints, trip.days.length);
          } else {
            // Calculate from date range
            if (trip?.metadata?.startDate && trip?.metadata?.endDate) {
              const start = new Date(trip.metadata.startDate);
              const end = new Date(trip.metadata.endDate);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              }
            }

            // If still not determined, look at the points themselves
            if (dayCount <= 0) {
              const maxPointDay = trip?.points?.reduce((max, p) => Math.max(max, p.day), 0) || 0;
              dayCount = Math.max(3, maxPointDay);
            }
          }

          return Array.from({ length: dayCount }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setScheduleDay(i + 1)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                background:
                  scheduleDay === i + 1
                    ? "var(--primary)"
                    : "var(--tab-inactive)",
                color:
                  scheduleDay === i + 1
                    ? "var(--text-on-primary)"
                    : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              Day {i + 1}
            </button>
          ));
        })()}
      </div>

      {scheduleViewMode === "map" ? (
        <div style={{ flex: 1, minHeight: 400, borderRadius: 16, overflow: "hidden" }}>
          <MapComponent
            points={getPoints(scheduleDay)}
            selectedPoint={null}
            theme={theme}
            onPointClick={(p) => {
              setActivePlannerDetail(p);
              setSelectedPoint(p);
              setSelectedWeatherLocation(p);
            }}
          />
        </div>
      ) : (
        <ErrorBoundary>
          <Reorder.Group
            axis="y"
            values={getPoints(scheduleDay)}
            onReorder={handleReorder}
            style={{ padding: 0, margin: 0, listStyle: "none" }}
          >
            {getPoints(scheduleDay).map((p) => {
              const isDone = !!completedItems[p.id];
              return (
                <Reorder.Item
                  key={p.id}
                  value={p}
                  style={{ marginBottom: 12 }}
                  onDragStart={() => {
                    isDraggingRef.current = true;
                  }}
                  onDragEnd={() => {
                    setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 100);
                  }}
                >
                  <div
                    className="glass-card"
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      setSelectedPoint(p);
                      setSelectedWeatherLocation(p);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      opacity: isDone ? 0.6 : 1,
                      transition: "opacity 0.2s",
                      cursor: "grab",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--primary)",
                          marginTop: 2,
                        }}
                      >
                        {(p.category as string) === "stay"
                          ? "숙소"
                          : (p.category as string) === "food"
                            ? "식사"
                            : (p.category as string) === "cafe"
                              ? "카페"
                              : "관광"}
                        {p.mapcode && (
                          <span
                            style={{
                              marginLeft: 8,
                              opacity: 0.6,
                              color: "var(--text-secondary)",
                            }}
                          >
                            MC: {p.mapcode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={(e) => deletePoint(p.id, e)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-dim)",
                          opacity: 0.4,
                          cursor: "pointer",
                          padding: 5,
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={(e) => toggleComplete(p.id, e)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: isDone
                            ? "var(--primary)"
                            : "var(--text-secondary)",
                          cursor: "pointer",
                          padding: 5,
                        }}
                      >
                        {isDone ? (
                          <CheckCircle size={24} />
                        ) : (
                          <Circle size={24} />
                        )}
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          <div
            style={{ display: "flex", gap: 10, marginTop: 20 }}
          >
            <button
              onClick={() => addPoint(scheduleDay, {
                name: "새 장소",
                category: "sightseeing",
                desc: "장소 설명을 입력하세요.",
                coordinates: { lat: 26.2124, lng: 127.6809 }
              })}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                background: "var(--tab-inactive)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <MapPin size={14} /> 장소 추가
            </button>
            <button
              onClick={() => addPoint(scheduleDay, {
                name: "새 맛집",
                category: "food",
                desc: "맛집 정보를 입력하세요.",
                coordinates: { lat: 26.2124, lng: 127.6809 }
              })}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                background: "var(--tab-inactive)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Utensils size={14} /> 맛집 추가
            </button>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};
