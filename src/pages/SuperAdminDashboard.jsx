import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CardActionArea,
} from '@mui/material';
import { motion } from 'framer-motion';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SportsIcon from '@mui/icons-material/Sports';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import WebIcon from '@mui/icons-material/Web';
import BusinessIcon from '@mui/icons-material/Business';
import QueueIcon from '@mui/icons-material/Queue';
import SeedIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import TuneIcon from '@mui/icons-material/Tune';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';
import AppLayout from '../components/AppLayout';
import Breadcrumbs from '../components/Breadcrumbs';
import { SkeletonStatCard } from '../components/skeletons';
import superAdminService from '../api/superAdminService';
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering } from '../store/authSlice';

// LocalStorage key for persisting filter settings
const FILTER_STORAGE_KEY = 'superadmin_dashboard_filters';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  // Load saved filters from localStorage
  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { selectedClubs: [], sortConfig: { key: 'name', direction: 'asc' } };
    } catch (err) {
      console.error('Error loading saved filters:', err);
      return { selectedClubs: [], sortConfig: { key: 'name', direction: 'asc' } };
    }
  };

  const savedFilters = loadSavedFilters();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [selectedClubs, setSelectedClubs] = useState(savedFilters.selectedClubs);
  const [clubBreakdown, setClubBreakdown] = useState([]);
  const [drillsBreakdown, setDrillsBreakdown] = useState([]);
  const [sortConfig, setSortConfig] = useState(savedFilters.sortConfig);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(null);

  // Check if user has superadmin role
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles.some(r => ['superadmin'].includes(r.role || r));

  // Define functions before useEffect
  const loadClubs = React.useCallback(async () => {
    try {
      const response = await superAdminService.getAllClubs();
      if (response.success) {
        setClubs(response.data);
      }
    } catch (err) {
      console.error('Error loading clubs:', err);
      setError('Failed to load clubs list');
    }
  }, []);

  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true);
      // If no clubs selected, show all. Otherwise, pass the array of selected club IDs
      const clubIds = selectedClubs.length === 0 ? null : selectedClubs;
      const response = await superAdminService.getAggregateStats(clubIds);

      if (response.success) {
        setStats(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedClubs]);

  const loadClubBreakdown = React.useCallback(async () => {
    try {
      const response = await superAdminService.getClubBreakdown();
      if (response.success) {
        // Filter breakdown by selected clubs if any are selected
        let breakdown = response.data;
        if (selectedClubs.length > 0) {
          breakdown = breakdown.filter(club => selectedClubs.includes(club.clubId));
        }
        setClubBreakdown(breakdown);
      }
    } catch (err) {
      console.error('Error loading club breakdown:', err);
    }
  }, [selectedClubs]);

  const loadDrillsBreakdown = React.useCallback(async () => {
    try {
      const clubIds = selectedClubs.length === 0 ? null : selectedClubs;
      const response = await superAdminService.getDrillsBreakdown(clubIds);
      if (response.success) {
        setDrillsBreakdown(response.data);
      }
    } catch (err) {
      console.error('Error loading drills breakdown:', err);
    }
  }, [selectedClubs]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadClubs();
    }
  }, [isSuperAdmin, loadClubs]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadStats();
      loadClubBreakdown();
      loadDrillsBreakdown();
    }
  }, [isSuperAdmin, loadStats, loadClubBreakdown, loadDrillsBreakdown]);

  // Save filter settings to localStorage whenever they change
  useEffect(() => {
    try {
      const filtersToSave = {
        selectedClubs,
        sortConfig
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (err) {
      console.error('Error saving filters:', err);
    }
  }, [selectedClubs, sortConfig]);

  // Helper function for nested value extraction
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((value, key) => value?.[key], obj);
  };

  // Memoized sorted club breakdown
  const sortedClubBreakdown = React.useMemo(() => {
    if (!clubBreakdown || clubBreakdown.length === 0) return [];

    const sorted = [...clubBreakdown].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [clubBreakdown, sortConfig]);

  // Redirect if not superadmin (after all hooks)
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleClubChange = (event) => {
    const value = event.target.value;
    setSelectedClubs(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSeedTrainingRecommendations = async () => {
    if (!window.confirm('This will clear and recreate all training exercises and recommendation rules. Continue?')) {
      return;
    }

    try {
      setSeeding(true);
      setSeedSuccess(null);
      setError(null);

      const response = await superAdminService.seedTrainingRecommendations();

      setSeedSuccess(`Successfully created ${response.data.exercisesCreated} exercises and ${response.data.rulesCreated} rules!`);

      // Auto-clear success message after 5 seconds
      setTimeout(() => setSeedSuccess(null), 5000);
    } catch (err) {
      console.error('Error seeding training recommendations:', err);
      setError(err.response?.data?.message || 'Failed to seed training recommendations');
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !stats) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Breadcrumbs />
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Superadmin Dashboard
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} md={4} key={i}>
                <SkeletonStatCard />
              </Grid>
            ))}
          </Grid>
        </Container>
      </AppLayout>
    );
  }

  if (error && !stats) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Breadcrumbs />

        {/* Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Superadmin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              System-wide statistics and management
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Club Filter - Multi-Select */}
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Filter by Academies</InputLabel>
              <Select
                multiple
                value={selectedClubs}
                onChange={handleClubChange}
                input={<OutlinedInput label="Filter by Academies" />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return 'All Academies';
                  }
                  const selectedNames = selected.map(id => {
                    const club = clubs.find(c => c.clubId === id);
                    return club ? club.name : id;
                  });
                  return selectedNames.join(', ');
                }}
              >
                {clubs.map((club) => (
                  <MenuItem key={club.clubId} value={club.clubId}>
                    <Checkbox checked={selectedClubs.indexOf(club.clubId) > -1} />
                    <ListItemText primary={club.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Temporary Seed Button */}
            <Button
              variant="contained"
              color="warning"
              startIcon={<SeedIcon />}
              onClick={handleSeedTrainingRecommendations}
              disabled={seeding}
            >
              {seeding ? 'Seeding...' : 'Seed Training Data'}
            </Button>
          </Box>
        </Box>

        {/* Success/Error Messages */}
        {seedSuccess && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSeedSuccess(null)}>
            {seedSuccess}
          </Alert>
        )}

        {/* Management Tools */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
            Management Tools
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                sx={{ height: '100%' }}
              >
                <CardActionArea onClick={() => navigate('/superadmin/drill-settings')} sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TuneIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Drill Settings
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Configure scoring rules & pattern counts
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                sx={{ height: '100%' }}
              >
                <CardActionArea onClick={() => navigate('/superadmin/drill-metadata')} sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DescriptionIcon sx={{ fontSize: 40, color: 'info.main' }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Drill Metadata
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Display names & visibility settings
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                sx={{ height: '100%' }}
              >
                <CardActionArea onClick={() => navigate('/superadmin/drill-instructions')} sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SettingsIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Drill Instructions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Setup & filming instructions
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                sx={{ height: '100%' }}
              >
                <CardActionArea onClick={() => navigate('/superadmin/users')} sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ManageAccountsIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        User Manager
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Search & manage user accounts
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            {isPlatformEngineering && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    sx={{ height: '100%' }}
                  >
                    <CardActionArea onClick={() => navigate('/superadmin/daw-access')} sx={{ height: '100%' }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SecurityIcon sx={{ fontSize: 40, color: 'error.main' }} />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            DAW Access
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Manage Wizard access & tiers
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    sx={{ height: '100%' }}
                  >
                    <CardActionArea onClick={() => navigate('/superadmin/engineering')} sx={{ height: '100%' }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <BugReportIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Engineering Investigations
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            View investigation requests & reports
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        {/* Consolidated Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* System Overview Card */}
          <Grid item xs={12} md={4}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              sx={{ p: 3, height: '100%' }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                System Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <BusinessIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.clubs || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Clubs
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <GroupIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.teams?.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Teams
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <SportsIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.users?.coaches || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Coaches
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <PersonIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.users?.players || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Players
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Drill Statistics Card */}
          <Grid item xs={12} md={4}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ p: 3, height: '100%' }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Drill Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <VideoLibraryIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.totalUploaded || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Drills
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <PendingActionsIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.awaitingAnnotation || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Awaiting Annotation
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <QueueIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.queuedForProcessing || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Queued for Processing
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <PlayCircleOutlineIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.readyForProcessing || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ready for Processing
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.analysed || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drills Analysed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* User Activity Card */}
          <Grid item xs={12} md={4}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              sx={{ p: 3, height: '100%' }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                User Activity
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <PeopleAltIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.uniqueUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <PhoneAndroidIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.uploadedViaApp || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Via App
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <WebIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.drills?.uploadedViaPortal || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Via Portal
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Academy Breakdown Table */}
        {clubBreakdown.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              sx={{ p: 3 }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                Academy Breakdown
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('name')}
                      >
                        Academy {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Head Coach
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('drills.totalUploaded')}
                      >
                        Total Drills {sortConfig.key === 'drills.totalUploaded' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('drills.awaitingAnnotation')}
                      >
                        Awaiting Annotation {sortConfig.key === 'drills.awaitingAnnotation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('drills.queuedForProcessing')}
                      >
                        Queued for Processing {sortConfig.key === 'drills.queuedForProcessing' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('drills.analysed')}
                      >
                        Analysed {sortConfig.key === 'drills.analysed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('drills.scored')}
                      >
                        Scored {sortConfig.key === 'drills.scored' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('drills.failed')}
                      >
                        Failed {sortConfig.key === 'drills.failed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('teams.total')}
                      >
                        Teams {sortConfig.key === 'teams.total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('users.coaches')}
                      >
                        Coaches {sortConfig.key === 'users.coaches' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('users.players')}
                      >
                        Players {sortConfig.key === 'users.players' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleSort('drills.uniqueUsers')}
                      >
                        Active Users {sortConfig.key === 'drills.uniqueUsers' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedClubBreakdown.map((club, index) => (
                      <TableRow
                        key={club.clubId}
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {club.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {club.headCoach || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{club.drills?.totalUploaded || 0}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={club.drills?.awaitingAnnotation || 0}
                            color={club.drills?.awaitingAnnotation > 0 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={club.drills?.queuedForProcessing || 0}
                            color={club.drills?.queuedForProcessing > 0 ? 'secondary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={club.drills?.analysed || 0}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={club.drills?.scored || 0}
                            color={club.drills?.scored > 0 ? 'info' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={club.drills?.failed || 0}
                            color={club.drills?.failed > 0 ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{club.teams?.total || 0}</TableCell>
                        <TableCell align="right">{club.users?.coaches || 0}</TableCell>
                        <TableCell align="right">{club.users?.players || 0}</TableCell>
                        <TableCell align="right">{club.drills?.uniqueUsers || 0}</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    {sortedClubBreakdown.length > 1 && (
                      <TableRow sx={{ backgroundColor: 'action.hover', borderTop: '2px solid', borderColor: 'divider' }}>
                        <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>-</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.drills?.totalUploaded || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.drills?.awaitingAnnotation || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.drills?.queuedForProcessing || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.drills?.analysed || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.drills?.scored || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.drills?.failed || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.teams?.total || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.users?.coaches || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.users?.players || 0), 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {sortedClubBreakdown.reduce((sum, club) => sum + (club.drills?.uniqueUsers || 0), 0)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* Drills Breakdown Table */}
        {drillsBreakdown.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              sx={{ p: 3 }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                Drills Breakdown by Type
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Drill Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total Drills</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Awaiting Annotation</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Queued for Processing</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Analysed</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Scored</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Failed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drillsBreakdown.map((drill, index) => (
                      <TableRow
                        key={`${drill.drillType}-${index}`}
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.02 }}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {drill.drillType}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {drill.totalDrills}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={drill.awaitingAnnotation}
                            color={drill.awaitingAnnotation > 0 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={drill.queuedForProcessing}
                            color={drill.queuedForProcessing > 0 ? 'secondary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={drill.analysed}
                            color={drill.analysed > 0 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${drill.scored} (${drill.scoredPercentage}%)`}
                            color={drill.scored > 0 ? 'info' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={drill.failed}
                            color={drill.failed > 0 ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Container>
    </AppLayout>
  );
};

export default SuperAdminDashboard;
