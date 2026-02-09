import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, User } from 'lucide-react';

interface LoginFormProps {
    onLogin: () => void;
    onBack: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onBack }) => {
    return (
        <motion.div
            key="login"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "30px",
                justifyContent: "center",
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
                <LogIn size={28} /> 로그인
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
                        이메일
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
                            type="email"
                            placeholder="email@example.com"
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
                        비밀번호
                    </label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid var(--glass-border)",
                            background: "var(--input-bg)",
                            color: "white",
                        }}
                    />
                </div>
                <button
                    onClick={onLogin}
                    className="primary-button"
                    style={{ marginTop: "10px" }}
                >
                    로그인하기
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
