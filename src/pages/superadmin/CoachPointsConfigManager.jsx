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
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import coachPointsService from '../../api/coachPointsService';
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';

const POINT_CATEGORIES = [
  { value: 'PORTAL_ENGAGEMENT', label: 'Portal Engagement', color: '#2196f3' },
  { value: 'PLAYER_MANAGEMENT', label: 'Player Management', color: '#4caf50' },
  { value: 'MISSIONS_ASSIGNMENTS', label: 'Missions & Assignments', color: '#ff9800' },
  { value: 'FEEDBACK_COMMUNICATION', label: 'Feedback & Communication', color: '#9c27b0' },
  { value: 'PERFORMANCE_ANALYSIS', label: 'Performance Analysis', color: '#00bcd4' },
  { value: 'CHALLENGES', label: 'Challenges', color: '#f44336' },
  { value: 'TRAINING_EXERCISES', label: 'Training Exercises', color: '#795548' },
  { value: 'COACH_DEVELOPMENT', label: 'Coach Development', color: '#607d8b' },
  { value: 'CONSISTENCY_RETENTION', label: 'Consistency & Retention', color: '#e91e63' },
  { value: 'QUALITY_BONUS', label: 'Quality Bonus', color: '#ffc107' },
];

const getCategoryColor = (categoryValue) => {
  const category = POINT_CATEGORIES.find(c => c.value === categoryValue);
  return category?.color || '#666';
};

const getCategoryLabel = (categoryValue) => {
  const category = POINT_CATEGORIES.find(c => c.value === categoryValue);
  return category?.label || categoryValue;
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const StatCard = ({ title, value, icon, color = 'primary.main' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const CoachPointsConfigManager = () => {
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Check if user has superadmin role or platform_engineering DAW tier
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles.some(r => ['superadmin'].includes(r.role || r));

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coachPointsService.getAllConfigs();
      if (response.success) {
        // API returns data directly as array, or as data.configs
        const configsData = Array.isArray(response.data) ? response.data : (response.data?.configs || []);
        setConfigs(configsData);
      }
    } catch (err) {
      console.error('Error loading configs:', err);
      setError('Failed to load coach points configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const response = await coachPointsService.getSystemAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setAnalyticsError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setAnalyticsError(err.response?.data?.message || err.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
      setAnalyticsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadConfigs();
    }
  }, [isSuperAdmin, loadConfigs]);

  // Load analytics when switching to analytics tab (lazy load)
  useEffect(() => {
    if (isSuperAdmin && activeTab === 1 && !analyticsLoaded && !analyticsLoading) {
      loadAnalytics();
    }
  }, [isSuperAdmin, activeTab, analyticsLoaded, analyticsLoading, loadAnalytics]);

  const handleEditClick = (config) => {
    setSelectedConfig(config);
    setEditFormData({
      ...config,
      streakMultiplier: config.streakMultiplier || { enabled: false, daysRequired: 7, multiplierValue: 1.5 },
      qualityMultiplier: config.qualityMultiplier || { enabled: false, thresholds: [] },
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedConfig(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!selectedConfig) return;

    try {
      setSaving(true);
      const response = await coachPointsService.updateConfig(selectedConfig.activityCode, editFormData);
      if (response.success) {
        toast.success('Configuration updated successfully');
        handleCloseEditDialog();
        loadConfigs();
      }
    } catch (err) {
      console.error('Error updating config:', err);
      toast.error(err.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (config) => {
    try {
      const response = await coachPointsService.toggleActivityStatus(config.activityCode);
      if (response.success) {
        toast.success(`Activity ${config.isActive ? 'disabled' : 'enabled'} successfully`);
        loadConfigs();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update activity status');
    }
  };

  // Filter configs based on search and category
  const filteredConfigs = configs.filter(config => {
    const matchesSearch = searchTerm === '' ||
      config.activityCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.activityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || config.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group configs by category
  const configsByCategory = filteredConfigs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {});

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
              Coach Points Configuration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage activity point values, caps, and multipliers
            </Typography>
          </Box>
          <IconButton onClick={() => { loadConfigs(); loadAnalytics(); }} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label="Activity Configuration"
            />
            <Tab
              icon={<BarChartIcon />}
              iconPosition="start"
              label="System Analytics"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {POINT_CATEGORIES.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {filteredConfigs.length} activities
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : Object.keys(configsByCategory).length === 0 ? (
            <Alert severity="info">
              No configurations found. Run the seed script to populate default activities.
            </Alert>
          ) : (
            Object.entries(configsByCategory).map(([category, categoryConfigs]) => (
              <Paper key={category} sx={{ mb: 3 }}>
                <Box sx={{
                  p: 2,
                  bgcolor: getCategoryColor(category),
                  color: 'white',
                  borderRadius: '4px 4px 0 0',
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    {getCategoryLabel(category)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {categoryConfigs.length} activities
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Base Points</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Daily Cap</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Weekly Cap</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Cooldown</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryConfigs.map((config) => (
                        <TableRow key={config._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {config.activityName}
                            </Typography>
                            {config.description && (
                              <Typography variant="caption" color="text.secondary">
                                {config.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={config.activityCode}
                              size="small"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={<StarIcon sx={{ fontSize: 14 }} />}
                              label={config.basePoints}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {config.maxPointsPerDay ? (
                              <Chip label={config.maxPointsPerDay} size="small" variant="outlined" />
                            ) : (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {config.maxPointsPerWeek ? (
                              <Chip label={config.maxPointsPerWeek} size="small" variant="outlined" />
                            ) : (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {config.cooldownMinutes ? (
                              <Tooltip title={`${config.cooldownMinutes} minutes`}>
                                <Chip label={`${config.cooldownMinutes}m`} size="small" variant="outlined" />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              size="small"
                              checked={config.isActive}
                              onChange={() => handleToggleStatus(config)}
                              color="success"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(config)}
                              title="Edit configuration"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {analyticsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : analyticsError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {analyticsError}
              <Button size="small" onClick={loadAnalytics} sx={{ ml: 2 }}>
                Retry
              </Button>
            </Alert>
          ) : analytics ? (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Coaches"
                    value={analytics.totalCoaches?.toLocaleString() || 0}
                    icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                    color="primary.main"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Transactions"
                    value={analytics.totalTransactions?.toLocaleString() || 0}
                    icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
                    color="success.main"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Points Awarded"
                    value={analytics.totalPointsAwarded?.toLocaleString() || 0}
                    icon={<StarIcon sx={{ fontSize: 40 }} />}
                    color="warning.main"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Active Categories"
                    value={POINT_CATEGORIES.length}
                    icon={<SettingsIcon sx={{ fontSize: 40 }} />}
                    color="info.main"
                  />
                </Grid>
              </Grid>

              {analytics.topActivities && analytics.topActivities.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Top Activities
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Activity Code</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Times Awarded</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Total Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.topActivities.map((activity, index) => (
                          <TableRow key={activity._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={index + 1}
                                  size="small"
                                  color={index < 3 ? 'warning' : 'default'}
                                />
                                <Typography variant="body2" fontFamily="monospace">
                                  {activity._id}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              {activity.count?.toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={activity.points?.toLocaleString()}
                                size="small"
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {analytics.recentActivity && analytics.recentActivity.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Recent Activity
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Coach</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Points</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.recentActivity.slice(0, 20).map((tx) => (
                          <TableRow key={tx._id}>
                            <TableCell>
                              <Typography variant="body2">
                                {tx.coachId?.firstName} {tx.coachId?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tx.coachId?.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {tx.activityName}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`+${tx.totalPoints}`}
                                size="small"
                                color="success"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {new Date(tx.awardedAt).toLocaleString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </>
          ) : (
            <Alert severity="info">
              No analytics data available yet. Points will be recorded as coaches use the portal.
            </Alert>
          )}
        </TabPanel>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Edit Activity Configuration
          </DialogTitle>
          <DialogContent dividers>
            {selectedConfig && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Activity Name"
                      value={editFormData.activityName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, activityName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Activity Code"
                      value={editFormData.activityCode || ''}
                      disabled
                      helperText="Cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={editFormData.category || ''}
                        label="Category"
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      >
                        {POINT_CATEGORIES.map(cat => (
                          <MenuItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Base Points"
                      type="number"
                      value={editFormData.basePoints || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, basePoints: parseInt(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><StarIcon fontSize="small" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Max Points Per Day"
                      type="number"
                      value={editFormData.maxPointsPerDay || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        maxPointsPerDay: e.target.value ? parseInt(e.target.value) : null
                      })}
                      helperText="Leave empty for no limit"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Max Points Per Week"
                      type="number"
                      value={editFormData.maxPointsPerWeek || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        maxPointsPerWeek: e.target.value ? parseInt(e.target.value) : null
                      })}
                      helperText="Leave empty for no limit"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cooldown (minutes)"
                      type="number"
                      value={editFormData.cooldownMinutes || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        cooldownMinutes: e.target.value ? parseInt(e.target.value) : null
                      })}
                      helperText="Minimum time between awards"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editFormData.isActive || false}
                          onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                        />
                      }
                      label="Activity Enabled"
                    />
                  </Grid>

                  {/* Streak Multiplier */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Streak Multiplier
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editFormData.streakMultiplier?.enabled || false}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            streakMultiplier: {
                              ...editFormData.streakMultiplier,
                              enabled: e.target.checked
                            }
                          })}
                        />
                      }
                      label="Enable Streak Bonus"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Days Required"
                      type="number"
                      value={editFormData.streakMultiplier?.daysRequired || 7}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        streakMultiplier: {
                          ...editFormData.streakMultiplier,
                          daysRequired: parseInt(e.target.value) || 7
                        }
                      })}
                      disabled={!editFormData.streakMultiplier?.enabled}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Multiplier Value"
                      type="number"
                      inputProps={{ step: 0.1, min: 1 }}
                      value={editFormData.streakMultiplier?.multiplierValue || 1.5}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        streakMultiplier: {
                          ...editFormData.streakMultiplier,
                          multiplierValue: parseFloat(e.target.value) || 1.5
                        }
                      })}
                      disabled={!editFormData.streakMultiplier?.enabled}
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

export default CoachPointsConfigManager;
