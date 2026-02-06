export const useGoogleTTS = () => {
    const speak = (text: string, lang: string = "ja-JP") => {
        if (!text) return;

        // Cancel any existing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;

        // Optional: Add error handling
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
        };

        window.speechSynthesis.speak(utterance);
    };

    return { speak };
};
