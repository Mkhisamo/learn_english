import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, Download, Smartphone, Share } from './icons';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function MobileInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if app was already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (!standalone && !dismissed) {
      // Show prompt after a delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:max-w-md sm:left-auto sm:right-4">
      <Card className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <h3 className="font-bold text-sm">Установите приложение!</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-sm text-white/90 mb-4">
          Установите Word Trainer на ваш телефон для быстрого доступа и работы без интернета!
        </p>

        <div className="space-y-2">
          {deferredPrompt && !isIOS && (
            <Button
              onClick={handleInstall}
              className="w-full bg-white text-purple-600 hover:bg-gray-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Установить приложение
            </Button>
          )}
          
          {isIOS && (
            <div className="text-xs text-white/80 space-y-1">
              <p className="flex items-center gap-1">
                <Share className="w-3 h-3" />
                Нажмите кнопку "Поделиться" в Safari
              </p>
              <p>Затем выберите "На экран «Домой»"</p>
            </div>
          )}
          
          {!deferredPrompt && !isIOS && (
            <p className="text-xs text-white/80">
              Откройте это приложение в Chrome для установки
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}