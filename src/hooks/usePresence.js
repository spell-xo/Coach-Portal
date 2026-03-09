import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';
import socketService from '../api/socketService';

/**
 * usePresence hook
 *
 * Manages user presence state with real-time Socket.io updates
 *
 * Features:
 * - Track online/offline status of users
 * - Automatic presence updates via Socket.io
 * - Last seen timestamps
 * - Idle detection (away status)
 * - Bulk presence fetching
 *
 * @param {string|string[]} userIds - User ID(s) to track
 * @returns {Object} Presence data and controls
 */
export const usePresence = (userIds) => {
  const currentUser = useSelector(selectCurrentUser);
  const [presenceMap, setPresenceMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // Normalize userIds to array
  const userIdArray = Array.isArray(userIds) ? userIds : [userIds].filter(Boolean);

  /**
   * Update presence for a single user
   */
  const updatePresence = useCallback((userId, status, lastSeen = null) => {
    setPresenceMap((prev) => ({
      ...prev,
      [userId]: {
        status,
        lastSeen: lastSeen || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  /**
   * Update presence for multiple users
   */
  const updateBulkPresence = useCallback((presenceData) => {
    setPresenceMap((prev) => ({
      ...prev,
      ...presenceData,
    }));
  }, []);

  /**
   * Get presence for a specific user
   */
  const getPresence = useCallback(
    (userId) => {
      return (
        presenceMap[userId] || {
          status: 'offline',
          lastSeen: null,
          updatedAt: null,
        }
      );
    },
    [presenceMap]
  );

  /**
   * Set up Socket.io listeners
   */
  useEffect(() => {
    if (!currentUser || userIdArray.length === 0) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    // Connection status
    const handleConnect = () => {
      setIsConnected(true);

      // Request initial presence data for tracked users
      socket.emit('presence:subscribe', { userIds: userIdArray });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Presence updates
    const handlePresenceUpdate = (data) => {
      const { userId, status, lastSeen } = data;
      updatePresence(userId, status, lastSeen);
    };

    // Bulk presence data
    const handlePresenceData = (data) => {
      updateBulkPresence(data);
    };

    // User went online
    const handleUserOnline = (data) => {
      updatePresence(data.userId, 'online');
    };

    // User went offline
    const handleUserOffline = (data) => {
      updatePresence(data.userId, 'offline', data.lastSeen);
    };

    // User went away
    const handleUserAway = (data) => {
      updatePresence(data.userId, 'away');
    };

    // Set up listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('presence:data', handlePresenceData);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('user:away', handleUserAway);

    // If already connected, subscribe immediately
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('presence:data', handlePresenceData);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('user:away', handleUserAway);

      // Unsubscribe from presence updates
      socket.emit('presence:unsubscribe', { userIds: userIdArray });
    };
  }, [currentUser, userIdArray.join(','), updatePresence, updateBulkPresence]);

  /**
   * Idle detection for current user
   * Automatically sets status to 'away' after 5 minutes of inactivity
   */
  useEffect(() => {
    if (!currentUser) return;

    let idleTimer;
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);

      // Send 'online' status
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('presence:status', { status: 'online' });
      }

      // Set new idle timer
      idleTimer = setTimeout(() => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
          socket.emit('presence:status', { status: 'away' });
        }
      }, IDLE_TIMEOUT);
    };

    // Activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Initialize
    resetIdleTimer();

    // Cleanup
    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, [currentUser]);

  /**
   * Send online status when component mounts/unmounts
   */
  useEffect(() => {
    if (!currentUser) return;

    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('presence:status', { status: 'online' });
    }

    // Send offline status on unmount
    return () => {
      if (socket?.connected) {
        socket.emit('presence:status', { status: 'offline' });
      }
    };
  }, [currentUser]);

  return {
    presenceMap,
    getPresence,
    updatePresence,
    isConnected,
  };
};

export default usePresence;
