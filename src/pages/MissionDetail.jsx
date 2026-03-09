import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsIcon from '@mui/icons-material/Sports';
import NoteIcon from '@mui/icons-material/Note';
import AddIcon from '@mui/icons-material/Add';
import AppLayout from '../components/AppLayout';
import missionService from '../api/missionService';
import recommendationService from '../api/recommendationService';
import showToast from '../utils/toast';

const STATUS_COLORS = {
  DRAFT: '#F59E0B',
  SENT: '#10B981',
  ARCHIVED: '#6B7280',
  PENDING: '#F59E0B',
  READ: '#3B82F6',
  PARTIAL: '#8B5CF6',
  COMPLETE: '#10B981',
};

// Drill types for dropdown
const DRILL_TYPES = [
  { value: 'TRIPLE_CONE_DRILL', label: 'Triple Cone Drill' },
  { value: 'PASSING_RECEIVING_TURNING', label: 'Passing, Receiving & Turning' },
  { value: 'DIAMOND_DRIBBLING_DRILL', label: 'Diamond Dribbling' },
  { value: 'MOVEMENT_TO_RECEIVE_ON_BACK_FOOT_AND_PASS', label: 'Movement to Receive' },
  { value: 'FIRST_TOUCH_DRILL', label: 'First Touch' },
  { value: 'SAQ_SPEED', label: 'SAQ Speed' },
  { value: '7_CONE_WEAVE', label: '7 Cone Weave' },
  { value: 'ZIGZAG_DRILL', label: 'Zigzag Drill' },
  { value: 'KEEPY_UPPIES', label: 'Keepy Uppies' },
  { value: 'FIGURE_OF_8_DRILL', label: 'Figure of 8' },
  { value: 'DRIBBLE_PASS_DRIBBLE', label: 'Dribble Pass Dribble' },
  { value: 'THREE_GATE_PASS', label: 'Three Gate Pass' },
  { value: 'KEEPY_UPPIES_SECOND', label: 'Keepy Uppies (2nd)' },
];

const MissionDetail = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mission, setMission] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [activeTab, setActiveTab] = useState('recipients');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTab, setEditTab] = useState(0);
  const [editContent, setEditContent] = useState({
    coachNotes: '',
    recommendedExercises: [],
    recommendedDrills: [],
    strengthAndConditioning: [],
  });
  // For exercise picker
  const [availableExercises, setAvailableExercises] = useState([]);
  const [availableSCExercises, setAvailableSCExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  useEffect(() => {
    loadMission();
    loadRecipients();
  }, [missionId]);

  const loadMission = async () => {
    try {
      setLoading(true);
      const response = await missionService.getMissionById(missionId);
      if (response.success) {
        setMission(response.data);
      }
    } catch (err) {
      console.error('Error loading mission:', err);
      setError(err.response?.data?.message || 'Failed to load mission');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await missionService.getRecipients(missionId);
      if (response.success) {
        setRecipients(response.data || []);
      }
    } catch (err) {
      console.error('Error loading recipients:', err);
    }
  };

  const handleGenerateContent = async () => {
    try {
      setGenerating(true);
      const response = await missionService.generateMissionContent(missionId);
      if (response.success) {
        showToast.success(`Generated content for ${response.data.generatedCount} recipients`);
        loadRecipients();
      }
    } catch (err) {
      console.error('Error generating content:', err);
      showToast.error(err.response?.data?.message || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendMission = async () => {
    try {
      setSending(true);
      const response = await missionService.sendMission(missionId);
      if (response.success) {
        showToast.success(`Mission sent to ${response.data.sentTo} recipients`);
        setSendDialogOpen(false);
        loadMission();
        loadRecipients();
      }
    } catch (err) {
      console.error('Error sending mission:', err);
      showToast.error(err.response?.data?.message || 'Failed to send mission');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveRecipient = async (playerId) => {
    try {
      await missionService.removeRecipient(missionId, playerId);
      showToast.success('Recipient removed');
      loadRecipients();
      loadMission();
    } catch (err) {
      console.error('Error removing recipient:', err);
      showToast.error(err.response?.data?.message || 'Failed to remove recipient');
    }
  };

  const loadAvailableExercises = async () => {
    try {
      setExercisesLoading(true);
      // Load training exercises (for Recommended Exercises)
      const exerciseResponse = await recommendationService.getTrainingExercises({ categoryGroup: 'DRILL_SUPPORT' });
      if (exerciseResponse.success) {
        setAvailableExercises(exerciseResponse.data || []);
      }
      // Load S&C exercises
      const scResponse = await missionService.getSCExercises();
      if (scResponse.success) {
        setAvailableSCExercises(scResponse.data || []);
      }
    } catch (err) {
      console.error('Error loading exercises:', err);
    } finally {
      setExercisesLoading(false);
    }
  };

  const handleEditRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setEditContent({
      coachNotes: recipient.coachNotes || '',
      recommendedExercises: recipient.recommendedExercises || [],
      recommendedDrills: recipient.recommendedDrills || [],
      strengthAndConditioning: recipient.strengthAndConditioning || [],
    });
    setEditTab(0);
    setEditDialogOpen(true);
    loadAvailableExercises();
  };

  const handleSaveRecipientContent = async () => {
    try {
      // playerId can be an ObjectId string or a populated object
      const playerId = typeof selectedRecipient.playerId === 'object'
        ? selectedRecipient.playerId._id
        : selectedRecipient.playerId;
      await missionService.updateRecipientContent(missionId, playerId, {
        coachNotes: editContent.coachNotes,
        recommendedExercises: editContent.recommendedExercises,
        recommendedDrills: editContent.recommendedDrills,
        strengthAndConditioning: editContent.strengthAndConditioning,
      });
      showToast.success('Content updated');
      setEditDialogOpen(false);
      loadRecipients();
    } catch (err) {
      console.error('Error updating content:', err);
      showToast.error(err.response?.data?.message || 'Failed to update content');
    }
  };

  // Helper functions for editing arrays
  const handleAddExercise = (exercise) => {
    // Check if already added
    const alreadyAdded = editContent.recommendedExercises.some(
      ex => ex.exerciseId === exercise._id || ex.name === (exercise.name?.en || exercise.name)
    );
    if (alreadyAdded) {
      showToast.info('Exercise already added');
      return;
    }

    const newExercise = {
      exerciseId: exercise._id,
      name: exercise.name?.en || exercise.name || 'Exercise',
      duration: exercise.duration ? `${exercise.duration} min` : '5-10 min',
      description: exercise.description?.en || exercise.description || '',
      videoUrl: exercise.videoUrl || '',
      thumbnailUrl: exercise.thumbnailUrl || '',
      category: exercise.category || '',
      difficulty: exercise.difficulty || 'INTERMEDIATE',
      order: editContent.recommendedExercises.length,
    };
    setEditContent(prev => ({
      ...prev,
      recommendedExercises: [...prev.recommendedExercises, newExercise],
    }));
  };

  const handleRemoveExercise = (index) => {
    setEditContent(prev => ({
      ...prev,
      recommendedExercises: prev.recommendedExercises.filter((_, i) => i !== index),
    }));
  };

  const handleAddDrill = () => {
    const newDrill = {
      drillType: '',
      drillLevel: '1',
      drillName: '',
      reason: 'Coach assigned',
      isRetake: false,
      targetScore: 60,
      order: editContent.recommendedDrills.length,
    };
    setEditContent(prev => ({
      ...prev,
      recommendedDrills: [...prev.recommendedDrills, newDrill],
    }));
  };

  const handleUpdateDrill = (index, field, value) => {
    setEditContent(prev => {
      const updatedDrills = [...prev.recommendedDrills];
      updatedDrills[index] = { ...updatedDrills[index], [field]: value };
      // Auto-update drill name when type or level changes
      if (field === 'drillType' || field === 'drillLevel') {
        const drill = updatedDrills[index];
        const drillInfo = DRILL_TYPES.find(d => d.value === drill.drillType);
        if (drillInfo) {
          updatedDrills[index].drillName = `${drillInfo.label} - Level ${drill.drillLevel}`;
        }
      }
      return { ...prev, recommendedDrills: updatedDrills };
    });
  };

  const handleRemoveDrill = (index) => {
    setEditContent(prev => ({
      ...prev,
      recommendedDrills: prev.recommendedDrills.filter((_, i) => i !== index),
    }));
  };

  const handleAddSCExercise = (exercise) => {
    // Check if already added
    const alreadyAdded = editContent.strengthAndConditioning.some(
      ex => ex.exerciseId === exercise._id || ex.name === exercise.name
    );
    if (alreadyAdded) {
      showToast.info('Exercise already added');
      return;
    }

    const newExercise = {
      exerciseId: exercise._id,
      name: exercise.name,
      sets: exercise.defaultSets || 3,
      reps: exercise.defaultReps || '10',
      description: exercise.description || '',
      videoUrl: exercise.videoUrl || '',
      thumbnailUrl: exercise.thumbnailUrl || '',
      order: editContent.strengthAndConditioning.length,
    };
    setEditContent(prev => ({
      ...prev,
      strengthAndConditioning: [...prev.strengthAndConditioning, newExercise],
    }));
  };

  const handleUpdateSCExercise = (index, field, value) => {
    setEditContent(prev => {
      const updated = [...prev.strengthAndConditioning];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, strengthAndConditioning: updated };
    });
  };

  const handleRemoveSCExercise = (index) => {
    setEditContent(prev => ({
      ...prev,
      strengthAndConditioning: prev.strengthAndConditioning.filter((_, i) => i !== index),
    }));
  };

  // Open edit dialog at a specific tab
  const handleEditSection = (recipient, tabIndex) => {
    setSelectedRecipient(recipient);
    setEditContent({
      coachNotes: recipient.coachNotes || '',
      recommendedExercises: recipient.recommendedExercises || [],
      recommendedDrills: recipient.recommendedDrills || [],
      strengthAndConditioning: recipient.strengthAndConditioning || [],
    });
    setEditTab(tabIndex);
    setEditDialogOpen(true);
    loadAvailableExercises();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCompletionPercentage = (recipient) => {
    let total = 0;
    let completed = 0;

    if (recipient.recommendedDrills?.length > 0) {
      total += recipient.recommendedDrills.length;
      completed += recipient.drillsCompleted?.length || 0;
    }
    if (recipient.recommendedExercises?.length > 0) {
      total += 1;
      if (recipient.exercisesAcknowledgedAt) completed += 1;
    }
    if (recipient.strengthAndConditioning?.length > 0) {
      total += 1;
      if (recipient.scAcknowledgedAt) completed += 1;
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (error || !mission) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error || 'Mission not found'}</Alert>
          <Button onClick={() => navigate('/missions')} sx={{ mt: 2 }}>
            Back to Missions
          </Button>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/missions')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" component="h1">
                {mission.title}
              </Typography>
              <Chip
                label={mission.status}
                sx={{
                  backgroundColor: STATUS_COLORS[mission.status],
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
            {mission.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {mission.description}
              </Typography>
            )}
          </Box>
          {mission.status === 'DRAFT' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={generating ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
                onClick={handleGenerateContent}
                disabled={generating || recipients.length === 0}
              >
                {generating ? 'Generating...' : 'Generate Content'}
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setSendDialogOpen(true)}
                disabled={recipients.length === 0}
              >
                Send Mission
              </Button>
            </Box>
          )}
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Recipients
                </Typography>
                <Typography variant="h4">{mission.totalRecipients || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          {mission.status !== 'DRAFT' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Read
                    </Typography>
                    <Typography variant="h4">
                      {mission.stats?.totalRead || 0} / {mission.stats?.totalSent || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Drills Completed
                    </Typography>
                    <Typography variant="h4">{mission.stats?.totalDrillsCompleted || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Exercises Acknowledged
                    </Typography>
                    <Typography variant="h4">{mission.stats?.totalExercisesAcked || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
          {mission.dueDate && (
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Due Date
                  </Typography>
                  <Typography variant="h6">{formatDate(mission.dueDate)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label={`Recipients (${recipients.length})`} value="recipients" />
          </Tabs>
        </Paper>

        {/* Recipients List */}
        {activeTab === 'recipients' && (
          <Box>
            {recipients.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No recipients added yet. Go back and add teams or players.
                </Typography>
              </Paper>
            ) : (
              recipients.map((recipient) => (
                <Accordion key={recipient._id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                      <Avatar>
                        {recipient.playerName?.[0] || <PersonIcon />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          {recipient.playerName || 'Unknown Player'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {recipient.teamName || 'No team'}
                        </Typography>
                      </Box>
                      {mission.status !== 'DRAFT' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            size="small"
                            label={recipient.status}
                            sx={{
                              backgroundColor: STATUS_COLORS[recipient.status],
                              color: 'white',
                            }}
                          />
                          <Box sx={{ width: 100 }}>
                            <LinearProgress
                              variant="determinate"
                              value={getCompletionPercentage(recipient)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {getCompletionPercentage(recipient)}% complete
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {mission.status === 'DRAFT' && recipient.contentGenerated && (
                        <Chip size="small" label="Content Generated" color="success" variant="outlined" />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Recommended Exercises */}
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <FitnessCenterIcon color="primary" />
                            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Recommended Exercises</Typography>
                            {recipient.exercisesAcknowledgedAt && (
                              <CheckCircleIcon color="success" fontSize="small" />
                            )}
                            {mission.status === 'DRAFT' && (
                              <IconButton size="small" onClick={() => handleEditSection(recipient, 0)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          {recipient.recommendedExercises?.length > 0 ? (
                            <List dense>
                              {recipient.recommendedExercises.map((ex, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText
                                    primary={ex.name}
                                    secondary={ex.description}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No exercises assigned
                            </Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* Recommended Drills */}
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SportsSoccerIcon color="primary" />
                            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Recommended Drills</Typography>
                            {mission.status === 'DRAFT' && (
                              <IconButton size="small" onClick={() => handleEditSection(recipient, 1)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          {recipient.recommendedDrills?.length > 0 ? (
                            <List dense>
                              {recipient.recommendedDrills.map((drill, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText
                                    primary={drill.drillName}
                                    secondary={
                                      <Box component="span">
                                        {drill.reason}
                                        {drill.previousScore !== undefined && (
                                          <Chip
                                            size="small"
                                            label={`Previous: ${drill.previousScore}%`}
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
                                    }
                                  />
                                  {recipient.drillsCompleted?.includes(drill.drillType) && (
                                    <ListItemSecondaryAction>
                                      <CheckCircleIcon color="success" />
                                    </ListItemSecondaryAction>
                                  )}
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No drills assigned
                            </Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* S&C Exercises */}
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SportsIcon color="primary" />
                            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Strength & Conditioning</Typography>
                            {recipient.scAcknowledgedAt && (
                              <CheckCircleIcon color="success" fontSize="small" />
                            )}
                            {mission.status === 'DRAFT' && (
                              <IconButton size="small" onClick={() => handleEditSection(recipient, 2)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          {recipient.strengthAndConditioning?.length > 0 ? (
                            <List dense>
                              {recipient.strengthAndConditioning.map((sc, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText
                                    primary={sc.name}
                                    secondary={`${sc.sets} sets x ${sc.reps} reps`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No S&C exercises assigned
                            </Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* Coach Notes */}
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <NoteIcon color="primary" />
                            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Coach Notes</Typography>
                            {mission.status === 'DRAFT' && (
                              <IconButton size="small" onClick={() => handleEditSection(recipient, 3)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          {recipient.coachNotes ? (
                            <Typography variant="body2">{recipient.coachNotes}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No notes added
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Actions */}
                    {mission.status === 'DRAFT' && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditRecipient(recipient)}
                        >
                          Edit Content
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveRecipient(typeof recipient.playerId === 'object' ? recipient.playerId._id : recipient.playerId)}
                        >
                          Remove
                        </Button>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        )}

        {/* Send Confirmation Dialog */}
        <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)}>
          <DialogTitle>Send Mission</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to send this mission to {recipients.length} recipients?
              They will receive a notification with their personalized training content.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSendMission}
              disabled={sending}
            >
              {sending ? <CircularProgress size={20} /> : 'Send Mission'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Content Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Edit Content for {selectedRecipient?.playerName}
          </DialogTitle>
          <DialogContent sx={{ minHeight: 400 }}>
            <Tabs value={editTab} onChange={(e, v) => setEditTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tab label="Exercises" icon={<FitnessCenterIcon />} iconPosition="start" />
              <Tab label="Drills" icon={<SportsSoccerIcon />} iconPosition="start" />
              <Tab label="S&C" icon={<SportsIcon />} iconPosition="start" />
              <Tab label="Notes" icon={<NoteIcon />} iconPosition="start" />
            </Tabs>

            {/* Tab 0: Recommended Exercises */}
            {editTab === 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Current Exercises</Typography>
                {editContent.recommendedExercises.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No exercises assigned
                  </Typography>
                ) : (
                  <List dense sx={{ mb: 2 }}>
                    {editContent.recommendedExercises.map((ex, idx) => (
                      <ListItem key={idx} secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveExercise(idx)} size="small">
                          <DeleteIcon color="error" />
                        </IconButton>
                      }>
                        <ListItemText
                          primary={ex.name}
                          secondary={ex.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Add Exercise</Typography>
                {exercisesLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Autocomplete
                    options={availableExercises}
                    getOptionLabel={(option) => option.name?.en || option.name || ''}
                    onChange={(e, value) => value && handleAddExercise(value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Search exercises..." size="small" />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option._id}>
                        <Box>
                          <Typography variant="body2">{option.name?.en || option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.category} | {option.difficulty}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    value={null}
                    blurOnSelect
                  />
                )}
              </Box>
            )}

            {/* Tab 1: Recommended Drills */}
            {editTab === 1 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Current Drills</Typography>
                {editContent.recommendedDrills.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No drills assigned
                  </Typography>
                ) : (
                  <List dense sx={{ mb: 2 }}>
                    {editContent.recommendedDrills.map((drill, idx) => (
                      <ListItem key={idx} sx={{ alignItems: 'flex-start', py: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Drill Type</InputLabel>
                            <Select
                              value={drill.drillType}
                              label="Drill Type"
                              onChange={(e) => handleUpdateDrill(idx, 'drillType', e.target.value)}
                            >
                              {DRILL_TYPES.map(dt => (
                                <MenuItem key={dt.value} value={dt.value}>{dt.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <InputLabel>Level</InputLabel>
                            <Select
                              value={drill.drillLevel}
                              label="Level"
                              onChange={(e) => handleUpdateDrill(idx, 'drillLevel', e.target.value)}
                            >
                              {[1, 2, 3, 4, 5].map(level => (
                                <MenuItem key={level} value={String(level)}>{level}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            size="small"
                            label="Reason"
                            value={drill.reason}
                            onChange={(e) => handleUpdateDrill(idx, 'reason', e.target.value)}
                            sx={{ flexGrow: 1 }}
                          />
                          <IconButton onClick={() => handleRemoveDrill(idx)} size="small">
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddDrill}
                  size="small"
                >
                  Add Drill
                </Button>
              </Box>
            )}

            {/* Tab 2: S&C Exercises */}
            {editTab === 2 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Current S&C Exercises</Typography>
                {editContent.strengthAndConditioning.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No S&C exercises assigned
                  </Typography>
                ) : (
                  <List dense sx={{ mb: 2 }}>
                    {editContent.strengthAndConditioning.map((sc, idx) => (
                      <ListItem key={idx} sx={{ alignItems: 'flex-start', py: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                          <Typography variant="body2" sx={{ minWidth: 150 }}>{sc.name}</Typography>
                          <TextField
                            size="small"
                            label="Sets"
                            type="number"
                            value={sc.sets}
                            onChange={(e) => handleUpdateSCExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                            sx={{ width: 80 }}
                          />
                          <TextField
                            size="small"
                            label="Reps"
                            value={sc.reps}
                            onChange={(e) => handleUpdateSCExercise(idx, 'reps', e.target.value)}
                            sx={{ width: 100 }}
                          />
                          <IconButton onClick={() => handleRemoveSCExercise(idx)} size="small">
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Add S&C Exercise</Typography>
                {exercisesLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Autocomplete
                    options={availableSCExercises}
                    getOptionLabel={(option) => option.name || ''}
                    onChange={(e, value) => value && handleAddSCExercise(value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Search S&C exercises..." size="small" />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option._id}>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.category} | {option.defaultSets} sets x {option.defaultReps}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    value={null}
                    blurOnSelect
                  />
                )}
              </Box>
            )}

            {/* Tab 3: Coach Notes */}
            {editTab === 3 && (
              <Box>
                <TextField
                  fullWidth
                  label="Coach Notes"
                  value={editContent.coachNotes}
                  onChange={(e) => setEditContent({ ...editContent, coachNotes: e.target.value })}
                  multiline
                  rows={6}
                  placeholder="Add personalized notes for this player..."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveRecipientContent}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default MissionDetail;
