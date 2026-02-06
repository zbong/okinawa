import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Phone, Hotel, Sparkles, Trash2, Loader2, CloudSun, Wind, Droplets
} from 'lucide-react';
import MapComponent from '../MapComponent';
import { usePlanner } from '../../contexts/PlannerContext';

export const SummaryTab: React.FC = () => {
  const {
    activeTab,
    theme,
    overviewMode,
    setOverviewMode,
    trip,
    selectedPoint,
    setSelectedPoint,
    setSelectedWeatherLocation,
    weatherIndex,
    setWeatherIndex,
    getFormattedDate,
    getWeatherForDay,
    isLoadingWeather,
    weatherError,
    calculateProgress,
    setIsPlanning,
    setPlannerStep,
    addAccommodation,
    deleteAccommodation,
    fetchAttractionsWithAI,
    fetchHotelsWithAI,
    validateAndAddPlace,
    validateHotel,
    generatePlanWithAI
  } = usePlanner();

  if (activeTab !== "summary") return null;

  return (
    <div className="overview-content">
      {/* Toggle Switch */}
      <div
        style={{
          display: "flex",
          background:
            theme === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.08)",
          padding: 4,
          borderRadius: 24,
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setOverviewMode("map")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 20,
            border: "none",
            background:
              overviewMode === "map"
                ? "var(--primary)"
                : "transparent",
            color:
              overviewMode === "map"
                ? "var(--text-on-primary)"
                : "var(--text-secondary)",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          지도로 보기
        </button>
        <button
          onClick={() => setOverviewMode("text")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 20,
            border: "none",
            background:
              overviewMode === "text"
                ? "var(--primary)"
                : "transparent",
            color:
              overviewMode === "text"
                ? "var(--text-on-primary)"
                : "var(--text-secondary)",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          내용 보기
        </button>
      </div>

      {overviewMode === "map" ? (
        <div
          style={{
            flex: 1,
            width: "100%",
            borderRadius: "16px",
            overflow: "hidden",
            minHeight: "300px",
          }}
        >
          <MapComponent
            points={trip.points}
            selectedPoint={selectedPoint}
            onPointClick={(p) => {
              setSelectedPoint(p);
              setSelectedWeatherLocation(p);
            }}
          />
        </div>
      ) : (
        <>
          <section style={{ marginBottom: 24 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "210px",
              }}
            >
              <motion.div
                key={weatherIndex}
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
                  padding: "20px",
                  cursor: "grab",
                  touchAction: "pan-y",
                }}
              >
                {isLoadingWeather ? (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "white",
                    }}
                  >
                    <Loader2
                      size={48}
                      className="spin"
                      style={{ marginBottom: 12 }}
                    />
                    <div style={{ fontSize: 14, opacity: 0.9 }}>
                      날씨 정보 불러오는 중...
                    </div>
                  </div>
                ) : weatherError ? (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "white",
                    }}
                  >
                    <CloudSun
                      size={48}
                      style={{ marginBottom: 12, opacity: 0.5 }}
                    />
                    <div style={{ fontSize: 14, opacity: 0.9 }}>
                      {weatherError}
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "white",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            opacity: 0.7,
                            marginBottom: 2,
                          }}
                        >
                          {getFormattedDate(weatherIndex)}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            opacity: 0.9,
                            marginBottom: 4,
                          }}
                        >
                          {getWeatherForDay(weatherIndex).location}
                        </div>
                        <div
                          style={{
                            fontSize: 42,
                            fontWeight: 800,
                          }}
                        >
                          {getWeatherForDay(weatherIndex).temp}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            opacity: 0.9,
                          }}
                        >
                          {getWeatherForDay(weatherIndex).condition}
                        </div>
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 8,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Wind size={16} opacity={0.8} />
                          <span style={{ fontSize: 13 }}>
                            {getWeatherForDay(weatherIndex).wind}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Droplets size={16} opacity={0.8} />
                          <span style={{ fontSize: 13 }}>
                            {getWeatherForDay(weatherIndex).humidity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        bottom: 20,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 12,
                        zIndex: 2,
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              weatherIndex === i
                                ? "white"
                                : "rgba(255,255,255,0.3)",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Sparkles size={18} color="var(--primary)" /> 여행
                요약
              </h3>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  fontWeight: "bold",
                  background: "rgba(0, 212, 255, 0.1)",
                  padding: "4px 12px",
                  borderRadius: 12,
                }}
              >
                진행률 {calculateProgress()}%
              </div>
            </div>
            <div className="glass-card">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Calendar size={20} color="var(--primary)" />
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                      }}
                    >
                      여행 기간
                    </div>
                    <div
                      style={{ fontWeight: 600, fontSize: 14 }}
                    >
                      {trip.metadata.period} (
                      {trip.metadata.startDate} ~{" "}
                      {trip.metadata.endDate})
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Phone size={20} color="var(--primary)" />
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                      }}
                    >
                      비상 연락처
                    </div>
                    <div
                      style={{ fontWeight: 600, fontSize: 14 }}
                    >
                      현지 렌터카: 098-XXX-XXXX
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: 8,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      width: `${calculateProgress()}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, var(--primary) 0%, #00f2fe 100%)",
                      borderRadius: 4,
                      transition: "width 0.5s ease-out",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Hotel size={18} color="var(--primary)" /> 숙소
                정보
              </h3>
              <button
                onClick={addAccommodation}
                style={{
                  padding: "4px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                + 추가
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {trip.metadata.accommodations &&
                trip.metadata.accommodations.length > 0 ? (
                trip.metadata.accommodations.map((acc, idx) => (
                  <div
                    key={idx}
                    className="glass-card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          marginBottom: 4,
                        }}
                      >
                        {acc.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        📅 {acc.startDate} ~ {acc.endDate}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAccommodation(idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.2)",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div
                  className="glass-card"
                  style={{
                    textAlign: "center",
                    padding: "30px 20px",
                    opacity: 0.6,
                    border: "2px dashed var(--glass-border)",
                  }}
                >
                  <Hotel
                    size={32}
                    style={{ marginBottom: 10, opacity: 0.3 }}
                  />
                  <div style={{ fontSize: 14 }}>
                    등록된 숙소 정보가 없습니다.
                  </div>
                </div>
              )}
            </div>
          </section>

          <div
            className="glass-card primary"
            onClick={() => {
              setIsPlanning(true);
              setPlannerStep(0);
            }}
            style={{
              cursor: "pointer",
              padding: "20px",
              textAlign: "center",
              background: "rgba(0, 212, 255, 0.1)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              marginBottom: 40,
            }}
          >
            <h4 style={{ margin: 0, color: "var(--primary)" }}>
              새로운 여행 계획하기 ✨
            </h4>
            <p
              style={{
                fontSize: 12,
                margin: "4px 0 0",
                opacity: 0.8,
              }}
            >
              AI와 함께 나만의 완벽한 오키나와 여행을 만들어보세요.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
