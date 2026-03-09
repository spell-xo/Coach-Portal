import React from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { setLoading, setError, selectIsLoading, selectAuthError } from '../store/authSlice';
import authService from '../api/authService';

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  phoneNumber: Yup.string()
    .matches(/^[0-9+\-\s()]+$/, 'Invalid phone number')
    .optional(),
  country: Yup.string().optional(),
  organization: Yup.string().optional(),
  roles: Yup.array()
    .min(1, 'Please select at least one role')
    .required('Please select at least one role'),
});

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const isLoading = useSelector(selectIsLoading);
  const authError = useSelector(selectAuthError);

  const handleSubmit = async (values, { setSubmitting }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        country: values.country,
        organization: values.organization,
      });

      if (response.success) {
        // Registration successful - redirect to login
        // Preserve redirect parameter if it exists (e.g., from invitation flow)
        const redirectParam = searchParams.get('redirect');
        const loginPath = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';
        navigate(loginPath, { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
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
            Coach Portal
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Create your coach account
          </Typography>

          {authError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError}
            </Alert>
          )}

          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              phoneNumber: '',
              country: '',
              organization: '',
              roles: ['coach'], // Default to coach
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, values, setFieldValue }) => (
              <Form>
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
                <Field
                  as={TextField}
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
                <Field
                  as={TextField}
                  margin="normal"
                  fullWidth
                  id="phoneNumber"
                  label="Phone Number"
                  name="phoneNumber"
                  autoComplete="tel"
                  error={touched.phoneNumber && Boolean(errors.phoneNumber)}
                  helperText={touched.phoneNumber && errors.phoneNumber}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      margin="normal"
                      fullWidth
                      id="country"
                      label="Country (Optional)"
                      name="country"
                      autoComplete="country"
                      error={touched.country && Boolean(errors.country)}
                      helperText={touched.country && errors.country}
                    />
                  </Grid>
                </Grid>

                {/* Role Selection */}
                <FormControl
                  component="fieldset"
                  margin="normal"
                  error={touched.roles && Boolean(errors.roles)}
                  sx={{ mt: 2, mb: 2 }}
                >
                  <FormLabel component="legend">I want to register as:</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.roles.includes('player')}
                          onChange={(e) => {
                            const roles = e.target.checked
                              ? [...values.roles, 'player']
                              : values.roles.filter(r => r !== 'player');
                            setFieldValue('roles', roles);
                          }}
                        />
                      }
                      label="Player - Join teams and track my progress"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.roles.includes('coach')}
                          onChange={(e) => {
                            const roles = e.target.checked
                              ? [...values.roles, 'coach']
                              : values.roles.filter(r => r !== 'coach');
                            setFieldValue('roles', roles);
                          }}
                        />
                      }
                      label="Coach - Manage teams and players"
                    />
                  </FormGroup>
                  {touched.roles && errors.roles && (
                    <FormHelperText>{errors.roles}</FormHelperText>
                  )}
                  <FormHelperText>You can select both if you're both a player and a coach</FormHelperText>
                </FormControl>

                {/* Show organization field only if coach role is selected */}
                {values.roles.includes('coach') && (
                  <Field
                    as={TextField}
                    margin="normal"
                    fullWidth
                    id="organization"
                    label="Organization (Optional)"
                    name="organization"
                    helperText="e.g., Youth Soccer League, High School Team"
                    error={touched.organization && Boolean(errors.organization)}
                  />
                )}

                <Field
                  as={TextField}
                  margin="normal"
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
                <Field
                  as={TextField}
                  margin="normal"
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
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign Up'
                  )}
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Already have an account? Sign In
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
