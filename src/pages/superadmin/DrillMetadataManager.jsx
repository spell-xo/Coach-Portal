import React, { useState, useEffect } from 'react';
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
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import superAdminService from '../../api/superAdminService';
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';

const DrillMetadataManager = () => {
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drillMetadata, setDrillMetadata] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMetadata, setSelectedMetadata] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Check if user has superadmin role or platform_engineering DAW tier
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles.some(r => ['superadmin'].includes(r.role || r));

  useEffect(() => {
    if (isSuperAdmin) {
      loadDrillMetadata();
    }
  }, [isSuperAdmin]);

  const loadDrillMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminService.getAllDrillMetadata();
      if (response.success) {
        setDrillMetadata(response.data || []);
      }
    } catch (err) {
      console.error('Error loading drill metadata:', err);
      setError('Failed to load drill metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (metadata) => {
    setSelectedMetadata(metadata);
    setEditFormData({ ...metadata });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedMetadata(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!selectedMetadata) return;

    try {
      setSaving(true);
      const response = await superAdminService.updateDrillMetadata(selectedMetadata._id, editFormData);
      if (response.success) {
        toast.success('Drill metadata updated successfully');
        handleCloseEditDialog();
        loadDrillMetadata();
      }
    } catch (err) {
      console.error('Error updating drill metadata:', err);
      toast.error('Failed to update drill metadata');
    } finally {
      setSaving(false);
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
              Drill Metadata Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and edit drill configuration (cone counts, pattern counts)
            </Typography>
          </Box>
          <IconButton onClick={loadDrillMetadata} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : drillMetadata.length === 0 ? (
          <Alert severity="info">
            No drill metadata found.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Drill Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expected Cone Count</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pattern Count</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drillMetadata.map((metadata) => (
                  <TableRow key={metadata._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metadata.drill_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={metadata.expected_cone_count || 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={metadata.pattern_count || 0}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {metadata.updatedAt ? new Date(metadata.updatedAt).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(metadata)}
                        title="Edit drill metadata"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit Drill Metadata: {selectedMetadata?.drill_type}
          </DialogTitle>
          <DialogContent dividers>
            {selectedMetadata && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Drill Type"
                      value={editFormData.drill_type || ''}
                      disabled
                      helperText="Drill type cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expected Cone Count"
                      type="number"
                      value={editFormData.expected_cone_count || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, expected_cone_count: parseInt(e.target.value) || 0 })}
                      helperText="Number of cones expected for this drill"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pattern Count"
                      type="number"
                      value={editFormData.pattern_count || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, pattern_count: parseInt(e.target.value) || 0 })}
                      helperText="Number of patterns in this drill"
                    />
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
      </Container>
    </AppLayout>
  );
};

export default DrillMetadataManager;
