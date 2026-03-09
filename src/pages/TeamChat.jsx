import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Avatar,
  AvatarGroup
} from '@mui/material';
import { ArrowBack, People } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import socketService from '../api/socketService';
import * as messageService from '../api/messageService';

// Simple JWT decode function - updated
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT:', e);
    return null;
  }
};

const TeamChat = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const authState = useSelector((state) => state.auth);
  const accessToken = useSelector((state) => state.auth.accessToken);

  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [chatGroupId, setChatGroupId] = useState(teamId); // Use teamId as chatGroupId

  // Get current user ID from JWT token if user object is not available
  const tokenData = accessToken ? parseJwt(accessToken) : null;
  const currentUserId = currentUser?.id || currentUser?._id || tokenData?.sub;

  // Debug logging - FORCE RECOMPILE
  console.log('[TeamChat] Current User:', currentUser);
  console.log('[TeamChat] Full auth state:', authState);
  console.log('[TeamChat] Token data:', tokenData);
  console.log('[TeamChat] Current User ID:', currentUserId);
  console.log('[TeamChat] Team ID:', teamId);
  console.log('[TeamChat] Chat Group ID:', chatGroupId);
  console.log('[TeamChat] Connected:', connected);
  console.log('[TeamChat] WEBPACK HOT RELOAD TEST 3');

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messageService.getTeamMessages(teamId);
      setMessages(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Load team members
  const loadMembers = useCallback(async () => {
    try {
      const response = await messageService.getTeamChatMembers(teamId);
      setMembers(response.data || []);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  }, [teamId]);

  // Initialize socket connection and load data
  useEffect(() => {
    // Load messages and members
    loadMessages();
    loadMembers();

    // Connect to socket
    const socket = socketService.connect();

    // Check actual connection status after a delay
    setTimeout(() => {
      const isConnected = socket?.connected || false;
      console.log('[TeamChat] Socket connection status after connect:', isConnected);
      setConnected(isConnected);
      if (!isConnected) {
        setError('Failed to connect to chat server. Messages may not work.');
      }
    }, 2000);

    // Setup socket event listeners
    socketService.onNewMessage((message) => {
      console.log('[TeamChat] New message received:', message);
      setMessages((prev) => [...prev, message]);
    });

    socketService.onMessageSent((message) => {
      console.log('[TeamChat] Message sent confirmation:', message);
      // Add the sent message to the list if not already there
      setMessages((prev) => {
        const exists = prev.find(m => m._id === message._id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
    });

    socketService.onUserTyping(({ userId, user }) => {
      if (userId !== currentUserId) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === userId)) {
            return [...prev, { userId, name: user.name }];
          }
          return prev;
        });

        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }, 3000);
      }
    });

    socketService.onUserStoppedTyping(({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    socketService.onError((error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Connection error');
    });

    socketService.onGroupsJoined(({ groupIds }) => {
      console.log('Joined groups:', groupIds);
      // Only update if a different group ID is provided
      if (groupIds.length > 0 && groupIds[0] !== teamId) {
        console.log('Updating chatGroupId from socket:', groupIds[0]);
        setChatGroupId(groupIds[0]);
      }
    });

    // Cleanup on unmount - DON'T remove all listeners, just specific ones for this component
    return () => {
      console.log('[TeamChat] Cleaning up - NOT removing socket listeners (they persist globally)');
      // Socket listeners remain active for global state
      // Only remove if component truly unmounts (user leaves team chat entirely)
    };
  }, [teamId, currentUserId]);

  // Join chat group when component mounts
  useEffect(() => {
    if (connected && chatGroupId) {
      console.log('Joining group:', chatGroupId);
      socketService.joinGroups([chatGroupId]);
    }
  }, [connected, chatGroupId]);

  // Send message handler
  const handleSendMessage = useCallback(
    (messageData) => {
      console.log('[TeamChat] Sending message:', { chatGroupId, messageData, connected });

      if (!chatGroupId) {
        console.error('[TeamChat] No chat group ID available');
        setError('Chat not initialized. Please refresh the page.');
        return;
      }

      if (!connected) {
        console.error('[TeamChat] Not connected to socket');
        setError('Not connected to chat. Please check your connection.');
        return;
      }

      console.log('[TeamChat] Calling socketService.sendMessage');
      socketService.sendMessage(chatGroupId, messageData);
    },
    [chatGroupId, connected]
  );

  // Delete message handler
  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  }, []);

  // Typing indicator handlers
  const handleTypingStart = useCallback(() => {
    if (chatGroupId) {
      socketService.startTyping(chatGroupId);
    }
  }, [chatGroupId]);

  const handleTypingStop = useCallback(() => {
    if (chatGroupId) {
      socketService.stopTyping(chatGroupId);
    }
  }, [chatGroupId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FAFAFA' // Light background similar to mobile app
      }}
    >
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ backgroundColor: '#24FF00' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(`/teams/${teamId}`)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">Team Chat</Typography>
            <Typography variant="caption">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Typography>
          </Box>

          <AvatarGroup max={4} sx={{ mr: 2 }}>
            {members.slice(0, 4).map((member) => (
              <Avatar
                key={member._id}
                src={member.profilePicture}
                alt={member.name}
                sx={{ width: 32, height: 32 }}
              >
                {member.name?.charAt(0)}
              </Avatar>
            ))}
          </AvatarGroup>

          <Chip
            icon={<People />}
            label={members.length}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ color: 'white', borderColor: 'white' }}
          />
        </Toolbar>
      </AppBar>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Connection Status */}
      {!connected && (
        <Alert severity="warning" sx={{ m: 2 }}>
          Connecting to chat...
        </Alert>
      )}

      {/* Messages Container */}
      <Paper
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          m: 2,
          overflow: 'hidden',
          backgroundColor: 'white',
          borderRadius: '16px', // Softer corners
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)' // Subtle shadow
        }}
      >
        <MessageList
          messages={messages}
          loading={loading}
          currentUserId={currentUserId}
          onDeleteMessage={handleDeleteMessage}
        />

        <TypingIndicator users={typingUsers} />

        <Box sx={{ p: 2 }}>
          <MessageInput
            onSend={handleSendMessage}
            disabled={!connected || !chatGroupId}
            placeholder={
              !connected
                ? 'Connecting...'
                : !chatGroupId
                ? 'Loading chat...'
                : 'Type a message...'
            }
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default TeamChat;
