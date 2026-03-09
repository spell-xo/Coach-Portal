import React, { useCallback } from 'react';
import { useField } from 'formik';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  FormLabel,
  FormHelperText,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';

/**
 * FileUploadField component with drag-and-drop support
 *
 * Features:
 * - Drag and drop file upload
 * - File type validation
 * - File size validation
 * - Multiple file support
 * - Preview for images
 * - Progress indicator
 * - Formik integration
 */
const FileUploadField = ({
  name,
  label,
  helperText,
  required = false,
  accept,
  maxSize = 10485760, // 10MB default
  maxFiles = 1,
  showPreview = true,
  disabled = false,
}) => {
  const [field, meta, helpers] = useField(name);

  const hasError = meta.touched && meta.error;

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (acceptedFiles.length > 0) {
        if (maxFiles === 1) {
          helpers.setValue(acceptedFiles[0]);
        } else {
          const currentFiles = Array.isArray(field.value) ? field.value : [];
          helpers.setValue([...currentFiles, ...acceptedFiles].slice(0, maxFiles));
        }
        helpers.setTouched(true);
      }

      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        helpers.setError(error.message);
      }
    },
    [field.value, helpers, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled,
  });

  const removeFile = (index) => {
    if (maxFiles === 1) {
      helpers.setValue(null);
    } else {
      const files = Array.isArray(field.value) ? field.value : [];
      helpers.setValue(files.filter((_, i) => i !== index));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return <ImageIcon />;
    if (file.type?.startsWith('video/')) return <VideoFileIcon />;
    return <InsertDriveFileIcon />;
  };

  const files = maxFiles === 1
    ? (field.value ? [field.value] : [])
    : (Array.isArray(field.value) ? field.value : []);

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

      {/* Dropzone */}
      <Paper
        {...getRootProps()}
        component={motion.div}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: hasError
            ? 'error.main'
            : isDragActive
            ? 'secondary.main'
            : 'grey.300',
          borderRadius: 2,
          bgcolor: isDragActive ? 'rgba(36, 255, 0, 0.08)' : 'grey.50',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'secondary.main',
            bgcolor: disabled ? 'grey.50' : 'rgba(36, 255, 0, 0.04)',
          },
        }}
      >
        <input {...getInputProps()} />

        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: isDragActive ? 'secondary.main' : 'text.secondary',
            mb: 1,
          }}
        />

        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          or click to browse
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {accept && `Accepted: ${Object.keys(accept).join(', ')} • `}
          Max size: {formatFileSize(maxSize)}
          {maxFiles > 1 && ` • Max ${maxFiles} files`}
        </Typography>
      </Paper>

      {/* File Preview */}
      {files.length > 0 && showPreview && (
        <Box sx={{ mt: 2 }}>
          <AnimatePresence>
            {files.map((file, index) => (
              <Paper
                key={index}
                component={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                sx={{
                  p: 2,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {/* File Icon or Image Preview */}
                {file.type?.startsWith('image/') && URL.createObjectURL ? (
                  <Box
                    component="img"
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      color: 'text.secondary',
                    }}
                  >
                    {getFileIcon(file)}
                  </Box>
                )}

                {/* File Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>

                {/* Remove Button */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </AnimatePresence>
        </Box>
      )}

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
    </Box>
  );
};

export default FileUploadField;
