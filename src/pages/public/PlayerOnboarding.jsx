import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const PlayerOnboarding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitationData, setInvitationData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const clubId = searchParams.get('clubId');

  useEffect(() => {
    // Detect if mobile device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    setIsMobile(mobile);

    // Validate token
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Invalid or missing onboarding token');
      setLoading(false);
      return;
    }

    try {
      // Use base API URL without /v1 suffix for public onboarding routes
      const apiBaseUrl = process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL.replace('/api/v1', '/api')
        : 'http://localhost:4003/api';

      const response = await axios.get(
        `${apiBaseUrl}/onboarding/validate/${token}`
      );

      setInvitationData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error validating token:', err);
      setError(
        err.response?.data?.message ||
        'Invalid or expired onboarding link. Please contact your coach for a new invitation.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApp = () => {
    if (!token || !email || !clubId) {
      setError('Missing required parameters');
      return;
    }

    setRedirecting(true);

    // Create deep link
    const deepLink = `aim://onboarding?token=${token}&email=${encodeURIComponent(email)}&clubId=${clubId}`;

    // Try to open the app
    window.location.href = deepLink;

    // Fallback to app store if app doesn't open after 2 seconds
    setTimeout(() => {
      setRedirecting(false);
      // If still on page, app probably not installed
      // Could redirect to app store here
    }, 2000);
  };

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2
      }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom color="error">
              Onboarding Error
            </Typography>
            <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => window.location.href = 'https://aim.app'}
            >
              Go to AIM Website
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f5f5f5',
      py: 4
    }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to {invitationData?.clubName || 'AIM'}!
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Hi {invitationData?.playerName || email}
            </Typography>
          </Box>

          {/* Onboarding Steps */}
          <Stepper activeStep={0} orientation="vertical" sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Download the AIM Mobile App</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete Your Profile</StepLabel>
            </Step>
            <Step>
              <StepLabel>Start Training</StepLabel>
            </Step>
          </Stepper>

          {/* Instructions */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" paragraph>
              You've been added to <strong>{invitationData?.teamName || 'the team'}</strong> at{' '}
              <strong>{invitationData?.clubName}</strong>!
            </Typography>
            <Typography variant="body1" paragraph>
              To get started, you'll need to download the AIM mobile app and complete your profile.
            </Typography>
          </Box>

          {/* Action Buttons */}
          {isMobile ? (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleOpenApp}
                disabled={redirecting}
                sx={{ mb: 2 }}
              >
                {redirecting ? 'Opening AIM App...' : 'Open AIM App'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Don't have the app? Download it from the App Store
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => window.location.href = 'https://apps.apple.com/app/aim'}
                >
                  iOS App Store
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please open this link on your mobile device to continue with onboarding.
              </Alert>
              <Typography variant="body2" color="text.secondary" paragraph>
                Or scan the QR code with your phone camera (coming soon)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can also download the AIM app directly:
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => window.location.href = 'https://apps.apple.com/app/aim'}
                >
                  iOS App Store
                </Button>
              </Box>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Need help? Contact your coach or email{' '}
              <a href="mailto:support@aim.app">support@aim.app</a>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PlayerOnboarding;
