import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Avatar,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { setCredentials, setAvailableContexts } from '../store/authSlice';
import authService from '../api/authService';
import contextService from '../api/contextService';
import aimLogoOfficial from '../assets/images/aim-logo-official.svg';

const VALID_GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const VALID_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  gender: Yup.string()
    .required('Gender is required')
    .oneOf(VALID_GENDERS, 'Invalid gender selection'),
  dob: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .min(new Date('1900-01-01'), 'Date of birth must be after 1900')
    .nullable(),
  position: Yup.string()
    .oneOf(VALID_POSITIONS, 'Invalid position selection')
    .nullable(),
  jerseyNumber: Yup.number()
    .min(1, 'Jersey number must be at least 1')
    .max(99, 'Jersey number must be at most 99')
    .integer('Jersey number must be a whole number')
    .nullable(),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [invitationError, setInvitationError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [signupError, setSignupError] = useState(null);
  const [signupLoading, setSignupLoading] = useState(false);

  const token = searchParams.get('token');

  // Log on EVERY render
  console.log('[Signup] Component render - token:', token, 'invitationLoading:', invitationLoading, 'invitation:', invitation);

  useEffect(() => {
    console.log('[Signup] useEffect triggered - token:', token);

    const validateToken = async () => {
      if (!token) {
        console.log('[Signup] No token provided');
        setInvitationError('No invitation token provided');
        setInvitationLoading(false);
        return;
      }

      try {
        console.log('[Signup] Validating invitation token...');
        const response = await authService.validateInvitation(token);
        console.log('[Signup Debug] validateInvitation full response:', response);
        console.log('[Signup Debug] response.success:', response.success);
        console.log('[Signup Debug] response.invitationType:', response.invitationType);
        console.log('[Signup Debug] response.data:', response.data);

        if (response.success) {
          // Extract invitation data while preserving invitationType
          const invitationData = {
            ...(response.data.invitation || response.data),
            invitationType: response.invitationType
          };
          console.log('[Signup Debug] Final invitation data with type:', invitationData);
          console.log('[Signup Debug] Setting invitation state...');
          setInvitation(invitationData);
          console.log('[Signup Debug] Invitation state set successfully - should render form now');
        } else {
          console.error('[Signup Debug] Response not successful, setting error');
          setInvitationError(response.message || 'Invalid invitation');
        }
      } catch (error) {
        console.error('[Signup Debug] Error validating invitation:', error);
        console.error('[Signup Debug] Error response:', error.response);
        const errorMessage = error.response?.data?.message || 'Failed to validate invitation token';

        // Handle case where user already has an account
        if (error.response?.status === 409) {
          setInvitationError(
            'You already have an account. Please sign in to accept this invitation.'
          );
        } else if (error.response?.status === 410) {
          setInvitationError('This invitation has expired.');
        } else if (error.response?.status === 400) {
          setInvitationError('This invitation has already been used.');
        } else {
          setInvitationError(errorMessage);
        }
      } finally {
        setInvitationLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setSignupLoading(true);
    setSignupError(null);

    try {
      const isGuardianInvitation = invitation.invitationType === 'guardian';

      let response;
      if (isGuardianInvitation) {
        // Guardian signup - no team info needed
        response = await authService.signupAsGuardian({
          token,
          name: values.name,
          email: values.email,
          gender: values.gender,
          dob: values.dob,
          password: values.password,
        });
      } else {
        // Player signup - include team info
        response = await authService.signupWithInvitation({
          token,
          name: values.name,
          email: values.email,
          gender: values.gender,
          dob: values.dob,
          position: values.position || null,
          jerseyNumber: values.jerseyNumber || null,
          password: values.password,
        });
      }

      if (response.success) {
        // Store credentials
        dispatch(setCredentials(response.data));

        // Fetch available contexts
        try {
          const contextResponse = await contextService.listContexts();
          if (contextResponse.success && contextResponse.data.contexts) {
            dispatch(setAvailableContexts(contextResponse.data.contexts));
          }
        } catch (contextError) {
          console.error('Error fetching contexts:', contextError);
          // Non-critical error - continue with signup
        }

        // Navigate to player dashboard (works for both players and guardians)
        // Guardians will see their accessible players, players see their own data
        navigate('/player/dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Signup failed. Please try again.';

      // Handle existing user case
      if (error.response?.status === 409) {
        setSignupError(
          'An account with this email already exists. Please sign in instead.'
        );
      } else {
        setSignupError(errorMessage);
      }
    } finally {
      setSignupLoading(false);
      setSubmitting(false);
    }
  };

  if (invitationLoading) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Validating invitation...</Typography>
        </Box>
      </Container>
    );
  }

  if (invitationError) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Invalid Invitation
            </Typography>
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {invitationError}
            </Alert>
            {invitationError.includes('already have an account') && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component={RouterLink}
                  to={`/login?token=${token}`}
                  variant="body2"
                >
                  Sign in to accept invitation
                </Link>
              </Box>
            )}
            {!invitationError.includes('already have an account') && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  Go to login
                </Link>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {/* AIM Branding Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img
              src={aimLogoOfficial}
              alt="AIM"
              style={{
                height: '60px',
                marginBottom: '8px',
                color: '#000000'
              }}
            />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#7ED957',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              AI-Powered Football Training
            </Typography>
          </Box>

          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create Your Account
          </Typography>

          {invitation && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              {invitation.invitationType === 'guardian' ? (
                <>
                  {/* Guardian Invitation */}
                  {invitation.player?.profilePicture && (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Avatar
                        src={invitation.player.profilePicture}
                        sx={{ width: 80, height: 80, mx: 'auto' }}
                      >
                        {invitation.player.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" align="center">
                    You've been invited as a guardian for
                  </Typography>
                  <Typography variant="h6" align="center" sx={{ mt: 1, fontWeight: 600 }}>
                    {invitation.player?.name}
                  </Typography>
                  {invitation.relationship && (
                    <Typography variant="body2" align="center" color="text.secondary">
                      Relationship: {invitation.relationship}
                    </Typography>
                  )}
                </>
              ) : (
                <>
                  {/* Player/Team Invitation */}
                  {invitation.club?.logoUrl && (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <img
                        src={invitation.club.logoUrl}
                        alt={invitation.club?.name || invitation.clubName}
                        style={{
                          maxHeight: '80px',
                          maxWidth: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" align="center">
                    You've been invited to join
                  </Typography>
                  <Typography variant="h6" align="center" sx={{ mt: 1, fontWeight: 600 }}>
                    {invitation.club?.name || invitation.clubName}
                  </Typography>
                  {(invitation.team?.name || invitation.teamName) && (
                    <Typography variant="body2" align="center" color="text.secondary">
                      Team: {invitation.team?.name || invitation.teamName}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}

          {signupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {signupError}
            </Alert>
          )}

          <Formik
            initialValues={{
              name: invitation?.name || '',
              email: invitation?.email || '',
              gender: invitation?.gender || '',
              dob: invitation?.dob ? new Date(invitation.dob) : null,
              position: invitation?.position || '',
              jerseyNumber: invitation?.jerseyNumber || '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ errors, touched, isSubmitting, values, setFieldValue }) => {
              console.log('Signup: Form values:', values);
              console.log('Signup: Current invitation:', invitation);
              return (
              <Form>
                {/* Profile Picture Display */}
                {invitation?.profilePicture && (
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar
                      src={invitation.profilePicture}
                      sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
                    >
                      {invitation.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      Your profile picture
                    </Typography>
                  </Box>
                )}

                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Please review and confirm your details
                </Typography>

                {/* Personal Information */}
                <Grid container spacing={2}>
                  <Grid item xs={12}>
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
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      disabled
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email || 'Email cannot be changed'}
                    />
                  </Grid>

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

                  {/* Team Information - Only show for player invitations */}
                  {invitation?.invitationType !== 'guardian' && (invitation?.position || invitation?.jerseyNumber) && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Team Details
                          </Typography>
                        </Divider>
                      </Grid>

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
                    </>
                  )}

                  {/* Password Fields */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Set Your Password
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      id="confirmPassword"
                      autoComplete="new-password"
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={signupLoading || isSubmitting}
                >
                  {signupLoading || isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : invitation?.invitationType === 'guardian' ? (
                    'Create Guardian Account'
                  ) : (
                    'Create Account & Join Team'
                  )}
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to={`/login?token=${token}`}
                    variant="body2"
                  >
                    Already have an account? Sign In
                  </Link>
                </Box>
              </Form>
              );
            }}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
