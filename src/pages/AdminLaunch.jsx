import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Container } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setUser, setActiveClub, setAccessToken } from '../store/authSlice';
import apiClient from '../api/client';

export default function AdminLaunch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(true);
  const hasValidated = useRef(false);

  useEffect(() => {
    // Prevent double validation in React StrictMode
    if (hasValidated.current) {
      return;
    }
    hasValidated.current = true;

    const validateToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('No token provided. Please launch from the admin panel.');
        setValidating(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        setValidating(true);

        // Call the validation endpoint
        const response = await apiClient.post('/auth/validate-portal-token', { token });

        const { sessionToken, user, club } = response.data.data;

        if (!sessionToken || !user || !club) {
          throw new Error('Invalid response from server');
        }

        // Store the session token
        localStorage.setItem('token', sessionToken);
        localStorage.setItem('refreshToken', sessionToken); // Use same token as refresh for now

        // IMPORTANT: Set the access token in Redux FIRST so the interceptor uses it
        dispatch(setAccessToken(sessionToken));

        // Set apiClient default header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;

        // Store user and club info in Redux
        dispatch(setUser({
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          primaryRole: user.primaryRole,
          context: user.context,
          isPlatformAdmin: true
        }));

        dispatch(setActiveClub({
          id: club.id,
          name: club.name,
          logoUrl: club.logoUrl,
          enabled: club.enabled
        }));

        // Notify parent window (admin UI) that portal is ready
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'PORTAL_READY' }, '*');
          } catch (e) {
            console.warn('Could not notify parent window:', e);
          }
        }

        // Navigate to club dashboard
        setTimeout(() => {
          navigate(`/clubs/${club.id}/dashboard`, { replace: true });
        }, 500);

      } catch (err) {
        console.error('Error validating portal token:', err);

        let errorMessage = 'Failed to authenticate. ';

        if (err.response) {
          if (err.response.status === 401) {
            errorMessage += 'Token is invalid or has expired. Please try launching from admin again.';
          } else if (err.response.status === 403) {
            errorMessage += 'Token has already been used. Please generate a new one from admin.';
          } else {
            errorMessage += err.response.data?.message || 'Please try again.';
          }
        } else if (err.message) {
          errorMessage += err.message;
        } else {
          errorMessage += 'Please try again.';
        }

        setError(errorMessage);
        setValidating(false);

        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    };

    validateToken();
  }, [searchParams, navigate, dispatch]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3
        }}
      >
        {validating ? (
          <>
            <CircularProgress size={60} />
            <Typography variant="h5" color="text.secondary">
              Authenticating Platform Admin Access...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we set up your session
            </Typography>
          </>
        ) : error ? (
          <>
            <Alert severity="error" sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Authentication Failed
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login page...
            </Typography>
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Authentication Successful
              </Typography>
              <Typography variant="body2">
                Redirecting to club dashboard...
              </Typography>
            </Alert>
          </>
        )}
      </Box>
    </Container>
  );
}
