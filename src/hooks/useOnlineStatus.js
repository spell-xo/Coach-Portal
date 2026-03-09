import { useState, useEffect } from 'react';

/**
 * useOnlineStatus hook
 *
 * Detects online/offline status
 *
 * Features:
 * - Real-time connection status
 * - Automatic updates on network change
 * - Works with service workers
 *
 * Usage:
 * const isOnline = useOnlineStatus();
 *
 * {!isOnline && <Alert>You are offline</Alert>}
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[Network] Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default useOnlineStatus;
