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
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import clubService from '../../api/clubService';

const AddExistingPlayersDialog = ({ open, onClose, clubId, teamId, currentRoster, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerDetails, setPlayerDetails] = useState({});
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && clubId) {
      loadPlayers();
    }
  }, [open, clubId]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clubService.getPlayers(clubId);

      // Filter out players already on the team roster
      const currentPlayerIds = (currentRoster || []).map(r =>
        typeof r.playerId === 'object' ? r.playerId._id : r.playerId
      );

      const availablePlayers = (response.data || []).filter(player =>
        !currentPlayerIds.includes(player.id)
      );

      setAllPlayers(availablePlayers);
    } catch (err) {
      console.error('Error loading players:', err);
      setError(err.response?.data?.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = allPlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePlayer = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        // Remove player and their details
        const newSelected = prev.filter(id => id !== playerId);
        const newDetails = { ...playerDetails };
        delete newDetails[playerId];
        setPlayerDetails(newDetails);
        return newSelected;
      } else {
        // Add player
        return [...prev, playerId];
      }
    });
  };

  const handleUpdatePlayerDetails = (playerId, field, value) => {
    setPlayerDetails(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [field]: value
      }
    }));
  };

  const handleAddPlayers = async () => {
    if (selectedPlayers.length === 0) return;

    try {
      setAdding(true);
      setError(null);

      // Add each selected player to the team
      await Promise.all(
        selectedPlayers.map(playerId => {
          const details = playerDetails[playerId] || {};
          return clubService.addPlayerToTeam(clubId, playerId, teamId, {
            jerseyNumber: details.jerseyNumber || null,
            position: details.position || null,
          });
        })
      );

      // Reset state
      setSelectedPlayers([]);
      setPlayerDetails({});
      setSearchTerm('');

      // Notify parent and close
      onUpdate && onUpdate();
      onClose();
    } catch (err) {
      console.error('Error adding players:', err);
      setError(err.response?.data?.message || 'Failed to add players to team');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    if (!adding) {
      setSelectedPlayers([]);
      setPlayerDetails({});
      setSearchTerm('');
      setError(null);
      onClose();
    }
  };

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Add Existing Players to Team
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select club players to add to this team
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredPlayers.length === 0 ? (
          <Alert severity="info">
            {searchTerm
              ? 'No players found matching your search.'
              : 'All club players are already on this team.'}
          </Alert>
        ) : (
          <>
            {/* Selected count */}
            {selectedPlayers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`${selectedPlayers.length} player${selectedPlayers.length !== 1 ? 's' : ''} selected`}
                  color="primary"
                  size="small"
                />
              </Box>
            )}

            {/* Player List */}
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                const details = playerDetails[player.id] || {};

                return (
                  <ListItem
                    key={player.id}
                    sx={{
                      border: 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: isSelected ? 'action.selected' : 'inherit',
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleTogglePlayer(player.id)}
                      />
                      <ListItemAvatar>
                        <Avatar>{player.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {player.name}
                            <Chip
                              label={
                                player.accountStatus === 'provisioned' ? 'Pending Onboarding' :
                                player.accountStatus === 'partial' ? 'Partial Onboarding' :
                                'Onboarded'
                              }
                              size="small"
                              color={
                                player.accountStatus === 'provisioned' ? 'warning' :
                                player.accountStatus === 'partial' ? 'info' :
                                'success'
                              }
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={player.email}
                      />
                    </Box>

                    {/* Show additional fields when selected */}
                    {isSelected && (
                      <Grid container spacing={2} sx={{ mt: 1, px: 2, pb: 1 }}>
                        <Grid item xs={6}>
                          <TextField
                            label="Jersey Number"
                            type="number"
                            size="small"
                            fullWidth
                            value={details.jerseyNumber || ''}
                            onChange={(e) => handleUpdatePlayerDetails(player.id, 'jerseyNumber', e.target.value)}
                            inputProps={{ min: 1, max: 99 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl size="small" fullWidth>
                            <InputLabel>Position</InputLabel>
                            <Select
                              value={details.position || ''}
                              onChange={(e) => handleUpdatePlayerDetails(player.id, 'position', e.target.value)}
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
                    )}
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={adding}>
          Cancel
        </Button>
        <Button
          onClick={handleAddPlayers}
          variant="contained"
          startIcon={adding ? <CircularProgress size={20} /> : <PersonAddIcon />}
          disabled={selectedPlayers.length === 0 || adding}
        >
          {adding ? 'Adding...' : `Add ${selectedPlayers.length} Player${selectedPlayers.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExistingPlayersDialog;
