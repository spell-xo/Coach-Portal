import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Rating,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import manualScoringService from '../../api/manualScoringService';

// Granularity options
const GRANULARITY_OPTIONS = [
  { value: 'overall', label: 'Overall', description: 'Single overall score (0-100)' },
  // Category option temporarily removed - may be re-added later
  { value: 'metric', label: 'Metric', description: 'Enter values per metric (score auto-calculated)' },
  { value: 'activity', label: 'Activity', description: 'Score per activity segment' },
];

// Activity types for activity-level scoring
const ACTIVITY_TYPES = [
  'Dribble',
  'Pass',
  'First Touch',
  'Turn',
  'Sprint',
  'Cone Touch',
  'Ball Control',
  'Shot',
  'Other',
];

// Metric guidance tooltips - provides hints for users on what values to enter
const METRIC_GUIDANCE = {
  // Default guidance for unknown metrics
  default: {
    tooltip: 'Enter the observed value for this metric',
    placeholder: 'Enter value',
    unit: '',
  },
  // Time-based metrics
  'Total Time': {
    tooltip: 'Total time to complete the drill in seconds (e.g., 45.5)',
    placeholder: 'e.g., 45.5',
    unit: 's',
  },
  'Completion Time': {
    tooltip: 'Time to complete in seconds. Lower is generally better.',
    placeholder: 'e.g., 30.2',
    unit: 's',
  },
  // Touch-based metrics
  'Ball Touches': {
    tooltip: 'Total number of ball touches observed',
    placeholder: 'e.g., 24',
    unit: '',
  },
  'Touch Count': {
    tooltip: 'Number of touches counted',
    placeholder: 'e.g., 15',
    unit: '',
  },
  'First Touch Quality': {
    tooltip: 'Rate quality 1-10 (10=excellent control, 1=poor)',
    placeholder: '1-10',
    unit: '',
  },
  // Distance/speed metrics
  'Distance Covered': {
    tooltip: 'Estimated distance in meters',
    placeholder: 'e.g., 25.5',
    unit: 'm',
  },
  'Average Speed': {
    tooltip: 'Average speed in m/s',
    placeholder: 'e.g., 3.5',
    unit: 'm/s',
  },
  // Accuracy metrics
  'Pass Accuracy': {
    tooltip: 'Percentage of successful passes (0-100)',
    placeholder: '0-100',
    unit: '%',
  },
  'Shot Accuracy': {
    tooltip: 'Percentage of shots on target (0-100)',
    placeholder: '0-100',
    unit: '%',
  },
  // Count metrics
  'Successful Passes': {
    tooltip: 'Number of successful passes',
    placeholder: 'e.g., 8',
    unit: '',
  },
  'Missed Cones': {
    tooltip: 'Number of cones missed or knocked over',
    placeholder: 'e.g., 2',
    unit: '',
  },
  'Errors': {
    tooltip: 'Number of errors or mistakes observed',
    placeholder: 'e.g., 3',
    unit: '',
  },
};

// Get metric guidance with fallback to default
const getMetricGuidance = (metricName) => {
  // Try exact match first
  if (METRIC_GUIDANCE[metricName]) {
    return METRIC_GUIDANCE[metricName];
  }

  // Try case-insensitive partial match
  const lowerName = metricName.toLowerCase();
  for (const [key, value] of Object.entries(METRIC_GUIDANCE)) {
    if (key !== 'default' && lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Check for common patterns
  if (lowerName.includes('time') || lowerName.includes('duration')) {
    return { tooltip: 'Enter time in seconds', placeholder: 'e.g., 30.5', unit: 's' };
  }
  if (lowerName.includes('count') || lowerName.includes('number')) {
    return { tooltip: 'Enter the count/number observed', placeholder: 'e.g., 10', unit: '' };
  }
  if (lowerName.includes('accuracy') || lowerName.includes('percentage') || lowerName.includes('rate')) {
    return { tooltip: 'Enter percentage (0-100)', placeholder: '0-100', unit: '%' };
  }
  if (lowerName.includes('distance')) {
    return { tooltip: 'Enter distance in meters', placeholder: 'e.g., 15.5', unit: 'm' };
  }
  if (lowerName.includes('speed')) {
    return { tooltip: 'Enter speed in m/s', placeholder: 'e.g., 3.5', unit: 'm/s' };
  }

  return METRIC_GUIDANCE.default;
};

function ManualScoringModal({ open, onClose, drill, onScoreSubmitted }) {
  const [granularity, setGranularity] = useState('overall');
  const [overallScore, setOverallScore] = useState(50);
  const [categoryScores, setCategoryScores] = useState({});
  const [metricScores, setMetricScores] = useState({});
  const [activityScores, setActivityScores] = useState([]);
  const [notes, setNotes] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingScore, setExistingScore] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [aiScoreData, setAiScoreData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const startTimeRef = useRef(Date.now());
  const videoRef = useRef(null);

  // Get areas/categories dynamically from AI score data
  const getAIAreas = () => {
    if (aiScoreData?.areas) {
      return Object.keys(aiScoreData.areas);
    }
    return [];
  };

  // Get metrics for a specific area from AI score data
  const getAIMetricsForArea = (areaName) => {
    const area = aiScoreData?.areas?.[areaName];
    if (area?.categories) {
      return Object.keys(area.categories);
    }
    return [];
  };

  // Initialize scores when drill changes
  useEffect(() => {
    if (open && drill) {
      startTimeRef.current = Date.now();
      setIsEditMode(false);
      loadData();
    }
  }, [open, drill]);

  const loadData = async () => {
    if (!drill?._id) return;

    try {
      setLoadingExisting(true);

      // Fetch both existing scores and AI comparison data in parallel
      const [scoresResponse, comparisonResponse] = await Promise.all([
        manualScoringService.getManualScoresByVideo(drill._id),
        manualScoringService.getComparisonData(drill._id)
      ]);

      // Set AI score data for dynamic categories/metrics
      if (comparisonResponse.data?.aiScore) {
        setAiScoreData(comparisonResponse.data.aiScore);
      }

      // Check for existing user score
      if (scoresResponse.data && scoresResponse.data.length > 0) {
        const existing = scoresResponse.data[0];
        setExistingScore(existing);
        // Pre-populate form with existing score data for editing
        populateFormFromExisting(existing);
      } else {
        setExistingScore(null);
        initializeScores(comparisonResponse.data?.aiScore);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setExistingScore(null);
      setAiScoreData(null);
      initializeScores(null);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Populate form fields from existing score (for editing)
  const populateFormFromExisting = (existing) => {
    setGranularity(existing.granularity || 'overall');
    setNotes(existing.notes || '');
    setConfidenceLevel(existing.confidenceLevel || 3);
    setDifficultyRating(existing.difficultyRating || 3);

    if (existing.scores?.overall !== undefined) {
      setOverallScore(existing.scores.overall);
    }
    if (existing.scores?.categories) {
      setCategoryScores(existing.scores.categories);
    }
    if (existing.scores?.metrics) {
      setMetricScores(existing.scores.metrics);
    }
    if (existing.scores?.activities) {
      setActivityScores(existing.scores.activities);
    }
  };

  const initializeScores = (aiScore) => {
    // Initialize category scores from AI areas
    const areas = aiScore?.areas ? Object.keys(aiScore.areas) : [];

    const catScores = {};
    areas.forEach(area => {
      // Use AI score as default or 50
      const aiAreaScore = aiScore?.areas?.[area]?.scores?.raw_score;
      catScores[area] = aiAreaScore !== undefined ? Math.round(aiAreaScore) : 50;
    });
    setCategoryScores(catScores);

    // Initialize metric scores from AI area categories
    const metScores = {};
    areas.forEach(area => {
      metScores[area] = {};
      const categories = aiScore?.areas?.[area]?.categories || {};
      Object.keys(categories).forEach(cat => {
        const aiCatScore = categories[cat]?.scores?.score;
        metScores[area][cat] = {
          value: '',
          score: aiCatScore !== undefined ? Math.round(aiCatScore) : 50
        };
      });
    });
    setMetricScores(metScores);

    // Reset activity scores
    setActivityScores([]);
    setOverallScore(aiScore?.total_score !== undefined ? Math.round(aiScore.total_score) : 50);
  };

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  // Activity score handlers
  const addActivity = () => {
    const currentTime = videoRef.current?.currentTime || 0;
    setActivityScores(prev => [
      ...prev,
      {
        activityIndex: prev.length,
        type: 'Dribble',
        score: 50,
        frames: {
          start: Math.floor(currentTime),
          end: Math.min(Math.floor(currentTime) + 2, Math.floor(videoDuration) || 999)
        }
      }
    ]);
  };

  const removeActivity = (index) => {
    setActivityScores(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Reindex remaining activities
      return updated.map((act, i) => ({ ...act, activityIndex: i }));
    });
  };

  const updateActivity = (index, field, value) => {
    setActivityScores(prev => prev.map((act, i) => {
      if (i !== index) return act;
      if (field === 'start' || field === 'end') {
        return {
          ...act,
          frames: { ...act.frames, [field]: parseFloat(value) || 0 }
        };
      }
      return { ...act, [field]: value };
    }));
  };

  const seekToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.pause();
    }
  };

  const handleCategoryScoreChange = (category, value) => {
    setCategoryScores(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // Calculate auto-score based on entered value and AI reference data
  const calculateAutoScore = (area, metric, enteredValue) => {
    // If no value entered, return the AI score as default
    if (!enteredValue || enteredValue === '') {
      const aiMetricScore = aiScoreData?.areas?.[area]?.categories?.[metric]?.scores?.score;
      return aiMetricScore !== undefined ? Math.round(aiMetricScore) : 50;
    }

    // Try to parse the value as a number for comparison
    const numValue = parseFloat(enteredValue);
    if (isNaN(numValue)) {
      // If not a number, keep the existing AI score
      const aiMetricScore = aiScoreData?.areas?.[area]?.categories?.[metric]?.scores?.score;
      return aiMetricScore !== undefined ? Math.round(aiMetricScore) : 50;
    }

    // Get the AI's raw value for comparison if available
    const aiMetricData = aiScoreData?.areas?.[area]?.categories?.[metric];
    const aiValue = aiMetricData?.value || aiMetricData?.raw_value;
    const aiScore = aiMetricData?.scores?.score;

    // If we have an AI value, calculate score based on how manual value compares
    if (aiValue !== undefined && aiScore !== undefined) {
      const aiNumValue = parseFloat(aiValue);
      if (!isNaN(aiNumValue) && aiNumValue !== 0) {
        // Calculate difference ratio
        const ratio = numValue / aiNumValue;
        // Adjust score proportionally (capped at 0-100)
        // If manual value is same as AI, keep AI score
        // If manual value is better (lower for time, higher for counts depending on context), adjust accordingly
        const adjustedScore = Math.round(aiScore * ratio);
        return Math.max(0, Math.min(100, adjustedScore));
      }
    }

    // Fallback: use AI score if available, otherwise 50
    return aiScore !== undefined ? Math.round(aiScore) : 50;
  };

  const handleMetricScoreChange = (category, metric, field, value) => {
    setMetricScores(prev => {
      const currentMetricData = prev[category]?.[metric] || {};

      if (field === 'value') {
        // When value changes, auto-calculate the score
        const autoScore = calculateAutoScore(category, metric, value);
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [metric]: {
              ...currentMetricData,
              value: value,
              score: autoScore
            }
          }
        };
      }

      // For other fields (like score), update normally
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [metric]: {
            ...currentMetricData,
            [field]: value
          }
        }
      };
    });
  };

  const buildScoresObject = () => {
    switch (granularity) {
      case 'overall':
        return { overall: overallScore };
      case 'category':
        return { categories: categoryScores };
      case 'metric':
        return { metrics: metricScores };
      case 'activity':
        return { activities: activityScores };
      default:
        return { overall: overallScore };
    }
  };

  const handleSubmit = async () => {
    if (!drill?._id) {
      setError('No drill selected');
      return;
    }

    if (existingScore) {
      setError('You have already scored this drill');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const scoringDuration = Math.round((Date.now() - startTimeRef.current) / 1000);

      const scoreData = {
        videoUploadsId: drill._id,
        granularity,
        scores: buildScoresObject(),
        notes,
        scoringDuration,
        status: 'submitted',
        confidenceLevel,
        difficultyRating,
      };

      await manualScoringService.createManualScore(scoreData);

      if (onScoreSubmitted) {
        onScoreSubmitted(drill._id);
      }

      onClose();
    } catch (err) {
      console.error('Error submitting score:', err);
      setError(err.response?.data?.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const renderOverallScoring = (readOnly = false) => (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">
          Overall Score
        </Typography>
        {aiScoreData?.total_score !== undefined && (
          <Chip label={`AI: ${Math.round(aiScoreData.total_score)}`} size="small" variant="outlined" color="info" />
        )}
      </Box>
      {readOnly ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <Chip
            label={overallScore}
            color={getScoreChipColor(overallScore)}
            size="large"
            sx={{ fontSize: '1.5rem', py: 3, px: 4 }}
          />
        </Box>
      ) : (
        <>
          <Box sx={{ px: 2 }}>
            <Slider
              value={overallScore}
              onChange={(e, value) => setOverallScore(value)}
              min={0}
              max={100}
              valueLabelDisplay="on"
              marks={[
                { value: 0, label: '0' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 75, label: '75' },
                { value: 100, label: '100' },
              ]}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Chip
              label={`Score: ${overallScore}`}
              color={getScoreChipColor(overallScore)}
              size="large"
            />
          </Box>
        </>
      )}
    </Box>
  );

  const renderCategoryScoring = (readOnly = false) => {
    const areas = getAIAreas();

    if (areas.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 3 }}>
          No AI score data available for this drill. Categories cannot be loaded dynamically.
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Area Scores (from AI structure)
        </Typography>
        <Grid container spacing={2}>
          {areas.map((area) => {
            const aiScore = aiScoreData?.areas?.[area]?.scores?.raw_score;
            return (
              <Grid item xs={12} sm={6} key={area}>
                <Paper sx={{ p: 2 }} variant="outlined">
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {area}
                    </Typography>
                    {aiScore !== undefined && (
                      <Chip label={`AI: ${Math.round(aiScore)}`} size="small" variant="outlined" color="info" />
                    )}
                  </Box>
                  {readOnly ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 1 }}>
                      <Chip
                        label={categoryScores[area] || 'N/A'}
                        color={getScoreChipColor(categoryScores[area])}
                        size="medium"
                      />
                    </Box>
                  ) : (
                    <>
                      <Slider
                        value={categoryScores[area] || 50}
                        onChange={(e, value) => handleCategoryScoreChange(area, value)}
                        min={0}
                        max={100}
                        valueLabelDisplay="auto"
                      />
                      <Typography variant="body2" align="center">
                        {categoryScores[area] || 50}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderMetricScoring = (readOnly = false) => {
    const areas = getAIAreas();

    if (areas.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 3 }}>
          No AI score data available for this drill. Metrics cannot be loaded dynamically.
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Metric Scores (from AI structure)
        </Typography>
        {areas.map((area) => {
          const metrics = getAIMetricsForArea(area);
          if (metrics.length === 0) return null;

          const aiAreaScore = aiScoreData?.areas?.[area]?.scores?.raw_score;

          return (
            <Accordion key={area} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography>{area}</Typography>
                  {aiAreaScore !== undefined && (
                    <Chip label={`AI Area: ${Math.round(aiAreaScore)}`} size="small" variant="outlined" color="info" />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {metrics.map((metric) => {
                    const aiMetricScore = aiScoreData?.areas?.[area]?.categories?.[metric]?.scores?.score;
                    const guidance = getMetricGuidance(metric);
                    return (
                      <Grid item xs={12} key={metric}>
                        <Paper sx={{ p: 2 }} variant="outlined">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {metric}
                              </Typography>
                              <Tooltip title={guidance.tooltip} arrow placement="top">
                                <HelpIcon sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                              </Tooltip>
                            </Box>
                            {aiMetricScore !== undefined && (
                              <Chip label={`AI: ${Math.round(aiMetricScore)}`} size="small" variant="outlined" color="info" />
                            )}
                          </Box>
                          {readOnly ? (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {metricScores[area]?.[metric]?.value && (
                                <Typography variant="body2">Value: {metricScores[area][metric].value}{guidance.unit}</Typography>
                              )}
                              <Chip
                                label={metricScores[area]?.[metric]?.score || 'N/A'}
                                color={getScoreChipColor(metricScores[area]?.[metric]?.score)}
                                size="small"
                              />
                            </Box>
                          ) : (
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={6}>
                                <TextField
                                  size="small"
                                  label="Value"
                                  value={metricScores[area]?.[metric]?.value || ''}
                                  onChange={(e) => handleMetricScoreChange(area, metric, 'value', e.target.value)}
                                  fullWidth
                                  placeholder={guidance.placeholder}
                                  InputProps={{
                                    endAdornment: guidance.unit ? (
                                      <InputAdornment position="end">{guidance.unit}</InputAdornment>
                                    ) : null,
                                  }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  size="small"
                                  label="Score (auto-calculated)"
                                  value={metricScores[area]?.[metric]?.score || 50}
                                  fullWidth
                                  disabled
                                  InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <Chip
                                          label={metricScores[area]?.[metric]?.score || 50}
                                          size="small"
                                          color={getScoreChipColor(metricScores[area]?.[metric]?.score)}
                                          sx={{ mr: -1 }}
                                        />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      visibility: 'hidden',
                                      width: 0,
                                    },
                                  }}
                                />
                              </Grid>
                            </Grid>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  // Helper to get chip color based on score
  const getScoreChipColor = (score) => {
    if (score === undefined || score === null) return 'default';
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const renderActivityScoring = (readOnly = false) => (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Activity Segments ({activityScores.length})
        </Typography>
        {!readOnly && (
          <Button
            startIcon={<AddIcon />}
            onClick={addActivity}
            variant="outlined"
            size="small"
          >
            Add Activity
          </Button>
        )}
      </Box>

      {!readOnly && videoDuration > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Video Duration: {Math.floor(videoDuration)}s - Click "Add Activity" to mark segments at current video time
        </Typography>
      )}

      {activityScores.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {readOnly ? 'No activity scores recorded.' : 'No activities added yet. Play the video and click "Add Activity" to mark segments for scoring.'}
        </Alert>
      ) : (
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {activityScores.map((activity, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="subtitle2">
                  Activity {index + 1}: {activity.type}
                </Typography>
                {!readOnly && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeActivity(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {readOnly ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {activity.frames?.start}s - {activity.frames?.end}s
                  </Typography>
                  <Chip
                    label={activity.score}
                    color={getScoreChipColor(activity.score)}
                    size="small"
                  />
                </Box>
              ) : (
                <Grid container spacing={2} alignItems="center">
                  {/* Activity Type */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={activity.type}
                        label="Type"
                        onChange={(e) => updateActivity(index, 'type', e.target.value)}
                      >
                        {ACTIVITY_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Start Time */}
                  <Grid item xs={5} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TextField
                        size="small"
                        label="Start (s)"
                        type="number"
                        value={activity.frames.start}
                        onChange={(e) => updateActivity(index, 'start', e.target.value)}
                        inputProps={{ min: 0, max: videoDuration || 999, step: 0.1 }}
                        fullWidth
                      />
                      <IconButton
                        size="small"
                        onClick={() => seekToTime(activity.frames.start)}
                        title="Jump to start"
                      >
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>

                  {/* End Time */}
                  <Grid item xs={5} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TextField
                        size="small"
                        label="End (s)"
                        type="number"
                        value={activity.frames.end}
                        onChange={(e) => updateActivity(index, 'end', e.target.value)}
                        inputProps={{ min: 0, max: videoDuration || 999, step: 0.1 }}
                        fullWidth
                      />
                      <IconButton
                        size="small"
                        onClick={() => seekToTime(activity.frames.end)}
                        title="Jump to end"
                      >
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>

                  {/* Score */}
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Score: {activity.score}
                    </Typography>
                    <Slider
                      value={activity.score}
                      onChange={(e, value) => updateActivity(index, 'score', value)}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </Grid>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );

  // Handle update with confirmation
  const handleUpdate = async () => {
    if (!existingScore?._id) return;

    try {
      setSubmitting(true);
      setError(null);

      const scoringDuration = Math.round((Date.now() - startTimeRef.current) / 1000);

      const updateData = {
        scores: buildScoresObject(),
        notes,
        scoringDuration: existingScore.scoringDuration + scoringDuration,
        confidenceLevel,
        difficultyRating,
      };

      await manualScoringService.updateManualScore(existingScore._id, updateData);

      setShowSaveConfirmation(false);
      setIsEditMode(false);

      // Reload data to show updated values
      loadData();

      if (onScoreSubmitted) {
        onScoreSubmitted(drill._id);
      }
    } catch (err) {
      console.error('Error updating score:', err);
      setError(err.response?.data?.message || 'Failed to update score');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine if we're in read-only mode (existing score and not editing)
  const readOnly = existingScore && !isEditMode;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              Manual Scoring
            </Typography>
            {existingScore && (
              <Chip
                label={isEditMode ? 'Editing' : 'View Only'}
                size="small"
                color={isEditMode ? 'warning' : 'info'}
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {drill && (
          <Typography variant="body2" color="text.secondary">
            {drill.title || drill.fileName || 'Drill'} - {drill.playerName || 'Unknown Player'}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loadingExisting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Left side: Video Player */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle2" gutterBottom>
                  Video
                </Typography>
                {drill?.videoUrl ? (
                  <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                    <video
                      ref={videoRef}
                      src={drill.videoUrl}
                      controls
                      onLoadedMetadata={handleVideoLoaded}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#000',
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                    }}
                  >
                    <Typography color="text.secondary">
                      No video available
                    </Typography>
                  </Box>
                )}

                {/* Drill Info */}
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Drill Type</Typography>
                      <Typography variant="body2">{drill?.gameType || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Level</Typography>
                      <Typography variant="body2">{drill?.drillLevel || 'N/A'}</Typography>
                    </Grid>
                    {aiScoreData?.total_score !== undefined && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">AI Total Score</Typography>
                        <Chip
                          label={`${Math.round(aiScoreData.total_score)}%`}
                          size="small"
                          color={getScoreChipColor(aiScoreData.total_score)}
                          sx={{ ml: 1 }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Metadata (for existing scores) */}
                {existingScore && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Score Info
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Confidence</Typography>
                        <Rating value={confidenceLevel} readOnly={readOnly} size="small" onChange={(e, v) => !readOnly && setConfidenceLevel(v)} />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Difficulty</Typography>
                        <Rating value={difficultyRating} readOnly={readOnly} size="small" onChange={(e, v) => !readOnly && setDifficultyRating(v)} />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Scored: {new Date(existingScore.createdAt).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right side: Scoring Form */}
            <Grid item xs={12} md={6}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {existingScore && !isEditMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You have already scored this drill. Click "Edit" to modify your score.
                </Alert>
              )}

              {/* Granularity Selection - always enabled to allow viewing different score types */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>{readOnly ? 'View Scoring Type' : 'Scoring Granularity'}</InputLabel>
                <Select
                  value={granularity}
                  label={readOnly ? 'View Scoring Type' : 'Scoring Granularity'}
                  onChange={(e) => setGranularity(e.target.value)}
                >
                  {GRANULARITY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box>
                        <Typography>{opt.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Scoring based on granularity */}
              {granularity === 'overall' && renderOverallScoring(readOnly)}
              {granularity === 'category' && renderCategoryScoring(readOnly)}
              {granularity === 'metric' && renderMetricScoring(readOnly)}
              {granularity === 'activity' && renderActivityScoring(readOnly)}

              <Divider sx={{ my: 3 }} />

              {/* Notes */}
              {readOnly ? (
                notes ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">{notes}</Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    No notes recorded.
                  </Typography>
                )
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any observations about the drill performance..."
                  sx={{ mb: 3 }}
                />
              )}

              {/* Quality Ratings (if not existing or in edit mode) */}
              {!existingScore && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Confidence Level
                    </Typography>
                    <Rating
                      value={confidenceLevel}
                      onChange={(e, value) => setConfidenceLevel(value)}
                      icon={<StarIcon fontSize="inherit" />}
                      emptyIcon={<StarIcon fontSize="inherit" />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Difficulty Rating
                    </Typography>
                    <Rating
                      value={difficultyRating}
                      onChange={(e, value) => setDifficultyRating(value)}
                      icon={<StarIcon fontSize="inherit" />}
                      emptyIcon={<StarIcon fontSize="inherit" />}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        )}

        {/* Save Confirmation Dialog */}
        <Dialog open={showSaveConfirmation} onClose={() => setShowSaveConfirmation(false)}>
          <DialogTitle>Confirm Save Changes</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to save your changes to this manual score?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSaveConfirmation(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdate} disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {existingScore && !isEditMode ? 'Close' : 'Cancel'}
        </Button>

        {existingScore ? (
          isEditMode ? (
            <>
              <Button onClick={() => { setIsEditMode(false); populateFormFromExisting(existingScore); }} disabled={submitting}>
                Cancel Edit
              </Button>
              <Button
                variant="contained"
                onClick={() => setShowSaveConfirmation(true)}
                disabled={submitting || (granularity === 'activity' && activityScores.length === 0)}
                startIcon={<SaveIcon />}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => setIsEditMode(true)}
              startIcon={<EditIcon />}
            >
              Edit Score
            </Button>
          )
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || loadingExisting || (granularity === 'activity' && activityScores.length === 0)}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Score'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ManualScoringModal;
