import { getAudioBlob } from '../utils/audioCache';

export const useGoogleTTS = () => {
    const speak = async (text: string, lang: string = "ja-JP", audioId?: string) => {
        // 1. Check Local Cache First (for Offline support)
        if (audioId) {
            try {
                const cachedBlob = await getAudioBlob(audioId);
                if (cachedBlob) {
                    console.log("🔊 [Offline Playback] Playing from IndexedDB cache:", audioId);
                    const audioUrl = URL.createObjectURL(cachedBlob);
                    const audio = new Audio(audioUrl);
                    audio.onended = () => URL.revokeObjectURL(audioUrl);
                    audio.play().catch(err => {
                        console.error("🔊 [Offline Playback] Failed:", err);
                        URL.revokeObjectURL(audioUrl);
                        handleSynth(text, lang);
                    });
                    return;
                }
            } catch (e) {
                console.warn("🔊 [AudioCache] Error checking cache:", e);
            }
        }

        // 2. Play from URL (Online)
        // If audioId looks like a URL, we can try playing it directly
        if (audioId && (audioId.startsWith('http') || audioId.startsWith('blob:'))) {
            console.log("🔊 [Online Playback] Attempt:", audioId);
            const audio = new Audio(audioId);
            audio.play().catch(err => {
                console.error("🔊 [Online Playback] Failed, falling back to TTS:", err);
                handleSynth(text, lang);
            });
            return;
        }

        console.log("🔊 [Browser TTS] Attempt:", { text, lang });
        handleSynth(text, lang);
    };

    const handleSynth = (text: string, lang: string) => {
        if (!text) return;

        const cleanText = text.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
        const synth = window.speechSynthesis;

        // 1. Cancel any existing speech
        synth.cancel();

        const doSpeak = () => {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = lang; // Standard (e.g., 'th-TH')

            const voices = synth.getVoices();
            console.log(`🔊 [Mobile TTS] Device has ${voices.length} voices.`);

            // Log ALL voices to identify weirdly named ones on mobile
            voices.forEach((v, i) => console.log(`   [${i}] ${v.lang} | ${v.name}`));

            const langCode = lang.split('-')[0].toLowerCase();

            // Strict matching -> Lenient matching -> Name-based matching
            const voice = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ||
                voices.find(v => v.lang.toLowerCase().startsWith(langCode)) ||
                voices.find(v => v.name.toLowerCase().includes('thai')) ||
                voices.find(v => v.name.toLowerCase().includes('ไทย')) ||
                voices.find(v => v.name.toLowerCase().includes('japanese')) ||
                voices.find(v => v.name.toLowerCase().includes('日本語'));

            if (voice) {
                console.log("🔊 [Mobile TTS] Matching voice found:", voice.name);
                utterance.voice = voice;
            } else {
                console.warn("🔊 [Mobile TTS] No matching voice engine for", lang, ". It might be silent if system pack is missing.");
                // If we don't set utterance.voice, it defaults to the system's "best guess" or default voice.
            }

            utterance.onstart = () => console.log("🔊 [Mobile TTS] Playback started");
            utterance.onend = () => console.log("🔊 [Mobile TTS] Playback finished");
            utterance.onerror = (err) => console.error("🔊 [Mobile TTS] ERROR EVENT:", err);

            // Some mobile browsers need a small delay after cancel()
            setTimeout(() => {
                synth.speak(utterance);
                console.log("🔊 [Mobile TTS] speak() triggered");
            }, 50);
        };

        if (synth.getVoices().length === 0) {
            synth.onvoiceschanged = () => {
                doSpeak();
                synth.onvoiceschanged = null;
            };
        } else {
            doSpeak();
        }
    };

    return { speak };
};
