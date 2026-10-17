// Voice Recognition (Speech-to-Text) and Speech Synthesis (Text-to-Speech) Engine
import { SupportedLanguage, LANGUAGES } from './languages';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentRecognition: any = null;

export function getVoiceCode(lang: SupportedLanguage): string {
  const meta = LANGUAGES.find((l) => l.code === lang);
  return meta?.voiceCode || 'en-IN';
}

/**
 * Text-to-Speech (TTS) speaking in Indian languages
 */
export function speakText(
  text: string,
  lang: SupportedLanguage = 'en',
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser.');
    return false;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  const voiceCode = getVoiceCode(lang);
  utterance.lang = voiceCode;
  utterance.rate = 0.95; // Clear operational pace
  utterance.pitch = 1.0;

  // Try to find a native voice matching the language tag
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) => v.lang.toLowerCase() === voiceCode.toLowerCase() || v.lang.toLowerCase().startsWith(lang)
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

/**
 * Speech-to-Text (STT) for dictating emergency reports or copilot queries
 */
export function startVoiceRecognition(
  lang: SupportedLanguage = 'en',
  onResult: (transcript: string) => void,
  onError?: (error: string) => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined') return false;

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('Voice recognition not supported in this browser. Please use Google Chrome or Edge.');
    return false;
  }

  stopVoiceRecognition();

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = getVoiceCode(lang);
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      currentRecognition = null;
      if (onEnd) onEnd();
    };

    currentRecognition = recognition;
    recognition.start();
    return true;
  } catch (err: any) {
    console.error('Failed to start speech recognition:', err);
    if (onError) onError(err?.message || 'Speech recognition initialization failed');
    return false;
  }
}

export function stopVoiceRecognition() {
  if (currentRecognition) {
    try {
      currentRecognition.stop();
    } catch (e) {
      // Ignore
    }
    currentRecognition = null;
  }
}
