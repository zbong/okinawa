import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

interface AnalyzedFile {
  name: string;
  text: string;
  status: 'loading' | 'done' | 'error';
  parsedData?: any;
}

interface Ocr_labTabProps {
  isOcrLoading: boolean;
  analyzedFiles: AnalyzedFile[];
  handleTicketOcr: (e: React.ChangeEvent<HTMLInputElement>) => void;
  ticketFileInputRef: React.RefObject<HTMLInputElement>;
  handleMultipleOcr: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, linkedTo?: string) => void;
  deleteFile: (id: string, e?: React.MouseEvent) => void;
}

export const Ocr_labTab: React.FC<Ocr_labTabProps> = ({
  isOcrLoading,
  analyzedFiles,
  handleMultipleOcr,
}) => {
  const { view, setView } = usePlanner();

  if (view !== "ocr_lab") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "40px",
        background:
          "radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 900,
                marginBottom: "8px",
              }}
            >
              🔍 Document Intelligence Lab
            </h1>
            <p style={{ opacity: 0.6, fontSize: "14px" }}>
              업로드된 서류에서 핵심 여행 데이터를 자동으로
              추출했습니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <button
                disabled={isOcrLoading}
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  background: "var(--primary)",
                  border: "none",
                  color: "black",
                  cursor: isOcrLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  opacity: isOcrLoading ? 0.6 : 1,
                }}
              >
                {isOcrLoading ? "분석 중..." : "파일 업로드"}
              </button>
              <input
                type="file"
                multiple
                onChange={handleMultipleOcr}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </div>
            <button
              onClick={() => setView("landing")}
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              나가기
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "30px" }}>
          {analyzedFiles.map((file, idx) => (
            <div
              key={idx}
              style={{
                padding: "30px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                      {file.name}
                    </h3>
                    <span style={{ fontSize: "11px", opacity: 0.4 }}>
                      Type: {file.parsedData?.type || "Searching..."}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {file.status === "loading" && (
                    <Loader2
                      size={14}
                      className="spin"
                      color="#fbbf24"
                    />
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 12px",
                      borderRadius: "10px",
                      fontWeight: 900,
                      background:
                        file.status === "done"
                          ? "rgba(52, 211, 153, 0.15)"
                          : "rgba(251, 191, 36, 0.15)",
                      color:
                        file.status === "done" ? "#34d399" : "#fbbf24",
                      border: `1px solid ${file.status === "done" ? "#34d39940" : "#fbbf2440"}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {file.status === "loading"
                      ? "ANALYZING"
                      : file.status === "done"
                        ? "COMPLETE"
                        : "ERROR"}
                  </span>
                </div>
              </div>

              {file.status === "done" && file.parsedData && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "20px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {file.parsedData.summary && (
                    <div
                      style={{
                        fontSize: "14px",
                        color: "white",
                        marginBottom: "20px",
                        padding: "15px",
                        background: "rgba(0, 212, 255, 0.05)",
                        borderRadius: "12px",
                        borderLeft: "4px solid var(--primary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {file.parsedData.summary}
                      {file.parsedData.confidence && (
                        <div
                          style={{
                            fontSize: "10px",
                            opacity: 0.5,
                            marginTop: "8px",
                          }}
                        >
                          Reliability:{" "}
                          {Math.round(file.parsedData.confidence * 100)}
                          %
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {file.parsedData.type === "flight" && (
                      <>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            ROUTE & FLIGHT
                          </div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            ✈️ {file.parsedData.flight?.airline}{" "}
                            {file.parsedData.flight?.flightNumber}
                            <span
                              style={{
                                fontSize: "14px",
                                opacity: 0.6,
                                fontWeight: 400,
                              }}
                            >
                              (
                              {file.parsedData.flight?.departureAirport}{" "}
                              ➔ {file.parsedData.flight?.arrivalAirport}
                              )
                            </span>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            DEPARTURE
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                            }}
                          >
                            📅{" "}
                            {file.parsedData.flight?.departureDate ||
                              file.parsedData.startDate}{" "}
                            <span
                              style={{
                                color: "var(--primary)",
                                marginLeft: 8,
                              }}
                            >
                              🕒 {file.parsedData.flight?.departureTime}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            ARRIVAL
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                            }}
                          >
                            📅{" "}
                            {file.parsedData.flight?.arrivalDate ||
                              file.parsedData.flight?.departureDate ||
                              file.parsedData.endDate}{" "}
                            <span
                              style={{
                                color: "var(--primary)",
                                marginLeft: 8,
                              }}
                            >
                              🕒 {file.parsedData.flight?.arrivalTime}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {file.parsedData.type === "ship" && (
                      <>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            FERRY & ROUTE
                          </div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "#60a5fa",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            🚢 {file.parsedData.ship?.shipName}
                            <span
                              style={{
                                fontSize: "14px",
                                opacity: 0.6,
                                fontWeight: 400,
                              }}
                            >
                              ({file.parsedData.ship?.departurePort} ➔{" "}
                              {file.parsedData.ship?.arrivalPort})
                            </span>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            DEPARTURE
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                            }}
                          >
                            📅 {file.parsedData.ship?.departureDate}{" "}
                            <span
                              style={{
                                color: "#60a5fa",
                                marginLeft: 8,
                              }}
                            >
                              🕒 {file.parsedData.ship?.departureTime}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            ARRIVAL
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                            }}
                          >
                            📅{" "}
                            {file.parsedData.ship?.arrivalDate ||
                              file.parsedData.ship?.departureDate}{" "}
                            <span
                              style={{
                                color: "#60a5fa",
                                marginLeft: 8,
                              }}
                            >
                              🕒 {file.parsedData.ship?.arrivalTime}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {file.parsedData.type === "accommodation" && (
                      <>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            HOTEL NAME
                          </div>
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: 900,
                              color: "#fbbf24",
                            }}
                          >
                            🏨{" "}
                            {file.parsedData.accommodation?.hotelName ||
                              file.parsedData.hotelName}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            CHECK-IN
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                            }}
                          >
                            📅{" "}
                            {file.parsedData.accommodation
                              ?.checkInDate ||
                              file.parsedData.checkIn}{" "}
                            {(file.parsedData.accommodation
                              ?.checkInTime ||
                              file.parsedData.checkInTime) && (
                                <span
                                  style={{
                                    color: "var(--primary)",
                                    marginLeft: 8,
                                  }}
                                >
                                  🕒{" "}
                                  {file.parsedData.accommodation
                                    ?.checkInTime ||
                                    file.parsedData.checkInTime}
                                </span>
                              )}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.5,
                              marginBottom: "4px",
                            }}
                          >
                            CHECK-OUT
                          </div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                            }}
                          >
                            📅{" "}
                            {file.parsedData.accommodation
                              ?.checkOutDate ||
                              file.parsedData.checkOut}
                          </div>
                        </div>
                      </>
                    )}
                    {(file.parsedData.type === "other" ||
                      file.parsedData.type === "unknown" ||
                      file.parsedData.type === "transport") && (
                        <>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                opacity: 0.5,
                                marginBottom: "4px",
                              }}
                            >
                              START DATE
                            </div>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                              }}
                            >
                              📅 {file.parsedData.startDate}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                opacity: 0.5,
                                marginBottom: "4px",
                              }}
                            >
                              END DATE
                            </div>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                              }}
                            >
                              📅 {file.parsedData.endDate}
                            </div>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              )}

              <details>
                <summary
                  style={{
                    fontSize: "12px",
                    opacity: 0.5,
                    cursor: "pointer",
                    marginBottom: "10px",
                    outline: "none",
                  }}
                >
                  원본 텍스트 보기 (Raw Data)
                </summary>
                <pre
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    padding: "15px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#888",
                    whiteSpace: "pre-wrap",
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  {file.text}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
