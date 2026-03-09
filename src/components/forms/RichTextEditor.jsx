import React, { useMemo } from 'react';
import { useField } from 'formik';
import { Box, FormLabel, FormHelperText, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * RichTextEditor component with Formik integration
 *
 * Features:
 * - Rich text editing with toolbar
 * - Formik field binding
 * - Validation support
 * - Character count
 * - Customizable toolbar
 */
const RichTextEditor = ({
  name,
  label,
  placeholder = 'Start typing...',
  helperText,
  required = false,
  disabled = false,
  maxLength,
  minHeight = 200,
}) => {
  const [field, meta, helpers] = useField(name);

  const hasError = meta.touched && meta.error;

  // Quill modules configuration
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link'],
        ['clean'],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'link',
  ];

  const handleChange = (content) => {
    helpers.setValue(content);
    helpers.setTouched(true);
  };

  // Get plain text length for character count
  const getTextLength = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent?.length || 0;
  };

  const textLength = getTextLength(field.value);
  const isOverLimit = maxLength && textLength > maxLength;

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

      {/* Editor */}
      <Box
        sx={{
          '& .quill': {
            borderRadius: 2,
            border: '1px solid',
            borderColor: hasError ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
            '&:hover': {
              borderColor: hasError ? 'error.main' : 'rgba(0, 0, 0, 0.87)',
            },
            '&:focus-within': {
              borderColor: hasError ? 'error.main' : 'primary.main',
              borderWidth: 2,
            },
          },
          '& .ql-toolbar': {
            borderRadius: '8px 8px 0 0',
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: 'grey.50',
          },
          '& .ql-container': {
            borderRadius: '0 0 8px 8px',
            minHeight: `${minHeight}px`,
            fontSize: '1rem',
            fontFamily: 'inherit',
          },
          '& .ql-editor': {
            minHeight: `${minHeight}px`,
          },
          '& .ql-editor.ql-blank::before': {
            color: 'text.secondary',
            fontStyle: 'normal',
          },
        }}
      >
        <ReactQuill
          value={field.value || ''}
          onChange={handleChange}
          onBlur={() => helpers.setTouched(true)}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          theme="snow"
        />
      </Box>

      {/* Helper Text / Error Message / Character Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Box sx={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            {hasError ? (
              <FormHelperText
                component={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                error
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, m: 0 }}
              >
                <ErrorIcon sx={{ fontSize: 16 }} />
                <span>{meta.error}</span>
              </FormHelperText>
            ) : helperText ? (
              <FormHelperText sx={{ m: 0 }}>{helperText}</FormHelperText>
            ) : null}
          </AnimatePresence>
        </Box>

        {/* Character Count */}
        {maxLength && (
          <Typography
            variant="caption"
            color={isOverLimit ? 'error' : 'text.secondary'}
            sx={{ whiteSpace: 'nowrap', ml: 2 }}
          >
            {textLength} / {maxLength}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default RichTextEditor;
