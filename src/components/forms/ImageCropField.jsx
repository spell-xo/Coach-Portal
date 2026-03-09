import React, { useState, useCallback } from 'react';
import { useField } from 'formik';
import Cropper from 'react-easy-crop';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  FormHelperText,
  IconButton,
  Slider,
  Typography,
  Avatar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * ImageCropField component for uploading and cropping images
 *
 * Features:
 * - Image upload with preview
 * - Crop functionality with zoom
 * - Aspect ratio control
 * - Circular or square crop
 * - Formik integration
 * - Base64 or File output
 */
const ImageCropField = ({
  name,
  label,
  helperText,
  required = false,
  disabled = false,
  aspectRatio = 1, // 1 = square, 16/9 = landscape, etc.
  circularCrop = true,
  maxSize = 5242880, // 5MB default
  outputFormat = 'base64', // 'base64' or 'file'
}) => {
  const [field, meta, helpers] = useField(name);

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  const hasError = meta.touched && meta.error;

  const onFileChange = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];

        // Validate file size
        if (file.size > maxSize) {
          helpers.setError(
            `File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`
          );
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          helpers.setError('Please select an image file');
          return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImageSrc(reader.result);
          setCropDialogOpen(true);
        });
        reader.readAsDataURL(file);
      }
    },
    [helpers, maxSize]
  );

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const image = new Image();
    image.src = imageSrc;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      if (outputFormat === 'base64') {
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } else {
        canvas.toBlob((blob) => {
          const file = new File([blob], 'cropped-image.jpg', {
            type: 'image/jpeg',
          });
          resolve(file);
        }, 'image/jpeg', 0.95);
      }
    });
  }, [imageSrc, croppedAreaPixels, outputFormat]);

  const handleCropSave = async () => {
    const croppedImage = await createCroppedImage();
    helpers.setValue(croppedImage);
    helpers.setTouched(true);
    setCropDialogOpen(false);
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleRemoveImage = () => {
    helpers.setValue(null);
  };

  return (
    <Box>
      {/* Label */}
      {label && (
        <FormLabel
          required={required}
          error={Boolean(hasError)}
          sx={{ mb: 1, display: 'block', fontWeight: 600 }}
        >
          {label}
        </FormLabel>
      )}

      {/* Image Preview or Upload Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {field.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              component={motion.div}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              src={field.value}
              sx={{
                width: 100,
                height: 100,
                border: '2px solid',
                borderColor: 'divider',
              }}
            />

            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CropIcon />}
                disabled={disabled}
                sx={{ mb: 1 }}
              >
                Change Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={onFileChange}
                />
              </Button>

              <IconButton
                size="small"
                color="error"
                onClick={handleRemoveImage}
                disabled={disabled}
                sx={{ ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={disabled}
            sx={{
              py: 3,
              px: 4,
              borderStyle: 'dashed',
              borderWidth: 2,
              '&:hover': {
                borderStyle: 'dashed',
                borderWidth: 2,
              },
            }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={onFileChange}
            />
          </Button>
        )}
      </Box>

      {/* Error Message / Helper Text */}
      <AnimatePresence mode="wait">
        {hasError ? (
          <FormHelperText
            component={motion.div}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            error
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}
          >
            <ErrorIcon sx={{ fontSize: 16 }} />
            <span>{meta.error}</span>
          </FormHelperText>
        ) : helperText ? (
          <FormHelperText sx={{ mt: 1 }}>{helperText}</FormHelperText>
        ) : null}
      </AnimatePresence>

      {/* Crop Dialog */}
      <Dialog
        open={cropDialogOpen}
        onClose={handleCropCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crop Image</DialogTitle>
        <DialogContent sx={{ height: 400, position: 'relative' }}>
          {imageSrc && (
            <>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                cropShape={circularCrop ? 'round' : 'rect'}
                showGrid={!circularCrop}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 2, p: 2 }}>
          {/* Zoom Slider */}
          <Box sx={{ width: '100%', px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ZoomInIcon sx={{ color: 'text.secondary' }} />
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e, value) => setZoom(value)}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
                {Math.round(zoom * 100)}%
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCropCancel}>Cancel</Button>
            <Button variant="contained" onClick={handleCropSave}>
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageCropField;
