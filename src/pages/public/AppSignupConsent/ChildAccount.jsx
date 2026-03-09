import React, { useState, useCallback } from 'react';
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
import ConsentLayout from './ConsentLayout';
import appSignupConsentService from '../../../api/appSignupConsentService';

/**
 * Step 3: Create Child Account
 * - Prefills child name from consent data
 * - Handle input with availability check
 * - Password fields
 */
const ChildAccount = ({ consent, token, onNext, onBack, onError }) => {
  const isDemoMode = token === 'demo' || token === 'test' || token === '1';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle availability state
  const [handleStatus, setHandleStatus] = useState({ checking: false, available: null, message: null });
  const [handleCheckTimeout, setHandleCheckTimeout] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    handle: consent.child.email?.split('@')[0] || '',
    password: '',
    confirmPassword: '',
  });

  // Check handle availability with debounce
  const checkHandleAvailability = useCallback(async (handle) => {
    if (!handle || handle.length < 3) {
      setHandleStatus({ checking: false, available: null, message: null });
      return;
    }

    // In demo mode, simulate handle check
    if (isDemoMode) {
      setHandleStatus({
        checking: false,
        available: true,
        message: 'Handle is available (demo mode)',
      });
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
  }, [isDemoMode]);

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
      setLoading(true);

      // In demo mode, skip API calls
      if (isDemoMode) {
        onNext();
        return;
      }

      const childData = {
        handle: formData.handle.toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      await appSignupConsentService.createChild(token, childData);

      onNext();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Format DOB for display
  const formatDob = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <ConsentLayout
      title="Create Child Account"
      subtitle="Add last info to create your child's account"
      showBackButton
      onBack={onBack}
      academy={consent?.academy}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Child info (read-only) */}
        <TextField
          fullWidth
          label="Child's Name"
          value={consent.child.name}
          disabled
          margin="normal"
          InputProps={{ readOnly: true }}
        />

        <TextField
          fullWidth
          label="Date of Birth"
          value={formatDob(consent.child.dateOfBirth)}
          disabled
          margin="normal"
          InputProps={{ readOnly: true }}
        />

        {/* Handle input */}
        <TextField
          fullWidth
          label="Child's Handle"
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
                {handleStatus.available === true && (
                  <CheckCircleIcon color="success" />
                )}
                {handleStatus.available === false && (
                  <ErrorIcon color="error" />
                )}
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
          Child's Password *
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
          disabled={loading}
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
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
        </Button>
      </Box>
    </ConsentLayout>
  );
};

export default ChildAccount;
