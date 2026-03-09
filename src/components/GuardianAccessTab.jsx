import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import playerService from '../api/playerService';

const GuardianAccessTab = ({ playerId, playerName }) => {
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    relationship: '',
  });
  const [sending, setSending] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);

  useEffect(() => {
    loadGuardians();
  }, [playerId]);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await playerService.getPlayerGuardians(playerId);
      setGuardians(response.data || []);
    } catch (err) {
      console.error('Error loading guardians:', err);
      setError('Failed to load guardian access list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInviteDialog = () => {
    setInviteFormData({ email: '', name: '', relationship: '' });
    setInviteDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteFormData({ email: '', name: '', relationship: '' });
  };

  const handleInviteGuardian = async () => {
    if (!inviteFormData.email || !inviteFormData.name) {
      setError('Email and name are required');
      return;
    }

    try {
      setSending(true);
      setError(null);

      await playerService.inviteGuardian(playerId, inviteFormData);

      setSuccess(`Invitation sent to ${inviteFormData.email}`);
      handleCloseInviteDialog();
      loadGuardians();
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveGuardian = async (guardianId) => {
    if (!window.confirm('Are you sure you want to remove this guardian\'s access?')) {
      return;
    }

    try {
      setError(null);

      await playerService.removeGuardian(playerId, guardianId);

      setSuccess('Guardian access removed');
      loadGuardians();
    } catch (err) {
      console.error('Error removing guardian:', err);
      setError('Failed to remove guardian access');
    }
  };

  const handleResendInvitation = async (guardianId) => {
    try {
      setError(null);

      await playerService.resendGuardianInvitation(playerId, guardianId);

      setSuccess('Invitation resent successfully');
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError('Failed to resend invitation');
    }
  };

  const handleOpenActionMenu = (event, guardian) => {
    setAnchorEl(event.currentTarget);
    setSelectedGuardian(guardian);
  };

  const handleCloseActionMenu = () => {
    setAnchorEl(null);
    setSelectedGuardian(null);
  };

  const getSignupUrl = (token) => {
    const baseUrl = process.env.REACT_APP_SIGNUP_BASE_URL || window.location.origin;
    return `${baseUrl}/signup?token=${token}`;
  };

  const handleCopySignupLink = () => {
    if (selectedGuardian && selectedGuardian.token) {
      const signupUrl = getSignupUrl(selectedGuardian.token);
      navigator.clipboard.writeText(signupUrl).then(() => {
        setCopySnackbarOpen(true);
        handleCloseActionMenu();
      }).catch(err => {
        console.error('Failed to copy link:', err);
        setError('Failed to copy link to clipboard');
      });
    }
  };

  const handleOpenSignupLink = () => {
    if (selectedGuardian && selectedGuardian.token) {
      const signupUrl = getSignupUrl(selectedGuardian.token);
      window.open(signupUrl, '_blank');
      handleCloseActionMenu();
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" icon={<PendingIcon />} />;
      case 'declined':
        return <Chip label="Declined" color="error" size="small" icon={<CancelIcon />} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Guardian Access Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invite guardians (parents, family members) to view {playerName}'s reports and progress.
            Guardians have read-only access to drill reports, statistics, and performance data.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenInviteDialog}
        >
          Invite Guardian
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Guardians List */}
      {guardians.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Guardians Added
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Invite guardians to give them read-only access to this player's reports.
          </Typography>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenInviteDialog}>
            Invite Your First Guardian
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Relationship</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Invited</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {guardians.map((guardian) => (
                <TableRow key={guardian.id}>
                  <TableCell>{guardian.name}</TableCell>
                  <TableCell>{guardian.email}</TableCell>
                  <TableCell>{guardian.relationship || '—'}</TableCell>
                  <TableCell>{getStatusChip(guardian.status)}</TableCell>
                  <TableCell>
                    {new Date(guardian.invitedAt).toLocaleDateString()}
                    {guardian.acceptedAt && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Accepted: {new Date(guardian.acceptedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenActionMenu(e, guardian)}
                      title="More actions"
                    >
                      <MoreVertIcon />
                    </IconButton>
                    {guardian.status === 'pending' && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleResendInvitation(guardian.id)}
                        title="Resend invitation"
                      >
                        <RefreshIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveGuardian(guardian.id)}
                      title="Remove access"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseActionMenu}
      >
        {selectedGuardian?.status === 'pending' && (
          <MenuItem onClick={handleCopySignupLink}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Signup Link</ListItemText>
          </MenuItem>
        )}
        {selectedGuardian?.status === 'pending' && (
          <MenuItem onClick={handleOpenSignupLink}>
            <ListItemIcon>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open Signup Link</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Copy Snackbar */}
      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setCopySnackbarOpen(false)}
        message="Signup link copied to clipboard"
      />

      {/* Invite Guardian Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Guardian</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The guardian will receive an email invitation with instructions to create an account and view {playerName}'s reports.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Guardian Name"
                value={inviteFormData.name}
                onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="email"
                label="Email Address"
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                placeholder="e.g., parent@example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Relationship (Optional)"
                value={inviteFormData.relationship}
                onChange={(e) => setInviteFormData({ ...inviteFormData, relationship: e.target.value })}
                placeholder="e.g., Father, Mother, Guardian"
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Guardians will have access to:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>View drill reports and statistics</li>
                <li>View AI-generated performance analysis</li>
                <li>View training recommendations</li>
                <li>Export reports to PDF</li>
              </ul>
              <strong>Guardians will NOT be able to:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Edit player information</li>
                <li>Upload drills or videos</li>
                <li>Communicate with coaches</li>
                <li>Access other players' data</li>
              </ul>
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleInviteGuardian}
            disabled={sending || !inviteFormData.email || !inviteFormData.name}
            startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuardianAccessTab;
