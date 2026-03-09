import React, { useEffect, useRef } from 'react';
import { useFormikContext } from 'formik';
import { Box, Chip, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * AutoSaveIndicator component to show save status
 */
const AutoSaveIndicator = ({ status }) => {
  return (
    <AnimatePresence mode="wait">
      {status !== 'idle' && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <Chip
            icon={status === 'saved' ? <CheckCircleIcon /> : <SaveIcon />}
            label={
              status === 'saving'
                ? 'Saving draft...'
                : status === 'saved'
                ? 'Draft saved'
                : ''
            }
            size="small"
            color={status === 'saved' ? 'success' : 'default'}
            sx={{
              '& .MuiChip-icon': {
                animation: status === 'saving' ? 'pulse 1s infinite' : 'none',
              },
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
        </Box>
      )}
    </AnimatePresence>
  );
};

/**
 * AutoSaveFormHandler component that handles the auto-save logic
 * Must be used inside a Formik form
 */
const AutoSaveFormHandler = ({
  debounceMs = 1000,
  storageKey,
  onSave,
  enabled = true,
}) => {
  const formik = useFormikContext();
  const [saveStatus, setSaveStatus] = React.useState('idle');
  const timeoutRef = useRef(null);
  const previousValuesRef = useRef(formik.values);

  useEffect(() => {
    // Load saved draft on mount
    if (enabled && storageKey) {
      try {
        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          formik.setValues(parsedDraft, false);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [storageKey, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Check if values have actually changed
    const valuesChanged =
      JSON.stringify(formik.values) !== JSON.stringify(previousValuesRef.current);

    if (!valuesChanged) return;

    previousValuesRef.current = formik.values;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set saving status
    setSaveStatus('saving');

    // Save after debounce period
    timeoutRef.current = setTimeout(async () => {
      try {
        // Save to localStorage
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(formik.values));
        }

        // Call custom onSave if provided
        if (onSave) {
          await onSave(formik.values);
        }

        setSaveStatus('saved');

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Error saving draft:', error);
        setSaveStatus('idle');
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formik.values, debounceMs, storageKey, onSave, enabled]);

  return <AutoSaveIndicator status={saveStatus} />;
};

/**
 * AutoSaveForm wrapper component
 *
 * Features:
 * - Automatic draft saving to localStorage
 * - Debounced saves (default 1s)
 * - Visual save indicator
 * - Custom save callback
 * - Draft restoration on mount
 *
 * Usage:
 * <Formik {...formikProps}>
 *   <AutoSaveForm storageKey="my-form-draft">
 *     <FormField name="field1" />
 *     <FormField name="field2" />
 *   </AutoSaveForm>
 * </Formik>
 */
const AutoSaveForm = ({
  children,
  storageKey,
  debounceMs = 1000,
  onSave,
  enabled = true,
  showIndicator = true,
  indicatorPosition = 'top-right',
  ...props
}) => {
  const getIndicatorStyles = () => {
    const positions = {
      'top-right': {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
      },
      'top-left': {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1,
      },
      'bottom-right': {
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 1,
      },
      'bottom-left': {
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 1,
      },
    };

    return positions[indicatorPosition] || positions['top-right'];
  };

  return (
    <Box sx={{ position: 'relative' }} {...props}>
      {/* Auto-save Indicator */}
      {showIndicator && enabled && (
        <Box sx={getIndicatorStyles()}>
          <AutoSaveFormHandler
            debounceMs={debounceMs}
            storageKey={storageKey}
            onSave={onSave}
            enabled={enabled}
          />
        </Box>
      )}

      {/* Form Content */}
      {children}
    </Box>
  );
};

/**
 * Utility function to clear a saved draft
 */
export const clearFormDraft = (storageKey) => {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
};

/**
 * Utility function to check if a draft exists
 */
export const hasSavedDraft = (storageKey) => {
  try {
    return localStorage.getItem(storageKey) !== null;
  } catch (error) {
    console.error('Error checking draft:', error);
    return false;
  }
};

export default AutoSaveForm;
