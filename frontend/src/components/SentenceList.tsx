import React, { useState } from 'react';
import type { StudySet } from '../types';
import {
  BookOpen,
  Search,
  CheckCircle2,
  ChevronRight,
  UploadCloud,
  Trash2,
  Flame,
  Headphones,
} from 'lucide-react';

interface SentenceListProps {
  studySets: StudySet[];
  onSelectSetToPractice: (set: StudySet) => void;
  onOpenReader?: (set: StudySet) => void;
  onOpenUploadModal: () => void;
  onDeleteSet?: (setId: number) => void;
  selectedSetId?: number | null;
}

export const SentenceList: React.FC<SentenceListProps> = ({
  studySets,
  onSelectSetToPractice,
  onOpenReader,
  onOpenUploadModal,
  onDeleteSet,
  selectedSetId,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'system' | 'custom'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSets = studySets.filter((s) => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory;
    const matchSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  const totalSentencesCount = studySets.reduce((acc, curr) => acc + (curr.total_sentences || 0), 0);
  const totalPracticedCount = studySets.reduce((acc, curr) => acc + (curr.practiced_sentences || 0), 0);
  const overallPercentage =
    totalSentencesCount > 0 ? Math.round((totalPracticedCount / totalSentencesCount) * 100) : 0;

  const handleDelete = (e: React.MouseEvent, s: StudySet) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc muốn xóa Bộ câu: "${s.title}" cùng toàn bộ các câu bên trong?`)) {
      onDeleteSet?.(s.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Bộ Câu Ôn Luyện
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Chọn một bộ câu để bắt đầu luyện phát âm theo chủ đề hoặc tài liệu bạn đã tải lên.
          </p>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-200 transition-all cursor-pointer hover:-translate-y-0.5 shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>➕ Tạo / Tải lên Bộ câu mới</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            📚
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng bộ câu</div>
            <div className="text-xl font-black text-slate-900">{studySets.length} Bộ câu</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Câu đã hoàn thành</div>
            <div className="text-xl font-black text-slate-900">
              {totalPracticedCount} / {totalSentencesCount} câu
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ tổng thể</div>
            <div className="text-xl font-black text-slate-900">{overallPercentage}% hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
              activeCategory === 'all'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({studySets.length})
          </button>
          <button
            onClick={() => setActiveCategory('system')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
              activeCategory === 'system'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cơ bản hệ thống ({studySets.filter((s) => s.category === 'system').length})
          </button>
          <button
            onClick={() => setActiveCategory('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
              activeCategory === 'custom'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tài liệu của tôi ({studySets.filter((s) => s.category === 'custom').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm tên bộ câu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Grid of Study Sets Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSets.map((s) => {
          const isSelected = selectedSetId === s.id;
          const isCompleted = (s.completion_rate || 0) >= 100;

          return (
            <div
              key={s.id}
              onClick={() => onSelectSetToPractice(s)}
              className={`group p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer bg-white hover:shadow-xl hover:border-indigo-300 flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md'
                  : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <div>
                {/* Header: Icon, Badges, Delete */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      {s.icon || '📚'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            s.category === 'system'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}
                        >
                          {s.category === 'system' ? 'Cơ bản hệ thống' : 'Tài liệu tải lên'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {s.difficulty}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors mt-1">
                        {s.title}
                      </h3>
                    </div>
                  </div>

                  {s.category === 'custom' && onDeleteSet && (
                    <button
                      onClick={(e) => handleDelete(e, s)}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Xóa bộ câu này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Description */}
                {s.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium">
                    {s.description}
                  </p>
                )}

                {/* Preview sample sentences */}
                {s.preview_sentences && s.preview_sentences.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 mb-4 space-y-1 text-xs text-slate-600">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Câu mẫu trong bộ:
                    </span>
                    {s.preview_sentences.slice(0, 2).map((text, idx) => (
                      <div key={idx} className="truncate font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>"{text}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Bar & Footer Action */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      Đã luyện: <strong className="text-slate-900">{s.practiced_sentences ?? 0}</strong> / {s.total_sentences ?? 0} câu
                    </span>
                    <span className="font-bold text-indigo-600">{s.completion_rate ?? 0}%</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${s.completion_rate ?? 0}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : (s.completion_rate ?? 0) > 0
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                          : 'bg-transparent'
                      }`}
                    />
                  </div>

                  {(s.avg_score ?? 0) > 0 && (
                    <div className="text-[11px] text-slate-400 font-medium pt-0.5">
                      Điểm trung bình: <strong className="text-slate-700">{s.avg_score}/100</strong>
                    </div>
                  )}
                </div>

                {/* 2 Mode Buttons: Đọc hết 1 lèo & Luyện từng câu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenReader) {
                        onOpenReader(s);
                      } else {
                        onSelectSetToPractice(s);
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-xs"
                    title="Phát audio toàn bài liên tục với tốc độ tùy chỉnh 0.5x, 1.0x, 1.25x, 1.5x"
                  >
                    <Headphones className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>🎧 Đọc hết 1 lèo</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSetToPractice(s);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md hover:shadow-indigo-200 transition-all cursor-pointer"
                    title="Vào phòng thu âm luyện nói và chấm điểm từng câu"
                  >
                    <span>🎙️ Luyện từng câu</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSets.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-bold text-sm">Chưa tìm thấy bộ câu nào phù hợp.</p>
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tạo Bộ câu mới ngay</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
