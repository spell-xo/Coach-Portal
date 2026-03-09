import { useEffect, useState, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

/**
 * Global Socket Hook for Coach Portal
 * ====================================
 * Provides persistent socket connection and message listening across navigation
 */

export function useGlobalSocket() {
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const isInitialized = useRef(false);

    useEffect(() => {
        // Prevent re-initialization
        if (isInitialized.current) {
            console.log('[useGlobalSocket] Already initialized, skipping');
            return;
        }

        console.log('[useGlobalSocket] Initializing global socket connection');
        isInitialized.current = true;

        // Connect on mount
        socketService.connect();
        setConnected(true);

        // Listen for all messages globally
        const messageHandler = (message) => {
            console.log('[useGlobalSocket] Received message:', message);
            setLastMessage(message);

            // Increment unread count for this team/group
            const teamId = message.groupId || message.teamId;
            if (teamId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [teamId]: (prev[teamId] || 0) + 1
                }));
            }
        };

        socketService.onNewMessage(messageHandler);

        // Listen for connection events
        const handleConnect = () => {
            console.log('[useGlobalSocket] Socket connected');
            setConnected(true);
        };

        const handleDisconnect = () => {
            console.log('[useGlobalSocket] Socket disconnected');
            setConnected(false);
        };

        socketService.getSocket()?.on('connect', handleConnect);
        socketService.getSocket()?.on('disconnect', handleDisconnect);

        // Cleanup only on app close (unmount)
        return () => {
            console.log('[useGlobalSocket] Cleaning up global socket');
            socketService.removeAllListeners();
            socketService.disconnect();
            isInitialized.current = false;
        };
    }, []);

    const markTeamRead = useCallback((teamId) => {
        console.log('[useGlobalSocket] Marking team as read:', teamId);
        setUnreadCounts(prev => {
            const updated = { ...prev };
            delete updated[teamId];
            return updated;
        });
    }, []);

    const incrementUnreadCount = useCallback((teamId) => {
        console.log('[useGlobalSocket] Incrementing unread count for team:', teamId);
        setUnreadCounts(prev => ({
            ...prev,
            [teamId]: (prev[teamId] || 0) + 1
        }));
    }, []);

    return {
        connected,
        lastMessage,
        unreadCounts,
        markTeamRead,
        incrementUnreadCount
    };
}
