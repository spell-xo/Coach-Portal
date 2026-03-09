import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Card, CardContent, Typography, Button, CircularProgress, Alert, Grid, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, FormControl, InputLabel, Select, Chip, Divider, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, Tabs, Tab } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/Groups";
import SportsIcon from "@mui/icons-material/Sports";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AppLayout from "../../components/AppLayout";
import RequireRole from "../../components/RequireRole";
import AddExistingPlayersDialog from "../../components/team/AddExistingPlayersDialog";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import TypingIndicator from "../../components/chat/TypingIndicator";
import TeamAIReport from "../../components/TeamAIReport";
import teamService from "../../api/teamService";
import clubService from "../../api/clubService";
import * as messageService from "../../api/messageService";
import socketService from "../../api/socketService";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const teamColours = [
  { value: "red", label: "Red", hex: "#EF4444" },
  { value: "blue", label: "Blue", hex: "#3B82F6" },
  { value: "green", label: "Green", hex: "#22C55E" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "orange", label: "Orange", hex: "#F97316" },
  { value: "purple", label: "Purple", hex: "#A855F7" },
  { value: "pink", label: "Pink", hex: "#EC4899" },
  { value: "cyan", label: "Cyan", hex: "#06B6D4" },
  { value: "grey", label: "Grey", hex: "#6B7280" },
  { value: "black", label: "Black", hex: "#1F2937" },
];

const getColourHex = (colourValue) => {
  const colour = teamColours.find(c => c.value === colourValue);
  return colour ? colour.hex : null;
};

// Simple JWT decode function
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
};

const ClubTeamDetail = () => {
  const { clubId, teamId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);

  // Get current user ID from JWT token if user object is not available
  const tokenData = accessToken ? parseJwt(accessToken) : null;
  const currentUserId = currentUser?.id || currentUser?._id || tokenData?.sub;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [openAddCoach, setOpenAddCoach] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openAddPlayers, setOpenAddPlayers] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editData, setEditData] = useState({});
  const [removeLoading, setRemoveLoading] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamNameValue, setTeamNameValue] = useState("");
  const [editingColour, setEditingColour] = useState(false);

  // Chat state
  // const [messages, setMessages] = useState([]);
  // const [chatLoading, setChatLoading] = useState(false);
  // const [chatConnected, setChatConnected] = useState(false);
  // const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    loadTeamData();
    loadAvailableCoaches();
  }, [teamId, clubId]);

  // team's chat is hidden temporarily
  // useEffect(() => {
  //   if (tabValue === 2) {
  //     initializeChat();
  //   }
  // }, [tabValue, teamId]);
  // useEffect(() => {
  //   return () => {
  //     // Cleanup socket listeners when component unmounts
  //     if (tabValue === 2) {
  //       socketService.removeAllListeners();
  //     }
  //   };
  // }, [tabValue]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [teamResponse, coachesResponse] = await Promise.all([teamService.getTeamById(teamId), teamService.getTeamCoaches(teamId)]);

      setTeam(teamResponse.data);
      setCoaches(coachesResponse.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading team data:", err);
      setError(err.response?.data?.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeamName = async () => {
    if (!teamNameValue.trim() || teamNameValue.trim() === team.name) {
      setEditingTeamName(false);
      return;
    }
    try {
      await teamService.updateTeam(teamId, { name: teamNameValue.trim() });
      setTeam((prev) => ({ ...prev, name: teamNameValue.trim() }));
      setEditingTeamName(false);
      toast.success("Team name updated successfully");
    } catch (err) {
      console.error("Error updating team name:", err);
      toast.error(err.response?.data?.message || "Failed to update team name");
    }
  };

  const handleColourChange = async (newColour) => {
    try {
      await teamService.updateTeam(teamId, { colour: newColour || null });
      setTeam((prev) => ({ ...prev, colour: newColour }));
      setEditingColour(false);
      toast.success("Team colour updated successfully");
    } catch (err) {
      console.error("Error updating team colour:", err);
      toast.error(err.response?.data?.message || "Failed to update team colour");
    }
  };

  const loadAvailableCoaches = async () => {
    try {
      const response = await clubService.getStaff(clubId);
      // Filter to only show coaches and head coaches (case-insensitive)
      const clubCoaches = response.data.filter((staff) => {
        const role = staff.role?.toUpperCase();
        return role === "COACH" || role === "HEAD_COACH";
      });
      setAvailableCoaches(clubCoaches);
    } catch (err) {
      console.error("Error loading available coaches:", err);
    }
  };

  const handleAddCoach = async () => {
    if (!selectedCoach) return;

    try {
      setSubmitting(true);
      await teamService.addCoachToTeam(teamId, selectedCoach);

      // Reload team data
      await loadTeamData();

      setOpenAddCoach(false);
      setSelectedCoach("");
    } catch (err) {
      console.error("Error adding coach:", err);
      setError(err.response?.data?.message || "Failed to add coach to team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCoach = async (coachId) => {
    if (!window.confirm("Are you sure you want to remove this coach from the team?")) {
      return;
    }

    try {
      await teamService.removeCoachFromTeam(teamId, coachId);

      // Reload team data
      await loadTeamData();
    } catch (err) {
      console.error("Error removing coach:", err);
      setError(err.response?.data?.message || "Failed to remove coach");
    }
  };

  const handleBack = () => {
    navigate(`/clubs/${clubId}/teams`);
  };

  const handleRemovePlayer = async (playerId) => {
    if (!window.confirm("Are you sure you want to remove this player from the team?")) {
      return;
    }

    try {
      setRemoveLoading(playerId);
      await clubService.removePlayerFromTeam(clubId, playerId, teamId);
      await loadTeamData();
    } catch (err) {
      console.error("Error removing player:", err);
      setError(err.response?.data?.message || "Failed to remove player");
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleEditPlayer = (rosterEntry) => {
    setEditingPlayer(rosterEntry._id);
    setEditData({
      jerseyNumber: rosterEntry.jerseyNumber || "",
      position: rosterEntry.position || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditData({});
  };

  const handleSaveEdit = async (playerId) => {
    try {
      await clubService.updatePlayerTeamAssignment(clubId, playerId, teamId, {
        jerseyNumber: editData.jerseyNumber || null,
        position: editData.position || null,
      });

      setEditingPlayer(null);
      setEditData({});
      await loadTeamData();
    } catch (err) {
      console.error("Error updating player:", err);
      setError(err.response?.data?.message || "Failed to update player details");
    }
  };

  // team's chat is hidden temporarily
  // Chat functions
  // const initializeChat = async () => {
  //   try {
  //     setChatLoading(true);
  //     // Load messages first (this will create chat group if it doesn't exist)
  //     const response = await messageService.getTeamMessages(teamId);
  //     setMessages(response.data || []);

  //     // Reload team data to get the chatGroupId
  //     const teamResponse = await teamService.getTeamById(teamId);
  //     setTeam(teamResponse.data);

  //     // Now connect to chat with the updated team data
  //     if (teamResponse.data?.chatGroupId) {
  //       connectToChatWithGroupId(teamResponse.data.chatGroupId);
  //     }
  //   } catch (err) {
  //     console.error("Error initializing chat:", err);
  //     setError("Failed to initialize chat");
  //   } finally {
  //     setChatLoading(false);
  //   }
  // };

  // const loadChatMessages = async () => {
  //   try {
  //     setChatLoading(true);
  //     const response = await messageService.getTeamMessages(teamId);
  //     setMessages(response.data || []);
  //   } catch (err) {
  //     console.error("Error loading messages:", err);
  //     setError("Failed to load chat messages");
  //   } finally {
  //     setChatLoading(false);
  //   }
  // };

  // const connectToChatWithGroupId = (chatGroupId) => {
  //   if (!chatGroupId) {
  //     console.error("No chat group ID available");
  //     return;
  //   }

  //   socketService.connect();
  //   setChatConnected(true);

  //   // Join the team's chat group
  //   socketService.joinGroups([chatGroupId]);

  //   // Setup socket listeners
  //   socketService.onNewMessage((message) => {
  //     setMessages((prev) => [...prev, message]);
  //   });

  //   socketService.onUserTyping(({ userId, user }) => {
  //     if (userId !== currentUserId) {
  //       setTypingUsers((prev) => {
  //         if (!prev.find((u) => u.userId === userId)) {
  //           return [...prev, { userId, name: user.name }];
  //         }
  //         return prev;
  //       });

  //       setTimeout(() => {
  //         setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
  //       }, 3000);
  //     }
  //   });

  //   socketService.onUserStoppedTyping(({ userId }) => {
  //     setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
  //   });

  //   socketService.onError((error) => {
  //     console.error("Socket error:", error);
  //     setError(error.message || "Connection error");
  //   });
  // };

  // team's chat is hidden temporarily
  // const handleSendMessage = (messageData) => {
  //   if (!team?.chatGroupId) {
  //     console.error("No chat group ID");
  //     return;
  //   }
  //   socketService.sendMessage(team.chatGroupId, messageData);
  // };

  // const handleDeleteMessage = async (messageId) => {
  //   try {
  //     await messageService.deleteMessage(messageId);
  //     setMessages((prev) => prev.filter((m) => m._id !== messageId));
  //   } catch (err) {
  //     console.error("Error deleting message:", err);
  //     setError("Failed to delete message");
  //   }
  // };

  // Filter out coaches already assigned to the team
  const unassignedCoaches = availableCoaches.filter((coach) => !coaches.some((c) => c.userId === coach._id));

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (!team) {
    return (
      <AppLayout>
        <Container
          maxWidth={false}
          sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">Team not found</Alert>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container
        maxWidth={false}
        sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}>
          Back to Teams
        </Button>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box>
            {editingTeamName ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <TextField
                  value={teamNameValue}
                  onChange={(e) => setTeamNameValue(e.target.value)}
                  size="small"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTeamName();
                    if (e.key === "Escape") setEditingTeamName(false);
                  }}
                  sx={{ "& input": { fontSize: "2rem", fontWeight: 700 } }}
                />
                <IconButton onClick={handleSaveTeamName} color="primary" size="small">
                  <CheckIcon />
                </IconButton>
                <IconButton onClick={() => setEditingTeamName(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom>
                  {team.name}
                </Typography>
                <IconButton
                  onClick={() => {
                    setTeamNameValue(team.name);
                    setEditingTeamName(true);
                  }}
                  size="small"
                  sx={{ mb: 1 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
              {team.ageGroup && (
                <Chip
                  label={team.ageGroup}
                  color="primary"
                />
              )}
              {editingColour ? (
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap" }}>
                  {teamColours.map((colour) => (
                    <Box
                      key={colour.value}
                      onClick={() => handleColourChange(colour.value)}
                      sx={{
                        width: 28,
                        height: 28,
                        backgroundColor: colour.hex,
                        borderRadius: "50%",
                        cursor: "pointer",
                        border: team.colour === colour.value ? "2px solid #000" : "1px solid #ccc",
                        "&:hover": { transform: "scale(1.15)" },
                        transition: "all 0.2s",
                      }}
                      title={colour.label}
                    />
                  ))}
                  <IconButton size="small" onClick={() => handleColourChange(null)} title="Remove colour">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Chip
                  label={team.colour ? teamColours.find(c => c.value === team.colour)?.label || team.colour : "No colour"}
                  onClick={() => setEditingColour(true)}
                  onDelete={() => setEditingColour(true)}
                  deleteIcon={<EditIcon fontSize="small" />}
                  sx={{
                    backgroundColor: team.colour ? getColourHex(team.colour) : undefined,
                    color: team.colour && ["yellow", "cyan"].includes(team.colour) ? "#000" : team.colour ? "#fff" : undefined,
                    cursor: "pointer",
                  }}
                />
              )}
            </Box>
            {team.description && (
              <Typography
                variant="body2"
                color="text.secondary">
                {team.description}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 4, mt: 3 }}>
            <Box>
              <Typography variant="h6">{team.roster?.length || 0}</Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Total Players
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6">{coaches.length || 0}</Typography>
              <Typography
                variant="body2"
                color="text.secondary">
                Coaches
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Roster" />
            <Tab label="Coaches" />
            <Tab
              icon={<ChatIcon />}
              iconPosition="start"
              disabled
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  Team Chat
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{ height: 18, fontSize: "0.65rem" }}
                  />
                </Box>
              }
            />
            <Tab
              icon={<AssessmentIcon />}
              label="AI Report"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Paper>
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Team Roster</Typography>
              <Button
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenAddPlayers(true)}
                variant="contained"
                size="small">
                Manage Roster
              </Button>
            </Box>

            {team.roster && team.roster.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Player</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Jersey #</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {team.roster.map((rosterEntry) => {
                      const isEditing = editingPlayer === rosterEntry._id;
                      const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

                      return (
                        <TableRow
                          key={rosterEntry._id}
                          hover={!isEditing}
                          onClick={!isEditing ? () => navigate(`/players/${rosterEntry.playerId._id}`) : undefined}
                          sx={{
                            bgcolor: isEditing ? "action.selected" : "inherit",
                            cursor: isEditing ? "default" : "pointer",
                          }}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>{rosterEntry.playerId?.name?.charAt(0)}</Avatar>
                              <Typography variant="body2">{rosterEntry.playerId?.name || "Unknown Player"}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color="text.secondary">
                              {rosterEntry.playerId?.userId || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                type="number"
                                size="small"
                                value={editData.jerseyNumber}
                                onChange={(e) => setEditData({ ...editData, jerseyNumber: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                inputProps={{ min: 1, max: 99 }}
                                sx={{ width: 80 }}
                              />
                            ) : (
                              rosterEntry.jerseyNumber || "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <FormControl
                                size="small"
                                sx={{ minWidth: 120 }}
                                onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={editData.position || ""}
                                  onChange={(e) => setEditData({ ...editData, position: e.target.value })}>
                                  <MenuItem value="">
                                    <em>None</em>
                                  </MenuItem>
                                  {positions.map((pos) => (
                                    <MenuItem
                                      key={pos}
                                      value={pos}>
                                      {pos}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              rosterEntry.position || "-"
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {isEditing ? (
                              <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(rosterEntry.playerId._id);
                                  }}>
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPlayer(rosterEntry);
                                  }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePlayer(rosterEntry.playerId._id);
                                  }}
                                  disabled={removeLoading === rosterEntry.playerId._id}>
                                  {removeLoading === rosterEntry.playerId._id ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" />}
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
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  gutterBottom>
                  No players in roster yet
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setOpenAddPlayers(true)}
                  sx={{ mt: 1 }}>
                  Add Players
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper>
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Coaches</Typography>
              <RequireRole roles={["club_manager", "head_coach"]}>
                <Button
                  startIcon={<PersonAddIcon />}
                  onClick={() => setOpenAddCoach(true)}
                  variant="contained"
                  size="small"
                  disabled={unassignedCoaches.length === 0}>
                  Add Coach
                </Button>
              </RequireRole>
            </Box>

            {unassignedCoaches.length === 0 && availableCoaches.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Alert severity="info">
                  No coaches available. Please{" "}
                  <Button
                    size="small"
                    onClick={() => navigate(`/clubs/${clubId}/staff`)}>
                    invite coaches
                  </Button>{" "}
                  to the club first.
                </Alert>
              </Box>
            )}

            {unassignedCoaches.length === 0 && availableCoaches.length > 0 && coaches.length > 0 && (
              <Box sx={{ p: 2 }}>
                <Alert severity="info">All available club coaches are already assigned to this team.</Alert>
              </Box>
            )}

            {coaches.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  No coaches assigned yet
                </Typography>
              </Box>
            ) : (
              <List>
                {coaches.map((coach) => (
                  <ListItem
                    key={coach.userId}
                    divider>
                    <ListItemText
                      primary={coach.name || coach.userId}
                      secondary={coach.role === "head_coach" ? "Head Coach" : "Assistant Coach"}
                    />
                    <RequireRole roles={["club_manager", "head_coach"]}>
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveCoach(coach.userId)}
                          color="error">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </RequireRole>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        )}

        {/* {tabValue === 2 && (
          <Paper sx={{ height: "600px", display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}>
              <Typography variant="h6">Team Chat</Typography>
              <Typography
                variant="caption"
                color="text.secondary">
                {(team.roster?.length || 0) + coaches.length} members
              </Typography>
            </Box>

            {!team.chatGroupId ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexGrow: 1,
                }}>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Chat is not available for this team
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <MessageList
                    messages={messages}
                    loading={chatLoading}
                    currentUserId={currentUserId}
                    onDeleteMessage={handleDeleteMessage}
                  />
                </Box>

                <TypingIndicator users={typingUsers} />

                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={!chatConnected}
                    placeholder={!chatConnected ? "Connecting..." : "Type a message..."}
                  />
                </Box>
              </>
            )}
          </Paper>
        )} */}

        {/* Team AI Report Tab */}
        {tabValue === 3 && (
          <Box>
            <TeamAIReport
              teamId={teamId}
              teamName={team?.name}
            />
          </Box>
        )}

        {/* Add Coach Dialog */}
        <Dialog
          open={openAddCoach}
          onClose={() => setOpenAddCoach(false)}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>Add Coach to Team</DialogTitle>
          <DialogContent>
            <FormControl
              fullWidth
              sx={{ mt: 2 }}>
              <InputLabel>Select Coach</InputLabel>
              <Select
                value={selectedCoach}
                onChange={(e) => setSelectedCoach(e.target.value)}
                label="Select Coach">
                {unassignedCoaches.map((coach) => (
                  <MenuItem
                    key={coach._id}
                    value={coach._id}>
                    {coach.name} ({coach.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenAddCoach(false)}
              disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCoach}
              variant="contained"
              disabled={!selectedCoach || submitting}>
              {submitting ? <CircularProgress size={24} /> : "Add Coach"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Players Dialog */}
        <AddExistingPlayersDialog
          open={openAddPlayers}
          onClose={() => setOpenAddPlayers(false)}
          clubId={clubId}
          teamId={teamId}
          currentRoster={team?.roster || []}
          onUpdate={loadTeamData}
        />
      </Container>
    </AppLayout>
  );
};

export default ClubTeamDetail;
