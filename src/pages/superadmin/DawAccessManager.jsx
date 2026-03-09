import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import dawAccessService from '../../api/dawAccessService';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';

const TIERS = [
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'platform_engineering', label: 'Platform Engineering' },
  { value: 'platform_engineering_admin', label: 'Platform Engineering Admin' },
];

const getTierColor = (tier) => {
  const colors = {
    support_agent: 'default',
    analyst: 'info',
    superadmin: 'warning',
    platform_engineering: 'error',
    platform_engineering_admin: 'error',
  };
  return colors[tier] || 'default';
};

const formatTierLabel = (tier) => {
  const found = TIERS.find((t) => t.value === tier);
  return found ? found.label : tier;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const DawAccessManager = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 20,
    total: 0,
  });

  // Grant dialog
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [grantTier, setGrantTier] = useState('analyst');
  const [grantExpiry, setGrantExpiry] = useState('');
  const [granting, setGranting] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editTier, setEditTier] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  // Revoke dialog
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeUser, setRevokeUser] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dawAccessService.listDawUsers({
        search: searchTerm,
        page: pagination.page + 1,
        limit: pagination.limit,
      });
      const data = response.data;
      if (data.success) {
        setUsers(data.data?.users || []);
        setPagination((prev) => ({
          ...prev,
          total: data.data?.pagination?.total || 0,
        }));
      }
    } catch (err) {
      console.error('Error loading DAW users:', err);
      setError('Failed to load DAW users');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isPlatformEngineering) {
      loadUsers();
    }
  }, [isPlatformEngineering, loadUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlatformEngineering) {
        setPagination((prev) => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, isPlatformEngineering]);

  // User search for grant dialog
  useEffect(() => {
    if (!userSearchTerm || userSearchTerm.length < 2) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setUserSearchLoading(true);
        const response = await dawAccessService.searchUsers(userSearchTerm);
        const data = response.data;
        setUserSearchResults(data.data || []);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setUserSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  // Grant access
  const handleOpenGrantDialog = () => {
    setSelectedUser(null);
    setUserSearchTerm('');
    setUserSearchResults([]);
    setGrantTier('analyst');
    setGrantExpiry('');
    setGrantDialogOpen(true);
  };

  const handleCloseGrantDialog = () => {
    setGrantDialogOpen(false);
    setSelectedUser(null);
  };

  const handleGrantAccess = async () => {
    if (!selectedUser) return;
    try {
      setGranting(true);
      const data = {
        userId: selectedUser._id,
        tier: grantTier,
      };
      if (grantExpiry) {
        data.expiresAt = new Date(grantExpiry).toISOString();
      }
      await dawAccessService.grantDawAccess(data);
      toast.success(`DAW access granted to ${selectedUser.name}`);
      handleCloseGrantDialog();
      loadUsers();
    } catch (err) {
      console.error('Error granting DAW access:', err);
      toast.error(err.response?.data?.message || 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  // Edit access
  const handleEditClick = (user) => {
    setEditUser(user);
    setEditTier(user.featureAccess?.daw?.tier || 'analyst');
    setEditExpiry(
      user.featureAccess?.daw?.expiresAt
        ? new Date(user.featureAccess.daw.expiresAt).toISOString().split('T')[0]
        : ''
    );
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditUser(null);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      setSaving(true);
      const data = { tier: editTier };
      if (editExpiry) {
        data.expiresAt = new Date(editExpiry).toISOString();
      } else {
        data.expiresAt = null;
      }
      await dawAccessService.updateDawAccess(editUser._id, data);
      toast.success('DAW access updated');
      handleCloseEditDialog();
      loadUsers();
    } catch (err) {
      console.error('Error updating DAW access:', err);
      toast.error(err.response?.data?.message || 'Failed to update access');
    } finally {
      setSaving(false);
    }
  };

  // Revoke access
  const handleRevokeClick = (user) => {
    setRevokeUser(user);
    setRevokeDialogOpen(true);
  };

  const handleCloseRevokeDialog = () => {
    setRevokeDialogOpen(false);
    setRevokeUser(null);
  };

  const handleRevokeAccess = async () => {
    if (!revokeUser) return;
    try {
      setRevoking(true);
      await dawAccessService.revokeDawAccess(revokeUser._id);
      toast.success(`DAW access revoked for ${revokeUser.name}`);
      handleCloseRevokeDialog();
      loadUsers();
    } catch (err) {
      console.error('Error revoking DAW access:', err);
      toast.error(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setRevoking(false);
    }
  };

  // Redirect if not platform_engineering tier
  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              DAW Access Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage Drill Analysis Wizard access for users
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenGrantDialog}
            >
              Grant Access
            </Button>
            <IconButton onClick={loadUsers} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                {pagination.total} users with DAW access
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Users Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Alert severity="info">
            No users with DAW access found.
          </Alert>
        ) : (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Granted Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Expires</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.userId || user.email || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatTierLabel(user.featureAccess?.daw?.tier)}
                          size="small"
                          color={getTierColor(user.featureAccess?.daw?.tier)}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(user.featureAccess?.daw?.grantedAt)}
                      </TableCell>
                      <TableCell>
                        {user.featureAccess?.daw?.expiresAt ? (
                          <Chip
                            label={formatDate(user.featureAccess.daw.expiresAt)}
                            size="small"
                            color={new Date(user.featureAccess.daw.expiresAt) < new Date() ? 'error' : 'default'}
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">Never</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit access">
                            <IconButton size="small" onClick={() => handleEditClick(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Revoke access">
                            <IconButton
                              size="small"
                              onClick={() => handleRevokeClick(user)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </Paper>
        )}

        {/* Grant Access Dialog */}
        <Dialog open={grantDialogOpen} onClose={handleCloseGrantDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Grant DAW Access</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={userSearchResults}
                    getOptionLabel={(option) => `${option.name} (${option.userId || option.email})`}
                    value={selectedUser}
                    onChange={(event, newValue) => setSelectedUser(newValue)}
                    onInputChange={(event, newInputValue) => setUserSearchTerm(newInputValue)}
                    loading={userSearchLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search User"
                        placeholder="Type name or email..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {userSearchLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    noOptionsText={userSearchTerm.length < 2 ? 'Type to search...' : 'No users found'}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tier</InputLabel>
                    <Select
                      value={grantTier}
                      onChange={(e) => setGrantTier(e.target.value)}
                      label="Tier"
                    >
                      {TIERS.map((tier) => (
                        <MenuItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expiry Date (optional)"
                    value={grantExpiry}
                    onChange={(e) => setGrantExpiry(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Leave empty for no expiration"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseGrantDialog} disabled={granting}>
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              variant="contained"
              disabled={granting || !selectedUser}
            >
              {granting ? 'Granting...' : 'Grant Access'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Access Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Edit DAW Access: {editUser?.name}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tier</InputLabel>
                    <Select
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value)}
                      label="Tier"
                    >
                      {TIERS.map((tier) => (
                        <MenuItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expiry Date (optional)"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Leave empty for no expiration"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Revoke Access Dialog */}
        <Dialog open={revokeDialogOpen} onClose={handleCloseRevokeDialog} maxWidth="xs" fullWidth>
          <DialogTitle>Revoke DAW Access</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to revoke DAW access for <strong>{revokeUser?.name}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will immediately remove their ability to use the Drill Analysis Wizard.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRevokeDialog} disabled={revoking}>
              Cancel
            </Button>
            <Button
              onClick={handleRevokeAccess}
              variant="contained"
              color="error"
              disabled={revoking}
            >
              {revoking ? 'Revoking...' : 'Revoke Access'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default DawAccessManager;
