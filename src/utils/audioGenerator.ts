/**
 * TTS 오디오 유틸리티
 * 브라우저 내장 Web Speech API를 사용하여 CORS 문제 없이 음성 재생
 * generateAudioBase64는 호환성을 위해 유지하지만 빈 string 반환.
 * 실제 재생은 speakText()를 직접 호출.
 */

// 브라우저 TTS로 텍스트를 직접 읽어주는 함수
export function speakText(text: string, lang: string = 'ja-JP'): void {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
}

// 하위 호환성을 위해 유지 - 이제 아무것도 fetch하지 않고 빈 string 반환
export async function generateAudioBase64(_text: string, _lang: string): Promise<string> {
    // Google TTS fetch는 CORS로 차단됨. Web Speech API(speakText)를 직접 사용할 것.
    return "";
}
