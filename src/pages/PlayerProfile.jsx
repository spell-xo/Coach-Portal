import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Container, Box, Typography, Paper, Grid, CircularProgress, Alert, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TableSortLabel, Tabs, Tab, Card, CardContent, IconButton, TextField, MenuItem, Button, Checkbox, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SportsIcon from "@mui/icons-material/Sports";
import ChatIcon from "@mui/icons-material/Chat";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import playerService from "../api/playerService";
import AppLayout from "../components/AppLayout";
import PlayerAIReport from "../components/PlayerAIReport";
import ParentReport from "../components/ParentReport";
import AIAssistant from "../components/AIAssistant";
import CoachRatingsTab from "../components/CoachRatingsTab";
import GuardianAccessTab from "../components/GuardianAccessTab";
import ComparisonWizardDrawer from "../components/wizard/ComparisonWizardDrawer";
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering } from "../store/authSlice";
import { getComparator, stableSort, createSortHandler } from "../utils/tableSorting";

const PlayerProfile = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [playerStats, setPlayerStats] = useState(null);
  const [drills, setDrills] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [drillsPage, setDrillsPage] = useState(0);
  const [drillsRowsPerPage, setDrillsRowsPerPage] = useState(10);
  const [totalDrills, setTotalDrills] = useState(0);
  const [drillTypeFilter, setDrillTypeFilter] = useState("");
  const [drillStatusFilter, setDrillStatusFilter] = useState("");
  const [chatsPage, setChatsPage] = useState(0);
  const [chatsRowsPerPage, setChatsRowsPerPage] = useState(10);
  const [totalChats, setTotalChats] = useState(0);
  const [drillsOrder, setDrillsOrder] = useState("desc");
  const [drillsOrderBy, setDrillsOrderBy] = useState("date");
  const [chatsOrder, setChatsOrder] = useState("desc");
  const [chatsOrderBy, setChatsOrderBy] = useState("createdAt");

  // Comparison mode state (superadmin only)
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const isSuperAdmin = primaryRole === "superadmin" || isPlatformEngineering || userRoles?.some((r) => r.role === "superadmin" || r === "superadmin");
  const [selectedDrills, setSelectedDrills] = useState([]);
  const [comparisonDrawerOpen, setComparisonDrawerOpen] = useState(false);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  useEffect(() => {
    if (activeTab === 2) {
      loadDrills();
    } else if (activeTab === 3) {
      loadChats();
    }
    // Guardian Access tab (activeTab === 5) loads data internally via GuardianAccessTab component
  }, [activeTab, drillsPage, drillsRowsPerPage, drillTypeFilter, chatsPage, chatsRowsPerPage]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading player data for:", playerId);
      const response = await playerService.getPlayerStats(playerId);
      console.log("Player stats response:", response);

      if (response.success) {
        console.log("Player data:", response.data);
        setPlayerStats(response.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error loading player stats:", err);
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      // Handle 403 specifically - feature not available
      if (err.response?.status === 403) {
        setError("Player statistics are not available. This feature may require additional permissions or is not yet implemented.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load player data");
      }

      // Set empty stats matching the expected structure
      setPlayerStats({
        id: playerId,
        name: "Unknown Player",
        email: "",
        profilePicture: null,
        stats: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDrills = async () => {
    try {
      const filters = {
        limit: drillsRowsPerPage,
        offset: drillsPage * drillsRowsPerPage,
      };

      if (drillTypeFilter) {
        filters.drillType = drillTypeFilter;
      }

      const response = await playerService.getPlayerDrills(playerId, filters);

      if (response.success) {
        setDrills(response.data);
        setTotalDrills(response.meta?.total || response.data.length);
      }
    } catch (err) {
      console.error("Failed to load drills:", err);
      // Handle 403 - feature not available
      if (err.response?.status === 403) {
        setDrills([]);
        console.warn("Player drills feature requires additional permissions");
      }
    }
  };

  const loadChats = async () => {
    try {
      const response = await playerService.getPlayerChats(playerId, {
        limit: chatsRowsPerPage,
        offset: chatsPage * chatsRowsPerPage,
      });

      if (response.success) {
        setChats(response.data);
        setTotalChats(response.meta?.total || response.data.length);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
      // Handle 403 - feature not available
      if (err.response?.status === 403) {
        setChats([]);
        console.warn("Player chats feature requires additional permissions");
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDrillsPageChange = (event, newPage) => {
    setDrillsPage(newPage);
  };

  const handleDrillsRowsPerPageChange = (event) => {
    setDrillsRowsPerPage(parseInt(event.target.value, 10));
    setDrillsPage(0);
  };

  const handleChatsPageChange = (event, newPage) => {
    setChatsPage(newPage);
  };

  const handleChatsRowsPerPageChange = (event) => {
    setChatsRowsPerPage(parseInt(event.target.value, 10));
    setChatsPage(0);
  };

  const handleBack = () => {
    const from = location.state?.from;

    if (from === "/players") {
      // Going back to All Players page - restore the search state
      navigate("/players", {
        state: {
          searchTerm: location.state.searchTerm,
          page: location.state.page,
          rowsPerPage: location.state.rowsPerPage,
        },
      });
    } else if (from) {
      // Going back to a specific route (like team roster)
      navigate(from);
    } else {
      // Fallback to browser back
      navigate(-1);
    }
  };

  const handleDrillClick = (drillId) => {
    navigate(`/players/${playerId}/drills/${drillId}`, {
      state: { playerName: playerStats?.name },
    });
  };

  const handleDrillTypeFilterChange = (event) => {
    setDrillTypeFilter(event.target.value);
    setDrillsPage(0); // Reset to first page when filter changes
  };

  const handleResetFilters = () => {
    setDrillTypeFilter("");
    setDrillStatusFilter("");
    setDrillsPage(0);
  };

  const handleDrillSelect = (drillId) => {
    setSelectedDrills((prev) => {
      if (prev.includes(drillId)) {
        return prev.filter((id) => id !== drillId);
      }
      if (prev.length >= 4) return prev; // Max 4 drills
      return [...prev, drillId];
    });
  };

  const handleOpenComparison = () => {
    if (selectedDrills.length >= 2 && selectedDrills.length <= 4) {
      setComparisonDrawerOpen(true);
    }
  };

  const handleCloseComparison = () => {
    setComparisonDrawerOpen(false);
  };

  const handleDrillsRequestSort = createSortHandler(drillsOrderBy, drillsOrder, setDrillsOrderBy, setDrillsOrder, setDrillsPage);
  const handleChatsRequestSort = createSortHandler(chatsOrderBy, chatsOrder, setChatsOrderBy, setChatsOrder, setChatsPage);

  // Sort drills
  const sortedDrills = React.useMemo(() => {
    const numericFields = ["overallScore"];
    const isNumeric = numericFields.includes(drillsOrderBy);
    return stableSort(drills, getComparator(drillsOrder, drillsOrderBy, isNumeric));
  }, [drills, drillsOrder, drillsOrderBy]);

  // Sort chats
  const sortedChats = React.useMemo(() => {
    return stableSort(chats, getComparator(chatsOrder, chatsOrderBy));
  }, [chats, chatsOrder, chatsOrderBy]);

  if (loading) {
    return (
      <AppLayout>
        <Container
          maxWidth={false}
          sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Container>
      </AppLayout>
    );
  }

  if (error || !playerStats) {
    return (
      <AppLayout>
        <Container
          maxWidth={false}
          sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">{error || "Player not found"}</Alert>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container
        maxWidth={false}
        sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <IconButton
            onClick={handleBack}
            sx={{ mb: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Player Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar
              src={playerStats.profilePicture}
              alt={playerStats.name}
              sx={{ width: 80, height: 80 }}>
              {playerStats.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                gutterBottom>
                {playerStats.name}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary">
                {playerStats.email}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid
          container
          spacing={3}
          sx={{ mb: 3 }}>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <SportsIcon color="primary" />
                  <Typography
                    variant="body2"
                    color="text.secondary">
                    Total Drills
                  </Typography>
                </Box>
                <Typography variant="h4">{playerStats.stats?.totalDrills || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <TrendingUpIcon color="success" />
                  <Typography
                    variant="body2"
                    color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
                <Typography variant="h4">{playerStats.stats?.averageScore?.toFixed(1) || "0.0"}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary">
                    Rank
                  </Typography>
                </Box>
                <Typography variant="h4">#{playerStats.stats?.rank || "-"}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}>
            <Card>
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom>
                  Last Active
                </Typography>
                <Typography variant="body1">{playerStats.stats?.lastActive ? new Date(playerStats.stats.lastActive).toLocaleString() : "N/A"}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for Drills and Chats */}
        <Paper sx={{ width: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Coach Ratings" />
            <Tab label="Drill History" />
            <Tab label="AI Chats" />
            <Tab label="Guardian Report" />
            <Tab label="Guardian Access" />
            <Tab
              icon={<SmartToyIcon />}
              iconPosition="start"
              label="AI Assistant"
            />
          </Tabs>

          {/* Overview Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <PlayerAIReport playerId={playerId} />
            </Box>
          )}

          {/* Coach Ratings Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <CoachRatingsTab
                entityId={playerId}
                entityType="player"
                showPdfExport={false}
              />
            </Box>
          )}

          {/* Drills Tab */}
          {activeTab === 2 && (
            <Box>
              {/* Filters */}
              <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <TextField
                  select
                  label="Drill Type"
                  value={drillTypeFilter}
                  onChange={handleDrillTypeFilterChange}
                  size="small"
                  sx={{ minWidth: 200 }}>
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="JUGGLING">Juggling</MenuItem>
                  <MenuItem value="DRIBBLING">Dribbling</MenuItem>
                  <MenuItem value="PASSING">Passing</MenuItem>
                  <MenuItem value="SHOOTING">Shooting</MenuItem>
                </TextField>

                {drillTypeFilter && (
                  <Button
                    variant="outlined"
                    onClick={handleResetFilters}
                    size="small">
                    Reset Filters
                  </Button>
                )}

                {/* Comparison button (superadmin only) */}
                {isSuperAdmin && selectedDrills.length >= 2 && (
                  <Tooltip title={selectedDrills.length > 4 ? "Select 2-4 drills" : ""}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CompareArrowsIcon />}
                      onClick={handleOpenComparison}
                      disabled={selectedDrills.length < 2 || selectedDrills.length > 4}
                      sx={{ ml: "auto" }}>
                      Compare in Wizard ({selectedDrills.length})
                    </Button>
                  </Tooltip>
                )}

                {isSuperAdmin && selectedDrills.length > 0 && selectedDrills.length < 2 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                    Select {2 - selectedDrills.length} more drill{selectedDrills.length === 0 ? "s" : ""} to compare
                  </Typography>
                )}
              </Box>

              {drills.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <SportsIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
                  <Typography
                    variant="h6"
                    color="text.secondary">
                    {drillTypeFilter ? "No drills found matching filters" : "No drills completed yet"}
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {isSuperAdmin && (
                            <TableCell padding="checkbox" sx={{ width: 42 }}>
                              <Tooltip title="Select drills to compare (2-4)">
                                <CompareArrowsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                              </Tooltip>
                            </TableCell>
                          )}
                          <TableCell>
                            <TableSortLabel
                              active={drillsOrderBy === "date"}
                              direction={drillsOrderBy === "date" ? drillsOrder : "asc"}
                              onClick={() => handleDrillsRequestSort("date")}>
                              Date
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={drillsOrderBy === "drillType"}
                              direction={drillsOrderBy === "drillType" ? drillsOrder : "asc"}
                              onClick={() => handleDrillsRequestSort("drillType")}>
                              Drill Type
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={drillsOrderBy === "overallScore"}
                              direction={drillsOrderBy === "overallScore" ? drillsOrder : "asc"}
                              onClick={() => handleDrillsRequestSort("overallScore")}>
                              Overall Score
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={drillsOrderBy === "status"}
                              direction={drillsOrderBy === "status" ? drillsOrder : "asc"}
                              onClick={() => handleDrillsRequestSort("status")}>
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedDrills.map((drill) => (
                          <TableRow
                            key={drill.drillId}
                            hover
                            sx={{ cursor: "pointer" }}
                            onClick={() => handleDrillClick(drill.drillId)}>
                            {isSuperAdmin && (
                              <TableCell padding="checkbox">
                                <Checkbox
                                  size="small"
                                  checked={selectedDrills.includes(drill.drillId)}
                                  disabled={!selectedDrills.includes(drill.drillId) && selectedDrills.length >= 4}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDrillSelect(drill.drillId);
                                  }}
                                />
                              </TableCell>
                            )}
                            <TableCell>{new Date(drill.date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(drill.date).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={drill.drillType}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                color={drill.overallScore >= 70 ? "success.main" : "text.primary"}>
                                {drill.overallScore?.toFixed(1) || "0.0"}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={drill.status}
                                size="small"
                                color={drill.status === "completed" ? "success" : drill.status === "failed" ? "error" : "default"}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDrillClick(drill.drillId);
                                }}>
                                <VisibilityIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalDrills}
                    rowsPerPage={drillsRowsPerPage}
                    page={drillsPage}
                    onPageChange={handleDrillsPageChange}
                    onRowsPerPageChange={handleDrillsRowsPerPageChange}
                  />
                </>
              )}
            </Box>
          )}

          {/* Chats Tab */}
          {activeTab === 3 && (
            <Box>
              {chats.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <ChatIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
                  <Typography
                    variant="h6"
                    color="text.secondary">
                    No AI chat history
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ p: 2 }}>
                    {chats.map((chat, index) => (
                      <Paper
                        key={chat.conversationId || index}
                        sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                        <Typography
                          variant="caption"
                          color="text.secondary">
                          {new Date(chat.lastMessageAt).toLocaleString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 1 }}>
                          {chat.messageCount} messages
                        </Typography>
                        {chat.lastMessage && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, fontStyle: "italic" }}>
                            "{chat.lastMessage.substring(0, 100)}
                            {chat.lastMessage.length > 100 ? "..." : ""}"
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalChats}
                    rowsPerPage={chatsRowsPerPage}
                    page={chatsPage}
                    onPageChange={handleChatsPageChange}
                    onRowsPerPageChange={handleChatsRowsPerPageChange}
                  />
                </>
              )}
            </Box>
          )}

          {/* Guardian Report Tab */}
          {activeTab === 4 && (
            <Box sx={{ p: 3 }}>
              <ParentReport
                playerId={playerId}
                playerInfo={{
                  name: playerStats.name,
                  parentEmail: playerStats.parentEmail,
                  parentName: playerStats.parentName,
                  coachName: "Coach Smith", // In production, get from auth context
                }}
              />
            </Box>
          )}

          {/* Guardian Access Tab */}
          {activeTab === 5 && (
            <Box sx={{ p: 3 }}>
              <GuardianAccessTab
                playerId={playerId}
                playerName={playerStats?.name || "Player"}
              />
            </Box>
          )}

          {/* AI Assistant Tab */}
          {activeTab === 6 && (
            <Box sx={{ p: 3 }}>
              <AIAssistant
                context={{
                  playerId: playerId,
                  playerName: playerStats.name,
                  teamId: playerStats.teamId,
                }}
              />
            </Box>
          )}
        </Paper>
      </Container>

      {/* Comparison Wizard Drawer (superadmin only) */}
      {isSuperAdmin && (
        <ComparisonWizardDrawer
          open={comparisonDrawerOpen}
          onClose={handleCloseComparison}
          drillIds={selectedDrills}
          drillData={drills}
        />
      )}
    </AppLayout>
  );
};

export default PlayerProfile;
