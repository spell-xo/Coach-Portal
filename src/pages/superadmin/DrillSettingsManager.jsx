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
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import superAdminService from '../../api/superAdminService';
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';

const DrillSettingsManager = () => {
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drillSettings, setDrillSettings] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Check if user has superadmin role or platform_engineering DAW tier
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles.some(r => ['superadmin'].includes(r.role || r));

  useEffect(() => {
    if (isSuperAdmin) {
      loadDrillSettings();
    }
  }, [isSuperAdmin]);

  const loadDrillSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminService.getAllDrillSettings();
      if (response.success) {
        setDrillSettings(response.data || []);
      }
    } catch (err) {
      console.error('Error loading drill settings:', err);
      setError('Failed to load drill settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (setting) => {
    setSelectedSetting(setting);
    setEditFormData({ ...setting });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedSetting(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!selectedSetting) return;

    try {
      setSaving(true);
      const response = await superAdminService.updateDrillSetting(selectedSetting._id, editFormData);
      if (response.success) {
        toast.success('Drill setting updated successfully');
        handleCloseEditDialog();
        loadDrillSettings();
      }
    } catch (err) {
      console.error('Error updating drill setting:', err);
      toast.error('Failed to update drill setting');
    } finally {
      setSaving(false);
    }
  };

  const handleRuleChange = (ruleName, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ruleName]: {
          ...prev.rules[ruleName],
          [field]: value
        }
      }
    }));
  };

  // Redirect if not superadmin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate total pattern count from rules
  const getTotalPatternCount = (rules) => {
    if (!rules) return 0;
    return Object.values(rules).reduce((sum, rule) => sum + (rule['Pattern Count'] || 0), 0);
  };

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Drill Settings Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and edit drill scoring configuration
            </Typography>
          </Box>
          <IconButton onClick={loadDrillSettings} disabled={loading}>
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
        ) : drillSettings.length === 0 ? (
          <Alert severity="info">
            No drill settings found.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Drill Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Version</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Default</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Pattern Count</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rules Count</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drillSettings.map((setting) => (
                  <TableRow key={setting._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {setting.drillType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`v${setting.version || 1}`} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      {setting.isDefault ? (
                        <Chip label="Default" size="small" color="success" />
                      ) : (
                        <Chip label="No" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTotalPatternCount(setting.rules)}
                        size="small"
                        color="info"
                      />
                    </TableCell>
                    <TableCell>
                      {setting.rules ? Object.keys(setting.rules).length : 0}
                    </TableCell>
                    <TableCell>
                      {setting.updatedAt ? new Date(setting.updatedAt).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(setting)}
                        title="Edit drill setting"
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
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Edit Drill Setting: {selectedSetting?.drillType}
          </DialogTitle>
          <DialogContent dividers>
            {selectedSetting && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Drill Type"
                      value={editFormData.drillType || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, drillType: e.target.value })}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Version"
                      type="number"
                      value={editFormData.version || 1}
                      onChange={(e) => setEditFormData({ ...editFormData, version: parseInt(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editFormData.isDefault || false}
                          onChange={(e) => setEditFormData({ ...editFormData, isDefault: e.target.checked })}
                        />
                      }
                      label="Is Default"
                    />
                  </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mb: 2 }}>
                  Scoring Rules
                </Typography>

                {editFormData.rules && Object.entries(editFormData.rules).map(([ruleName, ruleData]) => (
                  <Accordion key={ruleName} defaultExpanded={false}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontWeight: 600 }}>{ruleName}</Typography>
                        <Chip
                          label={`Pattern Count: ${ruleData['Pattern Count'] || 0}`}
                          size="small"
                          color="info"
                        />
                        <Chip
                          label={`Weight: ${(ruleData['Overall Weighting'] || 0) * 100}%`}
                          size="small"
                          color="secondary"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Pattern Count"
                            type="number"
                            value={ruleData['Pattern Count'] || 0}
                            onChange={(e) => handleRuleChange(ruleName, 'Pattern Count', parseInt(e.target.value) || 0)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Overall Weighting"
                            type="number"
                            inputProps={{ step: 0.01, min: 0, max: 1 }}
                            value={ruleData['Overall Weighting'] || 0}
                            onChange={(e) => handleRuleChange(ruleName, 'Overall Weighting', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Success Threshold"
                            type="number"
                            inputProps={{ step: 0.01 }}
                            value={ruleData['Success Threshold'] || 0}
                            onChange={(e) => handleRuleChange(ruleName, 'Success Threshold', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Quality Weight"
                            type="number"
                            inputProps={{ step: 0.01 }}
                            value={ruleData['Quality Weight'] || 0}
                            onChange={(e) => handleRuleChange(ruleName, 'Quality Weight', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Completion Weight"
                            type="number"
                            inputProps={{ step: 0.01 }}
                            value={ruleData['Completion Weight'] || 0}
                            onChange={(e) => handleRuleChange(ruleName, 'Completion Weight', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Timing Weight"
                            type="number"
                            inputProps={{ step: 0.01 }}
                            value={ruleData['Timing Weight'] || 0}
                            onChange={(e) => handleRuleChange(ruleName, 'Timing Weight', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
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

export default DrillSettingsManager;
