import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import ParentAccount from './ParentAccount';
import TermsConditions from './TermsConditions';
import ChildAccount from './ChildAccount';
import Complete from './Complete';
import appSignupConsentService from '../../../api/appSignupConsentService';

/**
 * Main App Signup Consent Flow Container
 *
 * Routes:
 * /signup/consent?token=xxx
 *
 * Steps:
 * 1. parent_account - Create/login parent account
 * 2. terms_conditions - Accept terms & conditions
 * 3. child_account - Create child account
 * 4. complete - Success screen
 */
const AppSignupConsent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consent, setConsent] = useState(null);
  const [currentStep, setCurrentStep] = useState('parent_account');

  // Demo/test data for previewing the flow without a valid token
  const DEMO_CONSENT = {
    token: 'demo',
    status: 'pending',
    currentStep: 'parent_account',
    ageCategory: 'under_7',
    child: {
      name: 'John Smith',
      dateOfBirth: '2020-05-15',
      country: 'Ireland',
      email: null,
      gender: 'Male'
    },
    parent: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+353871234567',
      hasAccount: false
    },
    consent: {
      termsAccepted: false,
      privacyAccepted: false
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Load consent data
  useEffect(() => {
    const loadConsent = async () => {
      if (!token) {
        setError('Invalid consent link. No token provided.');
        setLoading(false);
        return;
      }

      // Demo mode - use fake data for testing UI
      if (token === 'demo' || token === 'test' || token === '1') {
        setConsent(DEMO_CONSENT);
        setCurrentStep('parent_account');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await appSignupConsentService.getConsent(token);
        setConsent(result.data);
        setCurrentStep(result.data.currentStep);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load consent request');
      } finally {
        setLoading(false);
      }
    };

    loadConsent();
  }, [token]);

  // Check if in demo mode
  const isDemoMode = token === 'demo' || token === 'test' || token === '1';

  // Refresh consent data after step completion
  const refreshConsent = async () => {
    if (isDemoMode) return consent;

    try {
      const result = await appSignupConsentService.getConsent(token);
      setConsent(result.data);
      return result.data;
    } catch (err) {
      console.error('Error refreshing consent:', err);
      // If consent is already completed, the API throws an error
      // In this case, return a completed status to allow navigation
      if (err.response?.data?.error?.includes('already been completed') ||
          err.message?.includes('already been completed')) {
        return { status: 'completed', currentStep: 'complete' };
      }
      return null;
    }
  };

  // Step navigation handlers
  const handleNextStep = async () => {
    // In demo mode, just advance to the next step
    if (isDemoMode) {
      const steps = ['parent_account', 'terms_conditions', 'child_account', 'complete'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
      return;
    }

    const updated = await refreshConsent();
    if (updated) {
      // For 13-17 flow, grant_consent step should go directly to complete
      // since the teen consent is granted in TermsConditions component
      // Also handle when consent is already completed (status check)
      if (updated.status === 'completed' ||
          updated.currentStep === 'grant_consent' ||
          updated.currentStep === 'complete') {
        setCurrentStep('complete');
      } else {
        setCurrentStep(updated.currentStep);
      }
    }
  };

  const handlePrevStep = () => {
    const steps = ['parent_account', 'terms_conditions', 'child_account', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleError = (err) => {
    setError(err);
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
          Loading consent request...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
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
        <Alert
          severity="error"
          sx={{
            maxWidth: 500,
            width: '100%',
            mb: 3,
          }}
        >
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Box>
    );
  }

  // Expired state
  if (consent?.status === 'expired') {
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
        <Alert
          severity="warning"
          sx={{
            maxWidth: 500,
            width: '100%',
            mb: 3,
          }}
        >
          This consent request has expired. Please ask your child to start a new signup request from the app.
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Box>
    );
  }

  // Already completed
  if (consent?.status === 'completed') {
    return <Complete consent={consent} token={token} />;
  }

  // Render current step
  switch (currentStep) {
    case 'parent_account':
      return (
        <ParentAccount
          consent={consent}
          token={token}
          onNext={handleNextStep}
          onError={handleError}
        />
      );

    case 'terms_conditions':
      return (
        <TermsConditions
          consent={consent}
          token={token}
          onNext={handleNextStep}
          onBack={handlePrevStep}
          onError={handleError}
        />
      );

    case 'child_account':
      return (
        <ChildAccount
          consent={consent}
          token={token}
          onNext={handleNextStep}
          onBack={handlePrevStep}
          onError={handleError}
        />
      );

    case 'complete':
      return <Complete consent={consent} token={token} />;

    default:
      return (
        <ParentAccount
          consent={consent}
          token={token}
          onNext={handleNextStep}
          onError={handleError}
        />
      );
  }
};

export default AppSignupConsent;
