import React from 'react';
import { Mic, BookOpen, BarChart3, UploadCloud } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'practice' | 'sentences' | 'progress';
  setActiveTab: (tab: 'practice' | 'sentences' | 'progress') => void;
  onOpenUploadModal: () => void;
  todayCompleted?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUploadModal,
  todayCompleted = 0,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,8px)]">
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto items-center px-2">
        
        {/* Tab 1: Luyện nói */}
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all rounded-xl cursor-pointer ${
            activeTab === 'practice'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'practice' ? 'bg-indigo-50 text-indigo-600 shadow-xs' : ''}`}>
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-tight">Luyện nói</span>
        </button>

        {/* Tab 2: Bộ câu */}
        <button
          onClick={() => setActiveTab('sentences')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all rounded-xl cursor-pointer ${
            activeTab === 'sentences'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'sentences' ? 'bg-indigo-50 text-indigo-600 shadow-xs' : ''}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-tight">Bộ câu</span>
        </button>

        {/* Tab 3: Tiến độ */}
        <button
          onClick={() => setActiveTab('progress')}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 transition-all rounded-xl cursor-pointer ${
            activeTab === 'progress'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'progress' ? 'bg-indigo-50 text-indigo-600 shadow-xs' : ''}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-tight">Tiến độ</span>
          {todayCompleted > 0 && (
            <span className="absolute top-1 right-3.5 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {todayCompleted > 99 ? '99+' : todayCompleted}
            </span>
          )}
        </button>

        {/* Action: Tải bài */}
        <button
          onClick={onOpenUploadModal}
          className="flex flex-col items-center justify-center gap-1 py-1 text-slate-500 hover:text-indigo-600 font-medium transition-all rounded-xl cursor-pointer active:scale-95"
        >
          <div className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors">
            <UploadCloud className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-tight">Tải bài</span>
        </button>

      </div>
    </div>
  );
};
