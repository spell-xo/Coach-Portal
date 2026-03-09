import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AppLayout from '../components/AppLayout';
import apiClient from '../api/client';

// ReactQuill toolbar configuration
const quillModules = {
  toolbar: [
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'link',
];

const DrillInstructionsManager = () => {
  const [selectedDrill, setSelectedDrill] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [allInstructions, setAllInstructions] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [togglingDrill, setTogglingDrill] = useState(null);
  const [drillTypes, setDrillTypes] = useState([]);
  const [loadingDrillTypes, setLoadingDrillTypes] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drillToDelete, setDrillToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    setupInstructions: {
      equipment: '',
      instructions: '',
      setupVideoUrl: '',
      demoVideoUrl: '',
    },
    filmingInstructions: '',
  });

  // Helper function to get drill label
  const getDrillLabel = (drillType) => {
    const drill = drillTypes.find(d => d.value === drillType);
    return drill ? drill.label : drillType;
  };

  // Load drill types and instructions on mount
  useEffect(() => {
    loadDrillTypes();
    loadAllInstructions();
  }, []);

  const loadDrillTypes = async () => {
    try {
      setLoadingDrillTypes(true);
      const response = await apiClient.get('/drill-instructions/types/available');
      if (response.data.success) {
        setDrillTypes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading drill types:', err);
      setError('Failed to load drill types');
    } finally {
      setLoadingDrillTypes(false);
    }
  };

  useEffect(() => {
    if (selectedDrill) {
      loadDrillInstructions();
    } else {
      // Reset form when no drill selected
      setFormData({
        setupInstructions: {
          equipment: '',
          instructions: '',
          setupVideoUrl: '',
          demoVideoUrl: '',
        },
        filmingInstructions: '',
      });
    }
  }, [selectedDrill]);

  const loadAllInstructions = async () => {
    try {
      setLoadingTable(true);
      const response = await apiClient.get('/drill-instructions');
      if (response.data.success) {
        setAllInstructions(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading all drill instructions:', err);
    } finally {
      setLoadingTable(false);
    }
  };

  const loadDrillInstructions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/drill-instructions/${selectedDrill}`);

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          setupInstructions: data.setupInstructions || {
            equipment: '',
            instructions: '',
            setupVideoUrl: '',
            demoVideoUrl: '',
          },
          filmingInstructions: data.filmingInstructions || '',
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // No instructions found for this drill type, start with empty form
        setFormData({
          setupInstructions: {
            equipment: '',
            instructions: '',
            setupVideoUrl: '',
            demoVideoUrl: '',
          },
          filmingInstructions: '',
        });
      } else {
        console.error('Error loading drill instructions:', err);
        setError(err.response?.data?.message || 'Failed to load drill instructions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDrill) {
      setError('Please select a drill type');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await apiClient.put(`/drill-instructions/${selectedDrill}`, formData);

      setSuccess('Drill instructions saved successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Refresh the table
      loadAllInstructions();
    } catch (err) {
      console.error('Error saving drill instructions:', err);
      setError(err.response?.data?.message || 'Failed to save drill instructions');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (drillType, currentEnabled) => {
    try {
      setTogglingDrill(drillType);
      await apiClient.patch(`/drill-instructions/${drillType}/toggle`, {
        enabled: !currentEnabled
      });

      // Update local state
      setAllInstructions(prev =>
        prev.map(instruction =>
          instruction.drillType === drillType
            ? { ...instruction, enabled: !currentEnabled }
            : instruction
        )
      );
    } catch (err) {
      console.error('Error toggling drill instructions:', err);
      setError(err.response?.data?.message || 'Failed to toggle drill status');
    } finally {
      setTogglingDrill(null);
    }
  };

  const handleEditDrill = (drillType) => {
    setSelectedDrill(drillType);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (drillType) => {
    setDrillToDelete(drillType);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!drillToDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await apiClient.delete(`/drill-instructions/${drillToDelete}`);

      setSuccess('Drill instructions deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Refresh the table
      loadAllInstructions();

      // Close dialog
      setDeleteDialogOpen(false);
      setDrillToDelete(null);

      // Clear form if the deleted drill was selected
      if (selectedDrill === drillToDelete) {
        setSelectedDrill('');
      }
    } catch (err) {
      console.error('Error deleting drill instructions:', err);
      setError(err.response?.data?.message || 'Failed to delete drill instructions');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDrillToDelete(null);
  };

  const handleChange = (section, field, value) => {
    if (section === 'setupInstructions') {
      setFormData((prev) => ({
        ...prev,
        setupInstructions: {
          ...prev.setupInstructions,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
              Drill Instructions Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure setup and filming instructions for different drill types
            </Typography>
          </Box>

          {/* Success/Error Messages */}
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

          {/* Configured Drills Table */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Configured Drills
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Drill Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingTable ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : allInstructions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No drill instructions configured yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allInstructions.map((instruction) => (
                        <TableRow
                          key={instruction._id}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            <Typography fontWeight="medium">
                              {getDrillLabel(instruction.drillType)}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(instruction.createdAt)}</TableCell>
                          <TableCell>{formatDate(instruction.updatedAt)}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <Chip
                                label={instruction.enabled !== false ? 'Enabled' : 'Disabled'}
                                color={instruction.enabled !== false ? 'success' : 'default'}
                                size="small"
                              />
                              <Switch
                                checked={instruction.enabled !== false}
                                onChange={() => handleToggleEnabled(instruction.drillType, instruction.enabled !== false)}
                                disabled={togglingDrill === instruction.drillType}
                                size="small"
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Edit Instructions">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditDrill(instruction.drillType)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Instructions">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(instruction.drillType)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Drill Type Selector */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Edit Instructions
              </Typography>
              <FormControl fullWidth disabled={loadingDrillTypes}>
                <InputLabel>Select Drill Type</InputLabel>
                <Select
                  value={selectedDrill}
                  onChange={(e) => setSelectedDrill(e.target.value)}
                  label="Select Drill Type"
                >
                  <MenuItem value="">
                    <em>Select a drill type</em>
                  </MenuItem>
                  {loadingDrillTypes ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading drill types...
                    </MenuItem>
                  ) : (
                    drillTypes.map((drill) => (
                      <MenuItem key={drill.value} value={drill.value}>
                        {drill.label}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* Instructions Form */}
          {selectedDrill && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Paper sx={{ mb: 3 }}>
                  <Box sx={{ px: 3, py: 3 }}>
                    {/* Equipment */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Equipment
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: 'white',
                          borderRadius: 1,
                          '& .ql-editor': {
                            fontSize: '12pt',
                            minHeight: '120px'
                          }
                        }}
                      >
                        <ReactQuill
                          theme="snow"
                          value={formData.setupInstructions.equipment}
                          onChange={(value) =>
                            handleChange('setupInstructions', 'equipment', value)
                          }
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="List the equipment needed for this drill..."
                        />
                      </Box>
                    </Box>

                    {/* Setup Instructions */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Setup Instructions
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: 'white',
                          borderRadius: 1,
                          '& .ql-editor': {
                            fontSize: '12pt',
                            minHeight: '180px'
                          }
                        }}
                      >
                        <ReactQuill
                          theme="snow"
                          value={formData.setupInstructions.instructions}
                          onChange={(value) =>
                            handleChange('setupInstructions', 'instructions', value)
                          }
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Enter detailed setup instructions..."
                        />
                      </Box>
                    </Box>

                    {/* Setup Video URL */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Setup Video URL
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="https://..."
                        value={formData.setupInstructions.setupVideoUrl}
                        onChange={(e) =>
                          handleChange('setupInstructions', 'setupVideoUrl', e.target.value)
                        }
                        helperText="URL to video showing how to set up the drill"
                      />
                    </Box>

                    {/* Demo Video URL */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Demo Video URL
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="https://..."
                        value={formData.setupInstructions.demoVideoUrl}
                        onChange={(e) =>
                          handleChange('setupInstructions', 'demoVideoUrl', e.target.value)
                        }
                        helperText="URL to video demonstrating the drill"
                      />
                    </Box>

                    {/* Filming Instructions */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Filming Instructions
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: 'white',
                          borderRadius: 1,
                          '& .ql-editor': {
                            fontSize: '12pt',
                            minHeight: '300px'
                          }
                        }}
                      >
                        <ReactQuill
                          theme="snow"
                          value={formData.filmingInstructions}
                          onChange={(value) => handleChange(null, 'filmingInstructions', value)}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Enter detailed filming instructions including camera angles, positioning, what to capture, etc..."
                        />
                      </Box>
                    </Box>

                    {/* Save Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Instructions'}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              )}
            </>
          )}

          {!selectedDrill && (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Select a drill type above to configure its instructions
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Drill Instructions?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the instructions for{' '}
            <strong>{drillToDelete ? getDrillLabel(drillToDelete) : ''}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default DrillInstructionsManager;
