import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Avatar,
  Alert,
  Collapse,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideocamIcon from '@mui/icons-material/Videocam';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import peilAvatar from '../assets/images/peil-avatar-48.png';
import AppLayout from '../components/AppLayout';
import Breadcrumbs from '../components/Breadcrumbs';
import DrillReportProfessional from '../components/DrillReportProfessional';
import CoachRatingsTab from '../components/CoachRatingsTab';
import playerService from '../api/playerService';
import superAdminService from '../api/superAdminService';
import recommendationService from '../api/recommendationService';
import wizardService from '../api/wizardService';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NoteIcon from '@mui/icons-material/StickyNote2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import HelpIcon from '@mui/icons-material/Help';
import { selectCurrentUser, selectPrimaryRole, selectUserRoles, selectHasDawAccess, selectDawTier, selectIsPlatformEngineering } from '../store/authSlice';
import WizardDrawer, { DRAWER_WIDTH } from '../components/wizard/WizardDrawer';
import AnnotationVideoToggle from '../components/wizard/AnnotationVideoToggle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import PatchTester from '../components/sandbox/PatchTester';
import ReprocessPanel from '../components/reprocess/ReprocessPanel';
import TagDialog from '../components/peil/TagDialog';
import tagService from '../api/tagService';

const DrillScoreItem = ({ data, title }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const formatPercentScore = (score) => {
    return score !== null && score !== undefined ? `${Math.round(score)}%` : 'N/A';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Tooltip title={data.description || ''} placement="top">
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Chip
              label={getScoreStatus(data?.scores?.raw_score)}
              size="small"
              color={data?.scores?.raw_score >= 80 ? 'success' : data?.scores?.raw_score >= 60 ? 'warning' : 'error'}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              {formatPercentScore(data?.scores?.raw_score)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${data?.scores?.attempted_pattern_count || 0} of ${data?.scores?.pattern_count || 5}`}
                size="small"
                variant="outlined"
              />
              <VideocamIcon fontSize="small" />
            </Box>
          </Box>

          {/* Category breakdown */}
          {data?.categories && Object.entries(data.categories).length > 0 && (
            <Box sx={{ mt: 2 }}>
              {Object.entries(data.categories).map(([key, value]) => (
                <Box key={key} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{key}</Typography>
                    <Chip
                      label={getScoreStatus(value.scores?.score)}
                      size="small"
                      color={value.scores?.score >= 80 ? 'success' : value.scores?.score >= 60 ? 'warning' : 'error'}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {formatPercentScore(value.scores?.score)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={value.scores?.score || 0}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(value.scores?.score)
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Tooltip>
    </Paper>
  );
};

const ClipPlayer = ({ src, startTime, endTime }) => {
  const videoRef = React.useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && src) {
      video.currentTime = startTime;

      const handleTimeUpdate = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          video.currentTime = startTime;
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [src, startTime, endTime]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', maxHeight: '200px', borderRadius: '8px' }}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

const DrillDetail = () => {
  const { playerId, drillId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const hasDawAccess = useSelector(selectHasDawAccess);
  const dawTier = useSelector(selectDawTier);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  // Check if user is superadmin or platform_engineering (DAW tier)
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles?.some(r => r.role === 'superadmin' || r === 'superadmin');
  const [loading, setLoading] = useState(false);
  const [drill, setDrill] = useState(null);
  const [scores, setScores] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerProfilePicture, setPlayerProfilePicture] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);
  const [recommendationSuccess, setRecommendationSuccess] = useState(null);
  const [isRequeueing, setIsRequeueing] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [copiedDrillId, setCopiedDrillId] = useState(false);
  const [drillTags, setDrillTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [requeueDialogOpen, setRequeueDialogOpen] = useState(false);
  const [requeueNote, setRequeueNote] = useState('');
  const [requeueError, setRequeueError] = useState('');
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addNoteError, setAddNoteError] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [rateRejectionDialogOpen, setRateRejectionDialogOpen] = useState(false);
  const [isRatingRejection, setIsRatingRejection] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeAnnotationUrl, setActiveAnnotationUrl] = useState(null);
  const [hasExistingSessions, setHasExistingSessions] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [pipelineValidation, setPipelineValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [observationsExpanded, setObservationsExpanded] = useState(false);

  // Admin UI base URL for sharing
  const ADMIN_UI_BASE_URL = 'https://admin-ui.aim-football.com';

  // Check if the current user is viewing their own drill
  const isViewingOwnDrill = currentUser?.id === playerId;

  useEffect(() => {
    if (playerId && drillId) {
      fetchDrillData();
    }
  }, [playerId, drillId]);

  useEffect(() => {
    if (!hasDawAccess || !drillId) return;
    wizardService.getSessions(drillId, 1, 0).then(data => {
      setHasExistingSessions(data.total > 0);
    }).catch(() => {});
  }, [drillId, hasDawAccess]);

  useEffect(() => {
    if (!hasDawAccess || !drillId) return;
    wizardService.getValidation(drillId).then(data => {
      if (data.manual_validations?.length > 0) {
        setValidationResult(data.manual_validations[data.manual_validations.length - 1]);
      } else if (data.pipeline_validation) {
        // Show pipeline/bulk validation as the main result when no manual validation exists
        setValidationResult(data.pipeline_validation);
      }
      if (data.pipeline_validation) {
        setPipelineValidation(data.pipeline_validation);
      }
    }).catch(() => {});
  }, [drillId, hasDawAccess]);

  const fetchDrillTags = async () => {
    try {
      const allTags = await tagService.listTags();
      const tagList = allTags.data || allTags.tags || [];
      const tagsForDrill = tagList.filter(
        t => t.drill_ids?.includes(drillId)
      );
      setDrillTags(tagsForDrill.map(t => t.tag_name));
    } catch {
      // Tags are non-critical
    }
  };

  useEffect(() => {
    if (!hasDawAccess || !drillId) return;
    fetchDrillTags();
  }, [drillId, hasDawAccess]);

  const handleRemoveTag = async (tagName) => {
    try {
      await tagService.updateTag(tagName, { remove_drill_ids: [drillId] });
      setDrillTags(prev => prev.filter(t => t !== tagName));
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const fetchDrillData = async () => {
    setLoading(true);
    try {
      let drillResponse, scoresResponse, highlightsResponse, playerStatsResponse;

      if (isSuperAdmin) {
        // Superadmin viewing any drill - use superadmin endpoints (no team permission check)
        [drillResponse, scoresResponse, highlightsResponse, playerStatsResponse] = await Promise.all([
          superAdminService.getDrillById(drillId),
          superAdminService.getDrillScoresById(drillId),
          superAdminService.getDrillHighlightsById(drillId),
          superAdminService.getPlayerById(playerId),
        ]);

        // Get player name and profile picture from API response
        if (playerStatsResponse?.data?.name) {
          setPlayerName(playerStatsResponse.data.name);
          setPlayerProfilePicture(playerStatsResponse.data.profilePicture || '');
        }
      } else if (isViewingOwnDrill) {
        // Player viewing their own drill - use player-specific endpoints
        [drillResponse, scoresResponse, highlightsResponse] = await Promise.all([
          playerService.getMyDrillDetails(drillId),
          playerService.getMyDrillScores(drillId),
          playerService.getMyDrillHighlights(drillId),
        ]);

        // Set player name from current user
        setPlayerName(currentUser.name);
        setPlayerProfilePicture(currentUser.profilePicture || '');
      } else {
        // Coach viewing player's drill - use coach endpoints
        [drillResponse, scoresResponse, highlightsResponse, playerStatsResponse] = await Promise.all([
          playerService.getDrillDetails(playerId, drillId),
          playerService.getDrillScores(playerId, drillId),
          playerService.getDrillHighlights(playerId, drillId),
          playerService.getPlayerStats(playerId),
        ]);

        // Get player name and profile picture from API response
        if (playerStatsResponse?.data?.name) {
          setPlayerName(playerStatsResponse.data.name);
          setPlayerProfilePicture(playerStatsResponse.data.profilePicture || '');
        } else if (window.history.state && window.history.state.playerName) {
          // Fallback to URL state if available
          setPlayerName(window.history.state.playerName);
        }
      }

      setDrill(drillResponse.data);
      setScores(scoresResponse.data);
      setHighlights(highlightsResponse.data);

      // Load recommendations after scores are available
      // This will auto-generate if none exist and scores are present
      if (scoresResponse.data) {
        loadRecommendations(true, scoresResponse.data);
      }
    } catch (error) {
      console.error('Error fetching drill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (autoGenerate = true, drillScores = null) => {
    if (!drillId) return;

    // Use provided scores or fall back to state
    const hasScores = drillScores || scores;

    try {
      setLoadingRecommendations(true);
      setRecommendationError(null);
      const response = await recommendationService.getDrillRecommendations(drillId);

      if (response.success && response.data) {
        setRecommendations(response.data);

        // Auto-generate if no recommendations exist and drill has scores
        if (autoGenerate && response.data.length === 0 && hasScores) {
          console.log('Auto-generating recommendations for drill with scores');
          await handleGenerateRecommendations(true); // Pass true to indicate auto-generation
        }
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Silently fail - recommendations might not exist yet
      setRecommendations([]);

      // Try auto-generating if drill has scores
      if (autoGenerate && hasScores) {
        try {
          await handleGenerateRecommendations(true);
        } catch (genError) {
          console.error('Auto-generation also failed:', genError);
        }
      }
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleGenerateRecommendations = async (isAutoGenerated = false) => {
    if (!drillId) return;

    try {
      setGeneratingRecommendations(true);
      if (!isAutoGenerated) {
        setRecommendationError(null);
        setRecommendationSuccess(null);
      }

      const response = await recommendationService.triggerDrillRecommendations(drillId);

      if (response.success) {
        // Only show success message if manually triggered
        if (!isAutoGenerated) {
          setRecommendationSuccess(
            `Generated ${response.recommendationsGenerated || 0} recommendation(s) successfully!`
          );
        }
        // Reload recommendations after generation (don't auto-generate again)
        await loadRecommendations(false);
      } else {
        if (!isAutoGenerated) {
          setRecommendationError(response.error || 'Failed to generate recommendations');
        }
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      if (!isAutoGenerated) {
        setRecommendationError(
          error.response?.data?.error || 'Failed to generate recommendations. Please try again.'
        );
      }
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  const formatPercentScore = (score) => {
    return score !== null && score !== undefined ? `${Math.round(score)}%` : 'N/A';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenRequeueDialog = () => {
    setRequeueNote('');
    setRequeueError('');
    setRequeueDialogOpen(true);
  };

  const handleCloseRequeueDialog = () => {
    setRequeueDialogOpen(false);
    setRequeueNote('');
    setRequeueError('');
  };

  const handleSkipPreClassifierRequeue = async () => {
    if (isRequeueing) return;

    // Validate note for superadmin
    if (isSuperAdmin && !requeueNote.trim()) {
      setRequeueError('Please provide a note explaining why you are requeuing this drill');
      return;
    }

    try {
      setIsRequeueing(true);
      setRequeueError('');
      // Use superadmin endpoint if user is superadmin (bypasses team permission check)
      if (isSuperAdmin) {
        await superAdminService.skipPreClassifierAndRequeue(drillId, requeueNote.trim());
      } else {
        await playerService.skipPreClassifierAndRequeue(playerId, drillId);
      }
      // Close dialog and refresh drill data after requeue
      handleCloseRequeueDialog();
      await fetchDrillData();
    } catch (error) {
      console.error('Error requeuing video:', error);
      setRequeueError(error.response?.data?.error || 'Failed to requeue video. Please try again.');
    } finally {
      setIsRequeueing(false);
    }
  };

  const handleCopyAdminLink = async () => {
    const adminLink = `${ADMIN_UI_BASE_URL}/users/${playerId}/drill-history/${drillId}`;
    try {
      await navigator.clipboard.writeText(adminLink);
      setCopiedAdminLink(true);
      setTimeout(() => setCopiedAdminLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy admin link:', error);
    }
  };

  const handleCopyDrillId = async () => {
    try {
      await navigator.clipboard.writeText(drillId);
      setCopiedDrillId(true);
      setTimeout(() => setCopiedDrillId(false), 2000);
    } catch (error) {
      console.error('Failed to copy drill ID:', error);
    }
  };

  const handleOpenAddNoteDialog = () => {
    setNewNote('');
    setAddNoteError('');
    setAddNoteDialogOpen(true);
  };

  const handleCloseAddNoteDialog = () => {
    setAddNoteDialogOpen(false);
    setNewNote('');
    setAddNoteError('');
  };

  const handleAddNote = async () => {
    if (isAddingNote) return;

    if (!newNote.trim()) {
      setAddNoteError('Please enter a note');
      return;
    }

    try {
      setIsAddingNote(true);
      setAddNoteError('');
      await superAdminService.addNoteToDrill(drillId, newNote.trim());
      handleCloseAddNoteDialog();
      // Refresh drill data to show the new note
      await fetchDrillData();
    } catch (error) {
      console.error('Error adding note:', error);
      setAddNoteError(error.response?.data?.error || 'Failed to add note. Please try again.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleOpenRateRejectionDialog = () => {
    setRateRejectionDialogOpen(true);
  };

  const handleCloseRateRejectionDialog = () => {
    setRateRejectionDialogOpen(false);
  };

  const handleRateRejection = async (rating) => {
    if (isRatingRejection) return;

    try {
      setIsRatingRejection(true);
      await superAdminService.rateRejection(drillId, rating);
      handleCloseRateRejectionDialog();
      // Refresh drill data to show the rating
      await fetchDrillData();
    } catch (error) {
      console.error('Error rating rejection:', error);
    } finally {
      setIsRatingRejection(false);
    }
  };

  const handleRunValidation = async () => {
    setValidating(true);
    setValidationError(null);
    try {
      const result = await wizardService.validateDrill(drillId);
      if (result.success === false || !result.classification) {
        setValidationError(result.error || 'Validation failed — no classification returned');
      } else {
        setValidationResult({
          classification: result.classification,
          compliance_score: result.compliance_score,
          drill_type_detected: result.drill_type_detected,
          metrics: result.metrics,
          observations: result.observations,
          bad_reason: result.bad_reason,
          rationale: result.rationale,
          requested_drill_type: result.requested_drill_type,
          model_used: result.model_used,
          validated_at: result.timestamp,
        });
        setObservationsExpanded(false);
      }
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleClearValidation = async () => {
    try {
      await wizardService.clearValidation(drillId);
      setValidationResult(null);
    } catch (err) {
      console.error('Failed to clear validation:', err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Breadcrumbs />
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, transition: 'margin-right 225ms cubic-bezier(0, 0, 0.2, 1)', ...(wizardOpen ? { marginRight: `${DRAWER_WIDTH}px` } : {}) }}>
        <Breadcrumbs />

        {/* Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" fontWeight="bold">
              {drill?.gameType || 'Drill Details'}
            </Typography>
            <Tooltip title={copiedDrillId ? 'Copied!' : `Click to copy full ID: ${drillId}`}>
              <Chip
                label={`ID: ${drillId?.substring(0, 12)}...`}
                size="small"
                onClick={handleCopyDrillId}
                icon={copiedDrillId ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                color={copiedDrillId ? 'success' : 'default'}
                sx={{
                  ml: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
            {drill?.notes && drill.notes.length > 0 && (
              <Tooltip
                title={
                  <Box sx={{ p: 1, maxWidth: 400 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Notes ({drill.notes.length})
                    </Typography>
                    {drill.notes.map((note, index) => (
                      <Box key={index} sx={{ mb: index < drill.notes.length - 1 ? 1.5 : 0 }}>
                        <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
                          {new Date(note.createdAt).toLocaleString()} by {note.createdBy?.name || 'Unknown'}
                        </Typography>
                        {note.action && (
                          <Chip
                            label={note.action.replace(/_/g, ' ')}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 18, my: 0.5 }}
                            color="info"
                          />
                        )}
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{note.message}</Typography>
                      </Box>
                    ))}
                  </Box>
                }
                arrow
                placement="bottom"
              >
                <NoteIcon
                  sx={{
                    fontSize: 24,
                    color: 'info.main',
                    cursor: 'help',
                    ml: 1.5
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={copiedAdminLink ? 'Copied!' : 'Copy Admin UI link for sharing'}>
              <Button
                variant="outlined"
                size="small"
                startIcon={copiedAdminLink ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={handleCopyAdminLink}
                color={copiedAdminLink ? 'success' : 'primary'}
              >
                {copiedAdminLink ? 'Copied!' : 'Copy Admin Link'}
              </Button>
            </Tooltip>
            {drill?.status === 'REJECTED' && !isViewingOwnDrill && (
              <Button
                variant="contained"
                color="primary"
                onClick={isSuperAdmin ? handleOpenRequeueDialog : handleSkipPreClassifierRequeue}
                disabled={isRequeueing}
              >
                {isRequeueing ? 'Requeuing...' : 'Skip Pre-Classifier & Requeue'}
              </Button>
            )}
            {isSuperAdmin && drill && (
              <>
                {drill.rejectionRating ? (
                  <Tooltip title={`Rated as "${
                    drill.rejectionRating.rating === 'correct' ? 'Correctly Rejected' :
                    drill.rejectionRating.rating === 'incorrect' ? 'Incorrectly Rejected' :
                    'Should Have Been Rejected'
                  }" by ${drill.rejectionRating.ratedBy?.name || 'Unknown'} on ${new Date(drill.rejectionRating.ratedAt).toLocaleString()}`}>
                    <Chip
                      icon={drill.rejectionRating.rating === 'correct' ? <ThumbUpIcon /> :
                            drill.rejectionRating.rating === 'should_have_rejected' ? <HelpIcon /> :
                            <ThumbDownIcon />}
                      label={drill.rejectionRating.rating === 'correct' ? 'Correctly Rejected' :
                             drill.rejectionRating.rating === 'incorrect' ? 'Incorrectly Rejected' :
                             'Should Have Been Rejected'}
                      color={drill.rejectionRating.rating === 'correct' ? 'success' :
                             drill.rejectionRating.rating === 'should_have_rejected' ? 'error' :
                             'error'}
                      onClick={handleOpenRateRejectionDialog}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Tooltip>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    onClick={handleOpenRateRejectionDialog}
                  >
                    Rate Drill
                  </Button>
                )}
              </>
            )}
            {isSuperAdmin && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<NoteIcon />}
                onClick={handleOpenAddNoteDialog}
              >
                Add Note
              </Button>
            )}
            {(isSuperAdmin || hasDawAccess) && (
              <Tooltip title="Hi, I'm Peil — your AIM drill analysis expert">
                <IconButton
                  onClick={() => setWizardOpen((prev) => !prev)}
                  sx={{
                    p: 0.25,
                    border: '2px solid',
                    borderColor: wizardOpen ? '#24FF00' : hasExistingSessions ? 'rgba(36,255,0,0.5)' : 'transparent',
                    boxShadow: wizardOpen
                      ? '0 0 10px rgba(36,255,0,0.35)'
                      : hasExistingSessions
                        ? '0 0 8px rgba(36,255,0,0.2)'
                        : 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': { boxShadow: '0 0 10px rgba(36,255,0,0.25)' },
                  }}
                >
                  <Avatar src={peilAvatar} alt="Peil" sx={{ width: 36, height: 36 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Tags Section (DAW access only) */}
        {hasDawAccess && (
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {drillTags.map(tag => (
              <Chip
                key={tag}
                icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
                label={tag}
                size="small"
                onDelete={() => handleRemoveTag(tag)}
                variant="outlined"
              />
            ))}
            <Chip
              icon={<AddIcon sx={{ fontSize: 16 }} />}
              label="Tag"
              size="small"
              onClick={() => setTagDialogOpen(true)}
              variant="outlined"
              color="primary"
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}
        <TagDialog
          open={tagDialogOpen}
          onClose={() => setTagDialogOpen(false)}
          drillIds={[drillId]}
          drillCount={1}
          onSuccess={() => {
            setTagDialogOpen(false);
            fetchDrillTags();
          }}
        />

        {/* Add Note Dialog (Superadmin only) */}
        <Dialog open={addNoteDialogOpen} onClose={handleCloseAddNoteDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Add Note</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add a note to this drill. Notes are visible to superadmins and are recorded for audit purposes.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={3}
              label="Note *"
              placeholder="Enter your note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              error={!!addNoteError}
              helperText={addNoteError}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddNoteDialog} disabled={isAddingNote}>
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              variant="contained"
              disabled={isAddingNote || !newNote.trim()}
            >
              {isAddingNote ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Requeue Note Dialog (Superadmin only) */}
        <Dialog open={requeueDialogOpen} onClose={handleCloseRequeueDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Requeue Drill</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide a note explaining why you are requeuing this drill. This will be recorded for audit purposes.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={3}
              label="Note *"
              placeholder="Enter the reason for requeuing this drill..."
              value={requeueNote}
              onChange={(e) => setRequeueNote(e.target.value)}
              error={!!requeueError}
              helperText={requeueError}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRequeueDialog} disabled={isRequeueing}>
              Cancel
            </Button>
            <Button
              onClick={handleSkipPreClassifierRequeue}
              variant="contained"
              disabled={isRequeueing || !requeueNote.trim()}
            >
              {isRequeueing ? 'Requeuing...' : 'Requeue'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rate Drill Dialog (Superadmin only) */}
        <Dialog open={rateRejectionDialogOpen} onClose={handleCloseRateRejectionDialog} maxWidth="xs" fullWidth>
          <DialogTitle>Rate Drill</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              How would you rate this drill's processing result?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                color="success"
                size="large"
                startIcon={<ThumbUpIcon />}
                onClick={() => handleRateRejection('correct')}
                disabled={isRatingRejection}
                sx={{ justifyContent: 'flex-start', py: 1.5 }}
              >
                Correctly Rejected
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<ThumbDownIcon />}
                onClick={() => handleRateRejection('incorrect')}
                disabled={isRatingRejection}
                sx={{ justifyContent: 'flex-start', py: 1.5 }}
              >
                Incorrectly Rejected
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<HelpIcon />}
                onClick={() => handleRateRejection('should_have_rejected')}
                disabled={isRatingRejection}
                sx={{ justifyContent: 'flex-start', py: 1.5 }}
              >
                Should Have Been Rejected
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRateRejectionDialog} disabled={isRatingRejection}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Drill Details" />
            <Tab label="Performance Report" />
            <Tab label="Coach Comment" />
            <Tab
              label="Recommended Exercises"
              icon={recommendations.length > 0 ? <CheckCircleIcon fontSize="small" /> : null}
              iconPosition="end"
            />
            {isPlatformEngineering && <Tab label="Patch Testing" />}
            {isPlatformEngineering && <Tab label="Reprocessing" />}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {/* Tab 0: Drill Details */}
          {activeTab === 0 && (
            <Box>
              {/* Version Information */}
              {drill && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Technical Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Model Detection version: <strong>{drill.model_detection_version || 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analysis Script version: <strong>{drill.analysis_version || 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scoring Metrics version: <strong>{drill.scoring_metrics_version || 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Score produced by:{' '}
                    {drill.reprocessed?.flag ? (
                      <strong>
                        {drill.reprocessed.last_patch_id
                          ? `Patch ${drill.reprocessed.last_patch_id}`
                          : 'Reprocessed (latest code)'}
                        {drill.reprocessed.last_reprocess_id && ` (${drill.reprocessed.last_reprocess_id})`}
                      </strong>
                    ) : (
                      <strong>Original pipeline</strong>
                    )}
                  </Typography>
                  {drill.reprocessed?.last_reprocessed_at && (
                    <Typography variant="body2" color="text.secondary">
                      Last reprocessed: <strong>{new Date(drill.reprocessed.last_reprocessed_at).toLocaleString()}</strong>
                    </Typography>
                  )}
                  {drill.version > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Data version: <strong>{drill.version}</strong>
                    </Typography>
                  )}
                </Paper>
              )}

              {/* Gemini Validation (DAW-gated) */}
              {hasDawAccess && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: validationResult ? 2 : 0 }}>
                    <Typography variant="h6">Gemini Validation</Typography>
                    {!validationResult && !validating && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleRunValidation}
                      >
                        Run Gemini Validation
                      </Button>
                    )}
                    {validationResult && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={handleRunValidation}
                          disabled={validating}
                        >
                          Re-run
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={handleClearValidation}
                          disabled={validating}
                        >
                          Clear
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Loading state */}
                  {validating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3, justifyContent: 'center' }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="text.secondary">
                        Analysing video with Gemini...
                      </Typography>
                    </Box>
                  )}

                  {/* Error state */}
                  {validationError && !validating && (
                    <Alert
                      severity="error"
                      sx={{ mt: 1 }}
                      action={
                        <Button color="inherit" size="small" onClick={handleRunValidation}>
                          Retry
                        </Button>
                      }
                    >
                      {validationError}
                    </Alert>
                  )}

                  {/* Result card */}
                  {validationResult && !validating && (
                    <Box>
                      {/* Header: classification chip + timestamp */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          label={validationResult.classification}
                          color={validationResult.classification === 'GOOD' ? 'success' : 'error'}
                          sx={{ fontWeight: 700 }}
                        />
                        {validationResult.classification === 'GOOD' && validationResult.compliance_score != null && (
                          <Typography variant="h5" fontWeight="bold">
                            {Math.round(validationResult.compliance_score)}%
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {validationResult.validated_at
                            ? new Date(validationResult.validated_at).toLocaleString()
                            : ''}
                        </Typography>
                      </Box>

                      {/* BAD reason */}
                      {validationResult.classification === 'BAD' && validationResult.bad_reason && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          {validationResult.bad_reason}
                        </Alert>
                      )}

                      {/* Rationale */}
                      {validationResult.rationale && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {validationResult.rationale}
                        </Typography>
                      )}

                      {/* Drill type comparison */}
                      {validationResult.drill_type_detected && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            Detected: <strong>{validationResult.drill_type_detected}</strong>
                          </Typography>
                          {validationResult.requested_drill_type && (
                            <Typography variant="body2">
                              Requested: <strong>{validationResult.requested_drill_type}</strong>
                              {' '}
                              {validationResult.drill_type_detected?.toLowerCase().replace(/[_ ]/g, '') ===
                               validationResult.requested_drill_type?.toLowerCase().replace(/[_ ]/g, '')
                                ? <Chip label="Match" size="small" color="success" sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }} />
                                : <Chip label="Mismatch" size="small" color="error" sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }} />
                              }
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Metrics grid (GOOD classification) */}
                      {validationResult.metrics && validationResult.classification === 'GOOD' && (
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          {validationResult.metrics.patterns_completed != null && (
                            <Grid item xs={6} sm={3}>
                              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="bold">{validationResult.metrics.patterns_completed}</Typography>
                                <Typography variant="caption" color="text.secondary">Patterns</Typography>
                              </Paper>
                            </Grid>
                          )}
                          {validationResult.metrics.cone_touches != null && (
                            <Grid item xs={6} sm={3}>
                              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="bold">{validationResult.metrics.cone_touches}</Typography>
                                <Typography variant="caption" color="text.secondary">Cone Touches</Typography>
                              </Paper>
                            </Grid>
                          )}
                          {validationResult.metrics.cones_missed != null && (
                            <Grid item xs={6} sm={3}>
                              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="bold">{validationResult.metrics.cones_missed}</Typography>
                                <Typography variant="caption" color="text.secondary">Cones Missed</Typography>
                              </Paper>
                            </Grid>
                          )}
                          {validationResult.metrics.loss_of_control_events != null && (
                            <Grid item xs={6} sm={3}>
                              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="bold">{validationResult.metrics.loss_of_control_events}</Typography>
                                <Typography variant="caption" color="text.secondary">Loss of Control</Typography>
                              </Paper>
                            </Grid>
                          )}
                        </Grid>
                      )}

                      {/* Observations (collapsible) */}
                      {validationResult.observations && (
                        Array.isArray(validationResult.observations) ? validationResult.observations.length > 0 : true
                      ) && (
                        <Box sx={{ mb: 1 }}>
                          <Button
                            size="small"
                            onClick={() => setObservationsExpanded(!observationsExpanded)}
                            endIcon={observationsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ textTransform: 'none', p: 0 }}
                          >
                            Observations
                          </Button>
                          <Collapse in={observationsExpanded}>
                            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                              {Array.isArray(validationResult.observations) ? (
                                validationResult.observations.map((obs, i) => (
                                  <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                                    {typeof obs === 'string' ? obs : JSON.stringify(obs)}
                                  </Typography>
                                ))
                              ) : (
                                <Typography variant="body2">
                                  {typeof validationResult.observations === 'string'
                                    ? validationResult.observations
                                    : JSON.stringify(validationResult.observations, null, 2)}
                                </Typography>
                              )}
                            </Paper>
                          </Collapse>
                        </Box>
                      )}

                      {/* Pipeline comparison */}
                      {pipelineValidation && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Pipeline: {pipelineValidation.classification || 'N/A'}
                          {pipelineValidation.classification === validationResult.classification
                            ? ' (matched)'
                            : ` (differs from manual: ${validationResult.classification})`}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              )}

              {/* Total Drill Score */}
              {scores && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Total Drill Score
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {formatPercentScore(scores.total_score)}
                  </Typography>
                </Paper>
              )}

              {/* Score Breakdown by Area */}
              {scores?.areas && Object.keys(scores.areas).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Performance by Area
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(scores.areas).map(([key, value]) => (
                      <Grid item xs={12} md={6} key={key}>
                        <DrillScoreItem title={key} data={value} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Uploaded Video */}
              {drill?.videoUrl && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Uploaded Video
                  </Typography>
                  <AnnotationVideoToggle
                    originalUrl={drill.videoUrl}
                    annotationUrl={activeAnnotationUrl}
                  />
                </Paper>
              )}

              {/* Highlights */}
              {highlights?.activities && highlights.activities.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Highlights ({highlights.activities.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {highlights.activities.map((highlight, index) => {
                      const matchingScore = scores?.activity_timeline?.activities?.find(
                        (score) =>
                          score?.type === highlight?.type &&
                          score?.frames?.start === highlight?.frames?.start
                      );
                      const rawScore = typeof matchingScore?.raw_score === 'number'
                        ? matchingScore.raw_score.toFixed(2)
                        : 'N/A';

                      return (
                        <Grid item xs={12} md={6} key={index}>
                          <Paper sx={{ p: 2 }} variant="outlined">
                            <ClipPlayer
                              src={drill?.videoUrl}
                              startTime={Number(highlight?.frames?.start) / 30}
                              endTime={Number(highlight?.frames?.end) / 30}
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {highlight?.type}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Score: {rawScore}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              )}

              {/* Loss of Control Events */}
              {(() => {
                // Debug logging
                console.log('[Loss of Control] highlights:', highlights);
                console.log('[Loss of Control] loss_of_control field:', highlights?.loss_of_control);

                // Handle both object and array formats for loss_of_control
                let lossEvents = [];
                if (highlights?.loss_of_control) {
                  if (Array.isArray(highlights.loss_of_control)) {
                    lossEvents = highlights.loss_of_control;
                    console.log('[Loss of Control] Using array format, count:', lossEvents.length);
                  } else if (typeof highlights.loss_of_control === 'object') {
                    lossEvents = Object.values(highlights.loss_of_control);
                    console.log('[Loss of Control] Using object format, converted count:', lossEvents.length);
                  }
                } else {
                  console.log('[Loss of Control] No loss_of_control data found in highlights');
                }

                // Filter valid events with frame data
                const validLossEvents = lossEvents.filter((event) => {
                  if (!event) return false;
                  const start = event?.frame?.start;
                  const end = event?.frame?.end;
                  const isValid = start !== undefined && start !== null && !isNaN(Number(start)) &&
                         end !== undefined && end !== null && !isNaN(Number(end));
                  console.log('[Loss of Control] Event validation:', { event, start, end, isValid });
                  return isValid;
                });

                console.log('[Loss of Control] Valid events count:', validLossEvents.length);

                if (validLossEvents.length === 0) return null;

                const severityColors = {
                  high: 'error.main',
                  medium: 'warning.main',
                  low: 'warning.light',
                };

                return (
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                      Loss of Control Events ({validLossEvents.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {validLossEvents.map((event, index) => {
                        const fps = 30;
                        const frameBuffer = 10;
                        const startFrame = Math.max(0, Number(event.frame.start) - frameBuffer);
                        const endFrame = Number(event.frame.end);
                        const startTime = startFrame / fps;
                        const endTime = endFrame / fps;

                        const durationFrames = endFrame - Number(event.frame.start);
                        const durationSeconds = (durationFrames / fps).toFixed(2);

                        const severity = event?.loss_event_severity?.toLowerCase() || 'unknown';
                        const eventType = event?.event_loss_type
                          ? event.event_loss_type.replace(/_/g, ' ').toUpperCase()
                          : 'LOSS OF CONTROL';

                        return (
                          <Grid item xs={12} md={6} key={event?.event_id ?? `loss-event-${index}`}>
                            <Paper
                              sx={{
                                p: 2,
                                border: '2px solid',
                                borderColor: severityColors[severity] || 'grey.400'
                              }}
                              variant="outlined"
                            >
                              {drill?.videoUrl && (
                                <ClipPlayer
                                  src={drill.videoUrl}
                                  startTime={startTime}
                                  endTime={endTime}
                                />
                              )}
                              <Typography
                                variant="body2"
                                sx={{ mt: 1, color: 'error.main', fontWeight: 600 }}
                              >
                                {eventType}
                              </Typography>
                              <Typography variant="body2">
                                Severity:{' '}
                                <Chip
                                  label={severity.toUpperCase()}
                                  size="small"
                                  color={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'default'}
                                />
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Duration: {durationSeconds}s ({durationFrames} frames)
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                Frames: {event?.frame?.start} - {event?.frame?.end}
                              </Typography>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Paper>
                );
              })()}

              {!drill && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No drill data available
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 1: Performance Report */}
          {activeTab === 1 && (
            <Box>
              {drill && scores ? (
                <DrillReportProfessional
                  drill={drill}
                  scores={scores}
                  highlights={highlights}
                  playerName={playerName}
                  playerProfilePicture={playerProfilePicture}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No report data available
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 2: Coach Ratings */}
          {activeTab === 2 && (
            <Box>
              <CoachRatingsTab
                entityId={drillId}
                entityType="drill"
                showPdfExport={true}
              />
            </Box>
          )}

          {/* Tab 3: Recommended Exercises */}
          {activeTab === 3 && (
            <Box>
              {/* Header with Generate Button */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Training Recommendations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recommendations.length > 0
                        ? `${recommendations.length} personalized exercise${recommendations.length !== 1 ? 's' : ''} recommended based on performance`
                        : 'Generate personalized training recommendations based on drill performance'}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={generatingRecommendations ? <CircularProgress size={20} color="inherit" /> : <AutorenewIcon />}
                    onClick={handleGenerateRecommendations}
                    disabled={generatingRecommendations || !scores}
                  >
                    {generatingRecommendations ? 'Generating...' : recommendations.length > 0 ? 'Regenerate' : 'Generate Recommendations'}
                  </Button>
                </Box>

                {!scores && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                    ⚠️ This drill needs scores before recommendations can be generated
                  </Typography>
                )}
              </Paper>

              {/* Success/Error Messages */}
              {recommendationSuccess && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="body2">✓ {recommendationSuccess}</Typography>
                </Paper>
              )}

              {recommendationError && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="body2">✗ {recommendationError}</Typography>
                </Paper>
              )}

              {/* Recommendations List */}
              {loadingRecommendations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recommendations.length > 0 ? (
                <Grid container spacing={3}>
                  {recommendations.map((rec, index) => {
                    const priorityLevel = rec.recommendationRule?.priority >= 8 ? 'HIGH' : rec.recommendationRule?.priority >= 5 ? 'MEDIUM' : 'LOW';
                    const priorityColor = priorityLevel === 'HIGH' ? 'error' : priorityLevel === 'MEDIUM' ? 'warning' : 'success';

                    return (
                      <Grid item xs={12} md={6} key={rec._id || index}>
                        <Paper
                          sx={{
                            p: 3,
                            height: '100%',
                            border: `2px solid`,
                            borderColor: `${priorityColor}.main`,
                            borderRadius: 2,
                            position: 'relative',
                          }}
                        >
                          {/* Priority Badge */}
                          <Chip
                            label={`${priorityLevel} Priority`}
                            color={priorityColor}
                            size="small"
                            sx={{ position: 'absolute', top: 12, right: 12 }}
                          />

                          {/* Exercise Video Thumbnail */}
                          {rec.trainingExercise?.thumbnailUrl && (
                            <Box
                              component="img"
                              src={rec.trainingExercise.thumbnailUrl}
                              alt={rec.trainingExercise.name?.en}
                              sx={{
                                width: '100%',
                                height: 160,
                                objectFit: 'cover',
                                borderRadius: 1,
                                mb: 2,
                              }}
                            />
                          )}

                          {/* Exercise Icon and Name */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pr: 10 }}>
                            <FitnessCenterIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                              {rec.trainingExercise?.name?.en || 'Training Exercise'}
                            </Typography>
                          </Box>

                          {/* Exercise Details */}
                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            {rec.trainingExercise?.category && (
                              <Chip
                                label={rec.trainingExercise.category}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {rec.trainingExercise?.difficulty && (
                              <Chip
                                label={rec.trainingExercise.difficulty}
                                size="small"
                                color={
                                  rec.trainingExercise.difficulty === 'BEGINNER' ? 'success' :
                                  rec.trainingExercise.difficulty === 'INTERMEDIATE' ? 'warning' : 'error'
                                }
                              />
                            )}
                            {rec.trainingExercise?.duration && (
                              <Chip
                                label={`${rec.trainingExercise.duration} min`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>

                          {/* Exercise Description */}
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {rec.trainingExercise?.description?.en}
                          </Typography>

                          {/* Recommendation Message */}
                          {rec.recommendation?.title?.en && (
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Why this exercise?
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {rec.recommendation.message?.en}
                              </Typography>
                            </Paper>
                          )}

                          {/* Action Plan */}
                          {rec.recommendation?.actionPlan?.en && (
                            <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                                ACTION PLAN
                              </Typography>
                              <Typography variant="body2">
                                {rec.recommendation.actionPlan.en}
                              </Typography>
                            </Box>
                          )}

                          {/* Status */}
                          {rec.status && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                              <Chip
                                label={rec.status}
                                size="small"
                                color={rec.status === 'COMPLETED' ? 'success' : rec.status === 'IN_PROGRESS' ? 'info' : 'default'}
                              />
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <FitnessCenterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Recommendations Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Click "Generate Recommendations" above to get personalized training exercises based on this drill's performance.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Tab 4: Patch Testing (Platform Engineering only) */}
          {isPlatformEngineering && activeTab === 4 && (
            <Box>
              <PatchTester
                drillId={drillId}
                gameType={drill?.gameType}
                scores={scores}
                drill={drill}
              />
            </Box>
          )}

          {/* Tab 5: Reprocessing (Platform Engineering only) */}
          {isPlatformEngineering && activeTab === 5 && (
            <Box>
              <ReprocessPanel
                drillId={drillId}
                videoId={drill?._id}
                drill={drill}
                scores={scores}
                onApplied={fetchDrillData}
              />
            </Box>
          )}
        </Box>
      </Container>
      {(isSuperAdmin || hasDawAccess) && (
        <WizardDrawer
          open={wizardOpen}
          onClose={() => {
            setWizardOpen(false);
            if (hasDawAccess && drillId) {
              wizardService.getSessions(drillId, 1, 0).then(data => {
                setHasExistingSessions(data.total > 0);
              }).catch(() => {});
            }
          }}
          drillId={drillId}
          drill={drill}
          scores={scores}
          highlights={highlights}
          onAnnotationReady={setActiveAnnotationUrl}
          dawTier={dawTier}
        />
      )}
    </AppLayout>
  );
};

export default DrillDetail;
