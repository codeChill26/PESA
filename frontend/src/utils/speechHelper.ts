/**
 * speechHelper.ts
 * Pure Client-Side Speech Engine:
 * - 100% Web Speech Synthesis API native của trình duyệt (0ms latency, chạy offline)
 * - Hỗ trợ đầy đủ 4 mức tốc độ: 0.5x, 1.0x, 1.25x, 1.5x
 * - Giọng đọc chất lượng cao: Nữ Mỹ (US Female), Nam Mỹ (US Male), Nữ Anh (UK Female), Nam Anh (UK Male)
 * - Phát âm từng từ đơn lẻ khi bấm vào từ với độ trễ 0ms
 */

let activeAudio: HTMLAudioElement | null = null;

// Ánh xạ giọng sang BCP-47 language tag
const VOICE_LANG_MAP: Record<string, string> = {
  us_female: 'en-US',
  us_male: 'en-US',
  uk_female: 'en-GB',
  uk_male: 'en-GB',
};

/**
 * Dừng mọi âm thanh đang phát (cả Audio element lẫn Web Speech)
 */
export const stopAllSpeech = () => {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Điều chỉnh tốc độ audio đang phát tức thì (0ms latency)
 */
export const setAudioPlaybackRate = (speed: number) => {
  if (activeAudio) {
    activeAudio.playbackRate = speed;
  }
};

/**
 * Lấy tham chiếu Audio element hiện tại
 */
export const getActiveAudio = (): HTMLAudioElement | null => activeAudio;

/**
 * Tìm kiếm giọng đọc tiếng Anh tốt nhất trong danh sách voices của hệ điều hành/trình duyệt
 */
function getBestVoice(voiceKey: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const isUK = voiceKey.startsWith('uk');
  const isMale = voiceKey.endsWith('male');
  const targetPrefix = isUK ? 'en-gb' : 'en-us';

  // 1. Tìm giọng chuẩn có tên tự nhiên (Google, Siri, Samantha, Daniel, Karen, v.v.)
  const matched = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    const vName = v.name.toLowerCase();

    if (!vLang.startsWith(targetPrefix) && !vLang.startsWith('en')) return false;

    if (isMale) {
      return (
        vName.includes('male') ||
        vName.includes('guy') ||
        vName.includes('david') ||
        vName.includes('daniel') ||
        vName.includes('alex') ||
        vName.includes('george')
      );
    } else {
      return (
        vName.includes('female') ||
        vName.includes('jenny') ||
        vName.includes('samantha') ||
        vName.includes('victoria') ||
        vName.includes('karen') ||
        vName.includes('zira')
      );
    }
  });

  if (matched) return matched;

  // 2. Tìm bất kỳ voice nào thuộc en-US hoặc en-GB
  const langMatch = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix));
  if (langMatch) return langMatch;

  // 3. Tìm bất kỳ voice tiếng Anh nào
  return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || null;
}

/**
 * Phát âm thanh Client-Side thuần túy bằng Web Speech API
 */
export const speakWithWebSpeech = (
  text: string,
  voiceKey: string = 'us_female',
  _rate: string = '+0%',
  speed: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.('Trình duyệt không hỗ trợ Web Speech API');
    return;
  }

  stopAllSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  const lang = VOICE_LANG_MAP[voiceKey] || 'en-US';
  utterance.lang = lang;

  // Lấy tốc độ 0.75x trước đó (rate = 1.5) làm mốc 1.0x chuẩn mặc định theo yêu cầu người dùng
  // Khi chọn 1.0x -> phát ở rate 1.5 (vừa vặn, tự nhiên nhất)
  const effectiveRate = (speed || 1.0) * 1.5;
  utterance.rate = Math.max(0.5, Math.min(effectiveRate, 3.5));
  utterance.pitch = voiceKey.includes('female') ? 1.05 : 0.95;

  const voice = getBestVoice(voiceKey);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('[WebSpeech] Lỗi phát âm:', e);
    onError?.(e);
  };

  window.speechSynthesis.speak(utterance);
};

/**
 * Phát âm thanh chính (Pure Client-Side Speech):
 * Sử dụng Web Speech Synthesis với tốc độ tùy biến 0.5x - 2.0x và độ trễ 0ms
 */
export const playSpeech = ({
  text,
  voiceKey = 'us_female',
  rate,
  speed,
  onStart,
  onEnd,
  onError,
}: {
  text: string;
  voiceKey?: string;
  rate?: string;
  speed?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}) => {
  let targetSpeed = speed;
  if (targetSpeed === undefined) {
    if (rate === '-50%') targetSpeed = 0.5;
    else if (rate === '-25%' || rate === '-20%' || rate?.includes('0.8')) targetSpeed = 0.75;
    else if (rate === '+25%') targetSpeed = 1.25;
    else if (rate === '+50%') targetSpeed = 1.5;
    else if (rate === '+100%') targetSpeed = 2.0;
    else targetSpeed = 1.0;
  }
  speakWithWebSpeech(text, voiceKey, rate || '+0%', targetSpeed, onStart, onEnd, onError);
};

/**
 * Phát âm tức thì cho 1 từ đơn lẻ (khi nhấp vào từng từ)
 */
export const playWord = (word: string, voiceKey: string = 'us_female', rate: number = 1.2) => {
  const clean = word.replace(/[^a-zA-Z']/g, '').trim();
  if (!clean) return;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    stopAllSpeech();
    const utterance = new SpeechSynthesisUtterance(clean);
    const lang = VOICE_LANG_MAP[voiceKey] || 'en-US';
    utterance.lang = lang;
    utterance.rate = rate; // Đọc chậm rõ ràng
    utterance.pitch = voiceKey.includes('female') ? 1.05 : 0.95;

    const voice = getBestVoice(voiceKey);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }
};
