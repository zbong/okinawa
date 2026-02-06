import React from 'react';
import { usePlanner } from '../../contexts/PlannerContext';

interface ExchangeTabProps {
  convert: (val: string, type: "jpy" | "krw") => void;
}

export const ExchangeTab: React.FC<ExchangeTabProps> = ({
  convert
}) => {
  const {
    activeTab,
    jpyAmount,
    krwAmount,
    rate
  } = usePlanner();

  if (activeTab !== "exchange") return null;

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <div
        className="converter-card"
        style={{
          padding: 20,
          borderRadius: 16,
          width: "100%",
          maxWidth: 320,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            color: "var(--text-primary)",
            marginBottom: 20,
          }}
        >
          💱 환율 계산기
        </h3>

        <div style={{ marginBottom: 15 }}>
          <label
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
            }}
          >
            JPY
          </label>
          <input
            type="text"
            value={jpyAmount}
            onChange={(e) => convert(e.target.value, "jpy")}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--glass-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              marginTop: 5,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
            }}
          >
            KRW
          </label>
          <input
            type="text"
            value={krwAmount}
            onChange={(e) => convert(e.target.value, "krw")}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--glass-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              marginTop: 5,
            }}
          />
        </div>

        <p
          style={{
            textAlign: "center",
            color: "var(--text-dim)",
            fontSize: 12,
            marginBottom: 20,
          }}
        >
          100 JPY ≈ {Math.round(rate * 100).toLocaleString()} KRW
        </p>
      </div>
    </div>
  );
};
