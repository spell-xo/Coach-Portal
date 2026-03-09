/**
 * Bulk Manual Annotation View
 * Display list of videos with PENDING_MANUAL_ANNOTATION status and allow batch annotation
 * Based on PRD: Bulk upload Manual annotation
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  VideoFile as VideoFileIcon,
} from "@mui/icons-material";
import AppLayout from "../../components/AppLayout";
import RequireRole from "../../components/RequireRole";
import ManualConeDetection from "../../components/drills/ManualConeDetection";
import drillService from "../../api/drillService";
import { DRILL_STATUS, DRILL_STATUS_LABELS } from "../../constants/drillConstants";

const BulkManualAnnotationView = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load pending videos on mount
  useEffect(() => {
    loadPendingVideos();
  }, [clubId]);

  /**
   * Load videos with PENDING_MANUAL_ANNOTATION status
   */
  const loadPendingVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await drillService.getDrillsByStatus(
        clubId,
        DRILL_STATUS.PENDING_MANUAL_ANNOTATION,
        {
          page: 1,
          limit: 100,
        }
      );

      setVideos(response.drills || response.data || []);
    } catch (err) {
      console.error("Error loading pending videos:", err);
      setError(err.response?.data?.message || "Failed to load pending videos");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle annotate button click
   */
  const handleAnnotateClick = (video) => {
    setSelectedVideo(video);
    setAnnotationDialogOpen(true);
  };

  /**
   * Handle annotation submission
   */
  const handleAnnotationSubmit = async (markers, updatedGameType) => {
    if (!selectedVideo) return;

    try {
      setSubmitting(true);
      setError(null);

      // Format markers as required by API
      const manualAnnotation = {};
      markers.forEach((marker, index) => {
        manualAnnotation[index + 1] = {
          position: [marker.x, marker.y],
          detection_method: marker.detection_method,
          confidence: marker.confidence || null,
        };
      });

      // Determine if gameType was changed
      const originalGameType = selectedVideo.gameType || selectedVideo.drillType;
      const finalGameType = updatedGameType || originalGameType;
      const gameTypeChanged = finalGameType !== originalGameType;

      // Update drill record with annotations and change status to UPLOADED
      await drillService.updateDrillAnnotations(
        selectedVideo.id || selectedVideo._id,
        manualAnnotation,
        DRILL_STATUS.UPLOADED,
        gameTypeChanged ? finalGameType : undefined
      );

      // Remove video from list
      setVideos((prev) => prev.filter((v) => v.id !== selectedVideo.id && v._id !== selectedVideo._id));

      // Close dialog
      setAnnotationDialogOpen(false);
      setSelectedVideo(null);

      // Show success message
      // Could add a snackbar here
    } catch (err) {
      console.error("Error submitting annotations:", err);
      setError(err.response?.data?.message || "Failed to submit annotations");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleDialogClose = () => {
    if (!submitting) {
      setAnnotationDialogOpen(false);
      setSelectedVideo(null);
    }
  };

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate(`/clubs/${clubId}/drill-uploads`)}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">
              Manual Annotation Queue
            </Typography>
            <IconButton onClick={loadPendingVideos} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Review and annotate cone positions for uploaded videos
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : videos.length === 0 ? (
          /* Empty State */
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <VideoFileIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No videos pending annotation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              All uploaded videos have been annotated
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(`/clubs/${clubId}/drill-uploads`)}
            >
              Back to Drill Uploads
            </Button>
          </Paper>
        ) : (
          /* Video Grid */
          <>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">
                {videos.length} video{videos.length !== 1 ? "s" : ""} pending annotation
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {videos.map((video) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={video.id || video._id}>
                  <Card>
                    {/* Thumbnail */}
                    {video.frameUrl ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={video.frameUrl}
                        alt={video.fileName}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 200,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "grey.200",
                        }}
                      >
                        <VideoFileIcon sx={{ fontSize: 60, color: "grey.500" }} />
                      </Box>
                    )}

                    {/* Content */}
                    <CardContent>
                      <Typography variant="subtitle2" noWrap title={video.fileName}>
                        {video.fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Type: {video.gameType || video.drillType || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Player: {video.playerName || "N/A"}
                      </Typography>
                      <Chip
                        label={DRILL_STATUS_LABELS[video.status] || video.status}
                        size="small"
                        color="secondary"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>

                    {/* Actions */}
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={() => handleAnnotateClick(video)}
                      >
                        Annotate
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Annotation Dialog */}
        <Dialog
          open={annotationDialogOpen}
          onClose={handleDialogClose}
          maxWidth="lg"
          fullWidth
          disableEscapeKeyDown={submitting}
        >
          <DialogTitle>
            Manual Cone Annotation: {selectedVideo?.fileName || "Video"} | Type: {selectedVideo?.gameType || selectedVideo?.drillType || "NO_TYPE"}
          </DialogTitle>
          <DialogContent>
            {selectedVideo && selectedVideo.frameUrl && (
              <ManualConeDetection
                frameUrl={selectedVideo.frameUrl}
                onSubmit={handleAnnotationSubmit}
                autoRunYolo={true}
                gameType={selectedVideo.gameType || selectedVideo.drillType}
              />
            )}
            {submitting && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                <CircularProgress size={20} />
                <Typography>Submitting annotations...</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={submitting}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default BulkManualAnnotationView;
