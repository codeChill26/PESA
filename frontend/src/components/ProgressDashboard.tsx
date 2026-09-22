import React, { useEffect, useState } from 'react';
import type { User, UserProgress, StudySet } from '../types';
import { AlertCircle, History, BookOpen, ChevronRight } from 'lucide-react';
import { storageService } from '../utils/storageService';

interface ProgressDashboardProps {
  currentUser: User | null;
  onSelectSentenceToPractice?: (sentenceId: number) => void;
  onSelectSetToPractice?: (set: StudySet) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  currentUser,
  onSelectSetToPractice,
}) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    const stats = storageService.getUserStats(currentUser.id);
    const sets = storageService.getStudySets(currentUser.id);

    // Tính các từ hay phát âm sai
    const missedMap = new Map<string, number>();
    stats.recent_attempts.forEach((a) => {
      a.word_results?.forEach((w) => {
        if (w.status === 'error' || w.status === 'warning' || w.status === 'missing') {
          const clean = w.target_word.toLowerCase().replace(/[^a-z']/g, '');
          if (clean) {
            missedMap.set(clean, (missedMap.get(clean) || 0) + 1);
          }
        }
      });
    });

    const topMissed = Array.from(missedMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const bestScore = stats.recent_attempts.reduce((max, a) => Math.max(max, a.overall_score), 0);

    const recent = stats.recent_attempts.slice(0, 5).map((a, idx) => {
      const sentence = storageService.getSentences().find((s) => s.id === a.sentence_id);
      return {
        id: idx + 1,
        sentence_text: sentence?.text || 'Câu luyện tập',
        sentence_translation: sentence?.translation || '',
        overall_score: a.overall_score,
        created_at: a.created_at || new Date().toISOString(),
      };
    });

    setProgress({
      user_id: currentUser.id,
      user_name: currentUser.name,
      avatar: currentUser.avatar,
      daily_goal: currentUser.daily_goal,
      today_completed: stats.today_completed,
      total_attempts: stats.total_attempts,
      sentences_practiced: stats.completed_sentences,
      avg_score: stats.avg_score,
      best_score: bestScore,
      recent_attempts: recent,
      top_missed_words: topMissed,
      sets_progress: sets,
    });
    setLoading(false);
  }, [currentUser?.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Đang tải tiến độ học tập...</p>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-4xl shadow-inner">
            {progress.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">{progress.user_name}</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Thành viên tích cực
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Đã luyện tập tổng cộng <strong className="text-slate-800">{progress.sentences_practiced} câu</strong> tiếng Anh.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-600 uppercase">Hôm nay</div>
            <div className="text-xl font-black text-emerald-700">
              {progress.today_completed ?? 0}
              <span className="text-xs font-semibold text-emerald-500">/{progress.daily_goal || 5}</span>
            </div>
          </div>
          <div className="text-center px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Điểm trung bình</div>
            <div className="text-xl font-black text-indigo-600">{progress.avg_score}</div>
          </div>
          <div className="text-center px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Điểm cao nhất</div>
            <div className="text-xl font-black text-emerald-600">{progress.best_score}</div>
          </div>
        </div>
      </div>

      {/* NEW: Progress per Study Set */}
      {progress.sets_progress && progress.sets_progress.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Tiến độ Bộ Câu Ôn Luyện</h3>
                <p className="text-xs text-slate-500">
                  Theo dõi tỷ lệ hoàn thành và thành tích của từng bộ câu hệ thống & tự tải lên
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
              {progress.sets_progress.length} Bộ câu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {progress.sets_progress.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all bg-slate-50/50 hover:bg-white flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{s.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.category === 'custom'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.category === 'custom' ? 'Tự tải lên' : 'Hệ thống'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-600">{s.completion_rate ?? 0}%</span>
                      <div className="text-[10px] text-slate-400">
                        {s.practiced_sentences ?? 0}/{s.total_sentences ?? 0} câu
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        (s.completion_rate ?? 0) === 100
                          ? 'bg-emerald-500'
                          : (s.completion_rate ?? 0) > 50
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${s.completion_rate ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* Score Stats & Practice Action */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <div>
                      Điểm TB: <strong className="text-slate-800">{s.avg_score}đ</strong>
                    </div>
                    {s.best_score ? (
                      <div>
                        Cao nhất: <strong className="text-emerald-600">{s.best_score}đ</strong>
                      </div>
                    ) : null}
                  </div>

                  {onSelectSetToPractice && (
                    <button
                      onClick={() => onSelectSetToPractice(s)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                    >
                      <span>Luyện tập</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Section: Top Missed Words & Recent History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Missed Words to Review */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900">Từ cần chú ý phát âm</h3>
          </div>
          <p className="text-xs text-slate-500">
            Các từ AI nhận diện thấy bạn phát âm chưa chuẩn hoặc cần luyện tập thêm:
          </p>

          <div className="space-y-2">
            {progress.top_missed_words && progress.top_missed_words.length > 0 ? (
              progress.top_missed_words.map((pw, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-xs"
                >
                  <span className="font-bold text-amber-900 text-sm">"{pw.word}"</span>
                  <span className="text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                    Cần luyện lại: {pw.count} lần
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tuyệt vời! Hiện tại bạn không có từ nào bị phát âm lỗi nhiều.
              </div>
            )}
          </div>
        </div>

        {/* Recent Practice History */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Lịch sử luyện tập gần đây</h3>
          </div>
          <p className="text-xs text-slate-500">Các câu bạn đã hoàn thành trong các buổi tập trước:</p>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {progress.recent_attempts && progress.recent_attempts.length > 0 ? (
              progress.recent_attempts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate flex-1">
                    <div className="font-bold text-slate-800 truncate">{item.sentence_text}</div>
                    <div className="text-[11px] text-slate-400">{item.created_at}</div>
                  </div>
                  <div
                    className={`font-black px-2.5 py-1 rounded-lg text-xs ${
                      item.overall_score >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.overall_score >= 70
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.overall_score}đ
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có lịch sử. Hãy bắt đầu luyện tập câu đầu tiên!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
