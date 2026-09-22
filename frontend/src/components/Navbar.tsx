import React, { useState } from 'react';
import type { User } from '../types';
import { Sparkles, Volume2, UserPlus, ChevronDown, UploadCloud, Database } from 'lucide-react';

interface NavbarProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  activeTab: 'practice' | 'sentences' | 'progress';
  setActiveTab: (tab: 'practice' | 'sentences' | 'progress') => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  onAddUser: (name: string, role: string) => void;
  onOpenUploadModal?: () => void;
  onOpenBackupModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  users,
  currentUser,
  onSelectUser,
  activeTab,
  setActiveTab,
  selectedVoice,
  setSelectedVoice,
  onAddUser,
  onOpenUploadModal,
  onOpenBackupModal,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Thành viên');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onAddUser(newUserName.trim(), newUserRole);
      setNewUserName('');
      setShowAddModal(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('practice')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">PESA</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Gia đình
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Luyện nói tiếng Anh chuẩn giọng bản xứ</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'practice'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎙️ Phòng luyện nói
          </button>
          <button
            onClick={() => setActiveTab('sentences')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'sentences'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📚 Bộ Câu Ôn Luyện
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'progress'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Tiến độ học tập
          </button>
        </nav>

        {/* Right Tools: Voice Settings & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Upload Document Button */}
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-100 transition-all cursor-pointer shadow-xs hover:-translate-y-0.5"
              title="Tải file tài liệu hoặc dán văn bản để bóc tách câu học"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải tài liệu</span>
            </button>
          )}

          {/* Quick Backup Data Button */}
          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-xs hover:-translate-y-0.5"
              title="Sao lưu & Khôi phục dữ liệu học tập"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Sao lưu</span>
            </button>
          )}

          {/* Voice Accent Picker */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent outline-hidden cursor-pointer font-semibold text-slate-800"
            >
              <option value="us_female">Nữ Mỹ (Jenny)</option>
              <option value="us_male">Nam Mỹ (Guy)</option>
              <option value="uk_female">Nữ Anh (Sonia)</option>
              <option value="uk_male">Nam Anh (Ryan)</option>
            </select>
          </div>

          {/* User Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all text-slate-800"
            >
              <span className="text-xl">{currentUser?.avatar || '👤'}</span>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold leading-tight text-slate-900">{currentUser?.name || 'Chọn người học'}</span>
                  {currentUser && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700" title={`Hôm nay đã luyện ${currentUser.today_completed} câu`}>
                      {currentUser.today_completed} câu
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">{currentUser?.role || ''}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Chọn thành viên gia đình
                </div>
                
                <div className="max-h-56 overflow-y-auto py-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between hover:bg-indigo-50/60 transition-colors text-left ${
                        currentUser?.id === u.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{u.avatar}</span>
                        <div>
                          <div className="text-sm font-semibold">{u.name}</div>
                          <div className="text-xs text-slate-400 font-normal">{u.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600">{u.today_completed} câu</div>
                        <div className="text-[10px] text-slate-400">hôm nay</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowAddModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Thêm thành viên mới
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Navigation Tabs */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50 py-2 px-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('practice')}
          className={`py-1.5 px-3 rounded-lg ${activeTab === 'practice' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
        >
          🎙️ Luyện nói
        </button>
        <button
          onClick={() => setActiveTab('sentences')}
          className={`py-1.5 px-3 rounded-lg ${activeTab === 'sentences' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
        >
          📚 Bộ câu
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`py-1.5 px-3 rounded-lg ${activeTab === 'progress' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
        >
          📊 Tiến độ
        </button>
      </div>

      {/* Modal Thêm người dùng */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Thêm thành viên mới</h3>
            <p className="text-xs text-slate-500 mb-4">Mỗi thành viên sẽ có lịch sử và tiến độ luyện tập riêng.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thành viên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Em Lan, Anh Tuấn..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Học sinh, Đi làm..."
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-colors"
                >
                  Tạo hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
