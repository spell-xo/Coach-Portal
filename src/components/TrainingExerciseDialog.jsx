import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Divider,
  OutlinedInput,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const CATEGORIES = [
  'PASSING',
  'DRIBBLING',
  'FIRST_TOUCH',
  'SHOOTING',
  'CONTROL',
  'GENERAL',
];

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const COMMON_EQUIPMENT = [
  'Ball',
  'Cones',
  'Wall',
  'Goal',
  'Obstacle',
  'Hurdles',
  'Mannequin',
  'Poles',
  'Agility Ladder',
];

const COMMON_FOCUS_AREAS = [
  'Ball Control',
  'First Touch',
  'Passing Accuracy',
  'Speed',
  'Technique',
  'Decision Making',
  'Weak Foot',
  'Both Feet',
  'One Touch',
  'Reaction Time',
];

const TrainingExerciseDialog = ({ open, onClose, onSave, exercise, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: { en: '', es: '' },
    description: { en: '', es: '' },
    instructions: { en: '', es: '' },
    category: '',
    difficulty: 'INTERMEDIATE',
    videoUrl: '',
    thumbnailUrl: '',
    equipment: [],
    focusAreas: [],
    duration: 15,
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [newEquipment, setNewEquipment] = useState('');
  const [newFocusArea, setNewFocusArea] = useState('');

  useEffect(() => {
    if (exercise && mode === 'edit') {
      setFormData({
        name: exercise.name || { en: '', es: '' },
        description: exercise.description || { en: '', es: '' },
        instructions: exercise.instructions || { en: '', es: '' },
        category: exercise.category || '',
        difficulty: exercise.difficulty || 'INTERMEDIATE',
        videoUrl: exercise.videoUrl || '',
        thumbnailUrl: exercise.thumbnailUrl || '',
        equipment: exercise.equipment || [],
        focusAreas: exercise.focusAreas || [],
        duration: exercise.duration || 15,
        isActive: exercise.isActive !== undefined ? exercise.isActive : true,
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: { en: '', es: '' },
        description: { en: '', es: '' },
        instructions: { en: '', es: '' },
        category: '',
        difficulty: 'INTERMEDIATE',
        videoUrl: '',
        thumbnailUrl: '',
        equipment: [],
        focusAreas: [],
        duration: 15,
        isActive: true,
      });
    }
    setErrors({});
    setNewEquipment('');
    setNewFocusArea('');
  }, [exercise, mode, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleMultiLangChange = (field, lang, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
      },
    }));
  };

  const addEquipment = (equipment) => {
    if (equipment && !formData.equipment.includes(equipment)) {
      setFormData((prev) => ({
        ...prev,
        equipment: [...prev.equipment, equipment],
      }));
      setNewEquipment('');
    }
  };

  const removeEquipment = (equipment) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((e) => e !== equipment),
    }));
  };

  const addFocusArea = (area) => {
    if (area && !formData.focusAreas.includes(area)) {
      setFormData((prev) => ({
        ...prev,
        focusAreas: [...prev.focusAreas, area],
      }));
      setNewFocusArea('');
    }
  };

  const removeFocusArea = (area) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.filter((a) => a !== area),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.en?.trim()) {
      newErrors.nameEn = 'English name is required';
    }

    if (!formData.description.en?.trim()) {
      newErrors.descriptionEn = 'English description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Difficulty is required';
    }

    if (formData.duration && (formData.duration < 1 || formData.duration > 120)) {
      newErrors.duration = 'Duration must be between 1 and 120 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'edit' ? 'Edit Training Exercise' : 'Create Training Exercise'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Name */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Chip label="Exercise Name" />
              </Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name (English)"
                value={formData.name.en}
                onChange={(e) => handleMultiLangChange('name', 'en', e.target.value)}
                error={!!errors.nameEn}
                helperText={errors.nameEn}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name (Spanish)"
                value={formData.name.es}
                onChange={(e) => handleMultiLangChange('name', 'es', e.target.value)}
              />
            </Grid>

            {/* Category & Difficulty */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Chip label="Classification" />
              </Divider>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  label="Category"
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error">
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required error={!!errors.difficulty}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={formData.difficulty}
                  onChange={(e) => handleChange('difficulty', e.target.value)}
                  label="Difficulty"
                >
                  {DIFFICULTIES.map((diff) => (
                    <MenuItem key={diff} value={diff}>
                      {diff}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                error={!!errors.duration}
                helperText={errors.duration}
                inputProps={{ min: 1, max: 120 }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Chip label="Description" />
              </Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (English)"
                value={formData.description.en}
                onChange={(e) => handleMultiLangChange('description', 'en', e.target.value)}
                error={!!errors.descriptionEn}
                helperText={errors.descriptionEn}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Spanish)"
                value={formData.description.es}
                onChange={(e) => handleMultiLangChange('description', 'es', e.target.value)}
              />
            </Grid>

            {/* Instructions */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Chip label="Instructions" />
              </Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Instructions (English)"
                value={formData.instructions.en}
                onChange={(e) => handleMultiLangChange('instructions', 'en', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Instructions (Spanish)"
                value={formData.instructions.es}
                onChange={(e) => handleMultiLangChange('instructions', 'es', e.target.value)}
              />
            </Grid>

            {/* Media URLs */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Chip label="Media" />
              </Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Video URL"
                value={formData.videoUrl}
                onChange={(e) => handleChange('videoUrl', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thumbnail URL"
                value={formData.thumbnailUrl}
                onChange={(e) => handleChange('thumbnailUrl', e.target.value)}
                placeholder="https://..."
              />
            </Grid>

            {/* Equipment */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Chip label="Equipment Needed" />
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {formData.equipment.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    onDelete={() => removeEquipment(item)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Add Equipment</InputLabel>
                  <Select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    label="Add Equipment"
                  >
                    <MenuItem value="">
                      <em>Select or type custom</em>
                    </MenuItem>
                    {COMMON_EQUIPMENT.filter((eq) => !formData.equipment.includes(eq)).map(
                      (item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Custom Equipment"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder="Or type custom"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEquipment(newEquipment);
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addEquipment(newEquipment)}
                  disabled={!newEquipment}
                >
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Focus Areas */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Chip label="Focus Areas" />
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {formData.focusAreas.map((area) => (
                  <Chip
                    key={area}
                    label={area}
                    onDelete={() => removeFocusArea(area)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Add Focus Area</InputLabel>
                  <Select
                    value={newFocusArea}
                    onChange={(e) => setNewFocusArea(e.target.value)}
                    label="Add Focus Area"
                  >
                    <MenuItem value="">
                      <em>Select or type custom</em>
                    </MenuItem>
                    {COMMON_FOCUS_AREAS.filter((area) => !formData.focusAreas.includes(area)).map(
                      (item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Custom Focus Area"
                  value={newFocusArea}
                  onChange={(e) => setNewFocusArea(e.target.value)}
                  placeholder="Or type custom"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFocusArea(newFocusArea);
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addFocusArea(newFocusArea)}
                  disabled={!newFocusArea}
                >
                  Add
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {mode === 'edit' ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrainingExerciseDialog;
