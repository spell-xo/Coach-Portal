import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Paper,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import playerService from '../api/playerService';
import authService from '../api/authService';

const AcceptInvitation = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthAndLoadInvitation();
  }, [token]);

  // Re-check auth status whenever the location changes (after login redirect)
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    setIsLoggedIn(!!authToken);
  }, [window.location.href]);

  const checkAuthAndLoadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const authToken = localStorage.getItem('token');
      setIsLoggedIn(!!authToken);

      // Load invitation details (this endpoint is public)
      const response = await playerService.getInvitationByToken(token);

      if (response.success) {
        setInvitation(response.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load invitation';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await playerService.acceptInvitation(token);

      if (response.success) {
        setSuccess('Invitation accepted! You are now part of the team.');
        setTimeout(() => {
          navigate('/player/teams');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await playerService.declineInvitation(token);

      if (response.success) {
        setSuccess('Invitation declined.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !invitation) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
          {success}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <GroupIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Team Invitation
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {invitation && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {invitation.teamName}
              </Typography>
              <Chip label={invitation.teamAgeGroup} color="primary" size="small" sx={{ mb: 2 }} />

              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>{invitation.invitedBy}</strong> has invited you to join their team.
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Email: <strong>{invitation.email}</strong>
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                This invitation expires on{' '}
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        )}

        {!isLoggedIn && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You need to log in or create an account to accept this invitation.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleDecline}
            disabled={actionLoading}
            fullWidth
          >
            Decline
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleAccept}
            disabled={actionLoading}
            fullWidth
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : isLoggedIn ? (
              'Accept'
            ) : (
              'Login to Accept'
            )}
          </Button>
        </Box>

        {!isLoggedIn && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Button
                size="small"
                onClick={() => navigate(`/register?redirect=/invite/${token}`)}
              >
                Sign Up
              </Button>
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AcceptInvitation;
