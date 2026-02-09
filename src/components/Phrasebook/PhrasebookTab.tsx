import React from 'react';
import { MessageCircle, Volume2 } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

interface PhrasebookTabProps {
  speak: (text: string) => void;
}

export const PhrasebookTab: React.FC<PhrasebookTabProps> = ({
  speak
}) => {
  const {
    activeTab,
    trip
  } = usePlanner();

  if (activeTab !== "speech") return null;

  return (
    <div className="speech-view" style={{ padding: "16px" }}>
      <h2
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: "18px",
        }}
      >
        <MessageCircle size={20} color="var(--primary)" />
        일본어 필수 회화
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {trip?.speechData
          ?.filter((item) => item.category === "basic")
          .map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    opacity: 0.8,
                  }}
                >
                  {item.kor}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.jp}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--primary)",
                      opacity: 0.9,
                    }}
                  >
                    {item.pron}
                  </div>
                </div>
              </div>
              <button
                onClick={() => speak(item.jp)}
                style={{
                  background: "var(--primary)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "black",
                }}
              >
                <Volume2 size={14} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
