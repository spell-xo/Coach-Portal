import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Checkbox,
  FormControlLabel,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  ListItemButton,
  IconButton,
  Divider,
  Switch,
  FormGroup,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AppLayout from '../components/AppLayout';
import missionService from '../api/missionService';
import { clubService } from '../api/clubService';
import teamService from '../api/teamService';
import { selectActiveContext, selectIsClubContext } from '../store/authSlice';
import showToast from '../utils/toast';

const steps = ['Mission Details', 'Select Recipients', 'Review & Create'];

const CreateMission = () => {
  const navigate = useNavigate();
  const activeContext = useSelector(selectActiveContext);
  const isClubContext = useSelector(selectIsClubContext);
  const clubId = activeContext?.clubId;

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(null);

  // Configuration options
  const [includeRecommendedDrills, setIncludeRecommendedDrills] = useState(true);
  const [includeRecommendedExercises, setIncludeRecommendedExercises] = useState(true);
  const [includeSCExercises, setIncludeSCExercises] = useState(true);
  const [includeCoachNotes, setIncludeCoachNotes] = useState(true);

  // Teams and players selection
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);

  // Player search
  const [recipientTab, setRecipientTab] = useState('teams');
  const [allPlayers, setAllPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');

  useEffect(() => {
    loadTeams();
    loadPlayers();
  }, [clubId, isClubContext]);

  const loadTeams = async () => {
    try {
      setTeamsLoading(true);
      let response;

      if (isClubContext && clubId) {
        // In club context, use clubService
        response = await clubService.getTeams(clubId);
      } else {
        // Personal context, use teamService
        response = await teamService.getMyTeams();
      }

      if (response.success) {
        setTeams(response.data || []);
      }
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams');
    } finally {
      setTeamsLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      setPlayersLoading(true);

      if (isClubContext && clubId) {
        // In club context, use clubService to get all players
        const response = await clubService.getPlayers(clubId);
        if (response.success) {
          setAllPlayers(response.data || []);
        }
      } else {
        // In personal context, get players from all teams
        const teamsResponse = await teamService.getMyTeams();
        if (teamsResponse.success) {
          // Extract unique players from all teams
          const playersMap = new Map();
          (teamsResponse.data || []).forEach(team => {
            (team.players || []).forEach(player => {
              if (player._id && !playersMap.has(String(player._id))) {
                playersMap.set(String(player._id), player);
              }
            });
          });
          setAllPlayers(Array.from(playersMap.values()));
        }
      }
    } catch (err) {
      console.error('Error loading players:', err);
    } finally {
      setPlayersLoading(false);
    }
  };

  // Filter players based on search and normalize _id (API may return 'id' or '_id')
  const filteredPlayers = allPlayers
    .map(player => ({ ...player, _id: String(player._id || player.id) }))
    .filter(player => {
      if (!playerSearch.trim()) return true;
      const search = playerSearch.toLowerCase();
      return (
        player.name?.toLowerCase().includes(search) ||
        player.userId?.toLowerCase().includes(search) ||
        player.email?.toLowerCase().includes(search)
      );
    });

  const handleNext = () => {
    if (activeStep === 0) {
      if (!title.trim()) {
        setError('Please enter a mission title');
        return;
      }
    }
    if (activeStep === 1) {
      if (selectedTeams.length === 0 && selectedPlayers.length === 0) {
        setError('Please select at least one team or player');
        return;
      }
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleTeamToggle = (team) => {
    const isSelected = selectedTeams.some(t => t._id === team._id);
    if (isSelected) {
      setSelectedTeams(selectedTeams.filter(t => t._id !== team._id));
      // Also remove all players from this team
      const teamPlayerIds = (team.players || []).map(p => p._id || p);
      setSelectedPlayers(selectedPlayers.filter(p => !teamPlayerIds.includes(p._id)));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  const handlePlayerToggle = (player, team = null) => {
    const playerId = String(player._id || player.id);
    if (!playerId || playerId === 'undefined') {
      console.error('Player missing _id/id:', player);
      return;
    }
    setSelectedPlayers(prevSelected => {
      const isSelected = prevSelected.some(p => String(p._id) === playerId);
      if (isSelected) {
        return prevSelected.filter(p => String(p._id) !== playerId);
      } else {
        // Ensure _id is stored as string for consistent comparison
        return [...prevSelected, { ...player, _id: playerId, teamName: team?.name || 'Individual' }];
      }
    });
  };

  const isTeamSelected = (teamId) => {
    if (!teamId) return false;
    return selectedTeams.some(t => t._id && String(t._id) === String(teamId));
  };

  const isPlayerSelected = (playerId) => {
    if (!playerId) return false;
    return selectedPlayers.some(p => p._id && String(p._id) === String(playerId));
  };

  const getTotalRecipients = () => {
    // Count players from selected teams
    let count = selectedTeams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
    // Add individually selected players (not already in selected teams)
    const teamPlayerIds = selectedTeams.flatMap(t => (t.players || []).map(p => p._id || p));
    const additionalPlayers = selectedPlayers.filter(p => !teamPlayerIds.includes(p._id));
    count += additionalPlayers.length;
    return count;
  };

  const handleCreateMission = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create the mission with configuration options
      const missionResponse = await missionService.createMission({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        config: {
          includeRecommendedDrills,
          includeRecommendedExercises,
          includeSCExercises,
          includeCoachNotes,
        },
      });

      if (!missionResponse.success) {
        throw new Error(missionResponse.message || 'Failed to create mission');
      }

      const missionId = missionResponse.data._id;

      // Add recipients
      const teamIds = selectedTeams.map(t => t._id);
      const teamPlayerIdsSet = new Set(
        selectedTeams.flatMap(t => (t.players || []).map(p => String(p._id || p)))
      );
      // Get individual players not already in selected teams
      const additionalPlayerIds = selectedPlayers
        .filter(p => p._id && !teamPlayerIdsSet.has(String(p._id)))
        .map(p => p._id);

      console.log('Creating mission with recipients:', {
        teamIds,
        teamPlayerIdsSet: [...teamPlayerIdsSet],
        selectedPlayers: selectedPlayers.map(p => ({ _id: p._id, name: p.name })),
        additionalPlayerIds,
      });

      if (teamIds.length > 0 || additionalPlayerIds.length > 0) {
        await missionService.addRecipients(missionId, {
          teamIds,
          playerIds: additionalPlayerIds,
        });
      }

      showToast.success('Mission created successfully');
      navigate(`/missions/${missionId}`);
    } catch (err) {
      console.error('Error creating mission:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create mission');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <TextField
              fullWidth
              label="Mission Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Training Focus"
              sx={{ mb: 3 }}
              required
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the focus of this mission..."
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date (Optional)"
                value={dueDate}
                onChange={setDueDate}
                slotProps={{
                  textField: { fullWidth: true },
                }}
                minDate={new Date()}
              />
            </LocalizationProvider>

            {/* Configuration Options */}
            <Paper variant="outlined" sx={{ mt: 4, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Mission Content Options
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select what content to include when generating the mission for each player.
              </Typography>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeRecommendedDrills}
                      onChange={(e) => setIncludeRecommendedDrills(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SportsSoccerIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body1">Recommended Drills</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Auto-generate drill recommendations based on player performance
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ mb: 2, alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={includeRecommendedExercises}
                      onChange={(e) => setIncludeRecommendedExercises(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EditNoteIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body1">AI Coach Recommendations</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Include personalized training recommendations from AI analysis
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ mb: 2, alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={includeSCExercises}
                      onChange={(e) => setIncludeSCExercises(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FitnessCenterIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body1">Strength & Conditioning</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Include age-appropriate S&C exercises for physical development
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ mb: 2, alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={includeCoachNotes}
                      onChange={(e) => setIncludeCoachNotes(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EditNoteIcon fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body1">Coach Notes</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Add personalized notes for each player (can edit before sending)
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start' }}
                />
              </FormGroup>
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box>
            {/* Tabs for Teams and Players */}
            <Paper sx={{ mb: 3 }}>
              <Tabs value={recipientTab} onChange={(e, v) => setRecipientTab(v)}>
                <Tab label="Select by Team" value="teams" icon={<GroupIcon />} iconPosition="start" />
                <Tab label="Select Individual Players" value="players" icon={<PersonIcon />} iconPosition="start" />
              </Tabs>
            </Paper>

            {/* Teams Tab */}
            {recipientTab === 'teams' && (
              <>
                {teamsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : teams.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No teams found. You can still add individual players from the "Select Individual Players" tab.
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {teams.map((team) => (
                      <Grid item xs={12} md={6} key={team._id}>
                        <Card
                          variant={isTeamSelected(team._id) ? 'outlined' : 'elevation'}
                          sx={{
                            border: isTeamSelected(team._id) ? 2 : 1,
                            borderColor: isTeamSelected(team._id) ? 'primary.main' : 'divider',
                          }}
                        >
                          <CardActionArea onClick={() => handleTeamToggle(team)}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Checkbox
                                  checked={isTeamSelected(team._id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => handleTeamToggle(team)}
                                />
                                <GroupIcon color="primary" />
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="h6">{team.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {team.players?.length || 0} players
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </CardActionArea>

                          {/* Individual player selection within team */}
                          {!isTeamSelected(team._id) && team.players?.length > 0 && (
                            <Box sx={{ px: 2, pb: 2 }}>
                              <Button
                                size="small"
                                onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
                              >
                                {expandedTeam === team._id ? 'Hide players' : 'Select individual players'}
                              </Button>
                              {expandedTeam === team._id && (
                                <List dense>
                                  {team.players.map((player) => (
                                    <ListItem key={player._id} sx={{ py: 0.5 }}>
                                      <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}>
                                          {player.name?.[0] || <PersonIcon />}
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={player.name || 'Unknown Player'}
                                        secondary={player.userId}
                                      />
                                      <ListItemSecondaryAction>
                                        <Checkbox
                                          edge="end"
                                          checked={isPlayerSelected(player._id)}
                                          onChange={() => handlePlayerToggle(player, team)}
                                        />
                                      </ListItemSecondaryAction>
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}

            {/* Players Tab */}
            {recipientTab === 'players' && (
              <>
                {/* Search bar */}
                <TextField
                  fullWidth
                  placeholder="Search players by name or email..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                {playersLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredPlayers.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      {playerSearch ? 'No players match your search.' : 'No players found in the academy.'}
                    </Typography>
                  </Paper>
                ) : (
                  <Paper variant="outlined">
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {filteredPlayers.map((player) => (
                        <ListItem
                          key={player._id}
                          disablePadding
                        >
                          <ListItemButton
                            onClick={() => handlePlayerToggle(player)}
                            selected={isPlayerSelected(player._id)}
                          >
                            <ListItemAvatar>
                              <Avatar src={player.profilePicture}>
                                {player.name?.[0] || <PersonIcon />}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={player.name || 'Unknown Player'}
                              secondary={player.userId}
                            />
                            <Checkbox
                              edge="end"
                              checked={isPlayerSelected(player._id)}
                              tabIndex={-1}
                              disableRipple
                              inputProps={{ 'aria-labelledby': `player-${player._id}` }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </>
            )}

            {/* Selected summary */}
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Recipients: {getTotalRecipients()}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTeams.map((team) => (
                  <Chip
                    key={team._id}
                    icon={<GroupIcon />}
                    label={`${team.name} (${team.players?.length || 0})`}
                    onDelete={() => handleTeamToggle(team)}
                    color="primary"
                  />
                ))}
                {selectedPlayers
                  .filter(p => !selectedTeams.flatMap(t => t.players?.map(pl => pl._id)).includes(p._id))
                  .map((player) => (
                    <Chip
                      key={player._id}
                      icon={<PersonIcon />}
                      label={player.name}
                      onDelete={() => handlePlayerToggle(player)}
                    />
                  ))}
              </Box>
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Mission Summary
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="body1">{title}</Typography>
              </Box>

              {description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{description}</Typography>
                </Box>
              )}

              {dueDate && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1">
                    {dueDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Content to Generate
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {includeRecommendedDrills && (
                    <Chip size="small" icon={<SportsSoccerIcon />} label="Recommended Drills" color="primary" variant="outlined" />
                  )}
                  {includeRecommendedExercises && (
                    <Chip size="small" icon={<EditNoteIcon />} label="AI Recommendations" color="primary" variant="outlined" />
                  )}
                  {includeSCExercises && (
                    <Chip size="small" icon={<FitnessCenterIcon />} label="S&C Exercises" color="primary" variant="outlined" />
                  )}
                  {includeCoachNotes && (
                    <Chip size="small" icon={<EditNoteIcon />} label="Coach Notes" color="primary" variant="outlined" />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Recipients ({getTotalRecipients()} total)
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {selectedTeams.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Teams:
                      </Typography>
                      {selectedTeams.map((team) => (
                        <Typography key={team._id} variant="body2" sx={{ ml: 2 }}>
                          {team.name} ({team.players?.length || 0} players)
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {selectedPlayers.filter(p =>
                    !selectedTeams.flatMap(t => t.players?.map(pl => pl._id)).includes(p._id)
                  ).length > 0 && (
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        Individual Players:
                      </Typography>
                      {selectedPlayers
                        .filter(p => !selectedTeams.flatMap(t => t.players?.map(pl => pl._id)).includes(p._id))
                        .map((player) => (
                          <Typography key={player._id} variant="body2" sx={{ ml: 2 }}>
                            {player.name} ({player.teamName})
                          </Typography>
                        ))}
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                After creating the mission, you can generate personalized content for each player
                and review it before sending.
              </Alert>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate('/missions')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Create Performance Mission
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3 }}>
          {renderStepContent()}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleCreateMission}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Mission'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </AppLayout>
  );
};

export default CreateMission;
