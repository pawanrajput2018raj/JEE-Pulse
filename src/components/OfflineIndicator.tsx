import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface Props {
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const OfflineIndicator: React.FC<Props> = ({ isSyncing, onManualSync }) => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <aside
        aria-label="Offline Mode Notification"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-bounce"
      >
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Offline Mode — All changes saved locally on device.</span>
      </aside>
    );
  }

  if (showReconnected && isSyncing) {
    return (
      <aside
        aria-label="Cloud Syncing Status"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-700/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-emerald-400/30"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Back Online — Syncing with Cloud...</span>
      </aside>
    );
  }

  return null;
};
