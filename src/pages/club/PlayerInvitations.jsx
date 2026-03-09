import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import Avatar from '@mui/material/Avatar';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import clubService from '../../api/clubService';
import InvitePlayerDialog from '../../components/InvitePlayerDialog';

const PlayerInvitations = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [dialogInvitation, setDialogInvitation] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [signupLinkDialogOpen, setSignupLinkDialogOpen] = useState(false);
  const [signupLink, setSignupLink] = useState('');
  const [selectedInvitations, setSelectedInvitations] = useState([]);
  const [autoAcceptDialogOpen, setAutoAcceptDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [consentLinkDialogOpen, setConsentLinkDialogOpen] = useState(false);
  const [consentLinkData, setConsentLinkData] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    loadInvitations();
    loadStats();
    loadTeams();
  }, [clubId, statusFilter]);

  const loadTeams = async () => {
    try {
      const response = await clubService.getTeams(clubId);
      setTeams(response.data || []);
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  };

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const response = await clubService.getClubInvitations(clubId, filters);
      setInvitations(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError(err.response?.data?.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await clubService.getInvitationStats(clubId);
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const filteredInvitations = invitations.filter(inv =>
    inv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event, invitation) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvitation(invitation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvitation(null);
  };

  const handleResendInvitation = async () => {
    try {
      const response = await clubService.resendInvitation(clubId, selectedInvitation._id);
      setSuccess('Invitation resent successfully');
      setTimeout(() => setSuccess(null), 3000);
      handleMenuClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend invitation');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelInvitation = async () => {
    try {
      await clubService.cancelInvitation(clubId, selectedInvitation._id);
      setSuccess('Invitation cancelled successfully');
      setTimeout(() => setSuccess(null), 3000);
      setCancelDialogOpen(false);
      handleMenuClose();
      loadInvitations();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel invitation');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleViewSignupLink = () => {
    const link = `${window.location.origin}/signup?token=${selectedInvitation.token}`;
    setSignupLink(link);
    setDialogInvitation(selectedInvitation);
    setSignupLinkDialogOpen(true);
    handleMenuClose();
  };

  const handleViewOnboardingLink = () => {
    let link;
    if (selectedInvitation.autoAccepted && selectedInvitation.onboardingToken) {
      // For auto-accepted invitations, construct onboarding link
      link = `${window.location.origin}/onboarding?token=${selectedInvitation.onboardingToken}`;
    } else {
      // For regular invitations, use invitationUrl
      link = selectedInvitation.invitationUrl || `Unable to generate link - please regenerate token`;
    }
    setSignupLink(link);
    setDialogInvitation(selectedInvitation);
    setSignupLinkDialogOpen(true);
    handleMenuClose();
  };

  const handleRegenerateSingleToken = async (invitation) => {
    try {
      setBulkProcessing(true);
      const invitationToUse = invitation || selectedInvitation;

      if (!invitationToUse || !invitationToUse._id) {
        setError('No invitation selected');
        setTimeout(() => setError(null), 5000);
        setBulkProcessing(false);
        return;
      }

      const response = await clubService.regenerateInvitationTokens(clubId, [invitationToUse._id]);

      // Update the link in the dialog if response contains new token
      if (response.data && response.data.tokens && response.data.tokens.length > 0) {
        const newLink = response.data.tokens[0].signupUrl;
        setSignupLink(newLink);
      }

      setSuccess(`Successfully regenerated invitation token for ${invitationToUse.email}`);
      setTimeout(() => setSuccess(null), 5000);
      await loadInvitations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate token');
      setTimeout(() => setError(null), 5000);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleCopySignupLink = () => {
    navigator.clipboard.writeText(signupLink);
    setSuccess('Signup link copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleViewConsentLinks = () => {
    const inv = selectedInvitation;
    if (!inv?.consentInfo) return;

    const baseUrl = window.location.origin;
    const data = {
      invitation: inv,
      parentConsentUrl: `${baseUrl}/signup/consent?token=${inv.consentInfo.consentToken}`,
      playerSignupUrl: inv.consentInfo.playerSignupToken
        ? `${baseUrl}/signup/player?token=${inv.consentInfo.playerSignupToken}`
        : null,
      ageCategory: inv.consentInfo.ageCategory,
      consentStatus: inv.consentInfo.consentStatus,
      playerSignupCompleted: inv.consentInfo.playerSignupCompleted,
    };
    setConsentLinkData(data);
    setConsentLinkDialogOpen(true);
    handleMenuClose();
  };

  const handleCopyConsentLink = (link) => {
    navigator.clipboard.writeText(link);
    setSuccess('Link copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const pendingIds = filteredInvitations
        .filter(inv => inv.status === 'pending')
        .map(inv => inv._id);
      setSelectedInvitations(pendingIds);
    } else {
      setSelectedInvitations([]);
    }
  };

  const handleSelectOne = (invitationId) => {
    setSelectedInvitations(prev => {
      if (prev.includes(invitationId)) {
        return prev.filter(id => id !== invitationId);
      } else {
        return [...prev, invitationId];
      }
    });
  };

  const handleBatchAutoAccept = async () => {
    try {
      setBulkProcessing(true);
      const response = await clubService.batchAutoAcceptInvitations(clubId, selectedInvitations);
      setSuccess(`Successfully processed ${response.data.processed} invitations. ${response.data.created} new players created, ${response.data.existing} existing players added.`);
      setTimeout(() => setSuccess(null), 5000);
      setAutoAcceptDialogOpen(false);
      setSelectedInvitations([]);
      loadInvitations();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to auto-accept invitations');
      setTimeout(() => setError(null), 5000);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleRegenerateTokens = async () => {
    try {
      setBulkProcessing(true);
      const response = await clubService.regenerateInvitationTokens(clubId, selectedInvitations);
      setSuccess(`Successfully regenerated ${response.data.regenerated} invitation tokens`);
      setTimeout(() => setSuccess(null), 5000);
      setRegenerateDialogOpen(false);
      setSelectedInvitations([]);
      loadInvitations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate tokens');
      setTimeout(() => setError(null), 5000);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleInvitePlayer = async (invitationData) => {
    try {
      console.log('PlayerInvitations: handleInvitePlayer called with:', invitationData);

      let profilePictureUrl = null;

      // If profile picture is provided, upload it to GCS using pre-signed URL
      if (invitationData.profilePicture) {
        console.log('PlayerInvitations: Uploading profile picture to GCS');

        // Step 1: Get pre-signed URL from backend
        const uploadUrlResponse = await clubService.getProfilePictureUploadUrl(
          clubId,
          invitationData.email,
          invitationData.profilePicture.name,
          invitationData.profilePicture.type
        );

        if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
          throw new Error('Failed to get upload URL for profile picture');
        }

        const { uploadUrl, publicUrl } = uploadUrlResponse.data;

        // Step 2: Upload file directly to GCS using pre-signed URL
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: invitationData.profilePicture,
          headers: {
            'Content-Type': invitationData.profilePicture.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload profile picture: ${uploadResponse.statusText}`);
        }

        profilePictureUrl = publicUrl;
        console.log('PlayerInvitations: Profile picture uploaded successfully:', profilePictureUrl);
      }

      // Prepare invitation data (JSON, not FormData)
      const invitationPayload = {
        email: invitationData.email,
        name: invitationData.name,
        gender: invitationData.gender,
        teamId: invitationData.teamId || null,
        jerseyNumber: invitationData.jerseyNumber || null,
        position: invitationData.position || null,
        dob: invitationData.dob ? invitationData.dob.toISOString() : null,
        customMessage: invitationData.customMessage || null,
        profilePictureUrl: profilePictureUrl,
        parentName: invitationData.parentName || null,
        parentEmail: invitationData.parentEmail || null,
      };

      console.log('PlayerInvitations: Calling clubService.createPlayerInvitation with clubId:', clubId);
      const response = await clubService.createPlayerInvitation(clubId, invitationPayload);
      console.log('PlayerInvitations: Success! Response:', response);

      setSuccess(`Invitation sent successfully to ${invitationData.email}`);
      setTimeout(() => setSuccess(null), 5000);
      setInviteDialogOpen(false);
      loadInvitations();
      loadStats();
    } catch (err) {
      console.error('PlayerInvitations: Error:', err);
      // Re-throw the error so the dialog can display it
      throw new Error(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const content = (
    <Box sx={{ py: 4 }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Player Invitations
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => navigate(`/clubs/${clubId}/players/bulk-import`)}
            >
              Bulk Import
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invite Player
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="h6">{stats.total || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Invitations
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="h6" color="warning.main">
                {stats.pending || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="h6" color="success.main">
                {stats.accepted || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accepted
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="h6" color="error.main">
                {stats.expired || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expired
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Alerts */}
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

        {/* Filters */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={loadInvitations} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Tabs
            value={statusFilter}
            onChange={(e, newValue) => setStatusFilter(newValue)}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          >
            <Tab label="All" value="all" />
            <Tab label="Pending" value="pending" />
            <Tab label="Accepted" value="accepted" />
            <Tab label="Expired" value="expired" />
            <Tab label="Cancelled" value="cancelled" />
          </Tabs>
        </Paper>

        {/* Bulk Actions Toolbar */}
        {selectedInvitations.length > 0 && (
          <Paper sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">
                {selectedInvitations.length} invitation{selectedInvitations.length > 1 ? 's' : ''} selected
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAutoAcceptDialogOpen(true)}
                disabled={bulkProcessing}
              >
                Auto-Accept Selected
              </Button>
              <Button
                variant="outlined"
                onClick={() => setRegenerateDialogOpen(true)}
                disabled={bulkProcessing}
              >
                Regenerate Tokens
              </Button>
              <Button
                variant="text"
                onClick={() => setSelectedInvitations([])}
                disabled={bulkProcessing}
              >
                Clear Selection
              </Button>
            </Box>
            {bulkProcessing && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
        )}

        {/* Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredInvitations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm
                  ? 'No invitations match your search'
                  : statusFilter === 'all'
                  ? 'No invitations yet. Click "Invite Player" or "Bulk Import" to get started.'
                  : `No ${statusFilter} invitations`}
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedInvitations.length > 0 &&
                        selectedInvitations.length < filteredInvitations.filter(inv => inv.status === 'pending').length
                      }
                      checked={
                        filteredInvitations.filter(inv => inv.status === 'pending').length > 0 &&
                        selectedInvitations.length === filteredInvitations.filter(inv => inv.status === 'pending').length
                      }
                      onChange={handleSelectAll}
                      disabled={filteredInvitations.filter(inv => inv.status === 'pending').length === 0}
                    />
                  </TableCell>
                  <TableCell>Photo</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>DOB</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Jersey #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Consent</TableCell>
                  <TableCell>Onboarding</TableCell>
                  <TableCell>Invited</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const isSelected = selectedInvitations.includes(invitation._id);
                  const isPending = invitation.status === 'pending';

                  return (
                    <TableRow key={invitation._id} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(invitation._id)}
                          disabled={!isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={invitation.profilePicture}
                          alt={invitation.name}
                          sx={{ width: 32, height: 32 }}
                        >
                          {invitation.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{invitation.name}</TableCell>
                      <TableCell>{invitation.gender || '-'}</TableCell>
                      <TableCell>{formatDate(invitation.dob)}</TableCell>
                      <TableCell>
                        {invitation.teamId ? (
                          <Chip label={invitation.teamId} size="small" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{invitation.metadata?.position || '-'}</TableCell>
                      <TableCell>{invitation.metadata?.jerseyNumber || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={invitation.status}
                            color={getStatusColor(invitation.status)}
                            size="small"
                          />
                          {invitation.autoAccepted && (
                            <Tooltip title="Auto-accepted">
                              <CheckCircleIcon fontSize="small" color="success" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {invitation.consentInfo ? (
                          <Tooltip title={`${invitation.consentInfo.ageCategory === '13_to_18' ? '13-18' : 'Under 13'} - Click actions menu for links`}>
                            <Chip
                              icon={<FamilyRestroomIcon />}
                              label={
                                invitation.consentInfo.consentStatus === 'completed'
                                  ? 'Completed'
                                  : invitation.consentInfo.consentStatus === 'pending'
                                  ? 'Pending'
                                  : invitation.consentInfo.consentStatus
                              }
                              color={
                                invitation.consentInfo.consentStatus === 'completed'
                                  ? 'success'
                                  : 'warning'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {invitation.autoAccepted ? (
                          invitation.onboardingStatus === 'complete' ? (
                            <Chip label="Complete" color="success" size="small" icon={<CheckCircleIcon />} />
                          ) : invitation.onboardingStatus === 'in_progress' ? (
                            <Chip label="In Progress" color="warning" size="small" icon={<HourglassEmptyIcon />} />
                          ) : (
                            <Chip label="Pending" color="default" size="small" icon={<HourglassEmptyIcon />} />
                          )
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                      <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, invitation)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Container>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedInvitation?.status === 'pending' && !selectedInvitation?.autoAccepted && [
          <MenuItem key="resend" onClick={handleResendInvitation}>
            Resend Invitation
          </MenuItem>,
          <MenuItem key="link" onClick={handleViewSignupLink}>
            View Signup Link
          </MenuItem>,
          selectedInvitation?.consentInfo && (
            <MenuItem key="consent-links" onClick={handleViewConsentLinks}>
              View Consent Links
            </MenuItem>
          ),
          <MenuItem
            key="cancel"
            onClick={() => {
              setCancelDialogOpen(true);
              handleMenuClose();
            }}
          >
            Cancel Invitation
          </MenuItem>,
        ]}
        {selectedInvitation?.autoAccepted && selectedInvitation?.onboardingStatus !== 'complete' && [
          <MenuItem key="onboarding" onClick={handleViewOnboardingLink}>
            View Onboarding Link
          </MenuItem>,
          <MenuItem key="regenerate" onClick={() => {
            const invitation = selectedInvitation;
            handleMenuClose();
            handleRegenerateSingleToken(invitation);
          }}>
            Regenerate Token
          </MenuItem>,
          <MenuItem
            key="cancel"
            onClick={() => {
              setCancelDialogOpen(true);
              handleMenuClose();
            }}
          >
            Cancel Invitation
          </MenuItem>,
        ]}
        {selectedInvitation?.status === 'accepted' && (
          <MenuItem onClick={handleMenuClose}>View Player Profile</MenuItem>
        )}
      </Menu>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Invitation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the invitation for{' '}
            <strong>{selectedInvitation?.email}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
          <Button onClick={handleCancelInvitation} color="error" variant="contained">
            Yes, Cancel Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signup Link Dialog */}
      <Dialog
        open={signupLinkDialogOpen}
        onClose={() => {
          setSignupLinkDialogOpen(false);
          setDialogInvitation(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Signup Link</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Share this link with <strong>{dialogInvitation?.email}</strong> to complete
            their signup:
          </DialogContentText>
          <TextField
            fullWidth
            value={signupLink}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Copy link">
                    <IconButton onClick={handleCopySignupLink} edge="end">
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          {signupLink?.includes('Unable to generate link') && (
            <Button
              onClick={() => handleRegenerateSingleToken(dialogInvitation)}
              color="primary"
              variant="contained"
              disabled={bulkProcessing}
            >
              {bulkProcessing ? 'Regenerating...' : 'Regenerate Token'}
            </Button>
          )}
          <Button onClick={() => {
            setSignupLinkDialogOpen(false);
            setDialogInvitation(null);
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Auto-Accept Confirmation Dialog */}
      <Dialog
        open={autoAcceptDialogOpen}
        onClose={() => !bulkProcessing && setAutoAcceptDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Auto-Accept Invitations</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to auto-accept <strong>{selectedInvitations.length}</strong> invitation
            {selectedInvitations.length > 1 ? 's' : ''}?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            This will:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            <li>Create player accounts for new users (or link existing users)</li>
            <li>Add players to their assigned teams</li>
            <li>Generate onboarding links for players to complete setup</li>
            <li>Send notification emails with onboarding instructions</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoAcceptDialogOpen(false)} disabled={bulkProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleBatchAutoAccept}
            color="primary"
            variant="contained"
            disabled={bulkProcessing}
          >
            {bulkProcessing ? 'Processing...' : 'Auto-Accept'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Tokens Confirmation Dialog */}
      <Dialog
        open={regenerateDialogOpen}
        onClose={() => !bulkProcessing && setRegenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Regenerate Invitation Tokens</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to regenerate tokens for <strong>{selectedInvitations.length}</strong> invitation
            {selectedInvitations.length > 1 ? 's' : ''}?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            This will:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            <li>Generate new invitation tokens for selected invitations</li>
            <li>Extend expiration dates by 7 days</li>
            <li>Invalidate old invitation links</li>
            <li>Send new invitation emails with updated links</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateDialogOpen(false)} disabled={bulkProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleRegenerateTokens}
            color="primary"
            variant="contained"
            disabled={bulkProcessing}
          >
            {bulkProcessing ? 'Processing...' : 'Regenerate Tokens'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Consent Links Dialog */}
      <Dialog
        open={consentLinkDialogOpen}
        onClose={() => {
          setConsentLinkDialogOpen(false);
          setConsentLinkData(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FamilyRestroomIcon color="primary" />
            Parental Consent Links
          </Box>
        </DialogTitle>
        <DialogContent>
          {consentLinkData && (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                {consentLinkData.invitation?.name} ({consentLinkData.ageCategory === '13_to_18' ? 'Age 13-18' : 'Under 13'})
              </DialogContentText>

              {/* Consent Status */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Status</Typography>
                <Chip
                  label={consentLinkData.consentStatus === 'completed' ? 'Consent Completed' : 'Consent Pending'}
                  color={consentLinkData.consentStatus === 'completed' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>

              {/* Parent Consent Link */}
              <Typography variant="subtitle2" gutterBottom>
                Parent Consent Link
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Share this with the parent/guardian to create their account and provide consent.
              </Typography>
              <TextField
                fullWidth
                value={consentLinkData.parentConsentUrl}
                size="small"
                sx={{ mb: 3 }}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Copy link">
                        <IconButton
                          onClick={() => handleCopyConsentLink(consentLinkData.parentConsentUrl)}
                          edge="end"
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Player Signup Link - only for 13-18 */}
              {consentLinkData.playerSignupUrl && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Player Signup Link (13-18 only)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Share this with the player to create their own account. Either the parent or player can complete their step first.
                  </Typography>
                  <TextField
                    fullWidth
                    value={consentLinkData.playerSignupUrl}
                    size="small"
                    sx={{ mb: 2 }}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copy link">
                            <IconButton
                              onClick={() => handleCopyConsentLink(consentLinkData.playerSignupUrl)}
                              edge="end"
                              size="small"
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {consentLinkData.playerSignupCompleted && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      Player has already completed signup.
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setConsentLinkDialogOpen(false);
            setConsentLinkData(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Player Dialog */}
      <InvitePlayerDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onSubmit={handleInvitePlayer}
        teams={teams}
      />
    </Box>
  );

  return (
    <RequireRole roles={['head_coach', 'club_manager']} fallback={<div>Access denied</div>}>
      <AppLayout>{content}</AppLayout>
    </RequireRole>
  );
};

export default PlayerInvitations;
