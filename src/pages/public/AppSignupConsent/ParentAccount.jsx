import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
} from '@mui/material';
import ConsentLayout from './ConsentLayout';
import appSignupConsentService from '../../../api/appSignupConsentService';

/**
 * Step 1: Create Parent Account
 * - Prefills parent name, email, phone from consent data
 * - If parent email exists, shows login form instead
 * - Creates guardian account on submit
 */
const ParentAccount = ({ consent, token, onNext, onError }) => {
  const isDemoMode = token === 'demo' || token === 'test' || token === '1';
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(!isDemoMode);
  const [parentExists, setParentExists] = useState(false);
  const [error, setError] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Check if parent email already exists
  useEffect(() => {
    const checkParent = async () => {
      // Skip API call in demo mode
      if (isDemoMode) {
        setCheckingEmail(false);
        return;
      }

      try {
        setCheckingEmail(true);
        const result = await appSignupConsentService.checkParentExists(token);
        setParentExists(result.data.exists);
        setIsLoginMode(result.data.exists);
      } catch (err) {
        console.error('Error checking parent:', err);
      } finally {
        setCheckingEmail(false);
      }
    };

    checkParent();
  }, [token, isDemoMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      // In demo mode, skip API calls
      if (isDemoMode) {
        onNext();
        return;
      }

      if (isLoginMode) {
        await appSignupConsentService.loginParent(token, {
          email: consent.parent.email,
          password: formData.password,
        });
      } else {
        await appSignupConsentService.registerParent(token, {
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }

      onNext();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({ password: '', confirmPassword: '' });
    setError(null);
  };

  if (checkingEmail) {
    return (
      <ConsentLayout title="Create Parent Account" academy={consent?.academy}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </ConsentLayout>
    );
  }

  return (
    <ConsentLayout title="Create Parent Account" academy={consent?.academy}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {parentExists && !isLoginMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          An account with this email already exists. Please sign in to continue.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Prefilled parent info (read-only) */}
        <TextField
          fullWidth
          label="Full Name"
          value={consent.parent.name}
          disabled
          margin="normal"
          InputProps={{ readOnly: true }}
        />

        <TextField
          fullWidth
          label="Email Address"
          value={consent.parent.email}
          disabled
          margin="normal"
          InputProps={{ readOnly: true }}
        />

        {consent.parent.phone && (
          <TextField
            fullWidth
            label="Phone Number (Optional)"
            value={consent.parent.phone}
            disabled
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        )}

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {isLoginMode ? 'Sign In' : 'Set Your Password'}
          </Typography>
        </Divider>

        {/* Password fields */}
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          margin="normal"
          autoComplete={isLoginMode ? 'current-password' : 'new-password'}
        />

        {!isLoginMode && (
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
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            mt: 3,
            mb: 2,
            py: 1.5,
            backgroundColor: '#1a1a2e',
            '&:hover': {
              backgroundColor: '#16213e',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : isLoginMode ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary">
          {isLoginMode ? "Don't have an account? " : 'Already Have an Account? '}
          <Link
            component="button"
            type="button"
            onClick={toggleMode}
            sx={{ color: '#6366f1', fontWeight: 500 }}
          >
            {isLoginMode ? 'Create Account' : 'Sign In'}
          </Link>
        </Typography>
      </Box>
    </ConsentLayout>
  );
};

export default ParentAccount;
