import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ratingsService from '../api/ratingsService';

const TRAITS = [
  { key: 'attitude', label: 'Attitude', description: 'Player\'s general demeanor and mindset' },
  { key: 'teamplay', label: 'Team Play', description: 'Ability to work with teammates' },
  { key: 'respect', label: 'Respect', description: 'Respect for coaches, teammates, and opponents' },
  { key: 'ambition', label: 'Ambition', description: 'Drive to improve and succeed' },
  { key: 'effort', label: 'Effort', description: 'Work ethic and dedication' },
  { key: 'humility', label: 'Humility', description: 'Ability to learn from mistakes' }
];

/**
 * CoachRatingsTab Component
 * Allows coaches to rate players on 6 key traits and add comments
 *
 * @param {string} entityId - Drill ID or Player ID
 * @param {string} entityType - 'drill' or 'player'
 * @param {boolean} showPdfExport - Whether to show PDF export button
 */
const CoachRatingsTab = ({ entityId, entityType = 'drill', showPdfExport = false }) => {
  // Initialize state based on entity type
  const [ratings, setRatings] = useState(
    entityType === 'drill'
      ? { comments: '' }
      : {
          attitude: null,
          teamplay: null,
          respect: null,
          ambition: null,
          effort: null,
          humility: null,
          comments: ''
        }
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load existing ratings on mount
  useEffect(() => {
    loadRatings();
  }, [entityId, entityType]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (entityType === 'drill') {
        response = await ratingsService.getDrillRating(entityId);
      } else {
        response = await ratingsService.getPlayerRating(entityId);
      }

      if (response.success && response.data) {
        if (entityType === 'drill') {
          // For drills, only load comments
          setRatings({
            comments: response.data.comments || ''
          });
        } else {
          // For players, load all ratings
          setRatings({
            attitude: response.data.attitude ?? null,
            teamplay: response.data.teamplay ?? null,
            respect: response.data.respect ?? null,
            ambition: response.data.ambition ?? null,
            effort: response.data.effort ?? null,
            humility: response.data.humility ?? null,
            comments: response.data.comments || ''
          });
        }
      }
    } catch (err) {
      console.error('Error loading ratings:', err);
      // If 404 or no ratings, keep empty ratings
      if (err.response?.status !== 404) {
        setError('Failed to load ratings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (trait, value) => {
    setRatings(prev => ({
      ...prev,
      [trait]: value
    }));
    setSuccess(null);
  };

  const handleCommentsChange = (event) => {
    setRatings(prev => ({
      ...prev,
      comments: event.target.value
    }));
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let response;
      if (entityType === 'drill') {
        response = await ratingsService.updateDrillRating(entityId, ratings);
      } else {
        response = await ratingsService.updatePlayerRating(entityId, ratings);
      }

      if (response.success) {
        setSuccess(entityType === 'drill' ? 'Comment saved successfully!' : 'Ratings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving ratings:', err);
      setError('Failed to save ratings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      setError(null);

      if (entityType === 'drill') {
        await ratingsService.exportDrillPDF(entityId);
      } else {
        await ratingsService.exportPlayerPDF(entityId);
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getSliderColor = (value) => {
    if (value === null) return '#9ca3af';
    if (value >= 7) return '#10b981'; // Green
    if (value >= 4) return '#3b82f6'; // Blue
    return '#ef4444'; // Red
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" component="h2">
              Coach Assessment
            </Typography>
            {showPdfExport && (
              <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                onClick={handleExportPDF}
                disabled={exporting}
              >
                Export PDF
              </Button>
            )}
          </Box>

          {entityType === 'player' && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Rate the player on the following traits using a scale of 0-10:
              </Typography>

              <Grid container spacing={3}>
                {TRAITS.map((trait) => (
                  <Grid item xs={12} md={6} key={trait.key}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {trait.label}
                        </Typography>
                        <Chip
                          label={ratings[trait.key] !== null ? ratings[trait.key].toFixed(1) : 'N/A'}
                          size="small"
                          sx={{
                            backgroundColor: getSliderColor(ratings[trait.key]),
                            color: 'white',
                            fontWeight: 600,
                            minWidth: 50
                          }}
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        {trait.description}
                      </Typography>

                      <Slider
                        value={ratings[trait.key] ?? 5}
                        onChange={(e, value) => handleSliderChange(trait.key, value)}
                        min={0}
                        max={10}
                        step={0.5}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 5, label: '5' },
                          { value: 10, label: '10' }
                        ]}
                        valueLabelDisplay="auto"
                        sx={{
                          color: getSliderColor(ratings[trait.key]),
                          '& .MuiSlider-thumb': {
                            width: 20,
                            height: 20
                          },
                          '& .MuiSlider-markLabel': {
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />
            </>
          )}

          {entityType === 'drill' && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your comments about this drill performance:
            </Typography>
          )}

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Coach Comments
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder={`Add your comments about this ${entityType}...`}
              value={ratings.comments}
              onChange={handleCommentsChange}
              variant="outlined"
            />
          </Box>

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              size="large"
            >
              {entityType === 'drill' ? 'Save Comment' : 'Save Ratings'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CoachRatingsTab;
