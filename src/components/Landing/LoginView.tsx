import React, { useState, useEffect } from 'react'; // Import useEffect
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Mail, Globe, AlertCircle } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';

export const LoginView: React.FC = () => {
    const { setView, signInWithEmail, signInWithGoogle, signUpWithPassword, signInWithPassword, showToast, isLoggedIn } = usePlanner();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authMode, setAuthMode] = useState<"login" | "signup" | "magic">("login");
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [error, setError] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        if (isLoggedIn) {
            setView("landing");
        }
    }, [isLoggedIn, setView]);


    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email) {
            setError("이메일을 입력해주세요.");
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmail(email);
            setIsEmailSent(true);
            showToast("로그인 링크가 이메일로 전송되었습니다.", "success");
        } catch (err: any) {
            setError(err.message || "로그인 요청 중 문제가 발생했습니다.");
            showToast("로그인 실패. 다시 시도해 주세요.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("이메일과 비밀번호를 모두 입력해주세요.");
            return;
        }

        setIsLoading(true);
        try {
            if (authMode === "login") {
                await signInWithPassword(email, password);
                showToast("성공적으로 로그인되었습니다.", "success");
            } else {
                const response = await signUpWithPassword(email, password);
                // Confirm Email이 꺼져있을 경우 response에 session이 바로 담겨옵니다.
                if (response?.session) {
                    showToast(`${email.split('@')[0]}님, 환영합니다!`, "success");
                } else {
                    showToast("회원가입이 완료되었습니다! 로그인을 진행해주세요.", "success");
                    setAuthMode("login");
                }
            }
        } catch (err: any) {
            setError(err.message || "인증 중 문제가 발생했습니다.");
            showToast("인증 실패. 다시 시도해 주세요.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "구글 로그인 중 문제가 발생했습니다.");
            showToast("구글 로그인 실패. 다시 시도해 주세요.", "error");
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
                width: "100%",
                maxWidth: "400px",
                margin: "0 auto",
                padding: "20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "24px"
            }}
        >
            {/* Header */}
            <div>
                <button
                    onClick={() => setView("landing")}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-dim)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "14px",
                        marginBottom: "16px"
                    }}
                >
                    <ArrowLeft size={16} /> 돌아가기
                </button>
                <h2 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "8px" }}>
                    {authMode === "login" ? "다시 오셨군요!" : authMode === "signup" ? "새로운 시작" : "간편한 시작"}
                </h2>
                <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>
                    {authMode === "login" ? "로그인하여 여행 계획을 확인하세요." : "회원가입하고 나만의 맞춤 여행을 만드세요."}
                </p>
            </div>

            {/* Mode Switcher */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                background: "rgba(255,255,255,0.05)",
                padding: "4px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.1)"
            }}>
                {(["login", "signup", "magic"] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => { setAuthMode(mode); setError(""); }}
                        style={{
                            padding: "10px",
                            borderRadius: "10px",
                            border: "none",
                            background: authMode === mode ? "var(--primary)" : "transparent",
                            color: authMode === mode ? "black" : "white",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        {mode === "login" ? "로그인" : mode === "signup" ? "회원가입" : "매직링크"}
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: "12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "12px",
                    color: "#ef4444",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center"
                }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {isEmailSent ? (
                <div style={{
                    padding: "32px",
                    background: "rgba(34, 197, 94, 0.1)",
                    borderRadius: "20px",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16
                }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: "50%", background: "#22c55e",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "black"
                    }}>
                        <Check size={32} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>이메일 확인 필요</h3>
                        <p style={{ fontSize: "13px", opacity: 0.8, lineHeight: 1.5 }}>
                            <strong>{email}</strong>로 로그인 링크를 보냈습니다.<br />
                            메일함을 확인하고 링크를 클릭하면<br />자동으로 로그인됩니다.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsEmailSent(false)}
                        style={{
                            marginTop: "16px",
                            padding: "10px 20px",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "13px"
                        }}
                    >
                        이메일 다시 입력하기
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Google Login - Always prominent */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "16px",
                            background: "white",
                            border: "none",
                            color: "black",
                            fontWeight: 800,
                            fontSize: "15px",
                            cursor: isLoading ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }}
                    >
                        <Globe size={18} /> Google 계정으로 계속하기
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "4px 0" }}>
                        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                        <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px" }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                    </div>

                    {/* Auth Forms */}
                    <form onSubmit={authMode === "magic" ? handleMagicLink : handlePasswordAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                            <input
                                type="email"
                                placeholder="이메일 주소"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "16px 16px 16px 48px",
                                    borderRadius: "16px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                    fontSize: "15px",
                                    outline: "none",
                                    transition: "border-color 0.2s"
                                }}
                            />
                        </div>

                        {authMode !== "magic" && (
                            <div style={{ position: "relative" }}>
                                <AlertCircle size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                                <input
                                    type="password"
                                    placeholder="비밀번호 (6자 이상)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{
                                        width: "100%",
                                        padding: "16px 16px 16px 48px",
                                        borderRadius: "16px",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "white",
                                        fontSize: "15px",
                                        outline: "none"
                                    }}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                padding: "16px",
                                borderRadius: "16px",
                                background: "var(--primary)",
                                border: "none",
                                color: "black",
                                fontWeight: 800,
                                fontSize: "15px",
                                cursor: isLoading ? "wait" : "pointer",
                                opacity: isLoading ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                marginTop: "8px"
                            }}
                        >
                            {isLoading ? "처리 중..." : (
                                <>
                                    {authMode === "login" ? "로그인" : authMode === "signup" ? "계정 만들기" : "로그인 링크 받기"}
                                    <Sparkles size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

        </motion.div>
    );
};
