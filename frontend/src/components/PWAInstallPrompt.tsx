import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Sparkles } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem app đã được chạy ở chế độ standalone (đã cài đặt) chưa
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // 2. Nhận diện thiết bị iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Bắt sự kiện beforeinstallprompt trên Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Hiển thị sau 3 giây để người dùng làm quen giao diện
      setTimeout(() => setShowPrompt(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Nếu là iOS và chưa từng đóng prompt hôm nay, hiển thị gợi ý sau 4 giây
    const dismissed = localStorage.getItem('pesa_pwa_dismissed');
    if (isIosDevice && !isRunningStandalone && !dismissed) {
      setTimeout(() => setShowPrompt(true), 3500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pesa_pwa_dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-xl animate-fade-in">
      <button
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        title="Đóng"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
            <span>Cài đặt PESA lên Điện thoại</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/40 text-indigo-300 border border-indigo-400/30">
              PWA
            </span>
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Học nói tiếng Anh toàn màn hình cực mượt, mở tức thì và dùng được cả khi mất mạng!
          </p>

          {/* Trường hợp Android / Chrome: Nút bấm 1-click */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Cài đặt Ứng dụng ngay (1 chạm)</span>
            </button>
          )}

          {/* Trường hợp iOS Safari: Hướng dẫn 2 bước trực quan */}
          {isIOS && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5 text-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">1.</span>
                <span>Bấm nút Chia sẻ</span>
                <Share className="w-3.5 h-3.5 text-indigo-400 inline" />
                <span>dưới thanh Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">2.</span>
                <span>Chọn</span>
                <span className="font-semibold text-white inline-flex items-center gap-1">
                  <PlusSquare className="w-3.5 h-3.5 text-indigo-400" /> "Thêm vào MH chính"
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
