import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User, MapPin } from 'lucide-react';

interface SignupFormProps {
    onSignup: (name: string, address: string) => void;
    onBack: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSignup, onBack }) => {
    const handleSignup = () => {
        const nameInput =
            (
                document.querySelector(
                    'input[placeholder="홍길동"]',
                ) as HTMLInputElement
            )?.value || "신규여행자";
        const addrInput =
            (
                document.getElementById(
                    "signup-address",
                ) as HTMLInputElement
            )?.value || "";
        onSignup(nameInput, addrInput);
    };

    return (
        <motion.div
            key="signup"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "30px",
                justifyContent: "flex-start",
                background:
                    "radial-gradient(circle at center, #1e293b 0%, #0a0a0b 100%)",
                overflowY: "auto"
            }}
        >
            <h2
                style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    marginBottom: "30px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <UserPlus size={28} /> 회원가입
            </h2>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                <div style={{ textAlign: "left" }}>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            opacity: 0.6,
                            fontSize: "13px",
                        }}
                    >
                        이름
                    </label>
                    <div style={{ position: "relative" }}>
                        <User
                            size={18}
                            style={{
                                position: "absolute",
                                left: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                opacity: 0.5,
                            }}
                        />
                        <input
                            type="text"
                            placeholder="홍길동"
                            style={{
                                width: "100%",
                                padding: "16px 16px 16px 48px",
                                borderRadius: "12px",
                                border: "1px solid var(--glass-border)",
                                background: "var(--input-bg)",
                                color: "white",
                            }}
                        />
                    </div>
                </div>
                <div style={{ textAlign: "left" }}>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            opacity: 0.6,
                            fontSize: "13px",
                        }}
                    >
                        집 주소 (여행 출발지)
                    </label>
                    <div style={{ position: "relative" }}>
                        <MapPin
                            size={18}
                            style={{
                                position: "absolute",
                                left: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                opacity: 0.5,
                            }}
                        />
                        <input
                            id="signup-address"
                            type="text"
                            placeholder="예: 서울특별시 강남구..."
                            style={{
                                width: "100%",
                                padding: "16px 16px 16px 48px",
                                borderRadius: "12px",
                                border: "1px solid var(--glass-border)",
                                background: "var(--input-bg)",
                                color: "white",
                            }}
                        />
                    </div>
                </div>
                <button
                    onClick={handleSignup}
                    className="primary-button"
                >
                    회원가입 완료
                </button>
                <button
                    onClick={onBack}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-secondary)",
                    }}
                >
                    뒤로 가기
                </button>
            </div>
        </motion.div>
    );
};
