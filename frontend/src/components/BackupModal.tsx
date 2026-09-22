import React, { useState } from 'react';
import { Download, Upload, RotateCcw, X, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { storageService } from '../utils/storageService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  // Xuất file sao lưu JSON
  const handleExport = () => {
    try {
      const json = storageService.exportBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `pesa_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ text: 'Đã tải xuống file sao lưu thành công!', type: 'success' });
    } catch (e) {
      setStatusMsg({ text: 'Lỗi khi tạo file sao lưu.', type: 'error' });
    }
  };

  // Nhập file sao lưu JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storageService.importBackupJSON(content);
        if (success) {
          setStatusMsg({ text: 'Khôi phục toàn bộ dữ liệu thành công!', type: 'success' });
          onDataRestored();
        } else {
          setStatusMsg({ text: 'File sao lưu không đúng định dạng PESA.', type: 'error' });
        }
      }
    };
    reader.readAsText(file);
  };

  // Reset về mặc định
  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu về mặc định ban đầu không?')) {
      storageService.resetToDefault();
      setStatusMsg({ text: 'Đã đặt lại dữ liệu mặc định thành công!', type: 'success' });
      onDataRestored();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Sao Lưu & Khôi Phục Dữ Liệu</h3>
            <p className="text-xs text-slate-500">Chuyển dữ liệu học tập giữa điện thoại và máy tính</p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Nút Xuất File */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Tải file sao lưu (JSON)</div>
                <div className="text-[11px] text-slate-500">Lưu lại bộ câu, tiến độ và lịch sử điểm số</div>
              </div>
            </div>
          </button>

          {/* Nút Nhập File */}
          <label className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group text-left">
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Nhập dữ liệu từ file</div>
                <div className="text-[11px] text-slate-500">Chọn file JSON đã xuất trước đó để khôi phục</div>
              </div>
            </div>
          </label>

          {/* Nút Reset */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 group-hover:text-rose-600 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700">Khôi phục về mặc định ban đầu</div>
                <div className="text-[11px] text-slate-500">Nạp lại 6 bộ câu chuẩn và 3 người dùng mẫu</div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
