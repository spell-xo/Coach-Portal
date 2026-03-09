import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import teamService from '../api/teamService';
import clubService from '../api/clubService';
import * as messageService from '../api/messageService';
import socketService from '../api/socketService';
import InvitePlayerDialog from '../components/InvitePlayerDialog';
import AddExistingPlayersDialog from '../components/team/AddExistingPlayersDialog';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import AppLayout from '../components/AppLayout';
import { useSelector } from 'react-redux';
import { getComparator, stableSort, createSortHandler } from '../utils/tableSorting';

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

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);

  // Get current user ID from JWT token if user object is not available
  const tokenData = accessToken ? parseJwt(accessToken) : null;
  const currentUserId = currentUser?.id || currentUser?._id || tokenData?.sub;

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openAddPlayersDialog, setOpenAddPlayersDialog] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [removeLoading, setRemoveLoading] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editData, setEditData] = useState({});
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('player.name');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    loadTeamDetails();
  }, [id]);

  useEffect(() => {
    if (tabValue === 1) {
      loadInvitations();
    } else if (tabValue === 2) {
      loadChatMessages();
      connectToChat();
    }
  }, [tabValue, id]);

  useEffect(() => {
    return () => {
      // Cleanup socket listeners when component unmounts
      if (tabValue === 2) {
        socketService.removeAllListeners();
      }
    };
  }, [tabValue]);

  const loadTeamDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamService.getTeamById(id);
      if (response.success) {
        setTeam(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await teamService.getTeamInvitations(id);
      if (response.success) {
        setInvitations(response.data);
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  const handleInvitePlayer = async (email) => {
    try {
      await teamService.createInvitation(id, email);
      setOpenInviteDialog(false);
      loadInvitations();
      setTabValue(1); // Switch to invitations tab
    } catch (err) {
      // Extract error message from various possible response formats
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to send invitation';
      throw new Error(errorMessage);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to remove this player from the team?')) {
      return;
    }

    try {
      setRemoveLoading(playerId);
      await teamService.removePlayerFromRoster(id, playerId);
      loadTeamDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove player');
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleEditPlayer = (rosterEntry) => {
    setEditingPlayer(rosterEntry._id);
    setEditData({
      jerseyNumber: rosterEntry.jerseyNumber || '',
      position: rosterEntry.position || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditData({});
  };

  const handleSaveEdit = async (playerId) => {
    if (!team?.clubId) {
      setError('Club ID not available');
      return;
    }

    try {
      await clubService.updatePlayerTeamAssignment(team.clubId, playerId, id, {
        jerseyNumber: editData.jerseyNumber || null,
        position: editData.position || null
      });

      setEditingPlayer(null);
      setEditData({});
      loadTeamDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update player details');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await teamService.cancelInvitation(id, invitationId);
      loadInvitations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  // Chat functions
  const loadChatMessages = async () => {
    try {
      setChatLoading(true);
      const response = await messageService.getTeamMessages(id);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load chat messages');
    } finally {
      setChatLoading(false);
    }
  };

  const connectToChat = () => {
    if (!team?.chatGroupId) {
      console.error('No chat group ID available');
      return;
    }

    socketService.connect();
    setChatConnected(true);

    // Join the team's chat group
    socketService.joinGroups([team.chatGroupId]);

    // Setup socket listeners
    socketService.onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
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
  };

  const handleSendMessage = (messageData) => {
    if (!team?.chatGroupId) {
      console.error('No chat group ID');
      return;
    }
    socketService.sendMessage(team.chatGroupId, messageData);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'injured':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInvitationStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      case 'expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleRequestSort = createSortHandler(orderBy, order, setOrderBy, setOrder);

  // Sort roster
  const sortedRoster = React.useMemo(() => {
    if (!team?.roster) return [];
    const numericFields = ['jerseyNumber'];
    const isNumeric = numericFields.includes(orderBy);
    return stableSort(team.roster, getComparator(order, orderBy, isNumeric));
  }, [team?.roster, order, orderBy]);

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!team) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Alert severity="error">Team not found</Alert>
      </Container>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teams')}
          sx={{ mb: 2 }}
        >
          Back to Teams
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {team.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={team.ageGroup} color="primary" />
                <Chip
                  label={team.settings?.privacy === 'public' ? 'Public' : 'Private'}
                  variant="outlined"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Created {new Date(team.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Box>
              <IconButton title="Edit team">
                <EditIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
            <Box>
              <Typography variant="h6">{team.stats?.playerCount || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Players
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6">{team.stats?.activePlayers || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active Players
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6">{team.stats?.coachCount || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Coaches
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Roster" />
            <Tab label="Invitations" />
            <Tab icon={<ChatIcon />} label="Team Chat" iconPosition="start" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Team Roster</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setOpenAddPlayersDialog(true)}
                >
                  Add Existing Players
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setOpenInviteDialog(true)}
                >
                  Invite Player
                </Button>
              </Box>
            </Box>
            {team.roster && team.roster.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'player.name'}
                          direction={orderBy === 'player.name' ? order : 'asc'}
                          onClick={() => handleRequestSort('player.name')}
                        >
                          Player
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'jerseyNumber'}
                          direction={orderBy === 'jerseyNumber' ? order : 'asc'}
                          onClick={() => handleRequestSort('jerseyNumber')}
                        >
                          Jersey #
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'position'}
                          direction={orderBy === 'position' ? order : 'asc'}
                          onClick={() => handleRequestSort('position')}
                        >
                          Position
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={() => handleRequestSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRoster.map((rosterEntry) => {
                      const isEditing = editingPlayer === rosterEntry._id;
                      const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

                      return (
                        <TableRow
                          key={rosterEntry._id}
                          hover={!isEditing}
                          onClick={!isEditing ? () => navigate(`/players/${rosterEntry.playerId._id}`, {
                            state: { from: `/teams/${id}` }
                          }) : undefined}
                          sx={{
                            cursor: isEditing ? 'default' : 'pointer',
                            bgcolor: isEditing ? 'action.selected' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={rosterEntry.playerId?.profilePicture}>
                                {rosterEntry.playerId?.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  {rosterEntry.playerId?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {rosterEntry.playerId?.userId}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                type="number"
                                size="small"
                                value={editData.jerseyNumber}
                                onChange={(e) => setEditData({ ...editData, jerseyNumber: e.target.value })}
                                inputProps={{ min: 1, max: 99 }}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ width: 80 }}
                              />
                            ) : (
                              rosterEntry.jerseyNumber || '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <FormControl size="small" sx={{ minWidth: 120 }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={editData.position}
                                  onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                                >
                                  <MenuItem value="">
                                    <em>None</em>
                                  </MenuItem>
                                  {positions.map((pos) => (
                                    <MenuItem key={pos} value={pos}>
                                      {pos}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              rosterEntry.position || '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rosterEntry.status}
                              size="small"
                              color={getStatusColor(rosterEntry.status)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {isEditing ? (
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(rosterEntry.playerId._id);
                                  }}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPlayer(rosterEntry);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePlayer(rosterEntry.playerId._id);
                                  }}
                                  disabled={removeLoading === rosterEntry.playerId._id}
                                >
                                  {removeLoading === rosterEntry.playerId._id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No players on the roster yet
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setOpenInviteDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Invite Your First Player
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pending Invitations
              </Typography>
            </Box>
            {invitations.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Invited By</TableCell>
                      <TableCell>Sent</TableCell>
                      <TableCell>Expires</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            {invitation.email}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invitation.status}
                            size="small"
                            color={getInvitationStatusColor(invitation.status)}
                          />
                        </TableCell>
                        <TableCell>{invitation.invitedBy?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          {invitation.status === 'pending' && (
                            <Button
                              size="small"
                              onClick={() => handleCancelInvitation(invitation._id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No pending invitations
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper'
              }}
            >
              <Typography variant="h6">Team Chat</Typography>
              <Typography variant="caption" color="text.secondary">
                {team.stats?.playerCount + team.stats?.coachCount || 0} members
              </Typography>
            </Box>

            {!team.chatGroupId ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexGrow: 1
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Chat is not available for this team
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <MessageList
                    messages={messages}
                    loading={chatLoading}
                    currentUserId={currentUserId}
                    onDeleteMessage={handleDeleteMessage}
                  />
                </Box>

                <TypingIndicator users={typingUsers} />

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={!chatConnected}
                    placeholder={
                      !chatConnected ? 'Connecting...' : 'Type a message...'
                    }
                  />
                </Box>
              </>
            )}
          </Paper>
        )}

        <InvitePlayerDialog
          open={openInviteDialog}
          onClose={() => setOpenInviteDialog(false)}
          onSubmit={handleInvitePlayer}
        />

        <AddExistingPlayersDialog
          open={openAddPlayersDialog}
          onClose={() => setOpenAddPlayersDialog(false)}
          clubId={team?.clubId}
          teamId={id}
          currentRoster={team?.roster || []}
          onUpdate={loadTeamDetails}
        />
      </Container>
    </AppLayout>
  );
};

export default TeamDetails;
