import React from 'react';
import { usePlanner } from '../../contexts/PlannerContext';
import { getDestinationInfo } from '../../utils/destinationHelper';

interface ExchangeTabProps {
  convert: (val: string, type: "foreign" | "krw") => void;
}

export const ExchangeTab: React.FC<ExchangeTabProps> = ({ convert }) => {
  const {
    activeTab,
    trip,
    foreignAmount,
    krwAmount,
    rate,
  } = usePlanner();

  if (activeTab !== "exchange") return null;

  const destination = trip?.metadata?.destination || "";
  // AI가 생성한(또는 하드코딩된) 국가 정보 사용
  const destInfo = trip?.metadata?.destinationInfo || getDestinationInfo(destination);

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
            marginBottom: 4,
          }}
        >
          💱 환율 계산기
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20, opacity: 0.7 }}>
          {destInfo.flag} {destInfo.country} · {destInfo.currencyName} ({destInfo.currencySymbol})
        </p>

        {/* 외화 입력 */}
        <div style={{ marginBottom: 15 }}>
          <label
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {destInfo.currencySymbol} {destInfo.currency}
          </label>
          <input
            type="text"
            value={foreignAmount}
            onChange={(e) => convert(e.target.value, "foreign")}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--glass-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              marginTop: 5,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* 원화 입력 */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ₩ KRW
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
              boxSizing: "border-box",
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
          {destInfo.currencySymbol}100 {destInfo.currency} ≈ {Math.round(rate * 100).toLocaleString()} KRW
        </p>

        {/* 유의사항 */}
        <p style={{ textAlign: "center", fontSize: 10, color: "var(--text-secondary)", opacity: 0.5 }}>
          * 기준 환율은 앱 시작 시 자동으로 업데이트됩니다
        </p>
      </div>
    </div>
  );
};
