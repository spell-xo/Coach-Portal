import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';

const DRILL_TYPES = ['TRIPLE_CONE', 'SINGLE_CONE', 'WALL_JUGGLE', 'FREESTYLE', 'PASSING'];

const ScriptEditDialog = ({ open, onClose, script, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [whenToUse, setWhenToUse] = useState('');
  const [whatToLookFor, setWhatToLookFor] = useState('');
  const [spec, setSpec] = useState('');
  const [applicableDrillTypes, setApplicableDrillTypes] = useState([]);
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (open) {
      if (script) {
        setName(script.name || '');
        setDescription(script.description || '');
        setPurpose(script.purpose || '');
        setWhenToUse(script.when_to_use || '');
        setWhatToLookFor(script.what_to_look_for || '');
        setSpec(script.spec ? (typeof script.spec === 'string' ? script.spec : JSON.stringify(script.spec, null, 2)) : '');
        setApplicableDrillTypes(script.applicable_drill_types || []);
        setTags((script.tags || []).join(', '));
      } else {
        setName('');
        setDescription('');
        setPurpose('');
        setWhenToUse('');
        setWhatToLookFor('');
        setSpec('');
        setApplicableDrillTypes([]);
        setTags('');
      }
    }
  }, [open, script]);

  const toggleDrillType = (type) => {
    setApplicableDrillTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      let parsedSpec = {};
      if (spec.trim()) {
        try {
          parsedSpec = JSON.parse(spec);
        } catch {
          parsedSpec = spec.trim();
        }
      }

      const data = {
        name: name.trim(),
        description: description.trim(),
        purpose: purpose.trim() || undefined,
        when_to_use: whenToUse.trim() || undefined,
        what_to_look_for: whatToLookFor.trim() || undefined,
        spec: parsedSpec,
        applicable_drill_types: applicableDrillTypes,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await onSave(data, script?.id);
      onClose();
    } catch (err) {
      console.error('Failed to save script:', err);
      const message = err?.response?.data?.detail || err?.message || 'Failed to save script';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const isCreate = !script;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MovieCreationIcon />
        <Typography variant="h6" component="span">
          {isCreate ? 'Create Annotation Script' : 'Edit Annotation Script'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {saveError && (
          <Alert severity="error" onClose={() => setSaveError('')}>
            {saveError}
          </Alert>
        )}
        {/* Basic Info */}
        <Typography variant="subtitle2" color="text.secondary">
          Basic Info
        </Typography>
        <TextField
          label="Name"
          required
          fullWidth
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          size="small"
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Divider />

        {/* Metadata */}
        <Typography variant="subtitle2" color="text.secondary">
          Metadata
        </Typography>
        <TextField
          label="Purpose"
          fullWidth
          size="small"
          multiline
          rows={2}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
        <TextField
          label="When to Use"
          fullWidth
          size="small"
          multiline
          rows={2}
          value={whenToUse}
          onChange={(e) => setWhenToUse(e.target.value)}
        />
        <TextField
          label="What to Look For"
          fullWidth
          size="small"
          multiline
          rows={2}
          value={whatToLookFor}
          onChange={(e) => setWhatToLookFor(e.target.value)}
        />

        <Divider />

        {/* Spec */}
        <Typography variant="subtitle2" color="text.secondary">
          Annotation Spec
        </Typography>
        <TextField
          label="DSL Spec (JSON)"
          fullWidth
          size="small"
          multiline
          rows={10}
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
        />

        <Divider />

        {/* Drill Types */}
        <Typography variant="subtitle2" color="text.secondary">
          Drill Types
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {DRILL_TYPES.map((type) => (
            <Chip
              key={type}
              label={type.replace(/_/g, ' ')}
              size="small"
              variant={applicableDrillTypes.includes(type) ? 'filled' : 'outlined'}
              color={applicableDrillTypes.includes(type) ? 'primary' : 'default'}
              onClick={() => toggleDrillType(type)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        <TextField
          label="Tags (comma-separated)"
          fullWidth
          size="small"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isCreate ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScriptEditDialog;
