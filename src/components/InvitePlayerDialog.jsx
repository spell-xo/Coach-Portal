import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { PhotoCamera, Close, CameraAlt } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { selectCurrentUser } from '../store/authSlice';

const VALID_GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const VALID_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  gender: Yup.string()
    .required('Gender is required')
    .oneOf(VALID_GENDERS, 'Invalid gender selection'),
  teamId: Yup.string(),
  jerseyNumber: Yup.number()
    .min(1, 'Jersey number must be at least 1')
    .max(99, 'Jersey number must be at most 99')
    .integer('Jersey number must be a whole number')
    .nullable(),
  position: Yup.string()
    .oneOf(VALID_POSITIONS, 'Invalid position selection')
    .nullable(),
  dob: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .min(new Date('1900-01-01'), 'Date of birth must be after 1900')
    .nullable(),
  customMessage: Yup.string()
    .max(500, 'Message must be at most 500 characters')
    .nullable(),
  parentName: Yup.string()
    .when('dob', {
      is: (dob) => dob && calculateAge(dob) < 18,
      then: (schema) => schema.required('Parent name is required for players under 18'),
      otherwise: (schema) => schema.nullable(),
    }),
  parentEmail: Yup.string()
    .when('dob', {
      is: (dob) => dob && calculateAge(dob) < 18,
      then: (schema) => schema.email('Invalid email address').required('Parent email is required for players under 18'),
      otherwise: (schema) => schema.email('Invalid email address').nullable(),
    }),
});

const InvitePlayerDialog = ({ open, onClose, onSubmit, teams = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentUser = useSelector(selectCurrentUser);
  const userId = currentUser?.userId || currentUser?.email; // Get logged-in user's email
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width *= maxWidth / height;
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create a new File object with the original name
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select a valid image file');
          return;
        }

        // Validate file size (max 20MB before compression)
        if (file.size > 20 * 1024 * 1024) {
          setError('Image size must be less than 20MB');
          return;
        }

        let processedFile = file;

        // Compress if file is larger than 1MB
        if (file.size > 1 * 1024 * 1024) {
          console.log('Compressing image...', { originalSize: file.size });
          processedFile = await compressImage(file);
          console.log('Image compressed', {
            originalSize: file.size,
            compressedSize: processedFile.size,
            reduction: Math.round((1 - processedFile.size / file.size) * 100) + '%'
          });
        }

        setProfilePicture(processedFile);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePicturePreview(reader.result);
        };
        reader.readAsDataURL(processedFile);
        setError(null);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process image. Please try a different photo.');
      }
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError(null);
      console.log('InvitePlayerDialog: Submitting form with values:', values);

      // Prepare invitation data
      const invitationData = {
        email: values.email,
        name: values.name,
        gender: values.gender,
        teamId: values.teamId || null,
        jerseyNumber: values.jerseyNumber || null,
        position: values.position || null,
        dob: values.dob || null,
        customMessage: values.customMessage || null,
        profilePicture: profilePicture,
        parentName: values.parentName || null,
        parentEmail: values.parentEmail || null,
      };

      console.log('InvitePlayerDialog: Calling onSubmit with data:', invitationData);
      await onSubmit(invitationData);
      console.log('InvitePlayerDialog: Success!');
      resetForm();
      handleRemoveProfilePicture();
      setSubmitting(false);
      // Success - dialog will be closed by parent
    } catch (err) {
      console.error('InvitePlayerDialog: Error submitting invitation:', err);
      setError(err.message || 'Failed to send invitation');
      setSubmitting(false);
      // Don't close dialog on error - let user see the error message
    }
  };

  const handleClose = () => {
    setError(null);
    handleRemoveProfilePicture();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
    >
      <DialogTitle>Invite Player</DialogTitle>
      <Formik
        initialValues={{
          email: '',
          name: '',
          gender: '',
          teamId: '',
          jerseyNumber: '',
          position: '',
          dob: null,
          customMessage: '',
          parentName: '',
          parentEmail: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, values, setFieldValue }) => (
          <Form>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fill in the player details below. They will receive an invitation to join the club.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Profile Picture Upload */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Profile Picture (Optional)
                </Typography>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2
                }}>
                  <Avatar
                    src={profilePicturePreview}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                    alignItems: 'center'
                  }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<PhotoCamera />}
                      size={isMobile ? 'small' : 'medium'}
                    >
                      Choose Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CameraAlt />}
                      size={isMobile ? 'small' : 'medium'}
                    >
                      Take Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        capture="environment"
                        onChange={handleProfilePictureChange}
                      />
                    </Button>
                    {profilePicture && (
                      <IconButton
                        size="small"
                        onClick={handleRemoveProfilePicture}
                        color="error"
                      >
                        <Close />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                  Images over 1MB will be automatically compressed • Max size: 20MB
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {/* Name - Required (moved to first position) */}
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    onBlur={(e) => {
                      // Auto-populate email based on name
                      const name = e.target.value.trim();
                      if (name && !values.email && userId) {
                        // Extract domain from logged-in user's email
                        // e.g., "headcoach@gulfunitedfc.com" -> "gulfunitedfc.com"
                        const userEmailParts = userId.split('@');
                        const domain = userEmailParts.length === 2 ? userEmailParts[1] : 'example.com';

                        // Convert name to email format: "Paul McCarthy" -> "paul.mccarthy@gulfunitedfc.com"
                        const emailPrefix = name.toLowerCase().replace(/\s+/g, '.');
                        const generatedEmail = `${emailPrefix}@${domain}`;
                        setFieldValue('email', generatedEmail);
                      }
                    }}
                  />
                </Grid>

                {/* Email - Required (moved to second position) */}
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>

                {/* Gender - Required */}
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    required
                    error={touched.gender && Boolean(errors.gender)}
                  >
                    <InputLabel id="gender-label">Gender</InputLabel>
                    <Field
                      as={Select}
                      labelId="gender-label"
                      id="gender"
                      name="gender"
                      label="Gender"
                    >
                      {VALID_GENDERS.map((gender) => (
                        <MenuItem key={gender} value={gender}>
                          {gender}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.gender && errors.gender && (
                      <FormHelperText>{errors.gender}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Date of Birth - Optional */}
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date of Birth"
                      value={values.dob}
                      onChange={(value) => setFieldValue('dob', value)}
                      maxDate={new Date()}
                      minDate={new Date('1900-01-01')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: touched.dob && Boolean(errors.dob),
                          helperText: touched.dob && errors.dob,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                {/* Parent/Guardian Fields - shown when DOB indicates under 18 */}
                {values.dob && calculateAge(values.dob) !== null && calculateAge(values.dob) < 18 && (
                  <>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ py: 0.5 }}>
                        This player is under 18. Parent/guardian details are required for the consent flow.
                      </Alert>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        required
                        fullWidth
                        id="parentName"
                        label="Parent/Guardian Name"
                        name="parentName"
                        error={touched.parentName && Boolean(errors.parentName)}
                        helperText={touched.parentName && errors.parentName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        required
                        fullWidth
                        id="parentEmail"
                        label="Parent/Guardian Email"
                        name="parentEmail"
                        type="email"
                        error={touched.parentEmail && Boolean(errors.parentEmail)}
                        helperText={touched.parentEmail && errors.parentEmail}
                      />
                    </Grid>
                  </>
                )}

                {/* Team - Optional */}
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    error={touched.teamId && Boolean(errors.teamId)}
                  >
                    <InputLabel id="team-label">Team (Optional)</InputLabel>
                    <Field
                      as={Select}
                      labelId="team-label"
                      id="teamId"
                      name="teamId"
                      label="Team (Optional)"
                    >
                      <MenuItem value="">
                        <em>No team - Club only</em>
                      </MenuItem>
                      {teams.map((team) => (
                        <MenuItem key={team._id} value={team._id}>
                          {team.name} {team.ageGroup && `(${team.ageGroup})`}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.teamId && errors.teamId && (
                      <FormHelperText>{errors.teamId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Position - Optional */}
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    error={touched.position && Boolean(errors.position)}
                  >
                    <InputLabel id="position-label">Position (Optional)</InputLabel>
                    <Field
                      as={Select}
                      labelId="position-label"
                      id="position"
                      name="position"
                      label="Position (Optional)"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {VALID_POSITIONS.map((position) => (
                        <MenuItem key={position} value={position}>
                          {position}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.position && errors.position && (
                      <FormHelperText>{errors.position}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Jersey Number - Optional */}
                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="jerseyNumber"
                    label="Jersey Number (Optional)"
                    name="jerseyNumber"
                    type="number"
                    inputProps={{ min: 1, max: 99 }}
                    error={touched.jerseyNumber && Boolean(errors.jerseyNumber)}
                    helperText={touched.jerseyNumber && errors.jerseyNumber}
                  />
                </Grid>

                {/* Custom Message - Optional */}
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    id="customMessage"
                    label="Custom Message (Optional)"
                    name="customMessage"
                    multiline
                    rows={3}
                    placeholder="Add a personal message to the invitation..."
                    error={touched.customMessage && Boolean(errors.customMessage)}
                    helperText={
                      touched.customMessage && errors.customMessage
                        ? errors.customMessage
                        : `${values.customMessage?.length || 0}/500 characters`
                    }
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Send Invitation'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default InvitePlayerDialog;
