import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Team name is required')
    .min(3, 'Team name must be at least 3 characters')
    .max(50, 'Team name must not exceed 50 characters'),
  ageGroup: Yup.string()
    .required('Age group is required'),
  privacy: Yup.string()
    .required('Privacy setting is required'),
});

const ageGroups = [
  { value: 'U6', label: 'Under 6' },
  { value: 'U7', label: 'Under 7' },
  { value: 'U8', label: 'Under 8' },
  { value: 'U9', label: 'Under 9' },
  { value: 'U10', label: 'Under 10' },
  { value: 'U11', label: 'Under 11' },
  { value: 'U12', label: 'Under 12' },
  { value: 'U13', label: 'Under 13' },
  { value: 'U14', label: 'Under 14' },
  { value: 'U15', label: 'Under 15' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U17', label: 'Under 17' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U19', label: 'Under 19' },
  { value: 'U20', label: 'Under 20' },
  { value: 'U21', label: 'Under 21' },
  { value: 'Adult', label: 'Adult' },
  { value: 'Mixed', label: 'Mixed Age' },
];

const teamColours = [
  { value: 'red', label: 'Red', hex: '#EF4444' },
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'green', label: 'Green', hex: '#22C55E' },
  { value: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { value: 'orange', label: 'Orange', hex: '#F97316' },
  { value: 'purple', label: 'Purple', hex: '#A855F7' },
  { value: 'pink', label: 'Pink', hex: '#EC4899' },
  { value: 'cyan', label: 'Cyan', hex: '#06B6D4' },
  { value: 'grey', label: 'Grey', hex: '#6B7280' },
  { value: 'black', label: 'Black', hex: '#1F2937' },
];

// Generate birth years from 2000 to current year
const currentYear = new Date().getFullYear();
const birthYears = [];
for (let year = currentYear; year >= 2000; year--) {
  birthYears.push({ value: String(year), label: String(year) });
}

const CreateTeamDialog = ({ open, onClose, onSubmit }) => {
  const [error, setError] = useState(null);
  const [ageGroupMode, setAgeGroupMode] = useState('traditional'); // 'traditional' or 'birthYear'

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      await onSubmit(values);
      setSubmitting(false);
    } catch (err) {
      setError(err.message || 'Failed to create team');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Team</DialogTitle>
      <Formik
        initialValues={{
          name: '',
          ageGroup: '',
          privacy: 'private',
          colour: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, values, setFieldValue }) => (
          <Form>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Field
                as={TextField}
                margin="normal"
                required
                fullWidth
                id="name"
                label="Team Name"
                name="name"
                autoFocus
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />

              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Age Group Type
                </Typography>
                <ToggleButtonGroup
                  value={ageGroupMode}
                  exclusive
                  onChange={(e, newMode) => {
                    if (newMode !== null) {
                      setAgeGroupMode(newMode);
                      setFieldValue('ageGroup', ''); // Reset selection when switching modes
                    }
                  }}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="traditional">
                    Age Group (U6-U21)
                  </ToggleButton>
                  <ToggleButton value="birthYear">
                    Birth Year
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <FormControl
                fullWidth
                margin="normal"
                required
                error={touched.ageGroup && Boolean(errors.ageGroup)}
              >
                <InputLabel id="ageGroup-label">
                  {ageGroupMode === 'traditional' ? 'Age Group' : 'Birth Year'}
                </InputLabel>
                <Select
                  labelId="ageGroup-label"
                  id="ageGroup"
                  name="ageGroup"
                  value={values.ageGroup}
                  label={ageGroupMode === 'traditional' ? 'Age Group' : 'Birth Year'}
                  onChange={(e) => setFieldValue('ageGroup', e.target.value)}
                >
                  {ageGroupMode === 'traditional'
                    ? ageGroups.map((group) => (
                        <MenuItem key={group.value} value={group.value}>
                          {group.label}
                        </MenuItem>
                      ))
                    : birthYears.map((year) => (
                        <MenuItem key={year.value} value={year.value}>
                          {year.label}
                        </MenuItem>
                      ))
                  }
                </Select>
                {touched.ageGroup && errors.ageGroup && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.ageGroup}
                  </Alert>
                )}
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <InputLabel id="privacy-label">Privacy</InputLabel>
                <Select
                  labelId="privacy-label"
                  id="privacy"
                  name="privacy"
                  value={values.privacy}
                  label="Privacy"
                  onChange={(e) => setFieldValue('privacy', e.target.value)}
                >
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Team Colour (Optional)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {teamColours.map((colour) => (
                    <Box
                      key={colour.value}
                      onClick={() => setFieldValue('colour', values.colour === colour.value ? '' : colour.value)}
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: colour.hex,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: values.colour === colour.value ? '3px solid #000' : '2px solid transparent',
                        boxShadow: values.colour === colour.value ? '0 0 0 2px #fff, 0 0 0 4px #000' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                      title={colour.label}
                    />
                  ))}
                </Box>
                {values.colour && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Selected: {teamColours.find(c => c.value === values.colour)?.label}
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Create Team'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default CreateTeamDialog;
