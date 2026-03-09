import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import clubService from '../../api/clubService';

const ManagePlayerTeams = ({ open, onClose, clubId, player, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [playerTeams, setPlayerTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (open && player) {
      loadData();
    }
  }, [open, player, clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load player's current teams and all club teams in parallel
      const [playerTeamsResponse, allTeamsResponse] = await Promise.all([
        clubService.getPlayerTeams(clubId, player.id),
        clubService.getTeams(clubId)
      ]);

      setPlayerTeams(playerTeamsResponse.data || []);
      setAvailableTeams(allTeamsResponse.data || []);
    } catch (err) {
      console.error('Error loading team data:', err);
      setError(err.response?.data?.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTeam = async () => {
    if (!selectedTeam) return;

    try {
      setError(null);
      await clubService.addPlayerToTeam(clubId, player.id, selectedTeam, {
        jerseyNumber: jerseyNumber || null,
        position: position || null,
      });

      // Reset form
      setSelectedTeam('');
      setJerseyNumber('');
      setPosition('');

      // Reload data
      await loadData();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Error adding player to team:', err);
      setError(err.response?.data?.message || 'Failed to add player to team');
    }
  };

  const handleRemoveFromTeam = async (teamId) => {
    if (!window.confirm('Remove player from this team?')) return;

    try {
      setError(null);
      await clubService.removePlayerFromTeam(clubId, player.id, teamId);
      await loadData();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Error removing player from team:', err);
      setError(err.response?.data?.message || 'Failed to remove player from team');
    }
  };

  const startEdit = (team) => {
    setEditingTeam(team.teamId);
    setEditData({
      jerseyNumber: team.jerseyNumber || '',
      position: team.position || '',
    });
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setEditData({});
  };

  const saveEdit = async (teamId) => {
    try {
      setError(null);
      await clubService.updatePlayerTeamAssignment(clubId, player.id, teamId, {
        jerseyNumber: editData.jerseyNumber || null,
        position: editData.position || null,
      });

      setEditingTeam(null);
      setEditData({});
      await loadData();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Error updating team assignment:', err);
      setError(err.response?.data?.message || 'Failed to update assignment');
    }
  };

  const getAvailableTeamsForAdd = () => {
    const playerTeamIds = playerTeams.map(pt => pt.teamId.toString());
    return availableTeams.filter(team => !playerTeamIds.includes(team._id.toString()));
  };

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Manage Teams for {player?.name}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Current Teams */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Current Teams ({playerTeams.length})
            </Typography>
            {playerTeams.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                Player is not assigned to any teams yet
              </Alert>
            ) : (
              <List sx={{ mb: 3 }}>
                {playerTeams.map((team) => (
                  <ListItem
                    key={team.teamId}
                    divider
                    sx={{
                      bgcolor: editingTeam === team.teamId ? 'action.hover' : 'inherit',
                      border: editingTeam === team.teamId ? 1 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    {editingTeam === team.teamId ? (
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {team.teamName}
                          {team.ageGroup && (
                            <Chip label={team.ageGroup} size="small" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <TextField
                              label="Jersey Number"
                              type="number"
                              size="small"
                              fullWidth
                              value={editData.jerseyNumber}
                              onChange={(e) => setEditData({ ...editData, jerseyNumber: e.target.value })}
                              inputProps={{ min: 1, max: 99 }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Position</InputLabel>
                              <Select
                                value={editData.position}
                                onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                                label="Position"
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
                          </Grid>
                        </Grid>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => saveEdit(team.teamId)}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={cancelEdit}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <ListItemText
                          primary={
                            <Box>
                              {team.teamName}
                              {team.ageGroup && (
                                <Chip label={team.ageGroup} size="small" sx={{ ml: 1 }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              {team.jerseyNumber && `#${team.jerseyNumber}`}
                              {team.jerseyNumber && team.position && ' • '}
                              {team.position}
                              {!team.jerseyNumber && !team.position && 'No jersey number or position set'}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => startEdit(team)} sx={{ mr: 1 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveFromTeam(team.teamId)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            )}

            {/* Add to Team */}
            {getAvailableTeamsForAdd().length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Add to Team
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Team</InputLabel>
                      <Select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        label="Select Team"
                      >
                        {getAvailableTeamsForAdd().map((team) => (
                          <MenuItem key={team._id} value={team._id}>
                            {team.name} {team.ageGroup && `(${team.ageGroup})`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Jersey Number (Optional)"
                      type="number"
                      fullWidth
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      inputProps={{ min: 1, max: 99 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Position (Optional)</InputLabel>
                      <Select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        label="Position (Optional)"
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
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddToTeam}
                      disabled={!selectedTeam}
                      fullWidth
                    >
                      Add to Team
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}

            {getAvailableTeamsForAdd().length === 0 && playerTeams.length > 0 && (
              <Alert severity="info">
                Player is assigned to all available teams in this club
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManagePlayerTeams;
