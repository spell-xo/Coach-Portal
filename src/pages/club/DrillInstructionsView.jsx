import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Grid,
} from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import AppLayout from '../../components/AppLayout';
import apiClient from '../../api/client';

// Video Player Component
const VideoPlayer = ({ url, title }) => {
  if (!url) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
          p: 4,
          minHeight: 200,
        }}
      >
        <VideocamOffIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          No video available at present
        </Typography>
      </Box>
    );
  }

  // Check if it's a YouTube URL
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (isYouTube) {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return (
        <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 8,
              border: 'none',
            }}
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Box>
      );
    }
  }

  // Check if it's a Vimeo URL
  const isVimeo = url.includes('vimeo.com');

  if (isVimeo) {
    const vimeoId = url.match(/vimeo.com\/(\d+)/)?.[1];
    if (vimeoId) {
      return (
        <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 8,
              border: 'none',
            }}
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </Box>
      );
    }
  }

  // Default: Use HTML5 video player for direct video URLs
  return (
    <Box sx={{ width: '100%' }}>
      <video
        controls
        style={{
          width: '100%',
          borderRadius: 8,
          maxHeight: 400,
          backgroundColor: '#000',
        }}
      >
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
};

const DrillInstructionsView = () => {
  const [selectedDrill, setSelectedDrill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [drillTypes, setDrillTypes] = useState([]);
  const [loadingDrillTypes, setLoadingDrillTypes] = useState(true);

  // Load drill types on mount
  useEffect(() => {
    loadDrillTypes();
  }, []);

  useEffect(() => {
    if (selectedDrill) {
      loadDrillInstructions();
    } else {
      setInstructions(null);
    }
  }, [selectedDrill]);

  const loadDrillTypes = async () => {
    try {
      setLoadingDrillTypes(true);
      const response = await apiClient.get('/drill-instructions/types/available');
      if (response.data.success) {
        // Only show enabled drill types in the user-facing view
        const enabledDrillTypes = response.data.data || [];
        setDrillTypes(enabledDrillTypes);
      }
    } catch (err) {
      console.error('Error loading drill types:', err);
    } finally {
      setLoadingDrillTypes(false);
    }
  };

  const loadDrillInstructions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/drill-instructions/${selectedDrill}`);

      if (response.data.success && response.data.data) {
        setInstructions(response.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No instructions have been configured for this drill type yet.');
        setInstructions(null);
      } else {
        console.error('Error loading drill instructions:', err);
        setError(err.response?.data?.message || 'Failed to load drill instructions');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
              Drill Instructions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View setup and filming instructions for different drill types
            </Typography>
          </Box>

          {/* Drill Type Selector */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <FormControl fullWidth disabled={loadingDrillTypes}>
                <InputLabel>Select Drill Type</InputLabel>
                <Select
                  value={selectedDrill}
                  onChange={(e) => setSelectedDrill(e.target.value)}
                  label="Select Drill Type"
                >
                  <MenuItem value="">
                    <em>Select a drill type</em>
                  </MenuItem>
                  {loadingDrillTypes ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading drill types...
                    </MenuItem>
                  ) : (
                    drillTypes.map((drill) => (
                      <MenuItem key={drill.value} value={drill.value}>
                        {drill.label}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Instructions Display */}
          {selectedDrill && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : instructions ? (
                <Paper sx={{ mb: 3 }}>
                  <Box sx={{ px: 3, py: 3 }}>
                    {/* Videos Section */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                        Videos
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Setup Video
                          </Typography>
                          <VideoPlayer
                            url={instructions.setupInstructions?.setupVideoUrl}
                            title="Setup Video"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Demo Video
                          </Typography>
                          <VideoPlayer
                            url={instructions.setupInstructions?.demoVideoUrl}
                            title="Demo Video"
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Equipment */}
                    {instructions.setupInstructions?.equipment && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                          Equipment
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box
                          sx={{
                            '& p': { margin: '0.5em 0' },
                            '& ul, & ol': { paddingLeft: '2em' },
                            color: 'text.secondary'
                          }}
                          dangerouslySetInnerHTML={{ __html: instructions.setupInstructions.equipment }}
                        />
                      </Box>
                    )}

                    {/* Setup Instructions */}
                    {instructions.setupInstructions?.instructions && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                          Setup Instructions
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box
                          sx={{
                            '& p': { margin: '0.5em 0' },
                            '& ul, & ol': { paddingLeft: '2em' },
                            color: 'text.secondary'
                          }}
                          dangerouslySetInnerHTML={{ __html: instructions.setupInstructions.instructions }}
                        />
                      </Box>
                    )}

                    {/* Filming Instructions */}
                    {instructions.filmingInstructions && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                          Filming Instructions
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box
                          sx={{
                            '& p': { margin: '0.5em 0' },
                            '& ul, & ol': { paddingLeft: '2em' },
                            color: 'text.secondary'
                          }}
                          dangerouslySetInnerHTML={{ __html: instructions.filmingInstructions }}
                        />
                      </Box>
                    )}

                    {!instructions.setupInstructions?.equipment &&
                      !instructions.setupInstructions?.instructions &&
                      !instructions.filmingInstructions &&
                      !instructions.setupInstructions?.setupVideoUrl &&
                      !instructions.setupInstructions?.demoVideoUrl && (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            No instructions available for this drill type.
                          </Typography>
                        </Box>
                      )}
                  </Box>
                </Paper>
              ) : null}
            </>
          )}

          {!selectedDrill && (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Select a drill type to view its instructions
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>
    </AppLayout>
  );
};

export default DrillInstructionsView;
