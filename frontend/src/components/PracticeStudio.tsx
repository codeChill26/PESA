import React, { useState, useRef, useEffect } from 'react';
import type { Sentence, User, AttemptResult, WordResult, StudySet, PlaybackSpeed } from '../types';
import confetti from 'canvas-confetti';
import {
  Volume2,
  Mic,
  Square,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  Pause,
  TrendingUp,
  Loader2,
  AlertCircle,
  Headphones,
} from 'lucide-react';
import { playSpeech, playWord, stopAllSpeech } from '../utils/speechHelper';
import { speechRecorder } from '../utils/speechRecognitionService';
import { evaluateSpeech } from '../utils/evaluationService';
import { storageService } from '../utils/storageService';

interface PracticeStudioProps {
  sentence: Sentence;
  currentUser: User | null;
  selectedVoice: string;
  currentStudySet?: StudySet | null;
  setSentences?: Sentence[];
  onSelectSentence?: (sentence: Sentence) => void;
  onNextSentence: () => void;
  onPrevSentence?: () => void;
  onRefreshSentences: () => void;
  onBackToSets?: () => void;
  onOpenReader?: (set: StudySet) => void;
}

export const PracticeStudio: React.FC<PracticeStudioProps> = ({
  sentence,
  currentUser,
  selectedVoice,
  currentStudySet = null,
  setSentences = [],
  onSelectSentence,
  onNextSentence,
  onPrevSentence,
  onRefreshSentences,
  onBackToSets,
  onOpenReader,
}) => {
  // TTS States
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);

  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingMyVoice, setIsPlayingMyVoice] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(0); // 0 to 100
  const timerIntervalRef = useRef<number | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Evaluation States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [activeWordTooltip, setActiveWordTooltip] = useState<WordResult | null>(null);

  // Display toggles
  const [showTranslation, setShowTranslation] = useState(true);
  const showHint = true;

  // Cleanup volume analyzer
  const cleanupAudioAnalyzer = () => {
    setVolumeLevel(0);
  };

  // Reset states when sentence changes
  useEffect(() => {
    stopAllSpeech();
    setResult(null);
    setRecordedAudioUrl(null);
    setAttemptNumber(1);
    setIsRecording(false);
    setIsPlayingTTS(false);
    setIsLoadingTTS(false);
    cleanupAudioAnalyzer();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [sentence.id]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllSpeech();
      cleanupAudioAnalyzer();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();
    };
  }, []);

  // --- 1. PLAY REFERENCE TTS (DUAL-ENGINE) ---
  const handlePlayTTS = () => {
    if (isPlayingTTS || isLoadingTTS) {
      stopAllSpeech();
      setIsPlayingTTS(false);
      setIsLoadingTTS(false);
      return;
    }

    setIsLoadingTTS(true);
    playSpeech({
      text: sentence.text,
      voiceKey: selectedVoice,
      speed: playbackSpeed,
      onStart: () => {
        setIsLoadingTTS(false);
        setIsPlayingTTS(true);
      },
      onEnd: () => {
        setIsLoadingTTS(false);
        setIsPlayingTTS(false);
      },
      onError: (err) => {
        console.warn('[PracticeStudio] TTS error:', err);
        setIsLoadingTTS(false);
        setIsPlayingTTS(false);
      },
    });
  };

  // Đổi tốc độ đọc ngay lập tức (nếu đang phát thì phát lại với tốc độ mới)
  const handleChangeSpeed = (newSpeed: PlaybackSpeed) => {
    setPlaybackSpeed(newSpeed);
    if (isPlayingTTS) {
      stopAllSpeech();
      setIsPlayingTTS(true);
      playSpeech({
        text: sentence.text,
        voiceKey: selectedVoice,
        speed: newSpeed,
        onStart: () => {
          setIsLoadingTTS(false);
          setIsPlayingTTS(true);
        },
        onEnd: () => {
          setIsLoadingTTS(false);
          setIsPlayingTTS(false);
        },
        onError: () => {
          setIsLoadingTTS(false);
          setIsPlayingTTS(false);
        },
      });
    }
  };

  // --- 2. RECORDING WITH CLIENT-SIDE SPEECH RECOGNITION ---
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const startRecording = async () => {
    try {
      stopAllSpeech();
      setIsRecording(true);
      setRecordDuration(0);
      setLiveTranscript('');
      setResult(null);

      const started = await speechRecorder.startRecording(
        (interim) => {
          setLiveTranscript(interim);
        },
        (vol) => {
          setVolumeLevel(vol);
        }
      );

      if (!started) {
        setIsRecording(false);
        alert('Vui lòng cấp quyền Microphone trên trình duyệt để luyện nói!');
        return;
      }

      // Đếm giây ghi âm
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Lỗi mở microphone:', err);
      setIsRecording(false);
      alert('Không thể truy cập Microphone. Vui lòng kiểm tra quyền trên trình duyệt!');
    }
  };

  const stopRecording = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    cleanupAudioAnalyzer();

    setIsEvaluating(true);
    try {
      const { transcript, duration, audioUrl } = await speechRecorder.stopRecording();
      setRecordedAudioUrl(audioUrl);

      // Chấm điểm phát âm Client-Side (0ms latency, không phụ thuộc server)
      const data = evaluateSpeech(sentence.text, transcript, duration);
      setResult(data);

      // Lưu bài tập vào LocalStorage qua storageService
      if (currentUser) {
        storageService.recordAttempt(currentUser.id, sentence.id, data, attemptNumber);
      }

      // Bắn pháo hoa ăn mừng nếu điểm cao (>= 85)
      if (data.overall_score >= 85) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onRefreshSentences();
    } catch (err) {
      console.error('Lỗi chấm điểm bài nói:', err);
      alert('Có lỗi xảy ra khi chấm điểm bài nói. Vui lòng thử lại!');
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- 4. RETRY ACTION (THỬ LẠI) ---
  const handleRetry = () => {
    setAttemptNumber((prev) => prev + 1);
    setRecordedAudioUrl(null);
    setActiveWordTooltip(null);
    setLiveTranscript('');
    startRecording();
  };

  // --- 5. PLAY MY RECORDED VOICE ---
  const handleToggleMyVoice = () => {
    if (!recordedAudioUrl) return;
    if (isPlayingMyVoice && userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      setIsPlayingMyVoice(false);
      return;
    }

    stopAllSpeech();
    const audio = new Audio(recordedAudioUrl);
    userAudioPlayerRef.current = audio;
    setIsPlayingMyVoice(true);
    audio.onended = () => setIsPlayingMyVoice(false);
    audio.play();
  };

  // Tính toán vị trí câu trong Bộ câu hiện tại
  const currentIndex = setSentences.findIndex((s) => s.id === sentence.id);
  const currentNumber = currentIndex >= 0 ? currentIndex + 1 : 1;
  const totalInSet = setSentences.length > 0 ? setSentences.length : 1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < setSentences.length - 1;
  const setPercent = Math.round((currentNumber / totalInSet) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {/* 1. Study Set Header Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBackToSets && (
            <button
              onClick={onBackToSets}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
              title="Quay lại danh sách Bộ câu"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Đổi bộ câu</span>
            </button>
          )}

          <div className="border-l border-slate-200 pl-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>{currentStudySet?.icon || '📚'}</span>
                <span>{currentStudySet?.title || sentence.topic_vi}</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentStudySet?.category === 'custom'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}
              >
                {currentStudySet?.category === 'custom' ? 'Tự tải lên' : 'Hệ thống'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              Khuôn viên bộ câu • Câu{' '}
              <strong className="text-indigo-600 font-bold">{currentNumber}</strong> / {totalInSet} câu
            </div>
          </div>
        </div>

        {/* Navigation buttons & Progress bar */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {currentStudySet && onOpenReader && (
            <button
              onClick={() => onOpenReader(currentStudySet)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:shadow-indigo-100 shrink-0"
              title="Phát audio toàn bài đọc liên tục với tốc độ 0.5x - 1.5x"
            >
              <Headphones className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Đọc hết 1 lèo (0.5x - 1.5x)</span>
              <span className="md:hidden">Full bài</span>
            </button>
          )}

          <button
            onClick={onPrevSentence}
            disabled={!hasPrev}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
              hasPrev
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer'
                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            }`}
            title="Câu trước"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-20 sm:w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${setPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 w-8 text-right">{setPercent}%</span>
          </div>

          <button
            onClick={onNextSentence}
            disabled={!hasNext}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              hasNext
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title={hasNext ? 'Câu tiếp theo trong bộ này' : 'Đã đến câu cuối cùng của bộ này'}
          >
            <span>Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Quick Sentence Carousel / Pills Selector */}
      {setSentences.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Các câu:
          </span>
          {setSentences.map((s, idx) => {
            const isCurrent = s.id === sentence.id;
            const hasScore = s.best_score && s.best_score > 0;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSentence?.(s)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-200'
                    : hasScore
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                title={`Câu ${idx + 1}: ${s.text}`}
              >
                <span>{idx + 1}</span>
                {hasScore && <span className="text-[10px] text-emerald-600">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Top Breadcrumb Badges */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
            {sentence.topic_vi}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            Cấp độ {sentence.difficulty}
          </span>
          {attemptNumber > 1 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 animate-pulse">
              Lần thử thứ {attemptNumber}
            </span>
          )}
        </div>

        {hasNext && (
          <button
            onClick={onNextSentence}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <span>Câu tiếp ({currentNumber + 1}/{totalInSet})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Practice Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 mb-6 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-full pointer-events-none" />

        {/* English Sentence Display */}
        <div className="text-center my-6 space-y-4">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mẹo: Bạn có thể bấm vào từng từ để nghe phát âm riêng của từ đó</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-snug sm:leading-tight">
            {/* Nếu đã có kết quả thì tô màu từng từ, chưa có thì hiển thị chữ gốc bấm được */}
            {result && result.word_results ? (
              <span className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                {result.word_results.map((w, idx) => {
                  let colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
                  let icon = '✓';

                  if (w.status === 'warning') {
                    colorClass = 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
                    icon = '⚠️';
                  } else if (w.status === 'error') {
                    colorClass = 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200';
                    icon = '❌';
                  } else if (w.status === 'missing') {
                    colorClass = 'bg-slate-100 text-slate-500 border-slate-300 line-through opacity-60';
                    icon = '❓';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveWordTooltip(activeWordTooltip === w ? null : w);
                        playWord(w.target_word, selectedVoice);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xl sm:text-3xl font-bold cursor-pointer transition-all shadow-xs ${colorClass}`}
                      title={`${w.feedback} • Bấm để nghe phát âm mẫu`}
                    >
                      <span>{w.target_word}</span>
                      <span className="text-xs font-normal opacity-70">{icon}</span>
                    </button>
                  );
                })}
              </span>
            ) : (
              <span className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {sentence.text.split(' ').map((w, idx) => (
                  <button
                    key={idx}
                    onClick={() => playWord(w, selectedVoice)}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 group/w border border-transparent hover:border-indigo-100"
                    title="Bấm để nghe phát âm từ này"
                  >
                    <span>{w}</span>
                    <Volume2 className="w-3.5 h-3.5 opacity-0 group-hover/w:opacity-60 text-indigo-500 transition-opacity" />
                  </button>
                ))}
              </span>
            )}
          </h1>

          {/* Word Feedback Popup Tooltip (Khi bấm vào từ) */}
          {activeWordTooltip && (
            <div className="inline-flex items-center gap-2.5 p-3 bg-slate-900 text-white text-xs sm:text-sm rounded-2xl shadow-xl animate-fade-in border border-slate-700">
              <span className="font-bold text-amber-300">"{activeWordTooltip.target_word}":</span>
              <span>{activeWordTooltip.feedback}</span>
              <button
                onClick={() => playWord(activeWordTooltip.target_word, selectedVoice)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe mẫu</span>
              </button>
              <button
                onClick={() => setActiveWordTooltip(null)}
                className="ml-1 text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Vietnamese Translation (Có nút ẩn/hiện) */}
          <div className="pt-2">
            {showTranslation ? (
              <p className="text-base sm:text-lg text-slate-600 font-medium">
                {sentence.translation}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">Bản dịch tiếng Việt đã ẩn</p>
            )}

            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showTranslation ? 'Ẩn bản dịch' : 'Xem bản dịch'}</span>
            </button>
          </div>

          {/* Pronunciation Hint (Lưu ý phát âm) */}
          {sentence.audio_hint && showHint && (
            <div className="max-w-md mx-auto mt-4 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-left text-xs text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Mẹo phát âm: </span>
                <span>{sentence.audio_hint}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 my-6"></div>

        {/* 3 Steps Interactive Controls */}
        <div className="space-y-6">

          {/* BƯỚC 1: NGHE MẪU (LISTEN) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handlePlayTTS}
              disabled={isLoadingTTS}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer ${
                isPlayingTTS
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 animate-pulse'
                  : isLoadingTTS
                  ? 'bg-indigo-400 text-white opacity-80'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5'
              }`}
            >
              {isLoadingTTS ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tải âm thanh mẫu...</span>
                </>
              ) : isPlayingTTS ? (
                <>
                  <Volume2 className="w-5 h-5 animate-bounce" />
                  <span>Đang phát giọng mẫu... (Bấm để dừng)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span>🎧 Bước 1: Nghe giọng mẫu</span>
                </>
              )}
            </button>

            {/* Speed Selector (0.5x, 0.75x, 1x Chuẩn, 1.25x, 1.5x) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
              <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1 hidden sm:inline">Tốc độ:</span>
              {([0.5, 0.75, 1.0, 1.25, 1.5] as PlaybackSpeed[]).map((spd) => {
                const isActive = playbackSpeed === spd;
                return (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleChangeSpeed(spd)}
                    className={`px-2 sm:px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs scale-105'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {spd === 1.0 ? '1x (Chuẩn)' : `${spd}x`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 2: BẮT ĐẦU NÓI & GHI ÂM (SPEAK & RECORD) */}
          <div className="text-center">
            {!isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={startRecording}
                  disabled={isEvaluating}
                  className="group relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xl shadow-rose-200 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="absolute inset-0 rounded-full border-4 border-rose-200 animate-ping opacity-25" />
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
                <div className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                  🎙️ Bước 2: Bấm để bắt đầu nói
                </div>
                <p className="text-[11px] text-slate-400">
                  Nói to, rõ ràng theo câu mẫu phía trên
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                {/* Realtime Dynamic Microphone Volume Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-12">
                  {[35, 65, 90, 80, 100, 75, 85, 45].map((baseH, idx) => {
                    // Chiều cao tự động co giãn theo volume level thực tế từ mic
                    const factor = Math.max(0.12, volumeLevel / 100);
                    const currentH = Math.max(6, Math.round(baseH * factor));
                    return (
                      <div
                        key={idx}
                        style={{ height: `${currentH}px` }}
                        className={`w-2 rounded-full transition-all duration-75 ${
                          volumeLevel > 8 ? 'bg-rose-500 shadow-xs shadow-rose-200' : 'bg-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Live Volume & Duration Info */}
                <div className="text-sm font-bold text-rose-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>
                    Đang ghi âm giọng của bạn: 00:
                    {recordDuration < 10 ? `0${recordDuration}` : recordDuration}
                  </span>
                </div>

                {/* Silence / Low Volume Warning */}
                {recordDuration >= 2 && volumeLevel < 4 && (
                  <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Chưa nhận thấy âm thanh từ micro — Hãy nói to và rõ hơn nhé!</span>
                  </div>
                )}

                {/* Real-time speech transcript feedback */}
                {liveTranscript && (
                  <div className="max-w-md px-4 py-2 rounded-xl bg-indigo-50/90 border border-indigo-200 text-xs font-semibold text-indigo-900 animate-fade-in text-center">
                    <span className="text-[10px] text-indigo-500 uppercase tracking-wider block font-bold mb-0.5">Micro đang nhận diện:</span>
                    "{liveTranscript}"
                  </div>
                )}

                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl hover:scale-105 transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Dừng & Chấm điểm ngay</span>
                </button>
              </div>
            )}

            {/* Loading Indicator while AI is analyzing */}
            {isEvaluating && (
              <div className="mt-4 flex flex-col items-center gap-2 animate-fade-in">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-indigo-600">AI đang phân tích từng từ phát âm...</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* BƯỚC 3: KẾT QUẢ ĐÁNH GIÁ (EVALUATION CARD) */}
      {result && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
            
            {/* Score circle badge */}
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-lg ${
                  result.overall_score >= 85
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-200'
                    : result.overall_score >= 70
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-200'
                    : 'bg-gradient-to-tr from-rose-500 to-red-400 shadow-rose-200'
                }`}
              >
                <span className="text-2xl">{result.overall_score}</span>
                <span className="text-[10px] font-semibold opacity-90">/ 100 ĐIỂM</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {result.overall_score >= 85
                      ? 'Xuất sắc! 🎉'
                      : result.overall_score >= 70
                      ? 'Rất tốt! 👏'
                      : 'Cố gắng lên! 💪'}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Lần thử #{result.attempt_number}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                  {result.feedback_summary}
                </p>
              </div>
            </div>

            {/* Listen back to my voice */}
            {recordedAudioUrl && (
              <button
                onClick={handleToggleMyVoice}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isPlayingMyVoice ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingMyVoice ? 'Tạm dừng giọng tôi' : 'Nghe lại giọng tôi vừa nói'}</span>
              </button>
            )}

          </div>

          {/* 3 Detail Metric Bars */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ chính xác</div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">{result.accuracy_score}%</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ trọn vẹn</div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">{result.completeness_score}%</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lưu loát</div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">{result.fluency_score}%</div>
            </div>
          </div>

          {/* Transcript detected */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">AI nghe được: </span>
              <span className="italic">"{result.transcript || 'Chưa nhận diện được giọng nói'}"</span>
            </div>
            {result.transcript && (
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                Whisper AI ✓
              </span>
            )}
          </div>

          {/* Words needing practice with quick audio buttons */}
          {result.word_results.some((w) => w.status === 'warning' || w.status === 'error') && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>Từ cần chú ý phát âm lại (Bấm để nghe giọng chuẩn):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.word_results
                  .filter((w) => w.status === 'warning' || w.status === 'error')
                  .map((w, i) => (
                    <button
                      key={i}
                      onClick={() => playWord(w.target_word, selectedVoice)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Bấm để nghe phát âm từ này"
                    >
                      <span>{w.target_word}</span>
                      <Volume2 className="w-3 h-3 text-amber-600" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Attempt Progress Chain (Lịch sử các lần thử câu này) */}
          {result.attempts_history && result.attempts_history.length > 1 && (
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Tiến bộ qua các lần thử:
              </div>
              <div className="flex items-center gap-2">
                {result.attempts_history.map((h, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold"
                  >
                    Lần {h.attempt_number}: {h.overall_score}đ
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Try Again & Next Sentence */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại ngay để đạt 100 điểm</span>
            </button>

            {hasNext ? (
              <button
                onClick={onNextSentence}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Sang câu tiếp theo ({currentNumber + 1}/{totalInSet})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onBackToSets}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Đã hết câu! Trở về Bộ câu 🎉</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
