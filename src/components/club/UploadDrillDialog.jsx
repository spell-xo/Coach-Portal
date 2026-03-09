import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../api/client';

const validationSchema = Yup.object({
  drillType: Yup.string().required('Drill type is required'),
  modelDetectionVersion: Yup.string().required('Model detection version is required'),
  analysisScriptVersion: Yup.string().required('Analysis script version is required'),
  scoringMetricsVersion: Yup.string().required('Scoring metrics version is required'),
  processingMode: Yup.string().required('Processing mode is required'),
  title: Yup.string(),
  description: Yup.string(),
  performPostProcessing: Yup.boolean(),
  generateAnnotatedVideo: Yup.boolean(),
  videoFile: Yup.mixed().required('Video file is required'),
});

const MODEL_DETECTION_VERSIONS = [
  { value: 'v1.0', label: 'v1.0' },
  { value: 'v1.1', label: 'v1.1' },
  { value: 'v2.0', label: 'v2.0' },
];

const ANALYSIS_SCRIPT_VERSIONS = [
  { value: 'v1.0', label: 'v1.0' },
  { value: 'v1.1', label: 'v1.1' },
  { value: 'v2.0', label: 'v2.0' },
];

const SCORING_METRICS_VERSIONS = [
  { value: 'v1.0', label: 'v1.0' },
  { value: 'v1.1', label: 'v1.1' },
  { value: 'v2.0', label: 'v2.0' },
];

const PROCESSING_MODES = [
  { value: 'standard', label: 'Standard' },
  { value: 'fast', label: 'Fast' },
  { value: 'high_quality', label: 'High Quality' },
];

const UploadDrillDialog = ({ open, onClose, onSubmit, player }) => {
  const [error, setError] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [drillTypes, setDrillTypes] = useState([]);
  const [loadingDrillTypes, setLoadingDrillTypes] = useState(false);

  // Debug logging
  console.log('UploadDrillDialog rendered', { open, player });

  // Load drill types when dialog opens
  useEffect(() => {
    if (open) {
      loadDrillTypes();
    }
  }, [open]);

  const loadDrillTypes = async () => {
    try {
      setLoadingDrillTypes(true);
      const response = await apiClient.get('/drill-instructions/types/available');
      if (response.data.success) {
        setDrillTypes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading drill types:', err);
      // Don't show error to user, just log it
    } finally {
      setLoadingDrillTypes(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('videoFile', values.videoFile);
      formData.append('drillType', values.drillType);
      formData.append('modelDetectionVersion', values.modelDetectionVersion);
      formData.append('analysisScriptVersion', values.analysisScriptVersion);
      formData.append('scoringMetricsVersion', values.scoringMetricsVersion);
      formData.append('processingMode', values.processingMode);
      formData.append('performPostProcessing', values.performPostProcessing);
      formData.append('generateAnnotatedVideo', values.generateAnnotatedVideo);

      if (values.title) formData.append('title', values.title);
      if (values.description) formData.append('description', values.description);

      await onSubmit(formData);
      resetForm();
      setSelectedFileName('');
      setSubmitting(false);
      // Success - dialog will be closed by parent
    } catch (err) {
      setError(err.message || 'Failed to upload drill');
      setSubmitting(false);
      // Don't close dialog on error - let user see the error message
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Upload Drill for {player?.name || 'Player'}
      </DialogTitle>
      <Formik
        initialValues={{
          drillType: '',
          modelDetectionVersion: '',
          analysisScriptVersion: '',
          scoringMetricsVersion: '',
          processingMode: '',
          title: '',
          description: '',
          performPostProcessing: false,
          generateAnnotatedVideo: true,
          videoFile: null,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, setFieldValue, values }) => (
          <Form>
            <DialogContent sx={{ pt: 2, minHeight: '400px' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload a drill video on behalf of <strong>{player?.name || 'the selected player'}</strong>
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Video File Upload */}
              <Box sx={{ mb: 3 }}>
                <input
                  accept="video/*"
                  style={{ display: 'none' }}
                  id="video-file-upload"
                  type="file"
                  onChange={(event) => {
                    const file = event.currentTarget.files[0];
                    if (file) {
                      setFieldValue('videoFile', file);
                      setSelectedFileName(file.name);
                    }
                  }}
                />
                <label htmlFor="video-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ py: 2 }}
                  >
                    {selectedFileName || 'Browse Video File'}
                  </Button>
                </label>
                {touched.videoFile && errors.videoFile && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.videoFile}
                  </Typography>
                )}
                {selectedFileName && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Selected: {selectedFileName}
                  </Typography>
                )}
              </Box>

              {/* Drill Type */}
              <Field
                as={TextField}
                select
                margin="normal"
                required
                fullWidth
                id="drillType"
                label="Drill Type"
                name="drillType"
                error={touched.drillType && Boolean(errors.drillType)}
                helperText={touched.drillType && errors.drillType}
                disabled={loadingDrillTypes}
              >
                {loadingDrillTypes ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading drill types...
                  </MenuItem>
                ) : (
                  drillTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))
                )}
              </Field>

              {/* Model Detection Version */}
              <Field
                as={TextField}
                select
                margin="normal"
                required
                fullWidth
                id="modelDetectionVersion"
                label="Model Detection Version"
                name="modelDetectionVersion"
                error={touched.modelDetectionVersion && Boolean(errors.modelDetectionVersion)}
                helperText={touched.modelDetectionVersion && errors.modelDetectionVersion}
              >
                {MODEL_DETECTION_VERSIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field>

              {/* Analysis Script Version */}
              <Field
                as={TextField}
                select
                margin="normal"
                required
                fullWidth
                id="analysisScriptVersion"
                label="Analysis Script Version"
                name="analysisScriptVersion"
                error={touched.analysisScriptVersion && Boolean(errors.analysisScriptVersion)}
                helperText={touched.analysisScriptVersion && errors.analysisScriptVersion}
              >
                {ANALYSIS_SCRIPT_VERSIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field>

              {/* Scoring Metrics Version */}
              <Field
                as={TextField}
                select
                margin="normal"
                required
                fullWidth
                id="scoringMetricsVersion"
                label="Scoring Metrics Version"
                name="scoringMetricsVersion"
                error={touched.scoringMetricsVersion && Boolean(errors.scoringMetricsVersion)}
                helperText={touched.scoringMetricsVersion && errors.scoringMetricsVersion}
              >
                {SCORING_METRICS_VERSIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field>

              {/* Processing Mode */}
              <Field
                as={TextField}
                select
                margin="normal"
                required
                fullWidth
                id="processingMode"
                label="Processing Mode"
                name="processingMode"
                error={touched.processingMode && Boolean(errors.processingMode)}
                helperText={touched.processingMode && errors.processingMode}
              >
                {PROCESSING_MODES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field>

              {/* Title (Optional) */}
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                id="title"
                label="Title (Optional)"
                name="title"
                error={touched.title && Boolean(errors.title)}
                helperText={touched.title && errors.title}
              />

              {/* Description (Optional) */}
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                multiline
                rows={3}
                id="description"
                label="Description (Optional)"
                name="description"
                error={touched.description && Boolean(errors.description)}
                helperText={touched.description && errors.description}
              />

              {/* Checkboxes */}
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.performPostProcessing}
                      onChange={(e) => setFieldValue('performPostProcessing', e.target.checked)}
                      name="performPostProcessing"
                    />
                  }
                  label="Perform Post Processing"
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.generateAnnotatedVideo}
                      onChange={(e) => setFieldValue('generateAnnotatedVideo', e.target.checked)}
                      name="generateAnnotatedVideo"
                    />
                  }
                  label="Generate Annotated Video"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {isSubmitting ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default UploadDrillDialog;
