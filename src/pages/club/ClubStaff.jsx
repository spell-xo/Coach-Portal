import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import clubService from '../../api/clubService';

const ClubStaff = () => {
  const { clubId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'COACH',
    customMessage: '',
  });

  useEffect(() => {
    loadStaff();
    loadInvitations();
  }, [clubId]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await clubService.getStaff(clubId);

      // Transform API response
      const transformedStaff = response.data.map(member => ({
        id: member._id,
        name: member.name,
        email: member.userId,
        role: member.role?.toUpperCase() || 'COACH',
        teams: member.teams || [],
        joinedAt: new Date().toISOString().split('T')[0], // Placeholder
      }));

      setStaff(transformedStaff);
      setError(null);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(err.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await clubService.getStaffInvitations(clubId, { status: 'pending' });
      setInvitations(response.data || []);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.email || !formData.name) {
      setError('Email and name are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const invitationData = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        customMessage: formData.customMessage || undefined,
      };

      console.log('Sending invitation:', { clubId, invitationData });

      await clubService.inviteStaffMember(clubId, invitationData);

      // Reload invitations
      await loadInvitations();

      // Reset form and close dialog
      setFormData({
        email: '',
        name: '',
        role: 'COACH',
        customMessage: '',
      });
      setAddDialogOpen(false);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await clubService.resendStaffInvitation(clubId, invitationId);
      await loadInvitations();
      alert('Invitation resent successfully');
    } catch (err) {
      console.error('Error resending invitation:', err);
      alert(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await clubService.cancelStaffInvitation(clubId, invitationId);
      await loadInvitations();
    } catch (err) {
      console.error('Error canceling invitation:', err);
      alert(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const handleCopyInvitationLink = async (invitationLink) => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      alert('Invitation link copied to clipboard!');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) {
      return;
    }

    try {
      await clubService.removeStaffMember(clubId, staffId);
      // Reload staff list
      await loadStaff();
    } catch (err) {
      console.error('Error removing staff:', err);
      alert(err.response?.data?.message || 'Failed to remove staff member');
    }
  };

  const formatRole = (role) => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'CLUB_MANAGER':
        return 'error';
      case 'HEAD_COACH':
        return 'primary';
      case 'COACH':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Group staff by role
  const headCoaches = staff.filter((s) => s.role === 'HEAD_COACH');
  const coaches = staff.filter((s) => s.role === 'COACH');

  const getInvitationStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Staff Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage coaches and staff members
            </Typography>
          </Box>

          <RequireRole roles={['club_manager']}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Invite Coach
            </Button>
          </RequireRole>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`Active Staff (${staff.length})`} />
            <Tab label={`Pending Invitations (${invitations.length})`} />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Active Staff Tab */}
            {tabValue === 0 && (
              <>
                {/* Head Coaches */}
            <Paper sx={{ mb: 4 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">
                  Head Coaches ({headCoaches.length})
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Teams</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {headCoaches.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {member.name}
                            <Chip
                              label={formatRole(member.role)}
                              size="small"
                              color={getRoleColor(member.role)}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {member.teams.length > 0 ? (
                              member.teams.map((team) => (
                                <Chip
                                  key={team._id}
                                  label={team.name}
                                  size="small"
                                  variant="outlined"
                                />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No teams assigned
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <RequireRole roles={['club_manager']}>
                            <IconButton size="small" color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveStaff(member.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </RequireRole>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

                {/* Coaches */}
                <Paper>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">
                      Coaches ({coaches.length})
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Teams</TableCell>
                          <TableCell>Joined</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {coaches.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {member.name}
                                <Chip
                                  label={formatRole(member.role)}
                                  size="small"
                                  color={getRoleColor(member.role)}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {member.teams.length > 0 ? (
                                  member.teams.map((team) => (
                                    <Chip
                                      key={team._id}
                                      label={team.name}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No teams assigned
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              <RequireRole roles={['club_manager', 'head_coach']}>
                                <IconButton size="small" color="primary">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveStaff(member.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </RequireRole>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </>
            )}

            {/* Pending Invitations Tab */}
            {tabValue === 1 && (
              <Paper>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">
                    Pending Invitations ({invitations.length})
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sent</TableCell>
                        <TableCell>Expires</TableCell>
                        <TableCell>Invitation Link</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invitations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                              No pending invitations
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        invitations.map((invitation) => (
                          <TableRow key={invitation._id}>
                            <TableCell>{invitation.name}</TableCell>
                            <TableCell>{invitation.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={formatRole(invitation.role)}
                                size="small"
                                color={getRoleColor(invitation.role)}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={invitation.status}
                                size="small"
                                color={getInvitationStatusColor(invitation.status)}
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(invitation.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(invitation.expiresAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {invitation.invitationLink ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                    {invitation.invitationLink}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleCopyInvitationLink(invitation.invitationLink)}
                                    title="Copy invitation link"
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <RequireRole roles={['club_manager']}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleResendInvitation(invitation._id)}
                                  title="Resend invitation"
                                >
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelInvitation(invitation._id)}
                                  title="Cancel invitation"
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </RequireRole>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        )}

        {/* Invite Staff Dialog */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Invite Staff Member</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                label="Email Address"
                type="email"
                fullWidth
                required
                variant="outlined"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="coach@example.com"
              />
              <TextField
                label="Full Name"
                fullWidth
                required
                variant="outlined"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="COACH">Coach</MenuItem>
                  <MenuItem value="HEAD_COACH">Head Coach</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Custom Message (Optional)"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                placeholder="Add a personal message to the invitation email..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStaff}
              variant="contained"
              disabled={!formData.email || !formData.name || submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Send Invitation'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default ClubStaff;
