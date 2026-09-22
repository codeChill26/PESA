import React, { useState, useEffect } from 'react';
import type { User, Sentence, StudySet } from './types';
import { storageService } from './utils/storageService';
import { Navbar } from './components/Navbar';
import { PracticeStudio } from './components/PracticeStudio';
import { SentenceList } from './components/SentenceList';
import { ProgressDashboard } from './components/ProgressDashboard';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { FullArticleReaderModal } from './components/FullArticleReaderModal';
import { BottomNavBar } from './components/BottomNavBar';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { BackupModal } from './components/BackupModal';

export const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [currentStudySet, setCurrentStudySet] = useState<StudySet | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'sentences' | 'progress'>('sentences');
  const [selectedVoice, setSelectedVoice] = useState<string>('us_female');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [readerStudySet, setReaderStudySet] = useState<StudySet | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Nạp toàn bộ dữ liệu từ Client-Side StorageService
  const reloadData = (targetUserId?: number) => {
    const loadedUsers = storageService.getUsers();
    setUsers(loadedUsers);

    // Xác định current user
    let activeUser = currentUser;
    const uId = targetUserId || activeUser?.id;

    if (!activeUser || targetUserId) {
      const savedUserId = localStorage.getItem('pesa_current_user_id');
      const matched = loadedUsers.find((u) => u.id.toString() === savedUserId) || loadedUsers[0];
      activeUser = matched || null;
      setCurrentUser(activeUser);
      if (activeUser) {
        localStorage.setItem('pesa_current_user_id', activeUser.id.toString());
      }
    }

    const loadedSets = storageService.getStudySets(uId);
    setStudySets(loadedSets);

    const loadedSentences = storageService.getSentences(uId);
    setSentences(loadedSentences);

    if (loadedSets.length > 0 && !currentStudySet) {
      setCurrentStudySet(loadedSets[0]);
    }

    if (loadedSentences.length > 0 && !selectedSentence) {
      setSelectedSentence(loadedSentences[0]);
    }
  };

  useEffect(() => {
    setLoading(true);
    reloadData();
    setLoading(false);
  }, []);

  // Thông báo tự tắt sau 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Đổi người dùng
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pesa_current_user_id', user.id.toString());
    reloadData(user.id);
  };

  // Thêm người dùng mới
  const handleAddUser = (name: string, role: string) => {
    const newUser = storageService.createUser(name, role);
    setCurrentUser(newUser);
    localStorage.setItem('pesa_current_user_id', newUser.id.toString());
    reloadData(newUser.id);
    setNotification({
      message: `Đã thêm thành viên "${name}" thành công!`,
      type: 'success',
    });
  };

  // Chọn bộ câu để bắt đầu luyện tập
  const handleSelectSetToPractice = (set: StudySet) => {
    setCurrentStudySet(set);
    const inSet = sentences.filter((s) => s.set_id === set.id);
    if (inSet.length > 0) {
      // Ưu tiên câu chưa đạt điểm giỏi
      const unpracticed = inSet.find((s) => !s.last_score || s.last_score < 85);
      setSelectedSentence(unpracticed || inSet[0]);
    }
    setActiveTab('practice');
  };

  // Chọn trực tiếp 1 câu để luyện
  const handleSelectSentence = (sentence: Sentence) => {
    setSelectedSentence(sentence);
    if (sentence.set_id) {
      const parentSet = studySets.find((s) => s.id === sentence.set_id);
      if (parentSet) setCurrentStudySet(parentSet);
    }
    setActiveTab('practice');
  };

  // Lấy danh sách câu của bộ hiện tại
  const currentSetSentences = currentStudySet
    ? sentences.filter((s) => s.set_id === currentStudySet.id)
    : sentences;

  // Chuyển câu tiếp theo
  const handleNextSentence = () => {
    if (!selectedSentence) return;
    const pool = currentSetSentences.length > 0 ? currentSetSentences : sentences;
    const currentIndex = pool.findIndex((s) => s.id === selectedSentence.id);
    const nextIndex = (currentIndex + 1) % pool.length;
    setSelectedSentence(pool[nextIndex]);
  };

  // Lùi về câu trước đó
  const handlePrevSentence = () => {
    if (!selectedSentence) return;
    const pool = currentSetSentences.length > 0 ? currentSetSentences : sentences;
    const currentIndex = pool.findIndex((s) => s.id === selectedSentence.id);
    const prevIndex = (currentIndex - 1 + pool.length) % pool.length;
    setSelectedSentence(pool[prevIndex]);
  };

  // Mở trình phát audio đọc full bài (0.5x - 1.5x)
  const handleOpenReader = (set: StudySet) => {
    setCurrentStudySet(set);
    setReaderStudySet(set);
    setIsReaderModalOpen(true);
  };

  // Xử lý sau khi upload tài liệu thành công
  const handleUploadSuccess = (
    setId: number,
    topicName: string,
    count: number,
    startMode?: 'reader' | 'practice'
  ) => {
    reloadData(currentUser?.id);
    setNotification({
      message: `Đã tạo thành công Bộ câu "${topicName}" (${count} câu)!`,
      type: 'success',
    });

    const updatedSets = storageService.getStudySets(currentUser?.id);
    const targetSet = updatedSets.find((s) => s.id === setId) || updatedSets.find((s) => s.title === topicName);

    if (targetSet) {
      setCurrentStudySet(targetSet);
      if (startMode === 'reader') {
        handleOpenReader(targetSet);
      } else if (startMode === 'practice') {
        handleSelectSetToPractice(targetSet);
      } else {
        // Khi không chọn Mode nào (bấm đóng để xem danh sách), luôn chuyển về tab 'sentences' (Bộ câu)
        setActiveTab('sentences');
      }
    } else {
      setActiveTab('sentences');
    }
  };

  // Xóa bộ câu
  const handleDeleteSet = (setId: number) => {
    storageService.deleteStudySet(setId);
    reloadData(currentUser?.id);
    if (currentStudySet?.id === setId) {
      setCurrentStudySet(null);
    }
    setNotification({
      message: 'Đã xóa bộ câu thành công.',
      type: 'info',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Đang khởi động PESA...</h2>
          <p className="text-xs text-slate-400">Ứng dụng luyện nói tiếng Anh cho cả gia đình</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200'
                : 'bg-slate-900 text-white border-slate-800 shadow-slate-300'
            }`}
          >
            <span>{notification.type === 'success' ? '🎉' : 'ℹ️'}</span>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header Navbar */}
      <Navbar
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        onAddUser={handleAddUser}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Content Area - Thêm pb-24 trên mobile để không bị BottomNavBar che */}
      <main className="flex-1 pb-24 md:pb-8">
        {activeTab === 'practice' && selectedSentence && (
          <PracticeStudio
            sentence={selectedSentence}
            currentUser={currentUser}
            selectedVoice={selectedVoice}
            currentStudySet={currentStudySet}
            setSentences={currentSetSentences}
            onSelectSentence={handleSelectSentence}
            onNextSentence={handleNextSentence}
            onPrevSentence={handlePrevSentence}
            onBackToSets={() => setActiveTab('sentences')}
            onOpenReader={handleOpenReader}
            onRefreshSentences={() => reloadData(currentUser?.id)}
          />
        )}

        {activeTab === 'sentences' && (
          <SentenceList
            studySets={studySets}
            onSelectSetToPractice={handleSelectSetToPractice}
            onOpenReader={handleOpenReader}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onDeleteSet={handleDeleteSet}
            selectedSetId={currentStudySet?.id || null}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressDashboard
            currentUser={currentUser}
            onSelectSetToPractice={handleSelectSetToPractice}
          />
        )}
      </main>

      {/* Mobile Native Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        todayCompleted={currentUser?.today_completed || 0}
      />

      {/* PWA Install Banner (iOS Safari & Android Chrome) */}
      <PWAInstallPrompt />

      {/* Backup & Restore Data Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={() => reloadData(currentUser?.id)}
      />

      {/* Document Upload & Text Paste Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Full Article Audio Reader Modal (Đọc hết 1 lèo 0.5x - 1.5x) */}
      {readerStudySet && (
        <FullArticleReaderModal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          studySet={readerStudySet}
          sentences={
            sentences.filter((s) => s.set_id === readerStudySet.id).length > 0
              ? sentences.filter((s) => s.set_id === readerStudySet.id)
              : sentences
          }
          selectedVoice={selectedVoice}
          onChangeVoice={setSelectedVoice}
          onPracticeSentence={(s) => {
            handleSelectSentence(s);
            setActiveTab('practice');
          }}
        />
      )}

      {/* Footer */}
      <footer className="hidden md:block border-t border-slate-200/80 py-6 text-center text-xs text-slate-400">
        <p>PESA — English Speaking Practice for Family • 100% Local-First PWA • 0đ Server Cost</p>
      </footer>
    </div>
  );
};

export default App;
