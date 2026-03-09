import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import playerService from '../api/playerService';

const StaffInvitationsCard = ({ onUpdate }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playerService.getStaffInvitations();
      console.log('Staff invitations response:', response);

      if (response.success) {
        console.log('Staff invitations data:', response.data);
        // Handle different response structures
        let invitationsData = response.data;

        // If data is an object with staffInvitations property
        if (invitationsData && !Array.isArray(invitationsData)) {
          if (invitationsData.staffInvitations) {
            invitationsData = invitationsData.staffInvitations;
          } else if (invitationsData.invitations) {
            invitationsData = invitationsData.invitations;
          }
        }

        // Ensure it's an array
        if (Array.isArray(invitationsData)) {
          console.log('Setting invitations:', invitationsData);
          setInvitations(invitationsData);
        } else {
          console.warn('Invitations data is not an array:', invitationsData);
          setInvitations([]);
        }
      } else {
        console.warn('Staff invitations response not successful:', response);
        setInvitations([]);
      }
    } catch (err) {
      console.error('Error loading staff invitations:', err);
      setError(err.response?.data?.message || 'Failed to load staff invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation) => {
    try {
      setActionLoading(invitation.id || invitation._id);
      setError(null);
      await playerService.acceptStaffInvitation(invitation.token);
      await loadInvitations();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (invitation) => {
    if (!window.confirm('Are you sure you want to decline this staff invitation?')) {
      return;
    }

    try {
      setActionLoading(invitation.id || invitation._id);
      setError(null);
      await playerService.declineStaffInvitation(invitation.token);
      await loadInvitations();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const formatRole = (role) => {
    if (!role) return 'Staff';
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getRoleColor = (role) => {
    const roleUpper = role?.toUpperCase();
    switch (roleUpper) {
      case 'HEAD_COACH':
        return 'primary';
      case 'COACH':
        return 'secondary';
      case 'CLUB_MANAGER':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Staff Invitations
          </Typography>
          {invitations.length > 0 && (
            <Chip
              label={invitations.length}
              color="primary"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {invitations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No pending staff invitations
          </Typography>
        ) : (
          <List>
            {invitations.map((invitation, index) => (
              <React.Fragment key={invitation.id || invitation._id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    px: 0,
                    py: 2,
                  }}
                >
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {invitation.club?.name || invitation.clubName || 'Club'}
                      </Typography>
                      <Chip
                        label={formatRole(invitation.role)}
                        size="small"
                        color={getRoleColor(invitation.role)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Invited by {invitation.invitedBy || invitation.invitedByDetails?.name || 'club manager'} to join as {formatRole(invitation.role).toLowerCase()}
                    </Typography>
                    {invitation.customMessage && (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                        "{invitation.customMessage}"
                      </Typography>
                    )}
                    {invitation.club?.teams && invitation.club.teams.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Teams: {invitation.club.teams.map(t => t.name).join(', ')}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleAccept(invitation)}
                      disabled={actionLoading === (invitation.id || invitation._id)}
                      fullWidth
                    >
                      {actionLoading === (invitation.id || invitation._id) ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Accept'
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleDecline(invitation)}
                      disabled={actionLoading === (invitation.id || invitation._id)}
                      fullWidth
                    >
                      Decline
                    </Button>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffInvitationsCard;
