import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AppLayout from '../components/AppLayout';
import challengeService from '../api/challengeService';
import playerService from '../api/playerService';
import showToast from '../utils/toast';

const CHALLENGE_TYPES = [
  { value: '1v1', label: '1v1 (Head-to-Head)' },
  { value: 'best-of-3', label: 'Best of 3 (Three Rounds)' },
  { value: 'group', label: 'Group (Multiple Participants)' },
];

const CreateChallenge = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState('group');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [createChat, setCreateChat] = useState(true);
  const [selectedDrills, setSelectedDrills] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Dialog state
  const [drillDialogOpen, setDrillDialogOpen] = useState(false);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);

  // Data
  const [availableDrills, setAvailableDrills] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);

  useEffect(() => {
    loadAvailableDrills();
    loadAvailablePlayers();
  }, []);

  const loadAvailableDrills = async () => {
    try {
      const response = await challengeService.getAvailableDrills();
      if (response.success) {
        setAvailableDrills(response.data);
      }
    } catch (err) {
      console.error('Error loading available drills:', err);
    }
  };

  const loadAvailablePlayers = async () => {
    try {
      const response = await playerService.getAllPlayers();
      if (response.success) {
        setAvailablePlayers(response.data);
      }
    } catch (err) {
      console.error('Error loading players:', err);
    }
  };

  const handleAddDrill = (drill, level, required) => {
    const newDrill = {
      gameType: drill.gameType,
      drillLevel: level,
      required,
      drillName: drill.name,
    };

    setSelectedDrills([...selectedDrills, newDrill]);
    setDrillDialogOpen(false);
  };

  const handleRemoveDrill = (index) => {
    setSelectedDrills(selectedDrills.filter((_, i) => i !== index));
  };

  const handleToggleParticipant = (player) => {
    const isSelected = selectedParticipants.some(p => p.playerId === player.playerId);
    if (isSelected) {
      setSelectedParticipants(selectedParticipants.filter(p => p.playerId !== player.playerId));
    } else {
      setSelectedParticipants([...selectedParticipants, player]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (selectedDrills.length === 0) {
      setError('Please select at least one drill');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const challengeData = {
        title,
        description,
        challengeType,
        version: 'v2',
        challengeDrills: selectedDrills.map(d => ({
          gameType: d.gameType,
          drillLevel: d.drillLevel,
          required: d.required,
        })),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        participants: selectedParticipants.map(p => p.playerId),
        createGroupChat: createChat,
      };

      const response = await challengeService.createChallenge(challengeData);

      if (response.success) {
        showToast.success('Challenge created successfully!');
        navigate(`/challenges/${response.data._id}`);
      }
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError(err.response?.data?.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const DrillSelectorDialog = () => {
    const [selectedDrillType, setSelectedDrillType] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('1');
    const [isRequired, setIsRequired] = useState(true);

    const handleAdd = () => {
      if (!selectedDrillType) {
        showToast.error('Please select a drill');
        return;
      }

      const drill = availableDrills.find(d => d.gameType === selectedDrillType);
      handleAddDrill(drill, selectedLevel, isRequired);
    };

    return (
      <Dialog open={drillDialogOpen} onClose={() => setDrillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Drill to Challenge</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Drill</InputLabel>
              <Select
                value={selectedDrillType}
                onChange={(e) => setSelectedDrillType(e.target.value)}
                label="Select Drill"
              >
                {availableDrills.map((drill) => (
                  <MenuItem key={drill.gameType} value={drill.gameType}>
                    {drill.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                label="Level"
              >
                <MenuItem value="1">Level 1</MenuItem>
                <MenuItem value="2">Level 2</MenuItem>
                <MenuItem value="3">Level 3</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Checkbox checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />}
              label="Required (participants must complete this drill)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrillDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">
            Add Drill
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const ParticipantSelectorDialog = () => (
    <Dialog
      open={participantDialogOpen}
      onClose={() => setParticipantDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Select Participants</DialogTitle>
      <DialogContent>
        <List>
          {availablePlayers.map((player) => {
            const isSelected = selectedParticipants.some(p => p.playerId === player.playerId);
            return (
              <ListItem key={player.playerId} button onClick={() => handleToggleParticipant(player)}>
                <Avatar src={player.profilePicture} sx={{ mr: 2 }}>
                  {player.name?.charAt(0) || '?'}
                </Avatar>
                <ListItemText primary={player.name} secondary={player.email} />
                <ListItemSecondaryAction>
                  <Checkbox
                    edge="end"
                    checked={isSelected}
                    onChange={() => handleToggleParticipant(player)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setParticipantDialogOpen(false)}>Done</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <AppLayout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/challenges')}>
            Back to Challenges
          </Button>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Challenge
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Challenge Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter challenge title"
                  inputProps={{ maxLength: 100 }}
                  helperText={`${title.length}/100 characters`}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description (optional)"
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 500 }}
                  helperText={`${description.length}/500 characters`}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Challenge Type</InputLabel>
                  <Select
                    value={challengeType}
                    onChange={(e) => setChallengeType(e.target.value)}
                    label="Challenge Type"
                  >
                    {CHALLENGE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Challenge Drills *
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setDrillDialogOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Add Drill ({selectedDrills.length} selected)
                </Button>

                {selectedDrills.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedDrills.map((drill, index) => (
                      <Chip
                        key={index}
                        label={`${drill.drillName} - Level ${drill.drillLevel} ${drill.required ? '(Required)' : '(Optional)'}`}
                        onDelete={() => handleRemoveDrill(index)}
                        color={drill.required ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Participants
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setParticipantDialogOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Select Participants ({selectedParticipants.length} selected)
                </Button>

                {selectedParticipants.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedParticipants.map((participant) => (
                      <Chip
                        key={participant.playerId}
                        avatar={<Avatar src={participant.profilePicture}>{participant.name?.charAt(0) || '?'}</Avatar>}
                        label={participant.name}
                        onDelete={() => setSelectedParticipants(selectedParticipants.filter(p => p.playerId !== participant.playerId))}
                      />
                    ))}
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={createChat} onChange={(e) => setCreateChat(e.target.checked)} />}
                  label="Create a group chat for challenge participants"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={() => navigate('/challenges')}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                  >
                    Create Challenge
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <DrillSelectorDialog />
        <ParticipantSelectorDialog />
      </Container>
    </AppLayout>
  );
};

export default CreateChallenge;
