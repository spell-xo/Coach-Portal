import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  AvatarGroup,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import teamService from '../api/teamService';
import * as messageService from '../api/messageService';
import socketService from '../api/socketService';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import AppLayout from '../components/AppLayout';

// Simple JWT decode function
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

const Messages = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);

  // Get current user ID from JWT token
  const tokenData = accessToken ? parseJwt(accessToken) : null;
  const currentUserId = currentUser?.id || currentUser?._id || tokenData?.sub;

  // Team list state
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMessages, setTeamMessages] = useState({});

  // Selected team chat state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadTeams();
  }, []);

  // Socket connection for selected team
  useEffect(() => {
    if (!selectedTeam?.chatGroupId) return;

    // Connect to socket
    socketService.connect();
    setConnected(true);

    // Join the team's chat group
    socketService.joinGroups([selectedTeam.chatGroupId]);

    // Setup socket listeners
    socketService.onNewMessage((message) => {
      setMessages((prev) => {
        // Remove any temporary message from the same sender with similar timestamp
        const withoutTemp = prev.filter(m => {
          if (!m._id.toString().startsWith('temp-')) return true;
          // Remove temp message if it matches content and is from same sender
          const timeDiff = Math.abs(new Date(m.sentAt) - new Date(message.sentAt));
          return !(m.sender._id === message.sender._id && timeDiff < 5000);
        });

        // Check if message already exists (avoid duplicates)
        const exists = withoutTemp.some(m => m._id === message._id);
        if (exists) return prev;

        return [...withoutTemp, message];
      });

      // Update last message in team list
      setTeamMessages((prev) => ({
        ...prev,
        [selectedTeam._id]: message,
      }));
    });

    socketService.onUserTyping(({ userId, user }) => {
      if (userId !== currentUserId) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === userId)) {
            return [...prev, { userId, name: user.name }];
          }
          return prev;
        });

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

    return () => {
      socketService.removeAllListeners();
    };
  }, [selectedTeam?.chatGroupId, currentUserId]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await teamService.getMyTeams();
      if (response.success) {
        const teamsData = response.data || [];
        setTeams(teamsData);
        await loadLastMessages(teamsData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadLastMessages = async (teamsData) => {
    const messagesMap = {};

    await Promise.all(
      teamsData.map(async (team) => {
        try {
          const response = await messageService.getTeamMessages(team._id);
          const messages = response.data || [];

          if (messages.length > 0) {
            messagesMap[team._id] = messages[messages.length - 1];
          }
        } catch (err) {
          console.error(`Failed to load messages for team ${team._id}:`, err);
        }
      })
    );

    setTeamMessages(messagesMap);
  };

  const loadChatMessages = async (teamId) => {
    try {
      setChatLoading(true);
      const response = await messageService.getTeamMessages(teamId);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load chat messages');
    } finally {
      setChatLoading(false);
    }
  };

  const loadMembers = async (teamId) => {
    try {
      const response = await messageService.getTeamChatMembers(teamId);
      setMembers(response.data || []);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const handleTeamClick = async (team) => {
    setSelectedTeam(team);
    setMessages([]);
    setMembers([]);
    await loadChatMessages(team._id);
    await loadMembers(team._id);
  };

  const handleSendMessage = useCallback(
    (messageData) => {
      if (!selectedTeam?.chatGroupId) {
        console.error('No chat group ID available');
        return;
      }

      // Optimistically add message to UI immediately
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content: messageData.content,
        sender: {
          _id: currentUserId,
          name: currentUser?.name || 'You',
          profilePicture: currentUser?.profilePicture
        },
        sentAt: new Date().toISOString(),
        status: 'sending'
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Send via socket
      socketService.sendMessage(selectedTeam.chatGroupId, messageData);
    },
    [selectedTeam?.chatGroupId, currentUserId, currentUser]
  );

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  }, []);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>
        {/* Team List Sidebar */}
        <Paper
          sx={{
            width: 360,
            flexShrink: 0,
            borderRadius: 0,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          elevation={0}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Messages
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {teams.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No teams yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a team to start chatting
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, overflow: 'auto', flexGrow: 1 }}>
              {teams.map((team, index) => {
                const lastMessage = teamMessages[team._id];
                const memberCount = (team.stats?.playerCount || 0) + (team.stats?.coachCount || 0);
                const isSelected = selectedTeam?._id === team._id;

                return (
                  <React.Fragment key={team._id}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleTeamClick(team)}
                        sx={{
                          py: 2,
                          backgroundColor: isSelected ? 'action.selected' : 'transparent',
                          '&:hover': {
                            backgroundColor: isSelected ? 'action.selected' : 'action.hover',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                            <GroupIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {team.name}
                              </Typography>
                              <Chip
                                label={team.ageGroup}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            lastMessage ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: '0.875rem' }}
                              >
                                {truncateMessage(lastMessage.content?.text || '')}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                No messages yet
                              </Typography>
                            )
                          }
                        />
                        <Box sx={{ textAlign: 'right', ml: 1 }}>
                          {lastMessage && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {formatLastMessageTime(lastMessage.createdAt)}
                            </Typography>
                          )}
                          <Chip
                            icon={<GroupIcon />}
                            label={memberCount}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20 }}
                          />
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FAFAFA' }}>
          {!selectedTeam ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <ChatIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Select a team to start chatting
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a team from the list to view and send messages
              </Typography>
            </Box>
          ) : (
            <>
              {/* Chat Header */}
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 0,
                  borderBottom: 1,
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                }}
                elevation={0}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedTeam.name}
                    </Typography>
                    <Typography variant="caption">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AvatarGroup max={5}>
                      {members.slice(0, 5).map((member) => (
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
                  </Box>
                </Box>
              </Paper>

              {/* Messages Container */}
              <Paper
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  borderRadius: 0,
                }}
                elevation={0}
              >
                <MessageList
                  messages={messages}
                  loading={chatLoading}
                  currentUserId={currentUserId}
                  onDeleteMessage={handleDeleteMessage}
                />

                <TypingIndicator users={typingUsers} />

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={!connected || !selectedTeam?.chatGroupId}
                    placeholder={
                      !connected
                        ? 'Connecting...'
                        : !selectedTeam?.chatGroupId
                        ? 'Chat not available'
                        : 'Type a message...'
                    }
                  />
                </Box>
              </Paper>
            </>
          )}
        </Box>
      </Box>
    </AppLayout>
  );
};

export default Messages;
