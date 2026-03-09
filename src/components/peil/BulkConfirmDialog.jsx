import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import bulkJobService from '../../api/bulkJobService';

const BulkConfirmDialog = ({ open, onClose, onConfirm, drillIds, totalFilteredCount }) => {
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [skipOnError, setSkipOnError] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const count = drillIds.length > 0 ? drillIds.length : totalFilteredCount;
  const idsToUse = drillIds.length > 0 ? drillIds : [];

  const handleSubmit = async () => {
    if (idsToUse.length === 0) {
      setError('No drills selected. Select specific drills first.');
      return;
    }

    if (idsToUse.length > 500) {
      setError('Maximum 500 drills per job. Please reduce your selection.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await bulkJobService.createJob({
        jobType: 'gemini_validation',
        drillIds: idsToUse,
        config: { max_concurrent: maxConcurrent, skip_on_error: skipOnError },
      });

      if (onConfirm) onConfirm(idsToUse);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Validate Drills</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          This will run Gemini validation on <strong>{count}</strong> drill{count !== 1 ? 's' : ''}.
        </Typography>

        {drillIds.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            No drills are selected. Select specific drills from the table to validate them.
          </Alert>
        )}

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Concurrency</InputLabel>
          <Select value={maxConcurrent} onChange={(e) => setMaxConcurrent(e.target.value)} label="Concurrency">
            <MenuItem value={1}>1 (slowest, safest)</MenuItem>
            <MenuItem value={3}>3 (recommended)</MenuItem>
            <MenuItem value={5}>5 (faster)</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Checkbox checked={skipOnError} onChange={(e) => setSkipOnError(e.target.checked)} size="small" />}
          label={<Typography variant="body2">Skip on error (continue processing remaining drills)</Typography>}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2, fontSize: '0.8rem' }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small" disabled={submitting}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={submitting || idsToUse.length === 0}
        >
          {submitting ? 'Starting...' : 'Start Validation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkConfirmDialog;
