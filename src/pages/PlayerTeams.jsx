import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Collapse,
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import playerService from '../api/playerService';
import AppLayout from '../components/AppLayout';

const PlayerTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [teamRosters, setTeamRosters] = useState({});
  const [rosterLoading, setRosterLoading] = useState({});

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playerService.getPlayerTeams();
      if (response.success) {
        setTeams(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClick = (team) => {
    setSelectedTeam(team);
    setLeaveDialogOpen(true);
  };

  const handleConfirmLeave = async () => {
    if (!selectedTeam) return;

    try {
      setLeaveLoading(true);
      await playerService.leaveTeam(selectedTeam._id);
      setLeaveDialogOpen(false);
      setSelectedTeam(null);
      loadTeams(); // Reload teams
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave team');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleToggleRoster = async (teamId) => {
    const isExpanded = expandedTeams[teamId];

    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !isExpanded,
    }));

    // Load roster if not already loaded and expanding
    if (!isExpanded && !teamRosters[teamId]) {
      try {
        setRosterLoading(prev => ({ ...prev, [teamId]: true }));
        const response = await playerService.getTeamRoster(teamId);
        if (response.success) {
          setTeamRosters(prev => ({
            ...prev,
            [teamId]: response.data,
          }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load team roster');
      } finally {
        setRosterLoading(prev => ({ ...prev, [teamId]: false }));
      }
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Teams
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {teams.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <GroupIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No teams yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't joined any teams. Wait for a coach to invite you!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {teams.map((team) => (
              <Grid item xs={12} sm={6} md={4} key={team._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {team.name}
                    </Typography>
                    <Chip
                      label={team.ageGroup}
                      size="small"
                      color="primary"
                      sx={{ mb: 2 }}
                    />

                    {team.playerInfo && (
                      <Box sx={{ mb: 2 }}>
                        {team.playerInfo.jerseyNumber && (
                          <Typography variant="body2" color="text.secondary">
                            Jersey: #{team.playerInfo.jerseyNumber}
                          </Typography>
                        )}
                        {team.playerInfo.position && (
                          <Typography variant="body2" color="text.secondary">
                            Position: {team.playerInfo.position}
                          </Typography>
                        )}
                        <Chip
                          label={team.playerInfo.status}
                          size="small"
                          color={team.playerInfo.status === 'active' ? 'success' : 'default'}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {team.stats?.playerCount || 0} players
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GroupIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {team.stats?.coachCount || 0} coaches
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      Joined {new Date(team.playerInfo?.joinedAt || team.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      onClick={() => handleToggleRoster(team._id)}
                      endIcon={expandedTeams[team._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {expandedTeams[team._id] ? 'Hide' : 'View'} Roster
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleLeaveClick(team)}
                      title="Leave team"
                    >
                      <ExitToAppIcon fontSize="small" />
                    </IconButton>
                  </CardActions>

                  <Collapse in={expandedTeams[team._id]} timeout="auto" unmountOnExit>
                    <CardContent sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Team Roster
                      </Typography>
                      {rosterLoading[team._id] ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : teamRosters[team._id]?.length > 0 ? (
                        <List dense>
                          {teamRosters[team._id].map((player) => (
                            <ListItem key={player.id} sx={{ px: 0 }}>
                              <ListItemAvatar>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {player.name?.charAt(0) || 'P'}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={player.name}
                                secondary={
                                  <>
                                    {player.jerseyNumber && `#${player.jerseyNumber}`}
                                    {player.position && ` • ${player.position}`}
                                    {` • ${player.status}`}
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No players found
                        </Typography>
                      )}
                    </CardContent>
                  </Collapse>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Leave Team Confirmation Dialog */}
        <Dialog
          open={leaveDialogOpen}
          onClose={() => !leaveLoading && setLeaveDialogOpen(false)}
        >
          <DialogTitle>Leave Team?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to leave <strong>{selectedTeam?.name}</strong>?
              You will need to be re-invited by a coach to rejoin.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveDialogOpen(false)} disabled={leaveLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLeave}
              color="error"
              variant="contained"
              disabled={leaveLoading}
            >
              {leaveLoading ? <CircularProgress size={24} /> : 'Leave Team'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default PlayerTeams;
