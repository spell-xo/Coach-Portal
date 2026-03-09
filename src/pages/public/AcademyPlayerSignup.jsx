import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ConsentLayout from './AppSignupConsent/ConsentLayout';
import appSignupConsentService from '../../api/appSignupConsentService';

/**
 * Academy Player Signup Page (13-18 flow)
 *
 * Accessed via /signup/player?token=xxx
 * Player creates their own account using the playerSignupToken.
 * This can be completed before or after the parent consents.
 */
const AcademyPlayerSignup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [signupData, setSignupData] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [completionData, setCompletionData] = useState(null);

  // Handle availability state
  const [handleStatus, setHandleStatus] = useState({ checking: false, available: null, message: null });
  const [handleCheckTimeout, setHandleCheckTimeout] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    handle: '',
    password: '',
    confirmPassword: '',
  });

  // Load signup data
  useEffect(() => {
    const loadSignupData = async () => {
      if (!token) {
        setError('Invalid signup link. No token provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await appSignupConsentService.getPlayerSignup(token);
        setSignupData(result.data);

        if (result.data.playerSignupCompleted) {
          setCompleted(true);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load signup details');
      } finally {
        setLoading(false);
      }
    };

    loadSignupData();
  }, [token]);

  // Check handle availability with debounce
  const checkHandleAvailability = useCallback(async (handle) => {
    if (!handle || handle.length < 3) {
      setHandleStatus({ checking: false, available: null, message: null });
      return;
    }

    setHandleStatus({ checking: true, available: null, message: null });

    try {
      const result = await appSignupConsentService.checkHandle(handle);
      setHandleStatus({
        checking: false,
        available: result.data.available,
        message: result.data.available ? 'Handle is available' : result.data.reason,
      });
    } catch (err) {
      setHandleStatus({
        checking: false,
        available: null,
        message: 'Error checking handle',
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);

    // Debounced handle check
    if (name === 'handle') {
      if (handleCheckTimeout) {
        clearTimeout(handleCheckTimeout);
      }
      const timeout = setTimeout(() => {
        checkHandleAvailability(value.toLowerCase());
      }, 500);
      setHandleCheckTimeout(timeout);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.handle || formData.handle.length < 3) {
      setError('Handle must be at least 3 characters');
      return;
    }

    if (handleStatus.available === false) {
      setError('Please choose an available handle');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);

      const result = await appSignupConsentService.completePlayerSignup(token, {
        handle: formData.handle.toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setCompletionData(result.data);
      setCompleted(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Format DOB for display
  const formatDob = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f7',
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
          Loading signup details...
        </Typography>
      </Box>
    );
  }

  // Error state (no signup data)
  if (error && !signupData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f7',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Completed state
  if (completed) {
    const parentConsented = completionData?.parentalConsentGranted || signupData?.consentStatus === 'completed';

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f7',
          p: 3,
        }}
      >
        <Box
          sx={{
            maxWidth: 500,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 3,
            p: { xs: 4, md: 6 },
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />

          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2 }}>
            Account Created
          </Typography>

          {signupData?.academy && (
            <Typography variant="subtitle1" sx={{ color: '#6366f1', mb: 2, fontWeight: 600 }}>
              {signupData.academy.clubName}{signupData.academy.teamName ? ` - ${signupData.academy.teamName}` : ''}
            </Typography>
          )}

          <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
            {parentConsented
              ? 'Your account is all set! You can now log in to the AIM app.'
              : 'Your account has been created. You\'ll be able to use the app once your parent/guardian completes the consent process.'}
          </Typography>

          {completionData?.handle && (
            <Box sx={{ backgroundColor: '#f5f5f7', borderRadius: 2, p: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Your Handle</Typography>
              <Typography variant="h6" fontWeight={600}>@{completionData.handle}</Typography>
            </Box>
          )}

          {!parentConsented && (
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              Your parent/guardian needs to complete the consent process before you can use the app.
              Ask them to check their email or use the consent link provided by your club.
            </Alert>
          )}
        </Box>
      </Box>
    );
  }

  // Signup form
  const academy = signupData?.academy;

  return (
    <ConsentLayout
      title="Create Your Account"
      subtitle={`Set up your player account${academy ? ` for ${academy.clubName}` : ''}`}
      academy={academy}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Player info (read-only) */}
        <TextField
          fullWidth
          label="Your Name"
          value={signupData?.playerName || ''}
          disabled
          margin="normal"
          InputProps={{ readOnly: true }}
        />

        {signupData?.dateOfBirth && (
          <TextField
            fullWidth
            label="Date of Birth"
            value={formatDob(signupData.dateOfBirth)}
            disabled
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        )}

        {/* Handle input */}
        <TextField
          fullWidth
          label="Choose Your Handle"
          name="handle"
          value={formData.handle}
          onChange={handleChange}
          required
          margin="normal"
          placeholder="Choose a unique username"
          helperText={handleStatus.message || 'This will be used for login'}
          error={handleStatus.available === false}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {handleStatus.checking && <CircularProgress size={20} />}
                {handleStatus.available === true && <CheckCircleIcon color="success" />}
                {handleStatus.available === false && <ErrorIcon color="error" />}
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
          Set Your Password *
        </Typography>

        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          margin="normal"
          autoComplete="new-password"
        />

        <TextField
          fullWidth
          label="Confirm your password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          margin="normal"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={submitting}
          sx={{
            mt: 4,
            mb: 2,
            py: 1.5,
            backgroundColor: '#1a1a2e',
            '&:hover': {
              backgroundColor: '#16213e',
            },
          }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
        </Button>
      </Box>
    </ConsentLayout>
  );
};

export default AcademyPlayerSignup;
