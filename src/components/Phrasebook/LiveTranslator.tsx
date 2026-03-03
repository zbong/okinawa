import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, RefreshCw } from 'lucide-react';
import { genAI } from '../../utils/ai-parser';

interface LiveTranslatorProps {
    destination: string;
    targetLangCode: string; // e.g. "ja-JP", "en-US"
    speak: (text: string, lang?: string, audioBase64?: string) => void;
}

export const LiveTranslator: React.FC<LiveTranslatorProps> = ({ destination, targetLangCode, speak }) => {
    const [inputText, setInputText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [pronunciation, setPronunciation] = useState("");
    const [resultLangCode, setResultLangCode] = useState("");
    const [micLang, setMicLang] = useState<'ko' | 'target'>('ko');
    const [errorDetail, setErrorDetail] = useState("");

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize SpeechRecognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'ko-KR'; // Default to Korean input

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                setInputText(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Use an effect to auto-translate when speech recognition stops AND we have text
    // that we didn't have before.
    const previousInputRef = useRef("");
    const prevListeningRef = useRef(isListening);

    useEffect(() => {
        const justStoppedListening = prevListeningRef.current && !isListening;
        if (justStoppedListening && inputText && inputText !== previousInputRef.current) {
            // User finished speaking, let's translate
            handleTranslate();
            previousInputRef.current = inputText;
        }
        prevListeningRef.current = isListening;
    }, [isListening, inputText]);

    const toggleListen = (lang: 'ko' | 'target') => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            if (!recognitionRef.current) {
                alert("이 브라우저에서는 음성 인식을 지원하지 않습니다.");
                return;
            }
            setInputText("");
            setTranslatedText("");
            setPronunciation("");
            setErrorDetail("");
            setMicLang(lang);
            recognitionRef.current.lang = lang === 'ko' ? 'ko-KR' : targetLangCode;
            recognitionRef.current.start();
        }
    };

    const handleTranslate = async () => {
        if (!inputText.trim()) return;
        setIsTranslating(true);
        setTranslatedText("");
        setPronunciation("");
        setResultLangCode("");
        setErrorDetail("");

        try {
            const targetLangName = getTargetLanguageName(targetLangCode, destination);

            const prompt = `
당신은 완벽한 양방향 실시간 통역기입니다.
입력된 문장의 언어를 판별하여, 한국어라면 ${targetLangName}로 번역하고,
${targetLangName} 등 외국어라면 한국어로 번역하세요.

출력 형식은 반드시 아래 JSON 구조와 정확히 일치해야 합니다. 추가적인 텍스트 없이 JSON만 출력하세요.
{
  "translated": "번역된 문장",
  "pronunciation": "한국인 기준 발음 표기 (외국어를 한국인에게 읽어주기 위한 용도. 한국어로 번역된 결과인 경우 빈 문자열로 남겨둠)",
  "langCode": "번역 결과물의 언어 코드 (한국어로 번역된 경우 'ko-KR', ${targetLangName}로 번역된 경우 '${targetLangCode}')"
}

번역할 문장: "${inputText}"
`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Reverted to the original requested model
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setTranslatedText(parsed.translated);
                setPronunciation(parsed.pronunciation || "");
                setResultLangCode(parsed.langCode || targetLangCode);

                // Auto speak
                speak(parsed.translated, parsed.langCode || targetLangCode);
            } else {
                setTranslatedText(responseText); // Fallback
                setResultLangCode(targetLangCode);
                speak(responseText, targetLangCode);
            }

        } catch (error: any) {
            console.error("Translation error:", error);
            const errMsg = error?.message || String(error);
            setErrorDetail(errMsg);
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="glass-card" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>실시간 통역</h3>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "12px" }}>
                    한국어 ↔ {getTargetLanguageName(targetLangCode, destination)}
                </span>
            </div>

            <div style={{ position: "relative", marginBottom: "12px" }}>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="대화할 내용을 입력하거나 마이크(언어선택)를 누르세요"
                    style={{
                        width: "100%",
                        padding: "16px",
                        paddingRight: "140px", // space for buttons
                        borderRadius: "16px",
                        border: "1px solid var(--glass-border)",
                        background: "var(--input-bg)",
                        color: "var(--text-primary)",
                        minHeight: "100px",
                        resize: "none",
                        fontSize: "15px",
                        lineHeight: "1.5",
                        boxSizing: "border-box",
                        outline: "none",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleTranslate();
                            previousInputRef.current = inputText;
                        }
                    }}
                />

                {/* Buttons container */}
                <div style={{ position: "absolute", bottom: "16px", right: "16px", display: "flex", gap: "8px" }}>

                    {/* Korean Mic */}
                    <button
                        onClick={() => toggleListen('ko')}
                        style={{
                            background: isListening && micLang === 'ko' ? "#ef4444" : "var(--glass-bg)",
                            color: isListening && micLang === 'ko' ? "white" : "var(--primary)",
                            border: `1px solid ${isListening && micLang === 'ko' ? "#ef4444" : "var(--glass-border)"}`,
                            borderRadius: "50%",
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        title="한국어 음성 입력"
                    >
                        {isListening && micLang === 'ko' ? <MicOff size={18} /> : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "11px", fontWeight: 800 }}><span>KO</span></div>}
                    </button>

                    {/* Target Language Mic */}
                    <button
                        onClick={() => toggleListen('target')}
                        style={{
                            background: isListening && micLang === 'target' ? "#ef4444" : "var(--glass-bg)",
                            color: isListening && micLang === 'target' ? "white" : "var(--primary)",
                            border: `1px solid ${isListening && micLang === 'target' ? "#ef4444" : "var(--glass-border)"}`,
                            borderRadius: "50%",
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        title={`${getTargetLanguageName(targetLangCode, destination)} 음성 입력`}
                    >
                        {isListening && micLang === 'target' ? <MicOff size={18} /> : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "11px", fontWeight: 800 }}><span>{targetLangCode.split('-')[0].toUpperCase()}</span></div>}
                    </button>

                    {/* Send / Translate */}
                    <button
                        onClick={() => {
                            handleTranslate();
                            previousInputRef.current = inputText;
                        }}
                        disabled={isTranslating || !inputText.trim()}
                        style={{
                            background: "var(--primary)",
                            color: "black",
                            border: "none",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: inputText.trim() && !isTranslating ? "pointer" : "not-allowed",
                            opacity: inputText.trim() && !isTranslating ? 1 : 0.5,
                            boxShadow: "0 4px 12px rgba(0, 212, 255, 0.3)",
                            marginLeft: "4px"
                        }}
                    >
                        {isTranslating ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>

            {errorDetail && (
                <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    borderRadius: "16px",
                    padding: "16px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    marginBottom: "16px",
                    position: "relative"
                }}>
                    <h4 style={{ color: "#ef4444", fontSize: "14px", marginTop: 0, marginBottom: "8px" }}>번역 오류 발생</h4>
                    <pre style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        paddingRight: "60px"
                    }}>
                        {errorDetail}
                    </pre>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(errorDetail);
                            alert("에러 메시지가 복사되었습니다.");
                        }}
                        style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            color: "var(--text-primary)",
                            cursor: "pointer"
                        }}
                    >
                        복사
                    </button>
                </div>
            )}

            {(translatedText || isTranslating) && (
                <div style={{
                    background: "rgba(0, 212, 255, 0.1)",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    position: "relative",
                    marginTop: "16px"
                }}>
                    {isTranslating ? (
                        <div style={{ color: "var(--primary)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                            <RefreshCw size={16} className="spin" /> 통역 중...
                        </div>
                    ) : (
                        <div style={{ paddingRight: "50px" }}>
                            <div style={{
                                fontSize: "20px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                marginBottom: "8px",
                                lineHeight: "1.4"
                            }}>
                                {translatedText}
                            </div>
                            {pronunciation && (
                                <div style={{
                                    fontSize: "14px",
                                    color: "var(--primary)",
                                    opacity: 0.9,
                                    fontWeight: 500
                                }}>
                                    {pronunciation}
                                </div>
                            )}

                            <button
                                onClick={() => speak(translatedText, targetLangCode)}
                                style={{
                                    position: "absolute",
                                    top: "20px",
                                    right: "20px",
                                    background: "var(--primary)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "44px",
                                    height: "44px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "black",
                                    boxShadow: "0 4px 12px rgba(0, 212, 255, 0.3)"
                                }}
                            >
                                <Volume2 size={24} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function getTargetLanguageName(code: string, destination: string): string {
    if (code.startsWith("ja")) return "일본어";
    if (code.startsWith("en")) return "영어";
    if (code.startsWith("zh")) return "중국어";
    if (code.startsWith("es")) return "스페인어";
    if (code.startsWith("fr")) return "프랑스어";
    if (code.startsWith("vi")) return "베트남어";
    if (code.startsWith("th")) return "태국어";
    // fallback based on destination
    return `${destination} 현지어`;
}
