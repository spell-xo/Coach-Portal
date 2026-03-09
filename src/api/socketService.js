import { io } from 'socket.io-client';
import { store } from '../store';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map(); // Map<event, Set<callback>>
  }

  /**
   * Connect to Socket.io server
   */
  connect() {
    console.log('=== SocketService.connect() called ===');

    if (this.socket?.connected) {
      console.log('Socket already connected, returning');
      return;
    }

    const state = store.getState();
    const accessToken = state.auth.accessToken;

    console.log('Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NO TOKEN');

    if (!accessToken) {
      console.error('Cannot connect to socket: No access token');
      return;
    }

    // IMPORTANT: Connect to the app-restapi socket server (port 8080), NOT coach-portal-api
    // This is because the mobile app connects to port 8080, and we need all clients
    // to connect to the SAME Socket.IO server for real-time messaging to work
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080';

    console.log('REACT_APP_SOCKET_URL:', process.env.REACT_APP_SOCKET_URL);
    console.log('Connecting to Socket.io at:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: {
        token: accessToken
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    console.log('Socket.io client created');

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Register all stored listeners (now supports multiple callbacks per event)
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket.on(event, callback);
      });
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join team chat groups
   * @param {Array<string>} groupIds - Array of group IDs to join
   */
  joinGroups(groupIds) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('join_groups', groupIds);
  }

  /**
   * Send a message to a group
   * @param {string} groupId - Group ID
   * @param {Object} messageData - Message content and metadata
   */
  sendMessage(groupId, messageData) {
    console.log('[SocketService] sendMessage called with:', { groupId, messageData });
    console.log('[SocketService] Socket exists:', !!this.socket);
    console.log('[SocketService] Socket connected:', this.socket?.connected);

    if (!this.socket) {
      console.error('[SocketService] Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('[SocketService] Socket not connected - current state:', this.socket.connected);
      return;
    }

    const payload = {
      groupId,
      ...messageData
    };

    console.log('[SocketService] Emitting send_message event with payload:', payload);
    this.socket.emit('send_message', payload);
    console.log('[SocketService] Message emitted successfully');
  }

  /**
   * Send typing indicator
   * @param {string} groupId - Group ID
   */
  startTyping(groupId) {
    if (!this.socket) return;
    this.socket.emit('typing_start', { groupId });
  }

  /**
   * Stop typing indicator
   * @param {string} groupId - Group ID
   */
  stopTyping(groupId) {
    if (!this.socket) return;
    this.socket.emit('typing_stop', { groupId });
  }

  /**
   * Add reaction to a message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji reaction
   */
  addReaction(messageId, emoji) {
    if (!this.socket) return;
    this.socket.emit('add_reaction', { messageId, emoji });
  }

  /**
   * Remove reaction from a message
   * @param {string} messageId - Message ID
   */
  removeReaction(messageId) {
    if (!this.socket) return;
    this.socket.emit('remove_reaction', { messageId });
  }

  /**
   * Mark messages as read
   * @param {string} groupId - Group ID
   * @param {string} lastMessageId - Last read message ID
   */
  markAsRead(groupId, lastMessageId) {
    if (!this.socket) return;
    this.socket.emit('mark_read', { groupId, lastMessageId });
  }

  /**
   * Listen for new messages
   * @param {Function} callback - Callback function
   */
  onNewMessage(callback) {
    this.on('new_message', callback);
  }

  /**
   * Listen for message sent confirmation
   * @param {Function} callback - Callback function
   */
  onMessageSent(callback) {
    this.on('message_sent', callback);
  }

  /**
   * Listen for user typing
   * @param {Function} callback - Callback function
   */
  onUserTyping(callback) {
    this.on('user_typing', callback);
  }

  /**
   * Listen for user stopped typing
   * @param {Function} callback - Callback function
   */
  onUserStoppedTyping(callback) {
    this.on('user_stopped_typing', callback);
  }

  /**
   * Listen for reaction added
   * @param {Function} callback - Callback function
   */
  onReactionAdded(callback) {
    this.on('reaction_added', callback);
  }

  /**
   * Listen for reaction removed
   * @param {Function} callback - Callback function
   */
  onReactionRemoved(callback) {
    this.on('reaction_removed', callback);
  }

  /**
   * Listen for messages read
   * @param {Function} callback - Callback function
   */
  onMessagesRead(callback) {
    this.on('messages_read', callback);
  }

  /**
   * Listen for groups joined confirmation
   * @param {Function} callback - Callback function
   */
  onGroupsJoined(callback) {
    this.on('groups_joined', callback);
  }

  /**
   * Listen for errors
   * @param {Function} callback - Callback function
   */
  onError(callback) {
    this.on('error', callback);
  }

  /**
   * Generic event listener - supports multiple callbacks per event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    // Create Set if it doesn't exist
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    // Add callback to Set (automatically prevents duplicates)
    this.listeners.get(event).add(callback);

    // Register on socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove specific event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      // If no more callbacks for this event, remove the entry
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
    if (this.socket && callback) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Remove all event listeners
   * NOTE: Use with caution - this removes ALL listeners including connection handlers!
   */
  removeAllListeners() {
    console.warn('[SocketService] removeAllListeners() called - this removes ALL socket listeners!');
    this.listeners.clear();
    if (this.socket) {
      // Don't remove built-in handlers (connect, disconnect, error)
      // Only remove custom event listeners
      const eventsToKeep = ['connect', 'disconnect', 'connect_error', 'error'];
      const allEvents = Object.keys(this.socket._callbacks || {});

      allEvents.forEach(event => {
        const eventName = event.replace(/^\$/, ''); // Socket.IO prefixes with $
        if (!eventsToKeep.includes(eventName)) {
          this.socket.off(eventName);
        }
      });
    }
  }
}

// Export singleton instance
export default new SocketService();
