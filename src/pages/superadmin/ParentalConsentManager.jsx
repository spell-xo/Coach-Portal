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
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import superAdminService from '../../api/superAdminService';
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';

const ParentalConsentManager = () => {
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Check if user has superadmin role or platform_engineering DAW tier
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles.some(r => ['superadmin'].includes(r.role || r));

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminService.getParentalConsentRequests({
        search: searchTerm,
        status: statusFilter,
        page: pagination.page + 1, // API uses 1-indexed pages
        limit: pagination.limit
      });
      if (response.success) {
        setRequests(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      }
    } catch (err) {
      console.error('Error loading parental consent requests:', err);
      setError('Failed to load parental consent requests');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadRequests();
    }
  }, [isSuperAdmin, loadRequests]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSuperAdmin) {
        setPagination(prev => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, isSuperAdmin]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const handleViewClick = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleEditClick = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      status: request.status || 'pending',
      parentEmail: request.parentEmail || '',
      parentName: request.parentName || '',
      playerName: request.playerName || '',
      relationship: request.relationship || '',
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedRequest(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    try {
      setSaving(true);
      const response = await superAdminService.updateParentalConsentRequest(
        selectedRequest._id,
        editFormData
      );
      if (response.success) {
        toast.success('Parental consent request updated successfully');
        handleCloseEditDialog();
        loadRequests();
      }
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (request) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRequest) return;

    try {
      setDeleting(true);
      const response = await superAdminService.deleteParentalConsentRequest(selectedRequest._id);
      if (response.success) {
        toast.success('Parental consent request deleted successfully');
        handleCloseDeleteDialog();
        loadRequests();
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error(err.response?.data?.message || 'Failed to delete request');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusChip = (status) => {
    const statusColors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      expired: 'default'
    };

    return (
      <Chip
        label={status || 'unknown'}
        size="small"
        color={statusColors[status] || 'default'}
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getConsentUrl = (request) => {
    if (!request?.consentToken && !request?.token && !request?._id) return null;
    const token = request.consentToken || request.token || request._id;
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup/consent?token=${token}`;
  };

  const handleCopyConsentLink = async (request) => {
    const url = getConsentUrl(request);
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Consent link copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy link');
      }
    }
  };

  // Redirect if not superadmin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Parental Consent Requests
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage parental consent requests for underage users
            </Typography>
          </Box>
          <IconButton onClick={loadRequests} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by player name, parent name, or email..."
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
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                {pagination.total} requests found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Alert severity="info">
            No parental consent requests found matching your criteria.
          </Alert>
        ) : (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Player Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Parent Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Parent Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Relationship</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {request.playerName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.parentName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.parentEmail || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.relationship || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(request.status)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(request.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Copy consent link">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyConsentLink(request)}
                              color="primary"
                            >
                              <LinkIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewClick(request)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit request">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(request)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete request">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(request)}
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
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </Paper>
        )}

        {/* View Details Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Parental Consent Request Details
          </DialogTitle>
          <DialogContent dividers>
            {selectedRequest && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Player Name</Typography>
                    <Typography variant="body1">{selectedRequest.playerName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Player Birthday</Typography>
                    <Typography variant="body1">{formatDate(selectedRequest.playerBirthday)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Parent Name</Typography>
                    <Typography variant="body1">{selectedRequest.parentName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Parent Email</Typography>
                    <Typography variant="body1">{selectedRequest.parentEmail || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Relationship</Typography>
                    <Typography variant="body1">{selectedRequest.relationship || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    {getStatusChip(selectedRequest.status)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Parent User ID</Typography>
                    <Typography variant="body1">{selectedRequest.parentUserId || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Child User ID</Typography>
                    <Typography variant="body1">{selectedRequest.childUserId || 'Not created yet'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Consent Link</Typography>
                    {getConsentUrl(selectedRequest) ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={getConsentUrl(selectedRequest)}
                          InputProps={{
                            readOnly: true,
                            sx: { fontSize: '0.85rem' }
                          }}
                        />
                        <Tooltip title="Copy link">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyConsentLink(selectedRequest)}
                            color="primary"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Typography variant="body1">N/A</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Consent Token</Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {selectedRequest.consentToken || selectedRequest.token || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Token Expires</Typography>
                    <Typography variant="body1">{formatDateTime(selectedRequest.tokenExpiresAt)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                    <Typography variant="body1">{formatDateTime(selectedRequest.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                    <Typography variant="body1">{formatDateTime(selectedRequest.updatedAt)}</Typography>
                  </Grid>
                  {selectedRequest.consentedAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Consented At</Typography>
                      <Typography variant="body1">{formatDateTime(selectedRequest.consentedAt)}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Request Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit Parental Consent Request
          </DialogTitle>
          <DialogContent dividers>
            {selectedRequest && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Player Name"
                      value={editFormData.playerName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, playerName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Parent Name"
                      value={editFormData.parentName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, parentName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Parent Email"
                      value={editFormData.parentEmail || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, parentEmail: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Relationship</InputLabel>
                      <Select
                        value={editFormData.relationship || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, relationship: e.target.value })}
                        label="Relationship"
                      >
                        <MenuItem value="">Not specified</MenuItem>
                        <MenuItem value="parent">Parent</MenuItem>
                        <MenuItem value="guardian">Guardian</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={editFormData.status || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        label="Status"
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="expired">Expired</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          maxWidth="sm"
        >
          <DialogTitle>
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this parental consent request for{' '}
              <strong>{selectedRequest?.playerName}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default ParentalConsentManager;
