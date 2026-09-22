import React, { useState, useEffect, useRef } from 'react';
import type { StudySet, Sentence, PlaybackSpeed } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  X,
  Mic,
  Languages,
  Repeat,
  Repeat1,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { playSpeech, stopAllSpeech, setAudioPlaybackRate } from '../utils/speechHelper';

interface FullArticleReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  studySet: StudySet | null;
  sentences: Sentence[];
  selectedVoice: string;
  onChangeVoice?: (voice: string) => void;
  onPracticeSentence?: (sentence: Sentence) => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5];

export const FullArticleReaderModal: React.FC<FullArticleReaderModalProps> = ({
  isOpen,
  onClose,
  studySet,
  sentences,
  selectedVoice,
  onPracticeSentence,
}) => {
  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [showTranslation, setShowTranslation] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // References
  const sentenceElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isPlayingRef = useRef(isPlaying);
  const currentIndexRef = useRef(currentIndex);
  const repeatModeRef = useRef(repeatMode);
  const speedRef = useRef(playbackSpeed);

  // Keep refs in sync
  isPlayingRef.current = isPlaying;
  currentIndexRef.current = currentIndex;
  repeatModeRef.current = repeatMode;
  speedRef.current = playbackSpeed;

  // Reset when opening or changing set
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsPlaying(false);
    } else {
      stopAllSpeech();
      setIsPlaying(false);
    }
  }, [isOpen, studySet?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  // Auto-scroll to active sentence
  useEffect(() => {
    if (!autoScroll || !isOpen) return;
    const el = sentenceElementsRef.current[currentIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex, autoScroll, isOpen]);

  if (!isOpen || !studySet || sentences.length === 0) return null;

  // Rate mapping for Edge-TTS backend
  const getRateParam = (speed: PlaybackSpeed): string => {
    switch (speed) {
      case 0.5:
        return '-50%';
      case 1.25:
        return '+25%';
      case 1.5:
        return '+50%';
      case 1.0:
      default:
        return '+0%';
    }
  };

  // Play a specific sentence by index
  const playSentenceAtIndex = (index: number) => {
    if (index < 0 || index >= sentences.length) {
      // Reached the end of the bài
      if (repeatModeRef.current === 'all') {
        setCurrentIndex(0);
        playSentenceAtIndex(0);
      } else {
        setIsPlaying(false);
        stopAllSpeech();
      }
      return;
    }

    setCurrentIndex(index);
    setIsPlaying(true);

    const targetSentence = sentences[index];
    const speed = speedRef.current;
    const rateParam = getRateParam(speed);

    playSpeech({
      text: targetSentence.text,
      voiceKey: selectedVoice,
      rate: rateParam,
      speed: speed,
      onStart: () => {
        setIsPlaying(true);
      },
      onEnd: () => {
        // Only advance if still in playing mode
        if (!isPlayingRef.current) return;

        if (repeatModeRef.current === 'one') {
          // Lặp lại đúng câu này
          setTimeout(() => {
            if (isPlayingRef.current) {
              playSentenceAtIndex(currentIndexRef.current);
            }
          }, 300);
        } else {
          // Tự động chuyển sang câu tiếp theo
          const nextIdx = currentIndexRef.current + 1;
          if (nextIdx < sentences.length) {
            setTimeout(() => {
              if (isPlayingRef.current) {
                playSentenceAtIndex(nextIdx);
              }
            }, 300);
          } else if (repeatModeRef.current === 'all') {
            setTimeout(() => {
              if (isPlayingRef.current) {
                playSentenceAtIndex(0);
              }
            }, 500);
          } else {
            setIsPlaying(false);
          }
        }
      },
      onError: (err) => {
        console.warn('[ArticleReader] Audio error:', err);
        // Fallback: move to next after brief pause
        if (isPlayingRef.current && currentIndexRef.current + 1 < sentences.length) {
          setTimeout(() => {
            if (isPlayingRef.current) {
              playSentenceAtIndex(currentIndexRef.current + 1);
            }
          }, 500);
        } else {
          setIsPlaying(false);
        }
      },
    });
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAllSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playSentenceAtIndex(currentIndex);
    }
  };

  // Skip to previous sentence
  const handlePrev = () => {
    stopAllSpeech();
    const prev = Math.max(0, currentIndex - 1);
    setCurrentIndex(prev);
    if (isPlaying) {
      playSentenceAtIndex(prev);
    }
  };

  // Skip to next sentence
  const handleNext = () => {
    stopAllSpeech();
    const next = Math.min(sentences.length - 1, currentIndex + 1);
    setCurrentIndex(next);
    if (isPlaying) {
      playSentenceAtIndex(next);
    }
  };

  // Restart from beginning
  const handleRestart = () => {
    stopAllSpeech();
    setCurrentIndex(0);
    playSentenceAtIndex(0);
  };

  // Change playback speed
  const handleChangeSpeed = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    speedRef.current = speed;
    setAudioPlaybackRate(speed);
    // Nếu đang phát âm thanh, lập tức phát lại câu hiện tại với tốc độ mới
    if (isPlayingRef.current) {
      stopAllSpeech();
      playSentenceAtIndex(currentIndexRef.current);
    }
  };

  // Toggle repeat mode
  const handleCycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  // Click on a sentence
  const handleClickSentence = (idx: number) => {
    stopAllSpeech();
    playSentenceAtIndex(idx);
  };

  // Switch to Practice Studio for this sentence
  const handleSwitchToPractice = (sentence: Sentence) => {
    stopAllSpeech();
    setIsPlaying(false);
    onClose();
    onPracticeSentence?.(sentence);
  };

  const progressPercent = Math.round(((currentIndex + 1) / sentences.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* TOP HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white text-xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              {studySet.icon || '📚'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                  Chế độ đọc full bài
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  {studySet.difficulty || 'A2'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Câu {currentIndex + 1} / {sentences.length}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                {studySet.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showTranslation
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
              title="Bật/tắt dịch nghĩa tiếng Việt"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{showTranslation ? 'Song ngữ: Bật' : 'Song ngữ: Tắt'}</span>
            </button>

            <button
              onClick={() => {
                stopAllSpeech();
                setIsPlaying(false);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FLOATING CONTROLS PANEL */}
        <div className="px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shadow-inner">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Playback Transport Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Phát lại từ đầu bài"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Câu trước"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95 ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Tự phát toàn bài</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === sentences.length - 1}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Câu tiếp theo"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleCycleRepeat}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  repeatMode !== 'off' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={
                  repeatMode === 'off'
                    ? 'Lặp lại: Tắt'
                    : repeatMode === 'all'
                    ? 'Lặp lại toàn bài'
                    : 'Lặp lại 1 câu (Shadowing)'
                }
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                <span className="text-[10px] hidden md:inline">
                  {repeatMode === 'off' ? 'Không lặp' : repeatMode === 'all' ? 'Lặp cả bài' : 'Lặp 1 câu'}
                </span>
              </button>
            </div>

            {/* SPEED CONTROLLER CHIPS (0.5x, 1.0x, 1.25x, 1.5x) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 hidden lg:inline">Tốc độ đọc:</span>
              <div className="p-1 bg-slate-800 rounded-xl flex items-center gap-1 border border-slate-700/60">
                {SPEED_OPTIONS.map((spd) => {
                  const isActive = playbackSpeed === spd;
                  return (
                    <button
                      key={spd}
                      onClick={() => handleChangeSpeed(spd)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/50 scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {spd === 1.0 ? '1x (Chuẩn)' : `${spd}x`}
                    </button>
                  );
                })}
              </div>

              {/* Animated Wave Indicator when playing */}
              {isPlaying && (
                <div className="flex items-center gap-0.5 ml-2">
                  <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse" />
                  <span className="w-1 h-5 bg-indigo-300 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse delay-150" />
                  <span className="w-1 h-2 bg-indigo-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Progress Slider */}
          <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span>Tiến độ bài</span>
            <div
              className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const targetIdx = Math.min(
                  sentences.length - 1,
                  Math.max(0, Math.floor(pos * sentences.length))
                );
                stopAllSpeech();
                playSentenceAtIndex(targetIdx);
              }}
            >
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-300"
              />
            </div>
            <span className="font-bold text-indigo-400">{progressPercent}%</span>
          </div>
        </div>

        {/* ARTICLE PASSAGE CONTENT - INTERACTIVE READING VIEW */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-4 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* Quick helper tip */}
            <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between text-xs text-indigo-800 font-medium">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Bấm vào bất kỳ câu nào để nhảy nghe câu đó. Bấm icon 🎙️ để chuyển sang luyện nói câu tương ứng.</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0 ml-2">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] text-slate-600">Tự cuộn</span>
              </label>
            </div>

            {/* List of Sentences */}
            <div className="space-y-3 pt-2">
              {sentences.map((s, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={s.id || idx}
                    ref={(el) => {
                      sentenceElementsRef.current[idx] = el;
                    }}
                    onClick={() => handleClickSentence(idx)}
                    className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-white border-indigo-400 shadow-lg shadow-indigo-100 ring-2 ring-indigo-200 -translate-y-0.5'
                        : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      
                      {/* Left: Index badge & Status */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-300'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                          }`}
                        >
                          {isActive && isPlaying ? (
                            <Volume2 className="w-4 h-4 animate-bounce" />
                          ) : (
                            idx + 1
                          )}
                        </span>

                        <div>
                          {/* English Target Sentence */}
                          <p
                            className={`text-base sm:text-lg font-bold leading-relaxed transition-colors ${
                              isActive ? 'text-indigo-950 font-extrabold' : 'text-slate-800 group-hover:text-indigo-600'
                            }`}
                          >
                            {s.text}
                          </p>

                          {/* Vietnamese Translation */}
                          {showTranslation && s.translation && (
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                              {s.translation}
                            </p>
                          )}

                          {/* Audio Hint / Pronunciation Note */}
                          {isActive && s.audio_hint && (
                            <div className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50/80 border border-amber-200/70 px-2.5 py-1 rounded-lg inline-block">
                              💡 {s.audio_hint}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action to Practice Sentence */}
                      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchToPractice(s);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:shadow-indigo-200"
                          title="Luyện nói câu này trong phòng thu"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Luyện nói</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER SUMMARY */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Tổng cộng: <strong className="text-slate-800">{sentences.length} câu</strong> trong bài đọc</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopAllSpeech();
                setIsPlaying(false);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Đóng trình đọc
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
