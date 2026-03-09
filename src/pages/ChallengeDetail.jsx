import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  FormGroup,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useSelector } from 'react-redux';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SportsIcon from '@mui/icons-material/Sports';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import TimelineIcon from '@mui/icons-material/Timeline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VideocamIcon from '@mui/icons-material/Videocam';
import SortIcon from '@mui/icons-material/Sort';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AppLayout from '../components/AppLayout';
import challengeService from '../api/challengeService';
import showToast from '../utils/toast';
import { selectCurrentUser } from '../store/authSlice';

// Drill type to icon mapping
const DRILL_ICONS = {
  'TRIPLE_CONE_DRILL': SportsSoccerIcon,
  'Triple Cone Drill': SportsSoccerIcon,
  '7_CONE_WEAVE': TimelineIcon,
  '7 Cone Weave': TimelineIcon,
  'ZIGZAG_DRILL': DirectionsRunIcon,
  'Zigzag Drill': DirectionsRunIcon,
  'FIGURE_OF_8_DRILL': TimelineIcon,
  'Figure of 8 Drill': TimelineIcon,
  'DIAMOND_DRIBBLING': SportsSoccerIcon,
  'Diamond Dribbling': SportsSoccerIcon,
  'DRIBBLE_PASS_DRIBBLE': DirectionsRunIcon,
  'Dribble Pass Dribble': DirectionsRunIcon,
  'THREE_GATE_PASS': SportsIcon,
  'Three Gate Pass': SportsIcon,
  'PASSING_RECEIVING_TURNING': SportsIcon,
  'Passing Receiving Turning': SportsIcon,
  'KEEPY_UPPIES': SportsSoccerIcon,
  'Keepy Uppies': SportsSoccerIcon,
  'DRIBBLE_ZIGZAG_DRIBBLE': DirectionsRunIcon,
  'Dribble Zigzag Dribble': DirectionsRunIcon,
  'CHEST_CONTROL_DRIBBLE': SportsSoccerIcon,
  'Chest Control Dribble': SportsSoccerIcon,
  'THREE_GATE_PASS_DRIBBLE': SportsIcon,
  'Three Gate Pass Dribble': SportsIcon,
  'FIVE_CONE_DRILL': SportsSoccerIcon,
  'Five Cone Drill': SportsSoccerIcon,
};

// Drill type to color mapping
const DRILL_COLORS = {
  'TRIPLE_CONE_DRILL': '#3B82F6',
  'Triple Cone Drill': '#3B82F6',
  '7_CONE_WEAVE': '#8B5CF6',
  '7 Cone Weave': '#8B5CF6',
  'ZIGZAG_DRILL': '#10B981',
  'Zigzag Drill': '#10B981',
  'FIGURE_OF_8_DRILL': '#F59E0B',
  'Figure of 8 Drill': '#F59E0B',
  'DIAMOND_DRIBBLING': '#EC4899',
  'Diamond Dribbling': '#EC4899',
  'DRIBBLE_PASS_DRIBBLE': '#6366F1',
  'Dribble Pass Dribble': '#6366F1',
  'THREE_GATE_PASS': '#14B8A6',
  'Three Gate Pass': '#14B8A6',
  'PASSING_RECEIVING_TURNING': '#F97316',
  'Passing Receiving Turning': '#F97316',
  'KEEPY_UPPIES': '#EF4444',
  'Keepy Uppies': '#EF4444',
  'default': '#6B7280',
};

const getDrillIcon = (drillType) => {
  return DRILL_ICONS[drillType] || SportsSoccerIcon;
};

const getDrillColor = (drillType) => {
  return DRILL_COLORS[drillType] || DRILL_COLORS['default'];
};

const STATUS_COLORS = {
  pending: '#F59E0B',
  active: '#10B981',
  completed: '#6366F1',
  cancelled: '#6B7280',
};

const PROGRESS_COLORS = {
  not_started: '#D1D5DB',
  in_progress: '#3B82F6',
  processing: '#F59E0B',
  completed: '#10B981',
};

const ChallengeDetail = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [participantDrillsOpen, setParticipantDrillsOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantDrills, setParticipantDrills] = useState(null);
  const [sortByPerformance, setSortByPerformance] = useState(false);
  const [sortByCompletion, setSortByCompletion] = useState(false);
  const [participantViewMode, setParticipantViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  useEffect(() => {
    if (challenge && challenge.version === 'v2') {
      loadProgress();
    }
  }, [challenge]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const response = await challengeService.getChallengeById(challengeId);

      if (response.success) {
        setChallenge(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading challenge:', err);
      setError(err.response?.data?.message || 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await challengeService.getChallengeProgress(challengeId);
      if (response.success) {
        setProgress(response.data);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const loadParticipantDrills = async (userId, userName) => {
    try {
      const response = await challengeService.getParticipantDrills(challengeId, userId);
      if (response.success) {
        setParticipantDrills(response.data);
        setSelectedParticipant({ userId, userName });
        setParticipantDrillsOpen(true);
      }
    } catch (err) {
      console.error('Error loading participant drills:', err);
      showToast.error('Failed to load participant drills');
    }
  };

  const handleAccept = async () => {
    try {
      const response = await challengeService.acceptChallenge(challengeId);
      if (response.success) {
        showToast.success('Challenge accepted!');
        loadChallenge();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to accept challenge');
    }
  };

  const handleDecline = async () => {
    try {
      const response = await challengeService.declineChallenge(challengeId);
      if (response.success) {
        showToast.success('Challenge declined');
        navigate('/challenges');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to decline challenge');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await challengeService.cancelChallenge(challengeId);
      if (response.success) {
        showToast.success('Challenge cancelled');
        loadChallenge();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to cancel challenge');
    }
  };

  const handleEnableChat = async () => {
    try {
      const response = await challengeService.enableChallengeChat(challengeId);
      if (response.success) {
        showToast.success('Challenge chat enabled!');
        loadChallenge();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to enable chat');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Sort participants based on selected criteria
  const sortedParticipants = useMemo(() => {
    if (!challenge?.participants || !progress?.participants) {
      return challenge?.participants || [];
    }

    let sorted = [...challenge.participants];

    if (sortByPerformance || sortByCompletion) {
      sorted.sort((a, b) => {
        const progressA = progress.participants.find(p => p.userId === a.userId._id);
        const progressB = progress.participants.find(p => p.userId === b.userId._id);

        if (!progressA && !progressB) return 0;
        if (!progressA) return 1;
        if (!progressB) return -1;

        if (sortByPerformance) {
          // Sort by overall score (descending)
          return (progressB.overallScore || 0) - (progressA.overallScore || 0);
        } else if (sortByCompletion) {
          // Sort by completion percentage (descending)
          return (progressB.completionPercentage || 0) - (progressA.completionPercentage || 0);
        }
        return 0;
      });
    }

    return sorted;
  }, [challenge?.participants, progress?.participants, sortByPerformance, sortByCompletion]);

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppLayout>
    );
  }

  if (error || !challenge) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error || 'Challenge not found'}</Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/challenges')} sx={{ mt: 2 }}>
            Back to Challenges
          </Button>
        </Container>
      </AppLayout>
    );
  }

  const isCreator = challenge.creator._id === currentUser?.sub;
  const userParticipant = challenge.participants.find(p => p.userId._id === currentUser?.sub);
  const isPending = userParticipant?.status === 'pending';
  const canAcceptDecline = isPending && !isCreator;
  const canCancel = isCreator && challenge.status !== 'completed' && challenge.status !== 'cancelled';
  const canEnableChat = isCreator && !challenge.groupChatId;

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/challenges')}>
            Back to Challenges
          </Button>
        </Box>

        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              label={challenge.challengeType}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
            <Chip
              label={challenge.status}
              size="small"
              sx={{
                backgroundColor: STATUS_COLORS[challenge.status],
                color: 'white',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Box>

          <Typography variant="h4" component="h1" gutterBottom>
            {challenge.title}
          </Typography>

          {challenge.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {challenge.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Start:</strong> {formatDate(challenge.startDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>End:</strong> {formatDate(challenge.endDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Creator:</strong> {challenge.creator.name}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button startIcon={<RefreshIcon />} onClick={loadChallenge} variant="outlined">
              Refresh
            </Button>

            {canAcceptDecline && (
              <>
                <Button
                  startIcon={<CheckCircleIcon />}
                  onClick={handleAccept}
                  variant="contained"
                  color="success"
                >
                  Accept Challenge
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleDecline}
                  variant="outlined"
                  color="error"
                >
                  Decline
                </Button>
              </>
            )}

            {canCancel && (
              <Button
                startIcon={<CancelPresentationIcon />}
                onClick={handleCancel}
                variant="outlined"
                color="error"
              >
                Cancel Challenge
              </Button>
            )}

            {canEnableChat && (
              <Button startIcon={<ChatIcon />} onClick={handleEnableChat} variant="outlined">
                Enable Chat
              </Button>
            )}

            {challenge.groupChatId && (
              <Button startIcon={<ChatIcon />} variant="outlined">
                Challenge Chat
              </Button>
            )}

            {challenge.version === 'v2' && progress && (
              <Button
                startIcon={<VisibilityIcon />}
                onClick={() => setProgressDialogOpen(true)}
                variant="outlined"
              >
                View Progress
              </Button>
            )}
          </Box>
        </Paper>

        {/* Challenge Drills */}
        {challenge.version === 'v2' && challenge.challengeDrills && challenge.challengeDrills.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Challenge Drills ({challenge.challengeDrills.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {challenge.challengeDrills.map((drill, index) => {
                const DrillIcon = getDrillIcon(drill.gameType);
                const drillColor = getDrillColor(drill.gameType);
                const drillName = drill.gameType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      pr: 2,
                      borderRadius: 2,
                      backgroundColor: `${drillColor}10`,
                      border: `1px solid ${drillColor}30`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        backgroundColor: `${drillColor}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DrillIcon sx={{ color: drillColor, fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {drillName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Level {drill.drillLevel} {drill.required ? '' : '(Optional)'}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* Participants */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Typography variant="h6">
              Participants ({challenge.participants.length})
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={participantViewMode}
                exclusive
                onChange={(e, newMode) => {
                  if (newMode !== null) setParticipantViewMode(newMode);
                }}
                size="small"
              >
                <ToggleButton value="grid">
                  <Tooltip title="Grid View">
                    <GridViewIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="list">
                  <Tooltip title="List View">
                    <ViewListIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Sorting Options */}
              {progress && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SortIcon color="action" fontSize="small" />
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={sortByPerformance}
                          onChange={(e) => {
                            setSortByPerformance(e.target.checked);
                            if (e.target.checked) setSortByCompletion(false);
                          }}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">By Score</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={sortByCompletion}
                          onChange={(e) => {
                            setSortByCompletion(e.target.checked);
                            if (e.target.checked) setSortByPerformance(false);
                          }}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">By Completion</Typography>}
                    />
                  </FormGroup>
                </Box>
              )}
            </Box>
          </Box>

          {/* List View */}
          {participantViewMode === 'list' && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Participant</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Progress</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell align="center">Drills</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedParticipants.map((participant, index) => {
                    const participantProgress = progress?.participants.find(
                      p => p.userId === participant.userId._id
                    );
                    const showRank = (sortByPerformance || sortByCompletion) && participantProgress;
                    const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                    return (
                      <TableRow key={participant.userId._id} hover>
                        <TableCell>
                          {showRank ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {rankMedal && <span>{rankMedal}</span>}
                              <Typography variant="body2">#{index + 1}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={participant.userId.profilePicture} sx={{ width: 32, height: 32 }}>
                              {participant.userId.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{participant.userId.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={participant.status}
                            size="small"
                            color={participant.status === 'accepted' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {participantProgress ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={participantProgress.completionPercentage}
                                sx={{
                                  width: 60,
                                  height: 6,
                                  borderRadius: 1,
                                  backgroundColor: '#E5E7EB',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: PROGRESS_COLORS[participantProgress.status],
                                  },
                                }}
                              />
                              <Typography variant="caption">{participantProgress.completionPercentage}%</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={500}>
                            {participantProgress?.overallScore?.toFixed(1) || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {participantProgress ? `${participantProgress.drillsCompleted}/${participantProgress.totalDrills}` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {participantProgress && (
                            <Button
                              size="small"
                              onClick={() => loadParticipantDrills(participant.userId._id, participant.userId.name)}
                            >
                              View Drills
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Grid View */}
          {participantViewMode === 'grid' && (
          <Grid container spacing={2}>
            {sortedParticipants.map((participant, index) => {
              const participantProgress = progress?.participants.find(
                p => p.userId === participant.userId._id
              );

              // Show ranking medal if sorting is active
              const showRank = (sortByPerformance || sortByCompletion) && participantProgress;
              const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

              return (
                <Grid item xs={12} sm={6} md={4} key={participant.userId._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar src={participant.userId.profilePicture}>
                            {participant.userId.name.charAt(0)}
                          </Avatar>
                          {showRank && rankMedal && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                fontSize: '1rem',
                              }}
                            >
                              {rankMedal}
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">{participant.userId.name}</Typography>
                            {showRank && (
                              <Typography variant="caption" color="text.secondary">
                                #{index + 1}
                              </Typography>
                            )}
                          </Box>
                          <Chip
                            label={participant.status}
                            size="small"
                            color={participant.status === 'accepted' ? 'success' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>

                      {participantProgress && (
                        <>
                          <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Progress
                              </Typography>
                              <Typography variant="caption" fontWeight={600}>
                                {participantProgress.completionPercentage}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={participantProgress.completionPercentage}
                              sx={{
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: '#E5E7EB',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: PROGRESS_COLORS[participantProgress.status],
                                },
                              }}
                            />
                          </Box>

                          <Typography variant="caption" color="text.secondary">
                            {participantProgress.drillsCompleted} / {participantProgress.totalDrills} drills completed
                          </Typography>

                          <Button
                            size="small"
                            fullWidth
                            sx={{ mt: 1 }}
                            onClick={() => loadParticipantDrills(participant.userId._id, participant.userId.name)}
                          >
                            View Drills
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          )}
        </Paper>

        {/* Progress Dialog */}
        <Dialog
          open={progressDialogOpen}
          onClose={() => setProgressDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Challenge Progress</DialogTitle>
          <DialogContent>
            {progress && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Overall progress for all participants
                </Typography>
                {progress.participants.map((p) => (
                  <Box key={p.userId} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{p.name}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {p.completionPercentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={p.completionPercentage}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {p.drillsCompleted} / {p.totalDrills} drills • Score: {p.overallScore.toFixed(1)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProgressDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Participant Drills Dialog */}
        <Dialog
          open={participantDrillsOpen}
          onClose={() => setParticipantDrillsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedParticipant?.userName} - Drills
          </DialogTitle>
          <DialogContent>
            {participantDrills && (
              <Box>
                {participantDrills.drills.map((drill, index) => {
                  const DrillIcon = getDrillIcon(drill.gameType);
                  const drillColor = getDrillColor(drill.gameType);

                  return (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: index < participantDrills.drills.length - 1 ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {/* Drill Icon */}
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            backgroundColor: `${drillColor}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <DrillIcon sx={{ color: drillColor, fontSize: 24 }} />
                        </Box>

                        {/* Drill Info */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2">{drill.drillName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Level {drill.drillLevel} {drill.required ? '(Required)' : '(Optional)'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {drill.status === 'completed' ? (
                              <>
                                <Chip label="Completed" size="small" color="success" />
                                <Typography variant="body2" component="span">
                                  Score: {drill.score?.toFixed(1) || 'N/A'}
                                </Typography>
                              </>
                            ) : drill.status === 'processing' ? (
                              <Chip label="Processing" size="small" color="warning" />
                            ) : (
                              <Chip label="Not Started" size="small" />
                            )}
                          </Box>
                        </Box>

                        {/* Video Button */}
                        {drill.videoUrl && (
                          <Tooltip title="Watch Video">
                            <IconButton
                              onClick={() => window.open(drill.videoUrl, '_blank')}
                              sx={{
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: '#2563EB',
                                },
                              }}
                              size="small"
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {drill.status === 'processing' && !drill.videoUrl && (
                          <Tooltip title="Video processing...">
                            <IconButton disabled size="small">
                              <VideocamIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setParticipantDrillsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default ChallengeDetail;
