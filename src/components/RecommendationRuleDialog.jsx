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
  Slider,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const OPERATORS = [
  { value: 'GREATER_THAN', label: '>' },
  { value: 'LESS_THAN', label: '<' },
  { value: 'GREATER_THAN_OR_EQUAL', label: '>=' },
  { value: 'LESS_THAN_OR_EQUAL', label: '<=' },
  { value: 'EQUAL', label: '=' },
  { value: 'BETWEEN', label: 'Between' },
];

const METRIC_CATEGORIES = {
  'Overall': [
    'overall.totalScore',
    'overall.overallScore',
    'overall.patternEfficiency',
  ],
  'Passing': [
    'passing.passingDuration',
    'passing.angleOfBallReturn',
    'passing.ballSpeedReturn',
    'passing.averageTouches',
    'passing.ballControlDistance',
    'passing.overallScore',
  ],
  'Dribbling': [
    'dribbling.speedToComplete',
    'dribbling.numberOfTouches',
    'dribbling.ballDistanceFromFoot',
    'dribbling.angleOfBallReturn',
    'dribbling.overallScore',
  ],
  'First Touch': [
    'firstTouch.passing1stTouchDistance',
    'firstTouch.dribbling1stTouchDistance',
    'firstTouch.dribbling1stTouchAngle',
    'firstTouch.overallScore',
  ],
};

const RecommendationRuleDialog = ({ open, onClose, onSave, rule, exercises, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    trainingExercise: '',
    priority: 5,
    conditions: [
      {
        metric: '',
        operator: 'GREATER_THAN',
        threshold: 0,
        secondThreshold: null,
      },
    ],
    recommendation: {
      title: { en: '', es: '' },
      message: { en: '', es: '' },
      actionPlan: { en: '', es: '' },
    },
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (rule && mode === 'edit') {
      setFormData({
        name: rule.name || '',
        trainingExercise: rule.trainingExercise?._id || rule.trainingExercise || '',
        priority: rule.priority || 5,
        conditions: rule.conditions?.length > 0 ? rule.conditions : [
          { metric: '', operator: 'GREATER_THAN', threshold: 0, secondThreshold: null }
        ],
        recommendation: {
          title: rule.recommendation?.title || { en: '', es: '' },
          message: rule.recommendation?.message || { en: '', es: '' },
          actionPlan: rule.recommendation?.actionPlan || { en: '', es: '' },
        },
        isActive: rule.isActive !== undefined ? rule.isActive : true,
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: '',
        trainingExercise: '',
        priority: 5,
        conditions: [
          { metric: '', operator: 'GREATER_THAN', threshold: 0, secondThreshold: null }
        ],
        recommendation: {
          title: { en: '', es: '' },
          message: { en: '', es: '' },
          actionPlan: { en: '', es: '' },
        },
        isActive: true,
      });
    }
    setErrors({});
  }, [rule, mode, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRecommendationChange = (field, lang, value) => {
    setFormData((prev) => ({
      ...prev,
      recommendation: {
        ...prev.recommendation,
        [field]: {
          ...prev.recommendation[field],
          [lang]: value,
        },
      },
    }));
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, conditions: newConditions }));
  };

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { metric: '', operator: 'GREATER_THAN', threshold: 0, secondThreshold: null },
      ],
    }));
  };

  const removeCondition = (index) => {
    if (formData.conditions.length > 1) {
      setFormData((prev) => ({
        ...prev,
        conditions: prev.conditions.filter((_, i) => i !== index),
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (!formData.trainingExercise) {
      newErrors.trainingExercise = 'Training exercise is required';
    }

    if (!formData.recommendation.title.en?.trim()) {
      newErrors.recommendationTitleEn = 'English title is required';
    }

    if (!formData.recommendation.message.en?.trim()) {
      newErrors.recommendationMessageEn = 'English message is required';
    }

    formData.conditions.forEach((condition, index) => {
      if (!condition.metric) {
        newErrors[`condition_${index}_metric`] = 'Metric is required';
      }
      if (condition.threshold === '' || condition.threshold === null) {
        newErrors[`condition_${index}_threshold`] = 'Threshold is required';
      }
      if (condition.operator === 'BETWEEN' && (condition.secondThreshold === '' || condition.secondThreshold === null)) {
        newErrors[`condition_${index}_secondThreshold`] = 'Second threshold is required for BETWEEN operator';
      }
    });

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
        {mode === 'edit' ? 'Edit Recommendation Rule' : 'Create Recommendation Rule'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Rule Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            {/* Training Exercise */}
            <Grid item xs={12} md={8}>
              <FormControl fullWidth required error={!!errors.trainingExercise}>
                <InputLabel>Training Exercise</InputLabel>
                <Select
                  value={formData.trainingExercise}
                  onChange={(e) => handleChange('trainingExercise', e.target.value)}
                  label="Training Exercise"
                >
                  {exercises?.map((exercise) => (
                    <MenuItem key={exercise._id} value={exercise._id}>
                      {exercise.name?.en || 'Unnamed Exercise'} ({exercise.category})
                    </MenuItem>
                  ))}
                </Select>
                {errors.trainingExercise && (
                  <Typography variant="caption" color="error">
                    {errors.trainingExercise}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Priority */}
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Priority: {formData.priority}</Typography>
              <Slider
                value={formData.priority}
                onChange={(e, value) => handleChange('priority', value)}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                1 = Low, 10 = High
              </Typography>
            </Grid>

            {/* Conditions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Conditions" />
              </Divider>
              {formData.conditions.map((condition, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        Condition {index + 1}
                      </Typography>
                    </Grid>

                    {/* Metric */}
                    <Grid item xs={12} md={5}>
                      <FormControl fullWidth size="small" error={!!errors[`condition_${index}_metric`]}>
                        <InputLabel>Metric</InputLabel>
                        <Select
                          value={condition.metric}
                          onChange={(e) => handleConditionChange(index, 'metric', e.target.value)}
                          label="Metric"
                        >
                          {Object.entries(METRIC_CATEGORIES).map(([category, metrics]) => [
                            <MenuItem key={category} disabled sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                              {category}
                            </MenuItem>,
                            ...metrics.map((metric) => (
                              <MenuItem key={metric} value={metric} sx={{ pl: 4 }}>
                                {metric.split('.')[1]}
                              </MenuItem>
                            )),
                          ])}
                        </Select>
                        {errors[`condition_${index}_metric`] && (
                          <Typography variant="caption" color="error">
                            {errors[`condition_${index}_metric`]}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Operator */}
                    <Grid item xs={6} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={condition.operator}
                          onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                          label="Operator"
                        >
                          {OPERATORS.map((op) => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Threshold */}
                    <Grid item xs={6} md={condition.operator === 'BETWEEN' ? 2 : 4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Threshold"
                        type="number"
                        value={condition.threshold}
                        onChange={(e) => handleConditionChange(index, 'threshold', parseFloat(e.target.value))}
                        error={!!errors[`condition_${index}_threshold`]}
                        helperText={errors[`condition_${index}_threshold`]}
                        inputProps={{ step: 0.1 }}
                      />
                    </Grid>

                    {/* Second Threshold (for BETWEEN) */}
                    {condition.operator === 'BETWEEN' && (
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Max"
                          type="number"
                          value={condition.secondThreshold || ''}
                          onChange={(e) => handleConditionChange(index, 'secondThreshold', parseFloat(e.target.value))}
                          error={!!errors[`condition_${index}_secondThreshold`]}
                          helperText={errors[`condition_${index}_secondThreshold`]}
                          inputProps={{ step: 0.1 }}
                        />
                      </Grid>
                    )}

                    {/* Remove Button */}
                    <Grid item xs={12} md={1}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeCondition(index)}
                        disabled={formData.conditions.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addCondition}
                variant="outlined"
                size="small"
              >
                Add Condition
              </Button>
            </Grid>

            {/* Recommendation Messages */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Recommendation Messages" />
              </Divider>
            </Grid>

            {/* Title */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title (English)"
                value={formData.recommendation.title.en}
                onChange={(e) => handleRecommendationChange('title', 'en', e.target.value)}
                error={!!errors.recommendationTitleEn}
                helperText={errors.recommendationTitleEn}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title (Spanish)"
                value={formData.recommendation.title.es}
                onChange={(e) => handleRecommendationChange('title', 'es', e.target.value)}
              />
            </Grid>

            {/* Message */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message (English)"
                value={formData.recommendation.message.en}
                onChange={(e) => handleRecommendationChange('message', 'en', e.target.value)}
                error={!!errors.recommendationMessageEn}
                helperText={errors.recommendationMessageEn}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message (Spanish)"
                value={formData.recommendation.message.es}
                onChange={(e) => handleRecommendationChange('message', 'es', e.target.value)}
              />
            </Grid>

            {/* Action Plan */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Action Plan (English)"
                value={formData.recommendation.actionPlan.en}
                onChange={(e) => handleRecommendationChange('actionPlan', 'en', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Action Plan (Spanish)"
                value={formData.recommendation.actionPlan.es}
                onChange={(e) => handleRecommendationChange('actionPlan', 'es', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {mode === 'edit' ? 'Save Changes' : 'Create Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecommendationRuleDialog;
