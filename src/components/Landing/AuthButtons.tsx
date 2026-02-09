import React from 'react';

interface AuthButtonsProps {
    onLogin: () => void;
    onSignup: () => void;
}

/**
 * Login and Signup buttons for unauthenticated users
 */
export const AuthButtons: React.FC<AuthButtonsProps> = ({ onLogin, onSignup }) => {
    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
            }}
        >
            <button
                onClick={onLogin}
                className="primary-button"
                style={{ width: "100%" }}
            >
                로그인
            </button>
            <button
                onClick={onSignup}
                style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "16px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    color: "white",
                    fontWeight: "bold",
                }}
            >
                회원가입
            </button>
        </div>
    );
};
