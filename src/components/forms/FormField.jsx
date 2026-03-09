import React from 'react';
import { useField } from 'formik';
import {
  TextField,
  FormControl,
  FormHelperText,
  Box,
  Typography,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Enhanced FormField component with Formik integration and inline validation
 *
 * Features:
 * - Automatic Formik field binding
 * - Real-time validation feedback
 * - Animated error/success indicators
 * - Accessible error messages
 * - Clean visual design
 */
const FormField = ({
  name,
  label,
  type = 'text',
  placeholder,
  helperText,
  multiline = false,
  rows = 4,
  required = false,
  disabled = false,
  showValidation = true,
  ...props
}) => {
  const [field, meta, helpers] = useField(name);

  const hasError = meta.touched && meta.error;
  const isValid = meta.touched && !meta.error && field.value;

  return (
    <FormControl fullWidth error={Boolean(hasError)}>
      <TextField
        {...field}
        {...props}
        type={type}
        label={label}
        placeholder={placeholder}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        required={required}
        disabled={disabled}
        error={Boolean(hasError)}
        helperText={
          <AnimatePresence mode="wait">
            {hasError ? (
              <Box
                component={motion.span}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <ErrorIcon sx={{ fontSize: 16 }} />
                <span>{meta.error}</span>
              </Box>
            ) : helperText ? (
              <span>{helperText}</span>
            ) : null}
          </AnimatePresence>
        }
        InputProps={{
          ...props.InputProps,
          endAdornment: showValidation ? (
            <AnimatePresence mode="wait">
              {isValid && (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                </Box>
              )}
            </AnimatePresence>
          ) : props.InputProps?.endAdornment,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused': {
              '& fieldset': {
                borderColor: hasError ? 'error.main' : isValid ? 'success.main' : 'primary.main',
                borderWidth: 2,
              },
            },
          },
          ...props.sx,
        }}
      />
    </FormControl>
  );
};

export default FormField;
