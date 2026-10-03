import { DailyRecord, SubjectType } from '../types';

export type WidgetSyncMessage =
  | { type: 'RECORD_UPDATED'; record: DailyRecord }
  | { type: 'TIMER_ACTION'; action: 'play' | 'pause' | 'next' | 'reset'; subject?: SubjectType }
  | { type: 'RELOAD_REQUEST' }
  | { type: 'PARENT_CLOSED' };

let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('jee-journey-widget-sync');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

export function broadcastWidgetUpdate(message: WidgetSyncMessage) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage(message);
    }
  } catch (err) {
    console.warn('Failed to broadcast widget message', err);
  }
}

export function subscribeWidgetUpdates(callback: (message: WidgetSyncMessage) => void) {
  if (!broadcastChannel) {
    // Fallback using storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pcm_question_tracker_state_v1' && e.newValue) {
        callback({ type: 'RELOAD_REQUEST' });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const handleMessage = (event: MessageEvent<WidgetSyncMessage>) => {
    callback(event.data);
  };

  broadcastChannel.addEventListener('message', handleMessage);
  return () => {
    broadcastChannel?.removeEventListener('message', handleMessage);
  };
}
