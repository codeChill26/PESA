import React, { useState, useRef } from 'react';
import type { TopicGroup } from '../types';
import { storageService } from '../utils/storageService';
import { detectAndSplitTopics } from '../utils/documentParser';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  FileText,
  FileCode,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Download,
  FileSpreadsheet,
  Scissors,
  Link as LinkIcon,
  Trash2,
  Edit3,
  Headphones,
  Mic,
  Layers,
  AlignLeft,
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (setId: number, topicName: string, count: number, startMode?: 'reader' | 'practice') => void;
}

interface EditableSentence {
  id: number;
  text: string;
  translation: string;
  word_count: number;
  difficulty?: string;
  audio_hint?: string;
}

const EMOJI_OPTIONS = ['📚', '☕', '💼', '✈️', '🌟', '🎯', '💬', '🍜', '👨‍👩‍👧', '💡', '🎓', '🏖️'];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [topicName, setTopicName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📚');
  const [difficulty, setDifficulty] = useState('A2');

  // Preview & Topic States
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewSentences, setPreviewSentences] = useState<EditableSentence[]>([]);
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-Topic detection states
  const [detectedTopics, setDetectedTopics] = useState<TopicGroup[]>([]);
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number>(0);
  const [passageText, setPassageText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'sentences' | 'passage'>('sentences');

  // Success 2-mode prompt state
  const [savedResult, setSavedResult] = useState<{
    setId: number;
    topicName: string;
    count: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      if (!topicName) {
        setTopicName(baseName.replace(/[_-]/g, ' '));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      if (!topicName) {
        setTopicName(baseName.replace(/[_-]/g, ' '));
      }
    }
  };

  // Trích xuất và xem trước câu & Topic
  const handleExtractPreview = async () => {
    setErrorMessage(null);
    if (activeTab === 'file' && !selectedFile) {
      setErrorMessage('Vui lòng chọn hoặc kéo thả một file tài liệu / file template.');
      return;
    }
    if (activeTab === 'text' && !pastedText.trim()) {
      setErrorMessage('Vui lòng dán nội dung văn bản tiếng Anh vào ô.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);

    const processText = (text: string, sourceName: string) => {
      try {
        const topics = detectAndSplitTopics(text, sourceName);
        if (topics.length === 0 || (topics.length === 1 && topics[0].sentences.length === 0)) {
          throw new Error('Không tìm thấy câu tiếng Anh phù hợp (3-25 từ) để luyện nói.');
        }

        setDetectedTopics(topics);
        setSelectedTopicIdx(0);
        const currentT = topics[0];
        setTopicName(currentT.topic_title || currentT.title || sourceName);
        setPassageText(currentT.passage_text || '');
        setSelectedIcon(currentT.icon || '📚');
        setDifficulty(currentT.difficulty || difficulty);

        const mapped: EditableSentence[] = (currentT.sentences || []).map((s, idx) => ({
          id: idx + 1,
          text: s.text,
          translation: s.translation || 'Nhấp để nghe mẫu và luyện tập phát âm',
          word_count: s.word_count || s.text.split(' ').length,
          difficulty: s.difficulty || difficulty,
          audio_hint: s.audio_hint || '',
        }));

        setPreviewSentences(mapped);
        setSelectedSentenceIds(new Set(mapped.map((s) => s.id)));
        setStep('preview');
      } catch (err: any) {
        setErrorMessage(err.message || 'Có lỗi xảy ra khi xử lý tài liệu.');
      } finally {
        setIsExtracting(false);
      }
    };

    if (activeTab === 'file' && selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        processText(content, selectedFile.name);
      };
      reader.onerror = () => {
        setErrorMessage('Không thể đọc nội dung file đã chọn.');
        setIsExtracting(false);
      };
      reader.readAsText(selectedFile);
    } else {
      processText(pastedText.trim(), topicName || 'Văn bản đã dán');
    }
  };

  // Chọn topic khác trong danh sách các topic đã nhận diện
  const handleSelectTopic = (tIdx: number) => {
    setSelectedTopicIdx(tIdx);
    const t = detectedTopics[tIdx];
    if (!t) return;
    setTopicName(t.topic_title || t.title || 'Bộ câu');
    setPassageText(t.passage_text || '');
    setSelectedIcon(t.icon || '📚');
    setDifficulty(t.difficulty || difficulty);

    const mapped: EditableSentence[] = (t.sentences || []).map((s: any, idx: number) => ({
      id: idx + 1,
      text: s.text,
      translation: s.translation || '',
      word_count: s.word_count || s.text.split(' ').length,
      difficulty: s.difficulty || t.difficulty || difficulty,
      audio_hint: s.audio_hint || '',
    }));
    setPreviewSentences(mapped);
    setSelectedSentenceIds(new Set(mapped.map((s) => s.id)));
  };

  // Bật/tắt chọn 1 câu
  const toggleSelectSentence = (id: number) => {
    const next = new Set(selectedSentenceIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedSentenceIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedSentenceIds.size === previewSentences.length) {
      setSelectedSentenceIds(new Set());
    } else {
      setSelectedSentenceIds(new Set(previewSentences.map((s) => s.id)));
    }
  };

  // TÁCH 1 CÂU DÀI THÀNH 2 CÂU
  const handleSplitSentence = (id: number) => {
    const target = previewSentences.find((s) => s.id === id);
    if (!target) return;

    const text = target.text.trim();
    let splitParts: string[] = [];

    const punctuationMatch = text.split(/(?<=[.!?])\s+/);
    if (punctuationMatch.length >= 2) {
      splitParts = punctuationMatch;
    } else {
      const commaMatch = text.split(/(?<=[,;])\s+/);
      if (commaMatch.length >= 2 && text.split(' ').length > 10) {
        splitParts = commaMatch;
      }
    }

    if (splitParts.length < 2) {
      alert('Không tìm thấy dấu ngắt thích hợp (chấm, phẩy) để tự động tách câu này.');
      return;
    }

    const newItems: EditableSentence[] = splitParts.map((p, idx) => ({
      id: Date.now() + idx,
      text: p.endsWith('.') || p.endsWith('!') || p.endsWith('?') ? p : p + '.',
      translation: idx === 0 ? target.translation : '',
      word_count: p.split(' ').length,
      difficulty: target.difficulty,
      audio_hint: target.audio_hint,
    }));

    const currentIdx = previewSentences.findIndex((s) => s.id === id);
    const updated = [
      ...previewSentences.slice(0, currentIdx),
      ...newItems,
      ...previewSentences.slice(currentIdx + 1),
    ];

    setPreviewSentences(updated);
    const updatedSelected = new Set(selectedSentenceIds);
    updatedSelected.delete(id);
    newItems.forEach((item) => updatedSelected.add(item.id));
    setSelectedSentenceIds(updatedSelected);
  };

  // GỘP CÂU VỚI CÂU KẾ TIẾP
  const handleMergeWithNext = (id: number) => {
    const currentIdx = previewSentences.findIndex((s) => s.id === id);
    if (currentIdx === -1 || currentIdx >= previewSentences.length - 1) return;

    const curr = previewSentences[currentIdx];
    const next = previewSentences[currentIdx + 1];

    const mergedText = `${curr.text.trim()} ${next.text.trim()}`;
    const mergedTranslation = [curr.translation, next.translation].filter(Boolean).join(' ');

    const mergedItem: EditableSentence = {
      id: curr.id,
      text: mergedText,
      translation: mergedTranslation,
      word_count: mergedText.split(' ').length,
      difficulty: curr.difficulty,
      audio_hint: curr.audio_hint,
    };

    const updated = [
      ...previewSentences.slice(0, currentIdx),
      mergedItem,
      ...previewSentences.slice(currentIdx + 2),
    ];

    setPreviewSentences(updated);
    const updatedSelected = new Set(selectedSentenceIds);
    updatedSelected.delete(next.id);
    updatedSelected.add(mergedItem.id);
    setSelectedSentenceIds(updatedSelected);
  };

  // Xóa 1 câu khỏi danh sách xem trước
  const handleDeletePreviewSentence = (id: number) => {
    setPreviewSentences((prev) => prev.filter((s) => s.id !== id));
    const next = new Set(selectedSentenceIds);
    next.delete(id);
    setSelectedSentenceIds(next);
  };

  // Cập nhật nội dung câu khi chỉnh sửa trực tiếp
  const handleUpdateSentenceText = (id: number, newText: string, newTrans: string) => {
    setPreviewSentences((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              text: newText,
              translation: newTrans,
              word_count: newText.split(' ').length,
            }
          : s
      )
    );
  };

  // Lưu 1 Bộ câu đã chọn
  const handleSaveSingleSet = () => {
    const chosen = previewSentences.filter((s) => selectedSentenceIds.has(s.id));
    if (chosen.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 câu để tạo Bộ câu.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = storageService.saveStudySet(
        topicName.trim() || 'Bộ câu mới',
        `Bộ câu ôn luyện gồm ${chosen.length} câu theo chủ đề`,
        selectedIcon,
        chosen.map((s) => ({
          text: s.text,
          translation: s.translation,
          difficulty: s.difficulty || difficulty,
          audio_hint: s.audio_hint,
        })),
        passageText || chosen.map((s) => s.text).join(' ')
      );

      // Bắn pháo hoa ăn mừng
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Kích hoạt ngay lập tức để App.tsx tự động reload dữ liệu và render ngay lập tức!
      onSuccess(res.set_id, res.topic_name, res.saved_count);

      setSavedResult({
        setId: res.set_id,
        topicName: res.topic_name,
        count: res.saved_count,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi lưu bộ câu bài học.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lưu tất cả các topic đã tự động phân tách
  const handleSaveAllTopics = () => {
    if (detectedTopics.length === 0) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = storageService.saveTopicSets(detectedTopics);
      const firstSet = res.created_sets[0];
      const totalCount = res.created_sets.reduce((sum, s) => sum + s.count, 0);

      // Bắn pháo hoa ăn mừng
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Kích hoạt ngay lập tức để App.tsx tự động reload dữ liệu và render ngay lập tức!
      onSuccess(firstSet?.set_id || 1, `${res.created_sets.length} Bộ câu theo chủ đề`, totalCount);

      setSavedResult({
        setId: firstSet?.set_id || 1,
        topicName: `${res.created_sets.length} Bộ câu theo chủ đề`,
        count: totalCount,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi lưu các bộ câu theo chủ đề.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAndClose = () => {
    if (savedResult) {
      onSuccess(savedResult.setId, savedResult.topicName, savedResult.count);
    }
    setSelectedFile(null);
    setPastedText('');
    setTopicName('');
    setSelectedIcon('📚');
    setDifficulty('A2');
    setStep('input');
    setPreviewSentences([]);
    setSelectedSentenceIds(new Set());
    setDetectedTopics([]);
    setSelectedTopicIdx(0);
    setPassageText('');
    setViewMode('sentences');
    setEditingId(null);
    setErrorMessage(null);
    setSavedResult(null);
    onClose();
  };

  const handleUseSampleText = () => {
    setPastedText(
      `# Topic 1: Morning Coffee and Productivity\nI always drink a warm cup of coffee every morning. It helps me feel awake, focused, and ready for work.\nStarting the day with positive thoughts will make all daily tasks much easier.\n\n# Topic 2: Traveling and Exploring New Places\nTraveling with family on holidays creates wonderful lifelong memories.\nWhen you travel abroad, don't be afraid to talk with friendly local people.`
    );
    setTopicName('Chủ đề tiếng Anh giao tiếp');
    setSelectedIcon('☕');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 text-xl">
              {selectedIcon}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                Tạo Bộ Câu Ôn Luyện Mới
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tự động cắt theo Topic, đọc liền mạch cả bài hoặc luyện phát âm từng câu
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Download Banner */}
        {step === 'input' && !savedResult && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Tải file mẫu có sẵn phân chia chủ đề:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const content = `text,translation,difficulty,topic,topic_vi\n"Good morning! Did you sleep well?","Chào buổi sáng! Bạn ngủ ngon không?","A1","daily_life","Đời sống hàng ngày"\n"It is such a beautiful and sunny day today.","Hôm nay quả là một ngày đẹp trời.","A2","daily_life","Đời sống hàng ngày"\n"Dinner is ready, let's eat together!","Cơm tối đã sẵn sàng rồi, cả nhà cùng ăn nhé!","A1","family","Gia đình"`;
                  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'pesa_mau_chu_de.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 font-bold shadow-xs hover:bg-indigo-50/60 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Mẫu CSV / Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const content = `# Topic 1: Đời sống hàng ngày\nGood morning! Did you sleep well last night?\nIt is such a beautiful and sunny day today.\nI want to improve my English speaking skills.\n\n# Topic 2: Gia đình thân yêu\nDinner is ready, let's eat together!\nSpending quality time with family makes me happy.`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'pesa_mau_markdown.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-slate-700 font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Mẫu Text / Markdown</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between animate-fade-in">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700">
              ✕
            </button>
          </div>
        )}

        {/* CONTENT BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {savedResult ? (
            /* SAVED SUCCESS - 2 MODES SELECTION DIALOG */
            <div className="py-6 px-4 text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 text-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-200 animate-bounce">
                🎉
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Đã tạo thành công Bộ câu "{savedResult.topicName}"!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Hệ thống đã đóng gói bài đọc và danh sách câu chuẩn xác. Hãy chọn chế độ bạn muốn bắt đầu học:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
                {/* MODE 1: ĐỌC HẾT 1 LÈO */}
                <button
                  type="button"
                  onClick={() => {
                    onSuccess(savedResult.setId, savedResult.topicName, savedResult.count, 'reader');
                    handleResetAndClose();
                  }}
                  className="group p-5 rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-violet-50/70 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 transition-all text-left cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 px-2 py-0.5 rounded-md bg-indigo-100/80 inline-block mb-1">
                      Mode 1
                    </span>
                    <h4 className="font-black text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                      🎧 Đọc hết 1 lèo
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Tự động phát audio liên tục toàn bài từ đầu đến cuối. Tùy chỉnh tốc độ <strong>0.5x, 1.0x, 1.25x, 1.5x</strong>, tự động highlight câu theo giọng đọc và cuộn màn hình.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-100/80 text-xs font-extrabold text-indigo-600 flex items-center justify-between">
                    <span>Mở bài nghe ngay</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* MODE 2: LUYỆN TỪNG CÂU */}
                <button
                  type="button"
                  onClick={() => {
                    onSuccess(savedResult.setId, savedResult.topicName, savedResult.count, 'practice');
                    handleResetAndClose();
                  }}
                  className="group p-5 rounded-3xl border-2 border-slate-200 bg-white hover:border-slate-800 hover:shadow-xl hover:shadow-slate-200 transition-all text-left cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-3 shadow-md shadow-slate-300 group-hover:scale-110 transition-transform">
                      <Mic className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 inline-block mb-1">
                      Mode 2
                    </span>
                    <h4 className="font-black text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                      🎙️ Luyện từng câu
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Vào phòng thu âm, luyện đọc to từng câu, ghi âm giọng nói của bạn và nhận phản hồi chấm điểm AI Whisper chi tiết từng từ.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-extrabold text-slate-900 flex items-center justify-between">
                    <span>Vào phòng thu âm</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Close Button to view newly rendered list */}
              <div className="pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
                >
                  ✕ Đóng và xem danh sách Bộ câu đã tạo
                </button>
              </div>
            </div>
          ) : step === 'input' ? (
            /* STEP 1: INPUT FILE OR TEXT */
            <>
              {/* Tab switch */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('file');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Tải file (.docx, .pdf, .txt, .md, .xlsx, .csv, .pptx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('text');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>Dán văn bản trực tiếp</span>
                </button>
              </div>

              {/* Tab 1: File Dropzone */}
              {activeTab === 'file' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.pptx,.txt,.md"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800">{selectedFile.name}</div>
                      <div className="text-xs text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Bấm để chọn file khác
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        Kéo thả file tài liệu vào đây, hoặc <span className="text-indigo-600 underline">chọn từ máy tính</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Hệ thống tự động phát hiện các tiêu đề Topic trong file và cắt thành từng bộ câu riêng biệt!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Textarea for pasting */}
              {activeTab === 'text' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Nội dung văn bản tiếng Anh:
                    </label>
                    <button
                      type="button"
                      onClick={handleUseSampleText}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                    >
                      Dán văn bản mẫu có sẵn 2 Topic
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Dán bài văn hoặc bài đọc tiếng Anh vào đây. Dùng '# Topic 1:' hoặc 'Topic 2:' nếu muốn chia thành nhiều bộ..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all bg-slate-50/50 focus:bg-white resize-none"
                  />
                  <div className="text-right text-[11px] text-slate-400">
                    {pastedText.split(/\s+/).filter(Boolean).length} từ
                  </div>
                </div>
              )}

              {/* Configuration Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Bộ Câu / Chủ đề:
                  </label>
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="Ví dụ: IELTS Speaking, Tiếng Anh du lịch..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cấp độ gợi ý:
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all bg-white"
                  >
                    <option value="A1">A1 - Dễ (Mới bắt đầu)</option>
                    <option value="A2">A2 - Cơ bản (Hàng ngày)</option>
                    <option value="B1">B1 - Tự tin (Nâng cao)</option>
                  </select>
                </div>
              </div>

              {/* Icon / Emoji Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Biểu tượng cho Bộ câu:
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedIcon(emoji)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                        selectedIcon === emoji
                          ? 'bg-indigo-100 border-2 border-indigo-600 scale-110 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/80 border border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: PREVIEW & SPLIT/MERGE & TOPICS */
            <div className="space-y-4">
              
              {/* If multiple topics were detected */}
              {detectedTopics.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Tự động nhận diện được {detectedTopics.length} chủ đề trong tài liệu:
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveAllTopics}
                      disabled={isSaving}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Đang lưu...' : `💾 Lưu tất cả ${detectedTopics.length} Bộ câu`}
                    </button>
                  </div>
                  
                  {/* Topic tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {detectedTopics.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTopic(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedTopicIdx === idx
                            ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                            : 'bg-indigo-100/60 text-indigo-800 hover:bg-white'
                        }`}
                      >
                        <span>{t.icon || '📚'}</span>
                        <span>{t.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-200/60 text-indigo-900">
                          {t.total_sentences} câu
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View mode toggle: Sentences vs Full Passage */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Bộ câu: "{topicName}" ({previewSentences.length} câu)
                  </span>
                  <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode('sentences')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        viewMode === 'sentences'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Từng câu ({previewSentences.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('passage')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        viewMode === 'passage'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span>Bài đọc toàn văn</span>
                    </button>
                  </div>
                </div>

                {viewMode === 'sentences' && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg bg-indigo-50 cursor-pointer"
                  >
                    {selectedSentenceIds.size === previewSentences.length
                      ? 'Bỏ chọn tất cả'
                      : 'Chọn tất cả'}
                  </button>
                )}
              </div>

              {/* VIEW 1: SENTENCES LIST WITH SPLIT / MERGE */}
              {viewMode === 'sentences' ? (
                <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                  {previewSentences.map((s, idx) => {
                    const isSelected = selectedSentenceIds.has(s.id);
                    const isEditing = editingId === s.id;
                    const canMerge = idx < previewSentences.length - 1;

                    return (
                      <div
                        key={s.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-white border-indigo-300 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSentence(s.id)}
                            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                          />

                          <div className="flex-1 space-y-1.5">
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={s.text}
                                  onChange={(e) =>
                                    handleUpdateSentenceText(s.id, e.target.value, s.translation)
                                  }
                                  className="w-full p-2 border border-indigo-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 outline-hidden"
                                />
                                <input
                                  type="text"
                                  value={s.translation}
                                  onChange={(e) =>
                                    handleUpdateSentenceText(s.id, s.text, e.target.value)
                                  }
                                  placeholder="Dịch nghĩa tiếng Việt (tùy chọn)..."
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-hidden"
                                />
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm font-bold text-slate-900 leading-snug">{s.text}</p>
                                {s.translation && (
                                  <p className="text-xs text-slate-500 font-medium mt-0.5">{s.translation}</p>
                                )}
                              </div>
                            )}

                            {/* Metadata & Quick Action Tools */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {s.word_count} từ • Câu #{idx + 1}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(isEditing ? null : s.id)}
                                  className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 px-2 py-0.5 rounded-md hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                                  title="Sửa nội dung câu"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{isEditing ? 'Xong' : 'Sửa'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSplitSentence(s.id)}
                                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 cursor-pointer"
                                  title="Cắt câu này làm 2 câu ngắn hơn"
                                >
                                  <Scissors className="w-3 h-3" />
                                  <span>Tách đôi</span>
                                </button>

                                {canMerge && (
                                  <button
                                    type="button"
                                    onClick={() => handleMergeWithNext(s.id)}
                                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                                    title="Gộp câu này với câu tiếp theo"
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    <span>Gộp sau</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeletePreviewSentence(s.id)}
                                  className="text-[11px] text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                                  title="Bỏ câu này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* VIEW 2: FULL PASSAGE TEXT VIEW */
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-800 space-y-3 max-h-[46vh] overflow-y-auto">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Văn bản toàn bài gốc (được lưu vào Bộ câu để phát đọc 1 lèo):
                  </div>
                  <p className="whitespace-pre-line font-medium">{passageText}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {!savedResult && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            {step === 'input' ? (
              <>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExtractPreview}
                  disabled={isExtracting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang bóc tách & phân tích topic...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Bóc tách & Phân loại Topic</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Quay lại chọn tài liệu</span>
                </button>
                
                <div className="flex items-center gap-2">
                  {detectedTopics.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSaveAllTopics}
                      disabled={isSaving}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Lưu tất cả {detectedTopics.length} bộ</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveSingleSet}
                    disabled={isSaving || selectedSentenceIds.size === 0}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-200 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo Bộ câu...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        <span>Tạo Bộ câu ({selectedSentenceIds.size} câu)</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
