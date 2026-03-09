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
  TableSortLabel,
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
  FormControlLabel,
  Switch,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Card,
  CardContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import superAdminService from '../../api/superAdminService';
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering } from '../../store/authSlice';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Chart colors
const CHART_COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];
const SOURCE_COLORS = {
  'self_signup': '#4caf50',
  'invitation': '#2196f3',
  'bulk_import': '#ff9800',
  'consent_flow': '#9c27b0',
  'unknown': '#607d8b',
};

const UserManager = () => {
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Statistics
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Storage key for filter persistence
  const FILTERS_STORAGE_KEY = 'superadmin_users_filters';

  // Load saved filters from localStorage
  const getSavedFilters = () => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedFilters = getSavedFilters();

  // Filters (shared across all tabs) - initialize from localStorage if available
  const [searchTerm, setSearchTerm] = useState(savedFilters.searchTerm || '');
  const [roleFilter, setRoleFilter] = useState(savedFilters.roleFilter || '');
  const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter || '');
  const [countryFilter, setCountryFilter] = useState(savedFilters.countryFilter || '');
  const [dateFrom, setDateFrom] = useState(savedFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(savedFilters.dateTo || '');
  const [availableCountries, setAvailableCountries] = useState([]);

  // Sorting
  const [sortBy, setSortBy] = useState(savedFilters.sortBy || 'createdDate');
  const [sortOrder, setSortOrder] = useState(savedFilters.sortOrder || 'desc');

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Reset password dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '', email: '', password: '', role: '', country: '', gender: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add to club dialog
  const [addToClubDialogOpen, setAddToClubDialogOpen] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedClubRole, setSelectedClubRole] = useState('player');
  const [addingToClub, setAddingToClub] = useState(false);

  // Club membership roles (lowercase to match USER_ROLE enum)
  const CLUB_ROLES = ['player', 'coach', 'head_coach', 'club_manager', 'guardian'];

  // Check if user has superadmin role or platform_engineering DAW tier
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles.some(r => ['superadmin'].includes(r.role || r));

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminService.searchUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        country: countryFilter,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
        page: pagination.page + 1, // API uses 1-indexed pages
        limit: pagination.limit
      });
      if (response.success) {
        setUsers(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
        // Update available countries from response
        if (response.countries) {
          setAvailableCountries(response.countries);
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, countryFilter, dateFrom, dateTo, sortBy, sortOrder, pagination.page, pagination.limit]);

  const loadStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await superAdminService.getUserStatistics({
        dateFrom,
        dateTo
      });
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [dateFrom, dateTo]);

  const loadClubs = useCallback(async () => {
    try {
      const response = await superAdminService.getAllClubs();
      if (response.success) {
        setClubs(response.data || []);
      }
    } catch (err) {
      console.error('Error loading clubs:', err);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
      loadStatistics();
      loadClubs();
    }
  }, [isSuperAdmin, loadUsers, loadStatistics, loadClubs]);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      searchTerm,
      roleFilter,
      statusFilter,
      countryFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [searchTerm, roleFilter, statusFilter, countryFilter, dateFrom, dateTo, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSuperAdmin) {
        setPagination(prev => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, isSuperAdmin]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.userId || '',
      handle: user.handle || '',
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      enabled: user.enabled !== false,
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setEditFormData({});
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const updates = {
        name: editFormData.name,
        handle: editFormData.handle,
        gender: editFormData.gender || null,
        enabled: editFormData.enabled,
      };

      // Only include birthday if it's set
      if (editFormData.birthday) {
        updates.birthday = new Date(editFormData.birthday);
      }

      const response = await superAdminService.updateUser(selectedUser._id, updates);
      if (response.success) {
        toast.success('User updated successfully');
        handleCloseEditDialog();
        loadUsers();
      }
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPasswordClick = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetPasswordDialogOpen(true);
  };

  const handleCloseResetPasswordDialog = () => {
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      setResettingPassword(true);
      const response = await superAdminService.resetUserPassword(selectedUser._id, newPassword);
      if (response.success) {
        toast.success('Password reset successfully');
        handleCloseResetPasswordDialog();
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const action = user.enabled !== false ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      if (user.enabled !== false) {
        // Disable user (soft delete)
        await superAdminService.deleteUser(user._id);
        toast.success('User disabled successfully');
      } else {
        // Enable user
        await superAdminService.updateUser(user._id, { enabled: true });
        toast.success('User enabled successfully');
      }
      loadUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      toast.error('Failed to update user status');
    }
  };

  const handleOpenCreateDialog = () => {
    setCreateFormData({ name: '', email: '', password: '', role: '', country: '', gender: '' });
    setCreateError('');
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateFormData({ name: '', email: '', password: '', role: '', country: '', gender: '' });
    setCreateError('');
  };

  const handleCreateUser = async () => {
    const { name, email, password, role } = createFormData;
    if (!name || !email || !password || !role) return;
    if (password.length < 6) {
      setCreateError('Password must be at least 6 characters');
      return;
    }

    try {
      setCreating(true);
      setCreateError('');
      const response = await superAdminService.createUser(createFormData);
      if (response.success) {
        toast.success(`User "${name}" created successfully`);
        handleCloseCreateDialog();
        loadUsers();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create user';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleAddToClubClick = (user) => {
    setSelectedUser(user);
    setSelectedClubId('');
    setSelectedClubRole('PLAYER');
    setAddToClubDialogOpen(true);
  };

  const handleCloseAddToClubDialog = () => {
    setAddToClubDialogOpen(false);
    setSelectedUser(null);
    setSelectedClubId('');
    setSelectedClubRole('PLAYER');
  };

  const handleAddToClub = async () => {
    if (!selectedUser || !selectedClubId || !selectedClubRole) return;

    try {
      setAddingToClub(true);
      const response = await superAdminService.addUserToClub(selectedUser._id, selectedClubId, selectedClubRole);
      if (response.success) {
        toast.success(response.message || 'User added to club successfully');
        handleCloseAddToClubDialog();
        loadUsers();
      }
    } catch (err) {
      console.error('Error adding user to club:', err);
      toast.error(err.response?.data?.message || 'Failed to add user to club');
    } finally {
      setAddingToClub(false);
    }
  };

  const handleRemoveFromClub = async (user, clubId) => {
    const clubName = user.clubInfo?.clubName || 'this club';
    if (!window.confirm(`Are you sure you want to remove ${user.name} from ${clubName}?`)) return;

    try {
      const response = await superAdminService.removeUserFromClub(user._id, clubId);
      if (response.success) {
        toast.success(response.message || 'User removed from club successfully');
        loadUsers();
      }
    } catch (err) {
      console.error('Error removing user from club:', err);
      toast.error(err.response?.data?.message || 'Failed to remove user from club');
    }
  };

  const getRoleChip = (user) => {
    // Try userType first (computed by backend), then roles array, then activeRole
    let role = user.userType;
    if (!role && user.roles && user.roles.length > 0) {
      role = user.roles[0]?.role || user.roles[0];
    }
    if (!role && user.activeRole) {
      role = user.activeRole;
    }
    if (!role) {
      return <Chip label="No Role" size="small" />;
    }

    const roleColors = {
      superadmin: 'error',
      admin: 'warning',
      coach: 'primary',
      player: 'success',
      club_admin: 'secondary',
      guardian: 'info',
      parent: 'info'
    };

    // Format role for display (capitalize, replace underscores)
    const displayRole = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
      <Chip
        label={displayRole}
        size="small"
        color={roleColors[role] || 'default'}
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getCreatedViaChip = (createdVia) => {
    const sourceConfig = {
      'self_signup': { label: 'App', color: 'primary' },
      'invitation': { label: 'Portal', color: 'secondary' },
      'bulk_import': { label: 'Import', color: 'info' },
      'consent_flow': { label: 'Consent', color: 'warning' },
    };

    const config = sourceConfig[createdVia] || { label: createdVia || 'Unknown', color: 'default' };

    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
        variant="outlined"
      />
    );
  };

  // Country code to name mapping
  const COUNTRY_CODE_TO_NAME = {
    'IE': 'Ireland', 'GB': 'United Kingdom', 'US': 'United States', 'ES': 'Spain',
    'FR': 'France', 'DE': 'Germany', 'IT': 'Italy', 'PT': 'Portugal', 'NL': 'Netherlands',
    'BE': 'Belgium', 'AU': 'Australia', 'CA': 'Canada', 'BR': 'Brazil', 'AR': 'Argentina',
    'MX': 'Mexico', 'JP': 'Japan', 'CN': 'China', 'IN': 'India', 'ZA': 'South Africa',
    'NG': 'Nigeria', 'EG': 'Egypt', 'PL': 'Poland', 'SE': 'Sweden', 'NO': 'Norway',
    'DK': 'Denmark', 'FI': 'Finland', 'AT': 'Austria', 'CH': 'Switzerland', 'GR': 'Greece',
    'TR': 'Turkey', 'RU': 'Russia', 'NZ': 'New Zealand', 'SG': 'Singapore', 'MY': 'Malaysia',
    'TH': 'Thailand', 'ID': 'Indonesia', 'PH': 'Philippines', 'VN': 'Vietnam', 'KR': 'South Korea',
    'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia', 'QA': 'Qatar', 'KW': 'Kuwait',
    'IL': 'Israel', 'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'UA': 'Ukraine',
    'HR': 'Croatia', 'RS': 'Serbia', 'SK': 'Slovakia', 'BG': 'Bulgaria', 'SI': 'Slovenia',
    'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'IS': 'Iceland', 'MT': 'Malta',
    'CY': 'Cyprus', 'LU': 'Luxembourg', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru',
    'GB-SCT': 'Scotland', 'GB-WLS': 'Wales', 'GB-ENG': 'England',
  };

  // Get country name from code or value
  const getCountryName = (country) => {
    if (!country) return 'Unknown';
    const code = country.trim().toUpperCase();
    if (code.length === 2 || code.includes('-')) {
      return COUNTRY_CODE_TO_NAME[code] || country;
    }
    // Already a name, return as-is with proper capitalization
    return country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
  };

  // Country code to flag emoji converter
  const getCountryFlag = (countryCode) => {
    if (!countryCode) return null;
    // Handle common country names/codes
    const countryMap = {
      'ireland': 'IE',
      'united kingdom': 'GB',
      'uk': 'GB',
      'united states': 'US',
      'usa': 'US',
      'spain': 'ES',
      'france': 'FR',
      'germany': 'DE',
      'italy': 'IT',
      'portugal': 'PT',
      'netherlands': 'NL',
      'belgium': 'BE',
      'australia': 'AU',
      'canada': 'CA',
      'brazil': 'BR',
      'argentina': 'AR',
      'mexico': 'MX',
      'japan': 'JP',
      'china': 'CN',
      'india': 'IN',
      'south africa': 'ZA',
      'nigeria': 'NG',
      'egypt': 'EG',
      'poland': 'PL',
      'sweden': 'SE',
      'norway': 'NO',
      'denmark': 'DK',
      'finland': 'FI',
      'austria': 'AT',
      'switzerland': 'CH',
      'greece': 'GR',
      'turkey': 'TR',
      'russia': 'RU',
      'new zealand': 'NZ',
      'singapore': 'SG',
      'malaysia': 'MY',
      'thailand': 'TH',
      'indonesia': 'ID',
      'philippines': 'PH',
      'vietnam': 'VN',
      'south korea': 'KR',
      'korea': 'KR',
      'uae': 'AE',
      'united arab emirates': 'AE',
      'saudi arabia': 'SA',
      'qatar': 'QA',
      'kuwait': 'KW',
      'israel': 'IL',
      'czech republic': 'CZ',
      'czechia': 'CZ',
      'hungary': 'HU',
      'romania': 'RO',
      'ukraine': 'UA',
      'croatia': 'HR',
      'serbia': 'RS',
      'scotland': 'GB-SCT',
      'wales': 'GB-WLS',
      'england': 'GB-ENG',
    };

    let code = countryCode.trim();
    // Check if it's already a 2-letter code
    if (code.length === 2) {
      code = code.toUpperCase();
    } else {
      // Try to map from country name
      code = countryMap[code.toLowerCase()] || code.toUpperCase().substring(0, 2);
    }

    // Convert to flag emoji (works for standard ISO codes)
    if (code.length === 2 && !code.includes('-')) {
      const codePoints = code
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    }
    return null;
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
              User Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Search, manage, and analyze user accounts
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Create User
            </Button>
            <IconButton onClick={() => { loadUsers(); loadStatistics(); }} disabled={loading || loadingStats}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Filters - shared across all tabs */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search name, email, handle..."
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
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="superadmin">Superadmin</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="club_admin">Club Admin</MenuItem>
                  <MenuItem value="coach">Coach</MenuItem>
                  <MenuItem value="player">Player</MenuItem>
                  <MenuItem value="guardian">Guardian</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
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
                  <MenuItem value="enabled">Enabled</MenuItem>
                  <MenuItem value="disabled">Disabled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Country</InputLabel>
                <Select
                  value={countryFilter}
                  onChange={(e) => {
                    setCountryFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Country"
                >
                  <MenuItem value="">All Countries</MenuItem>
                  {availableCountries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {getCountryFlag(country)} {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                  setCountryFilter('');
                  setDateFrom('');
                  setDateTo('');
                  setPagination(prev => ({ ...prev, page: 0 }));
                  localStorage.removeItem(FILTERS_STORAGE_KEY);
                }}
              >
                Clear Filters
              </Button>
              <Typography variant="body2" color="text.secondary">
                {pagination.total} users found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Results" />
            <Tab label="Summary" />
          </Tabs>
        </Paper>

        {/* Results Tab */}
        {activeTab === 0 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Alert severity="info">
                No users found matching your criteria.
              </Alert>
            ) : (
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <TableSortLabel
                            active={sortBy === 'name'}
                            direction={sortBy === 'name' ? sortOrder : 'asc'}
                            onClick={() => handleSort('name')}
                          >
                            User
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <TableSortLabel
                            active={sortBy === 'userId'}
                            direction={sortBy === 'userId' ? sortOrder : 'asc'}
                            onClick={() => handleSort('userId')}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Handle</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <TableSortLabel
                            active={sortBy === 'country'}
                            direction={sortBy === 'country' ? sortOrder : 'asc'}
                            onClick={() => handleSort('country')}
                          >
                            Country
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Club/Academy</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <TableSortLabel
                            active={sortBy === 'birthday'}
                            direction={sortBy === 'birthday' ? sortOrder : 'asc'}
                            onClick={() => handleSort('birthday')}
                          >
                            Birthday
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <TableSortLabel
                            active={sortBy === 'drillCount'}
                            direction={sortBy === 'drillCount' ? sortOrder : 'asc'}
                            onClick={() => handleSort('drillCount')}
                          >
                            Drills
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <TableSortLabel
                            active={sortBy === 'createdDate'}
                            direction={sortBy === 'createdDate' ? sortOrder : 'asc'}
                            onClick={() => handleSort('createdDate')}
                          >
                            Created
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={user.profilePicture}
                                sx={{ width: 32, height: 32 }}
                              >
                                {user.name?.charAt(0) || '?'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {user.name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.userId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {user.handle || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getRoleChip(user)}
                          </TableCell>
                          <TableCell>
                            {user.country ? (
                              <Tooltip title={getCountryName(user.country)}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body1" component="span">
                                    {getCountryFlag(user.country)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {user.country}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.clubInfo ? (
                              <Tooltip title={user.clubInfo.role ? `Role: ${user.clubInfo.role}` : ''}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {user.clubInfo.clubName}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(user.birthday)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.enabled !== false ? 'Enabled' : 'Disabled'}
                              size="small"
                              color={user.enabled !== false ? 'success' : 'error'}
                              variant={user.enabled !== false ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            {getCreatedViaChip(user.createdVia)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: user.drillCount > 0 ? 600 : 400, color: user.drillCount > 0 ? 'text.primary' : 'text.secondary' }}>
                              {user.drillCount || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                              {formatDateTime(user.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit user">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(user)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Add to club">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAddToClubClick(user)}
                                  color="primary"
                                >
                                  <GroupAddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {user.clubInfo && (
                                <Tooltip title={`Remove from ${user.clubInfo.clubName}`}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveFromClub(user, user.clubInfo.clubId)}
                                    color="warning"
                                  >
                                    <GroupRemoveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Reset password">
                                <IconButton
                                  size="small"
                                  onClick={() => handleResetPasswordClick(user)}
                                >
                                  <LockResetIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={user.enabled !== false ? 'Disable user' : 'Enable user'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleUserStatus(user)}
                                  color={user.enabled !== false ? 'default' : 'success'}
                                >
                                  {user.enabled !== false ? (
                                    <PersonOffIcon fontSize="small" />
                                  ) : (
                                    <PersonIcon fontSize="small" />
                                  )}
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
          </>
        )}

        {/* Summary Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {loadingStats ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !statistics ? (
              <Alert severity="info">No statistics available.</Alert>
            ) : (
              <Grid container spacing={3}>
                {/* Top Stats Cards */}
                <Grid item xs={6} sm={4} md={2}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {statistics.totalUsers?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {statistics.clubMembership?.withClubs?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        With Clubs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <PersonIcon color="info" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {statistics.clubMembership?.withoutClubs?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Solo Users
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Daily User Creation Line Chart */}
                <Grid item xs={12} md={8}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Daily User Registrations
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={statistics.dailyCreation || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                          />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="self_signup"
                            name="App"
                            stroke={SOURCE_COLORS.self_signup}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="invitation"
                            name="Portal"
                            stroke={SOURCE_COLORS.invitation}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="bulk_import"
                            name="Import"
                            stroke={SOURCE_COLORS.bulk_import}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="consent_flow"
                            name="Consent"
                            stroke={SOURCE_COLORS.consent_flow}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Users by Source Pie Chart */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Users by Source
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statistics.usersBySource || []}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {(statistics.usersBySource || []).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={SOURCE_COLORS[entry.source] || CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Users by Level Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Users by Drill Level
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistics.usersByLevel || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="level" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#2196f3">
                            {(statistics.usersByLevel || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Users by Country Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Countries
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistics.usersByCountry || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="countryName"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#4caf50" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Users by Role Pie Chart */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Users by Role
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statistics.usersByRole || []}
                            dataKey="count"
                            nameKey="role"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {(statistics.usersByRole || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* Edit User Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit User: {selectedUser?.name}
          </DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={editFormData.email || ''}
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Handle"
                      value={editFormData.handle || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, handle: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Birthday"
                      type="date"
                      value={editFormData.birthday || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, birthday: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={editFormData.gender || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                        label="Gender"
                      >
                        <MenuItem value="">Not specified</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editFormData.enabled !== false}
                          onChange={(e) => setEditFormData({ ...editFormData, enabled: e.target.checked })}
                        />
                      }
                      label="Account Enabled"
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

        {/* Reset Password Dialog */}
        <Dialog
          open={resetPasswordDialogOpen}
          onClose={handleCloseResetPasswordDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Reset Password for {selectedUser?.name}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Enter a new password for this user"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResetPasswordDialog} disabled={resettingPassword}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              variant="contained"
              color="warning"
              disabled={resettingPassword || !newPassword}
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add to Club Dialog */}
        <Dialog
          open={addToClubDialogOpen}
          onClose={handleCloseAddToClubDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Add {selectedUser?.name} to Club/Academy
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Club/Academy *</InputLabel>
                    <Select
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      label="Club/Academy *"
                    >
                      {clubs.map((club) => (
                        <MenuItem key={club._id || club.clubId} value={club._id || club.clubId}>
                          {club.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Role *</InputLabel>
                    <Select
                      value={selectedClubRole}
                      onChange={(e) => setSelectedClubRole(e.target.value)}
                      label="Role *"
                    >
                      {CLUB_ROLES.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddToClubDialog} disabled={addingToClub}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToClub}
              variant="contained"
              color="primary"
              disabled={addingToClub || !selectedClubId || !selectedClubRole}
            >
              {addingToClub ? 'Adding...' : 'Add to Club'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={handleCloseCreateDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Portal User</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 1 }}>
              {createError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {createError}
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name *"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password *"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    helperText="Minimum 6 characters"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Role *</InputLabel>
                    <Select
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                      label="Role *"
                    >
                      <MenuItem value="coach">Coach</MenuItem>
                      <MenuItem value="head_coach">Head Coach</MenuItem>
                      <MenuItem value="club_manager">Club Manager</MenuItem>
                      <MenuItem value="superadmin">Superadmin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={createFormData.country}
                    onChange={(e) => setCreateFormData({ ...createFormData, country: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={createFormData.gender}
                      onChange={(e) => setCreateFormData({ ...createFormData, gender: e.target.value })}
                      label="Gender"
                    >
                      <MenuItem value="">Not specified</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateDialog} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              variant="contained"
              disabled={creating || !createFormData.name || !createFormData.email || !createFormData.password || !createFormData.role}
            >
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default UserManager;
