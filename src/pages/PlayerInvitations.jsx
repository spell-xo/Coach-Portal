import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import playerService from '../api/playerService';
import AppLayout from '../components/AppLayout';

const PlayerInvitations = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, invitation: null });

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playerService.getPlayerInvitations();
      if (response.success) {
        setInvitations(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation) => {
    try {
      setActionLoading(invitation.token);
      setError(null);
      setSuccess(null);

      const response = await playerService.acceptInvitation(invitation.token);

      if (response.success) {
        setSuccess(`Successfully joined ${invitation.teamName}!`);
        // Remove the accepted invitation from the list
        setInvitations(invitations.filter(inv => inv.token !== invitation.token));
        setConfirmDialog({ open: false, action: null, invitation: null });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (invitation) => {
    try {
      setActionLoading(invitation.token);
      setError(null);
      setSuccess(null);

      const response = await playerService.declineInvitation(invitation.token);

      if (response.success) {
        setSuccess(`Invitation from ${invitation.teamName} declined`);
        // Remove the declined invitation from the list
        setInvitations(invitations.filter(inv => inv.token !== invitation.token));
        setConfirmDialog({ open: false, action: null, invitation: null });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmDialog = (action, invitation) => {
    setConfirmDialog({ open: true, action, invitation });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, action: null, invitation: null });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'accept') {
      handleAccept(confirmDialog.invitation);
    } else if (confirmDialog.action === 'decline') {
      handleDecline(confirmDialog.invitation);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Team Invitations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and respond to team invitations
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {invitations.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <GroupIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Pending Invitations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You don't have any pending team invitations at the moment.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/player/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {invitations.map((invitation) => (
              <Card key={invitation.token} elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {invitation.teamName}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Chip
                          icon={<GroupIcon />}
                          label={invitation.teamAgeGroup}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={invitation.status}
                          size="small"
                          color="warning"
                        />
                      </Stack>
                    </Box>
                  </Box>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Invited by: <strong>{invitation.invitedBy}</strong>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Sent: {formatDate(invitation.createdAt)}
                        {invitation.expiresAt && ` • Expires: ${formatDate(invitation.expiresAt)}`}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openConfirmDialog('accept', invitation)}
                    disabled={actionLoading === invitation.token}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => openConfirmDialog('decline', invitation)}
                    disabled={actionLoading === invitation.token}
                  >
                    Decline
                  </Button>
                  {actionLoading === invitation.token && <CircularProgress size={24} sx={{ ml: 2 }} />}
                </CardActions>
              </Card>
            ))}
          </Stack>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
          <DialogTitle>
            {confirmDialog.action === 'accept' ? 'Accept Invitation' : 'Decline Invitation'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirmDialog.action === 'accept'
                ? `Are you sure you want to join ${confirmDialog.invitation?.teamName}?`
                : `Are you sure you want to decline the invitation from ${confirmDialog.invitation?.teamName}?`
              }
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeConfirmDialog} disabled={!!actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              color={confirmDialog.action === 'accept' ? 'success' : 'error'}
              variant="contained"
              disabled={!!actionLoading}
            >
              {confirmDialog.action === 'accept' ? 'Accept' : 'Decline'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default PlayerInvitations;
