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
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import BoltIcon from '@mui/icons-material/Bolt';

const CATEGORY_OPTIONS = ['Scoring', 'Tracking', 'Detection', 'Validation', 'General'];

const DRILL_TYPES = ['TRIPLE_CONE', 'SINGLE_CONE', 'WALL_JUGGLE', 'FREESTYLE', 'PASSING'];

const EMPTY_STEP = { title: '', description: '', reasoning: '', expected_outcome: '' };
const EMPTY_SCRIPT = { name: '', script: '' };

const ShortcutEditDialog = ({ open, onClose, shortcut, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [summary, setSummary] = useState('');
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);
  const [scripts, setScripts] = useState([]);
  const [conclusionTemplate, setConclusionTemplate] = useState('');
  const [applicableDrillTypes, setApplicableDrillTypes] = useState([]);
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (open) {
      if (shortcut) {
        setName(shortcut.name || '');
        setDescription(shortcut.description || '');
        setCategory(shortcut.category || 'General');
        const wf = shortcut.workflow || {};
        setSummary(wf.summary || '');
        setSteps(wf.steps?.length > 0 ? wf.steps.map((s) => ({ ...EMPTY_STEP, ...s })) : [{ ...EMPTY_STEP }]);
        setScripts(wf.scripts?.length > 0 ? wf.scripts.map((s) => ({ ...EMPTY_SCRIPT, ...s })) : []);
        setConclusionTemplate(wf.conclusion_template || '');
        setApplicableDrillTypes(shortcut.applicable_drill_types || []);
        setTags((shortcut.tags || []).join(', '));
      } else {
        setName('');
        setDescription('');
        setCategory('General');
        setSummary('');
        setSteps([{ ...EMPTY_STEP }]);
        setScripts([]);
        setConclusionTemplate('');
        setApplicableDrillTypes([]);
        setTags('');
      }
    }
  }, [open, shortcut]);

  const handleStepChange = (index, field, value) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleScriptChange = (index, field, value) => {
    setScripts((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const toggleDrillType = (type) => {
    setApplicableDrillTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        category,
        workflow: {
          summary: summary.trim(),
          steps: steps.filter((s) => s.title.trim()),
          scripts: scripts.filter((s) => s.name.trim()),
          conclusion_template: conclusionTemplate.trim(),
        },
        applicable_drill_types: applicableDrillTypes,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await onSave(data, shortcut?.id);
      onClose();
    } catch (err) {
      console.error('Failed to save shortcut:', err);
    } finally {
      setSaving(false);
    }
  };

  const isCreate = !shortcut;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BoltIcon />
        <Typography variant="h6" component="span">
          {isCreate ? 'Create Analysis Shortcut' : 'Edit Analysis Shortcut'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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
        <FormControl size="small" fullWidth>
          <InputLabel>Category</InputLabel>
          <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />

        {/* Workflow */}
        <Typography variant="subtitle2" color="text.secondary">
          Workflow
        </Typography>
        <TextField
          label="Summary"
          fullWidth
          size="small"
          multiline
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        {/* Steps */}
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Steps
        </Typography>
        {steps.map((step, i) => (
          <Box key={i} sx={{ pl: 1, borderLeft: '3px solid', borderColor: 'primary.light', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Step {i + 1}
              </Typography>
              {steps.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                  sx={{ color: 'error.main', ml: 'auto' }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="Title"
                size="small"
                fullWidth
                value={step.title}
                onChange={(e) => handleStepChange(i, 'title', e.target.value)}
              />
              <TextField
                label="Description"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={step.description}
                onChange={(e) => handleStepChange(i, 'description', e.target.value)}
              />
              <TextField
                label="Reasoning"
                size="small"
                fullWidth
                value={step.reasoning}
                onChange={(e) => handleStepChange(i, 'reasoning', e.target.value)}
              />
              <TextField
                label="Expected Outcome"
                size="small"
                fullWidth
                value={step.expected_outcome}
                onChange={(e) => handleStepChange(i, 'expected_outcome', e.target.value)}
              />
            </Box>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setSteps((prev) => [...prev, { ...EMPTY_STEP }])}
          sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
        >
          Add Step
        </Button>

        <Divider />

        {/* Scripts */}
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Scripts
        </Typography>
        {scripts.map((s, i) => (
          <Box key={i} sx={{ pl: 1, borderLeft: '3px solid', borderColor: 'secondary.light', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Script {i + 1}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setScripts((prev) => prev.filter((_, idx) => idx !== i))}
                sx={{ color: 'error.main', ml: 'auto' }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="Name"
                size="small"
                fullWidth
                value={s.name}
                onChange={(e) => handleScriptChange(i, 'name', e.target.value)}
              />
              <TextField
                label="Script"
                size="small"
                fullWidth
                multiline
                rows={6}
                value={s.script}
                onChange={(e) => handleScriptChange(i, 'script', e.target.value)}
                InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
              />
            </Box>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setScripts((prev) => [...prev, { ...EMPTY_SCRIPT }])}
          sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
        >
          Add Script
        </Button>

        <Divider />

        <TextField
          label="Conclusion Template"
          fullWidth
          size="small"
          multiline
          rows={3}
          value={conclusionTemplate}
          onChange={(e) => setConclusionTemplate(e.target.value)}
        />

        <Divider />

        {/* Metadata */}
        <Typography variant="subtitle2" color="text.secondary">
          Metadata
        </Typography>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Applicable Drill Types
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

export default ShortcutEditDialog;
