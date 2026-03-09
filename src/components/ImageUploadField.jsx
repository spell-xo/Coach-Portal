import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  ZoomIn as ZoomIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';

/**
 * ImageUploadField Component
 * Handles image upload with drag-and-drop, preview, replace, and delete
 */
const ImageUploadField = ({
  label,
  currentImage,
  onUpload,
  onDelete,
  helpText,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Update preview when currentImage prop changes
  React.useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

  const validateFile = (file) => {
    // Check file type
    const acceptedTypes = accept.split(',');
    if (!acceptedTypes.some(type => file.type.match(type.trim()))) {
      return `Invalid file type. Please upload ${accept}`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
    }

    return null;
  };

  const handleFileSelect = async (file) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      await onUpload(file);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      setPreview(currentImage); // Revert to original on error
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    setUploading(true);
    try {
      await onDelete();
      setPreview(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  const handleZoomOpen = () => {
    setZoomDialogOpen(true);
  };

  const handleZoomClose = () => {
    setZoomDialogOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderWidth: dragOver ? 2 : 1,
          transition: 'all 0.2s',
        }}
      >
        {preview ? (
          // Preview mode - show image with actions
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={preview}
              alt={label}
              sx={{
                width: '100%',
                height: 300,
                objectFit: 'contain',
                bgcolor: 'grey.100',
              }}
            />

            {/* Action buttons */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 1,
              }}
            >
              <IconButton
                onClick={handleZoomOpen}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' },
                  boxShadow: 1,
                }}
                size="small"
              >
                <ZoomIcon />
              </IconButton>
              <IconButton
                onClick={handleDeleteClick}
                disabled={disabled || uploading}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
                  boxShadow: 1,
                }}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            {/* Upload overlay when uploading */}
            {uploading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress sx={{ color: 'white' }} />
              </Box>
            )}

            {/* Replace buttons */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={handleClick}
                disabled={disabled || uploading}
                fullWidth
              >
                Choose Image
              </Button>
              <Button
                variant="outlined"
                startIcon={<CameraIcon />}
                onClick={handleCameraClick}
                disabled={disabled || uploading}
                fullWidth
              >
                Take Photo
              </Button>
            </Box>
          </Box>
        ) : (
          // Upload mode - show drop zone
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            sx={{
              height: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              bgcolor: dragOver ? 'action.hover' : 'background.default',
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: disabled ? 'background.default' : 'action.hover',
              },
            }}
          >
            {uploading ? (
              <CircularProgress />
            ) : (
              <>
                <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  {dragOver ? 'Drop image here' : 'Click or drag image to upload'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {helpText || `Supported: ${accept} (max ${(maxSize / (1024 * 1024)).toFixed(1)}MB)`}
                </Typography>
              </>
            )}
          </Box>
        )}
      </Paper>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="user"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Image?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this image? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Zoom dialog */}
      <Dialog
        open={zoomDialogOpen}
        onClose={handleZoomClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{label}</DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={preview}
            alt={label}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleZoomClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageUploadField;
