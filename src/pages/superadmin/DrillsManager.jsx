import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
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
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  TextField,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ScoreIcon from '@mui/icons-material/EmojiEvents';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NoteIcon from '@mui/icons-material/StickyNote2';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import HelpIcon from '@mui/icons-material/Help';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AppLayout from '../../components/AppLayout';
import Fab from '@mui/material/Fab';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ComparisonWizardDrawer, { COMPARISON_DRAWER_WIDTH } from '../../components/wizard/ComparisonWizardDrawer';
import CommandCentre, { COMMAND_CENTRE_WIDTH } from '../../components/peil/CommandCentre';
import TagDialog from '../../components/peil/TagDialog';
import tagService from '../../api/tagService';
import Breadcrumbs from '../../components/Breadcrumbs';
import superAdminService from '../../api/superAdminService';
import wizardService from '../../api/wizardService';
import { showToast } from '../../utils/toast';
import peilAvatar from '../../assets/images/peil-avatar-48.png';
import { selectPrimaryRole, selectUserRoles, selectIsPlatformEngineering, selectHasDawAccess } from '../../store/authSlice';
import { DRILL_LEVELS, DRILL_STATUS_LABELS, DRILL_STATUS_COLORS, DRILL_TYPES } from '../../constants/drillConstants';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Chart colors
const CHART_COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548', '#607d8b', '#e91e63', '#3f51b5', '#009688', '#cddc39', '#ff5722', '#673ab7', '#03a9f4', '#8bc34a'];
const STATUS_CHART_COLORS = {
  'PROCESSED': '#4caf50',
  'UPLOADED': '#2196f3',
  'PROCESSING': '#ff9800',
  'PENDING_MANUAL_ANNOTATION': '#9c27b0',
  'FAILED': '#f44336',
  'REJECTED': '#e91e63',
};
const SCORE_CATEGORY_COLORS = {
  '0': '#f44336',
  '1-20': '#ff5722',
  '21-40': '#ff9800',
  '41-60': '#ffeb3b',
  '61-80': '#8bc34a',
  '81-100': '#4caf50',
};

const DrillsManager = () => {
  const navigate = useNavigate();
  const primaryRole = useSelector(selectPrimaryRole);
  const userRoles = useSelector(selectUserRoles);
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const hasDawAccess = useSelector(selectHasDawAccess);

  const [loading, setLoading] = useState(true);
  const [loadingReportIds, setLoadingReportIds] = useState(false);
  const [error, setError] = useState(null);
  const [drills, setDrills] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Summary statistics
  const [summary, setSummary] = useState(null);

  // Drill type statistics
  const [drillTypeStats, setDrillTypeStats] = useState(null);
  const [loadingDrillTypeStats, setLoadingDrillTypeStats] = useState(false);

  // Storage key for filter persistence
  const FILTERS_STORAGE_KEY = 'superadmin_drills_filters';

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

  // Filters - initialize from localStorage if available
  const [searchTerm, setSearchTerm] = useState(savedFilters.searchTerm || '');
  const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter || '');
  const [gameTypeFilter, setGameTypeFilter] = useState(savedFilters.gameTypeFilter || '');
  const [drillLevelFilter, setDrillLevelFilter] = useState(savedFilters.drillLevelFilter || '');
  const [uploadSourceFilter, setUploadSourceFilter] = useState(savedFilters.uploadSourceFilter || '');
  const [countryFilter, setCountryFilter] = useState(savedFilters.countryFilter || '');
  const [clubFilter, setClubFilter] = useState(savedFilters.clubFilter || '');
  const [dateFrom, setDateFrom] = useState(savedFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(savedFilters.dateTo || '');
  const [scoreCategoryFilter, setScoreCategoryFilter] = useState(savedFilters.scoreCategoryFilter || '');
  const [patternCountMismatchOnly, setPatternCountMismatchOnly] = useState(savedFilters.patternCountMismatchOnly || false);
  const [hasNotesOnly, setHasNotesOnly] = useState(savedFilters.hasNotesOnly || false);
  const [rejectionRatingFilter, setRejectionRatingFilter] = useState(savedFilters.rejectionRatingFilter || '');

  // Visited drill tracking (session-scoped)
  const [visitedDrills, setVisitedDrills] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('visitedDrills') || '[]'); } catch { return []; }
  });

  // Peil session indicators (DAW users only)
  const [peilSessions, setPeilSessions] = useState({});
  const [filterHasPeil, setFilterHasPeil] = useState(false);

  // Score category options for filter dropdown
  const SCORE_CATEGORIES = [
    { value: '0', label: '0' },
    { value: '1-20', label: '1-20' },
    { value: '21-40', label: '21-40' },
    { value: '41-60', label: '41-60' },
    { value: '61-80', label: '61-80' },
    { value: '81-100', label: '81-100' },
  ];

  // Filter options from API
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [availableUploadSources, setAvailableUploadSources] = useState([]);
  const [availableClubs, setAvailableClubs] = useState([]);

  // Tag filter state (must be declared before loadDrills which references tagFilter)
  const [tagFilter, setTagFilter] = useState(null); // { tagName, drillIds }
  const [availableTags, setAvailableTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagDialogMode, setTagDialogMode] = useState('selected'); // 'selected' or 'allMatching'

  // Check if user has superadmin role or platform_engineering DAW tier
  const isSuperAdmin = primaryRole === 'superadmin' || isPlatformEngineering ||
                       userRoles.some(r => ['superadmin'].includes(r.role || r));

  const loadDrills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminService.searchDrills({
        search: searchTerm,
        status: statusFilter,
        gameType: gameTypeFilter,
        drillLevel: drillLevelFilter,
        uploadSource: uploadSourceFilter,
        country: countryFilter,
        clubId: clubFilter,
        dateFrom: dateFrom,
        dateTo: dateTo,
        scoreCategory: scoreCategoryFilter,
        patternCountMismatchOnly: patternCountMismatchOnly,
        hasNotesOnly: hasNotesOnly,
        rejectionRatingFilter: rejectionRatingFilter,
        drillIds: tagFilter?.drillIds,
        page: pagination.page + 1,
        limit: pagination.limit
      });
      if (response.success) {
        setDrills(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.pages || 0
        }));
        if (response.filters) {
          setAvailableCountries(response.filters.countries || []);
          setAvailableStatuses(response.filters.statuses || []);
          setAvailableUploadSources(response.filters.uploadSources || []);
          setAvailableClubs(response.filters.clubs || []);
        }
        if (response.summary) {
          setSummary(response.summary);
        }
      }
    } catch (err) {
      console.error('Error loading drills:', err);
      setError('Failed to load drills');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, gameTypeFilter, drillLevelFilter, uploadSourceFilter, countryFilter, clubFilter, dateFrom, dateTo, scoreCategoryFilter, patternCountMismatchOnly, hasNotesOnly, rejectionRatingFilter, tagFilter, pagination.page, pagination.limit]);

  const loadDrillTypeStatistics = useCallback(async () => {
    try {
      setLoadingDrillTypeStats(true);
      const response = await superAdminService.getDrillTypeStatistics({
        search: searchTerm,
        status: statusFilter,
        gameType: gameTypeFilter,
        drillLevel: drillLevelFilter,
        uploadSource: uploadSourceFilter,
        country: countryFilter,
        clubId: clubFilter,
        dateFrom,
        dateTo,
        scoreCategory: scoreCategoryFilter
      });
      if (response.success) {
        setDrillTypeStats(response.data);
      }
    } catch (err) {
      console.error('Error loading drill type statistics:', err);
    } finally {
      setLoadingDrillTypeStats(false);
    }
  }, [searchTerm, statusFilter, gameTypeFilter, drillLevelFilter, uploadSourceFilter, countryFilter, clubFilter, dateFrom, dateTo, scoreCategoryFilter]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadDrills();
      loadDrillTypeStatistics();
    }
  }, [isSuperAdmin, loadDrills, loadDrillTypeStatistics]);

  // Fetch Peil session data after drills load (DAW users only)
  useEffect(() => {
    if (!hasDawAccess || drills.length === 0) return;
    const drillIds = drills.map(d => d._id);
    wizardService.checkSessions(drillIds).then(setPeilSessions).catch(() => {});
  }, [hasDawAccess, drills]);

  // Load available tags for the tag filter dropdown (DAW users only)
  const loadAvailableTags = useCallback(async () => {
    if (!hasDawAccess) return;
    try {
      const result = await tagService.listTags();
      setAvailableTags(result.data || []);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  }, [hasDawAccess]);

  useEffect(() => {
    if (isSuperAdmin) loadAvailableTags();
  }, [isSuperAdmin, loadAvailableTags]);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      searchTerm,
      statusFilter,
      gameTypeFilter,
      drillLevelFilter,
      uploadSourceFilter,
      countryFilter,
      clubFilter,
      dateFrom,
      dateTo,
      scoreCategoryFilter,
      patternCountMismatchOnly,
      hasNotesOnly,
      rejectionRatingFilter,
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [searchTerm, statusFilter, gameTypeFilter, drillLevelFilter, uploadSourceFilter, countryFilter, clubFilter, dateFrom, dateTo, scoreCategoryFilter, patternCountMismatchOnly, hasNotesOnly, rejectionRatingFilter]);

  // Reset "select all matching" when filters change
  useEffect(() => {
    setAllMatchingSelected(false);
  }, [searchTerm, statusFilter, gameTypeFilter, drillLevelFilter, uploadSourceFilter, countryFilter, clubFilter, dateFrom, dateTo, scoreCategoryFilter, patternCountMismatchOnly, hasNotesOnly, rejectionRatingFilter]);

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setGameTypeFilter('');
    setDrillLevelFilter('');
    setUploadSourceFilter('');
    setCountryFilter('');
    setClubFilter('');
    setDateFrom('');
    setDateTo('');
    setScoreCategoryFilter('');
    setPatternCountMismatchOnly(false);
    setHasNotesOnly(false);
    setRejectionRatingFilter('');
    setFilterHasPeil(false);
    setTagFilter(null);
    setAllMatchingSelected(false);
    setSelectedDrills([]);
    setPagination(prev => ({ ...prev, page: 0 }));
    localStorage.removeItem(FILTERS_STORAGE_KEY);
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

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return null;
    const countryMap = {
      'ireland': 'IE', 'united kingdom': 'GB', 'uk': 'GB', 'united states': 'US', 'usa': 'US',
      'spain': 'ES', 'france': 'FR', 'germany': 'DE', 'italy': 'IT', 'portugal': 'PT',
      'netherlands': 'NL', 'belgium': 'BE', 'australia': 'AU', 'canada': 'CA', 'brazil': 'BR',
      'argentina': 'AR', 'mexico': 'MX', 'japan': 'JP', 'china': 'CN', 'india': 'IN',
      'south africa': 'ZA', 'nigeria': 'NG', 'egypt': 'EG', 'poland': 'PL', 'sweden': 'SE',
      'norway': 'NO', 'denmark': 'DK', 'finland': 'FI', 'austria': 'AT', 'switzerland': 'CH',
      'greece': 'GR', 'turkey': 'TR', 'russia': 'RU', 'new zealand': 'NZ', 'singapore': 'SG',
      'malaysia': 'MY', 'thailand': 'TH', 'indonesia': 'ID', 'philippines': 'PH', 'vietnam': 'VN',
      'south korea': 'KR', 'korea': 'KR', 'uae': 'AE', 'united arab emirates': 'AE',
      'saudi arabia': 'SA', 'qatar': 'QA', 'kuwait': 'KW', 'israel': 'IL',
      'czech republic': 'CZ', 'czechia': 'CZ', 'hungary': 'HU', 'romania': 'RO',
      'ukraine': 'UA', 'croatia': 'HR', 'serbia': 'RS',
      'scotland': 'GB-SCT', 'wales': 'GB-WLS', 'england': 'GB-ENG',
    };

    let code = countryCode.trim();
    if (code.length === 2) {
      code = code.toUpperCase();
    } else {
      code = countryMap[code.toLowerCase()] || code.toUpperCase().substring(0, 2);
    }

    if (code.length === 2 && !code.includes('-')) {
      const codePoints = code.split('').map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    }
    return null;
  };

  const getStatusChip = (status) => {
    const label = DRILL_STATUS_LABELS[status] || status || 'Unknown';
    const color = DRILL_STATUS_COLORS[status] || 'default';
    return <Chip label={label} size="small" color={color} />;
  };

  const getRejectionRatingIcon = (drill) => {
    if (!drill.rejectionRating) return null;
    const rating = drill.rejectionRating.rating;
    const ratedBy = drill.rejectionRating.ratedBy?.name || 'Unknown';
    const ratedAt = drill.rejectionRating.ratedAt ? new Date(drill.rejectionRating.ratedAt).toLocaleString() : '';

    if (rating === 'correct') {
      return (
        <Tooltip title={`Correctly Rejected - by ${ratedBy} on ${ratedAt}`}>
          <ThumbUpIcon sx={{ fontSize: 18, color: 'success.main', ml: 0.5 }} />
        </Tooltip>
      );
    } else if (rating === 'incorrect') {
      return (
        <Tooltip title={`Incorrectly Rejected - by ${ratedBy} on ${ratedAt}`}>
          <ThumbDownIcon sx={{ fontSize: 18, color: 'error.main', ml: 0.5 }} />
        </Tooltip>
      );
    } else if (rating === 'should_have_rejected') {
      return (
        <Tooltip title={`Should Have Been Rejected - by ${ratedBy} on ${ratedAt}`}>
          <HelpIcon sx={{ fontSize: 18, color: 'error.main', ml: 0.5 }} />
        </Tooltip>
      );
    }
    return null;
  };

  const formatDrillType = (gameType) => {
    if (!gameType) return 'N/A';
    return gameType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatUploadSource = (source) => {
    if (!source) return 'N/A';
    if (source === 'Mobile APP' || source === 'mobile_app') return 'App';
    if (source === 'Coach Portal' || source === 'coach_portal') return 'Portal';
    if (source === 'Admin Portal' || source === 'admin_portal') return 'Admin';
    return source;
  };

  const getUploadSourceChip = (source) => {
    const isApp = source === 'Mobile APP' || source === 'mobile_app';
    const isPortal = source === 'Coach Portal' || source === 'coach_portal';
    const color = isApp ? 'primary' : isPortal ? 'secondary' : 'default';
    return <Chip label={formatUploadSource(source)} size="small" color={color} variant="outlined" />;
  };

  // Prepare chart data
  const getUploadSourceChartData = () => {
    if (!summary?.byUploadSource) return [];
    return Object.entries(summary.byUploadSource).map(([source, count]) => ({
      name: formatUploadSource(source),
      value: count
    }));
  };

  const getStatusChartData = () => {
    if (!summary?.byStatus) return [];
    return Object.entries(summary.byStatus).map(([status, count]) => ({
      name: DRILL_STATUS_LABELS[status] || status,
      value: count,
      fill: STATUS_CHART_COLORS[status] || '#607d8b'
    }));
  };

  const getCountryChartData = () => {
    if (!summary?.byCountry) return [];
    return Object.entries(summary.byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({
        name: country,
        value: count,
        flag: getCountryFlag(country)
      }));
  };

  const getClubChartData = () => {
    if (!summary?.byClub) return [];
    return Object.entries(summary.byClub)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([club, count]) => ({
        name: club.length > 15 ? club.substring(0, 15) + '...' : club,
        fullName: club,
        value: count
      }));
  };

  const getScoreCategoryChartData = () => {
    if (!summary?.byScoreCategory) return [];
    const order = ['0', '1-20', '21-40', '41-60', '61-80', '81-100'];
    return order
      .filter(cat => summary.byScoreCategory[cat] > 0)
      .map(category => ({
        name: category,
        value: summary.byScoreCategory[category],
        fill: SCORE_CATEGORY_COLORS[category]
      }));
  };

  const handleDrillClick = (drill) => {
    // Navigate to existing drill detail page with player and drill IDs
    if (drill.user && drill._id) {
      setVisitedDrills(prev => {
        const updated = [...new Set([...prev, drill._id])];
        sessionStorage.setItem('visitedDrills', JSON.stringify(updated));
        return updated;
      });
      navigate(`/players/${drill.user}/drills/${drill._id}`);
    }
  };

  const [exporting, setExporting] = useState(false);

  // Comparison wizard state
  const [selectedDrills, setSelectedDrills] = useState([]);
  const [comparisonDrawerOpen, setComparisonDrawerOpen] = useState(false);

  // Command Centre state
  const [commandCentreOpen, setCommandCentreOpen] = useState(false);

  // "Select all matching" state
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);

  const handleDrillSelect = (drillId, event) => {
    event.stopPropagation();
    setSelectedDrills((prev) => {
      if (prev.includes(drillId)) return prev.filter((id) => id !== drillId);
      return [...prev, drillId];
    });
  };

  const handleOpenComparison = () => {
    if (selectedDrills.length >= 2) setComparisonDrawerOpen(true);
  };

  const handleCloseComparison = () => {
    setComparisonDrawerOpen(false);
  };

  const handleTagFilter = (tagData) => {
    setTagFilter(tagData);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleSelectAllOnPage = (event) => {
    if (event.target.checked) {
      const pageIds = drills.map(d => d._id);
      setSelectedDrills(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      if (allMatchingSelected) {
        setSelectedDrills([]);
        setAllMatchingSelected(false);
      } else {
        const pageIds = new Set(drills.map(d => d._id));
        setSelectedDrills(prev => prev.filter(id => !pageIds.has(id)));
      }
    }
  };

  const handleSelectAllMatching = async () => {
    try {
      const response = await superAdminService.searchDrills({
        search: searchTerm,
        status: statusFilter,
        gameType: gameTypeFilter,
        drillLevel: drillLevelFilter,
        uploadSource: uploadSourceFilter,
        country: countryFilter,
        clubId: clubFilter,
        dateFrom: dateFrom,
        dateTo: dateTo,
        scoreCategory: scoreCategoryFilter,
        patternCountMismatchOnly: patternCountMismatchOnly,
        hasNotesOnly: hasNotesOnly,
        rejectionRatingFilter: rejectionRatingFilter,
        page: 1,
        limit: pagination.total
      });
      if (response.success && response.data) {
        setSelectedDrills(response.data.map(d => d._id));
        setAllMatchingSelected(true);
      }
    } catch (err) {
      console.error('Error fetching all matching drills:', err);
    }
  };

  const allOnPageSelected = drills.length > 0 && drills.every(d => selectedDrills.includes(d._id));

  const handleExportCSV = async () => {
    if (pagination.total === 0) return;

    try {
      setExporting(true);

      // Fetch ALL results with current filters (up to 10000)
      const response = await superAdminService.searchDrills({
        search: searchTerm,
        status: statusFilter,
        gameType: gameTypeFilter,
        drillLevel: drillLevelFilter,
        uploadSource: uploadSourceFilter,
        country: countryFilter,
        clubId: clubFilter,
        dateFrom: dateFrom,
        dateTo: dateTo,
        scoreCategory: scoreCategoryFilter,
        patternCountMismatchOnly: patternCountMismatchOnly,
        hasNotesOnly: hasNotesOnly,
        rejectionRatingFilter: rejectionRatingFilter,
        page: 1,
        limit: 10000  // Fetch all results
      });

      if (!response.success || !response.data || response.data.length === 0) {
        setExporting(false);
        return;
      }

      const allDrills = response.data;

      // Define CSV headers
      const headers = [
        'Player Name',
        'Country',
        'Club/Academy',
        'Drill Type',
        'Level',
        'Status',
        'Score',
        'Source',
        'Upload Date'
      ];

      // Convert drills data to CSV rows
      const rows = allDrills.map(drill => [
        drill.playerName || 'Unknown',
        drill.playerCountry || '',
        drill.clubInfo?.clubName || '',
        formatDrillType(drill.gameType) || '',
        drill.drillLevel ? drill.drillLevel.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : '',
        DRILL_STATUS_LABELS[drill.status] || drill.status || '',
        drill.score !== null && drill.score !== undefined ? (typeof drill.score === 'number' ? drill.score.toFixed(1) : drill.score) : '',
        formatUploadSource(drill.uploadedFrom) || '',
        formatDateTime(drill.uploadDate || drill.createdAt) || ''
      ]);

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Build CSV content
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      // Generate filename with current date and filters info
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let filename = `drills_export_${dateStr}`;
      if (statusFilter) filename += `_${statusFilter.toLowerCase()}`;
      if (drillLevelFilter) filename += `_${drillLevelFilter.toLowerCase()}`;
      filename += `.csv`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setExporting(false);
    }
  };

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
              Drills Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all uploaded drills across the platform
            </Typography>
          </Box>
          <IconButton onClick={loadDrills} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search player name or drill ID..."
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  {availableStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {DRILL_STATUS_LABELS[status] || status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Level</InputLabel>
                <Select
                  value={drillLevelFilter}
                  onChange={(e) => {
                    setDrillLevelFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Level"
                >
                  <MenuItem value="">All</MenuItem>
                  {DRILL_LEVELS.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Drill Type</InputLabel>
                <Select
                  value={gameTypeFilter}
                  onChange={(e) => {
                    setGameTypeFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Drill Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {DRILL_TYPES(drillLevelFilter || undefined).map((drill) => (
                    <MenuItem key={drill.value} value={drill.value}>
                      {formatDrillType(drill.value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={uploadSourceFilter}
                  onChange={(e) => {
                    setUploadSourceFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Source"
                >
                  <MenuItem value="">All</MenuItem>
                  {availableUploadSources.map((source) => (
                    <MenuItem key={source} value={source}>
                      {formatUploadSource(source)}
                    </MenuItem>
                  ))}
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
                  <MenuItem value="">All</MenuItem>
                  {availableCountries.map((country) => (
                    <MenuItem key={country.code || country} value={country.code || country}>
                      {getCountryFlag(country.code || country)} {country.name || country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Club</InputLabel>
                <Select
                  value={clubFilter}
                  onChange={(e) => {
                    setClubFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Club"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="no_club" sx={{ fontStyle: 'italic' }}>Not attached to any club</MenuItem>
                  {availableClubs.map((club) => (
                    <MenuItem key={club.id} value={club.id}>
                      {club.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1}>
              <FormControl fullWidth size="small">
                <InputLabel>Score</InputLabel>
                <Select
                  value={scoreCategoryFilter}
                  onChange={(e) => {
                    setScoreCategoryFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  label="Score"
                >
                  <MenuItem value="">All</MenuItem>
                  {SCORE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Date Filters Row */}
          <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
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
            <Grid item xs={12} sm={12} md={9} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={patternCountMismatchOnly}
                    onChange={(e) => {
                      setPatternCountMismatchOnly(e.target.checked);
                      setPagination(prev => ({ ...prev, page: 0 }));
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                    Pattern count mismatch only
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasNotesOnly}
                    onChange={(e) => {
                      setHasNotesOnly(e.target.checked);
                      setPagination(prev => ({ ...prev, page: 0 }));
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                    Has notes only
                  </Typography>
                }
              />
              {hasDawAccess && (
                <FormControlLabel
                  control={<Checkbox checked={filterHasPeil} onChange={(e) => setFilterHasPeil(e.target.checked)} size="small" />}
                  label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar src={peilAvatar} sx={{ width: 18, height: 18 }} />
                    <Typography variant="body2">Has Peil sessions</Typography>
                  </Box>}
                />
              )}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Drill Rating</InputLabel>
                <Select
                  value={rejectionRatingFilter}
                  label="Drill Rating"
                  onChange={(e) => {
                    setRejectionRatingFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="correct">Correctly Rejected</MenuItem>
                  <MenuItem value="incorrect">Incorrectly Rejected</MenuItem>
                  <MenuItem value="should_have_rejected">Should Have Been Rejected</MenuItem>
                  <MenuItem value="unrated">Unrated (Rejected)</MenuItem>
                </Select>
              </FormControl>
              {hasDawAccess && availableTags.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Tag</InputLabel>
                  <Select
                    value={tagFilter?.tagName || ''}
                    label="Tag"
                    onChange={async (e) => {
                      const tagName = e.target.value;
                      if (!tagName) {
                        handleTagFilter(null);
                      } else {
                        try {
                          const result = await tagService.getTagDrills(tagName);
                          handleTagFilter({ tagName, drillIds: result.drill_ids });
                        } catch (err) {
                          console.error('Error loading tag drills:', err);
                        }
                      }
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {availableTags.map((tag) => (
                      <MenuItem key={tag.id || tag.tag_name} value={tag.tag_name}>
                        {tag.tag_name} ({tag.drill_count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ height: 40 }}
              >
                Clear Filters
              </Button>
              <Typography variant="body2" color="text.secondary">
                {pagination.total} drills found
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
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Results" />
            <Tab label="Summary" />
            <Tab label="Drill Types" />
          </Tabs>

          {/* Results Tab */}
          {activeTab === 0 && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : drills.length === 0 ? (
                <Alert severity="info" sx={{ m: 2 }}>
                  No drills found matching your criteria.
                </Alert>
              ) : (
                <>
                  {/* Select all matching drills banner */}
                  {allOnPageSelected && pagination.total > drills.length && (
                    <Alert severity="info" icon={false} sx={{ borderRadius: 0, py: 0.5, textAlign: 'center' }}>
                      {allMatchingSelected ? (
                        <Typography variant="body2" component="span">
                          All <strong>{pagination.total}</strong> matching drills selected.{' '}
                          <Button size="small" onClick={() => { setAllMatchingSelected(false); setSelectedDrills([]); }}>
                            Clear selection
                          </Button>
                        </Typography>
                      ) : (
                        <Typography variant="body2" component="span">
                          All {drills.length} drills on this page are selected.{' '}
                          <Button size="small" onClick={handleSelectAllMatching}>
                            Select all {pagination.total} matching drills
                          </Button>
                        </Typography>
                      )}
                    </Alert>
                  )}
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {isSuperAdmin && (
                            <TableCell padding="checkbox" sx={{ width: 42 }}>
                              <Checkbox
                                size="small"
                                checked={allOnPageSelected}
                                indeterminate={selectedDrills.length > 0 && !allOnPageSelected}
                                onChange={handleSelectAllOnPage}
                              />
                            </TableCell>
                          )}
                          <TableCell sx={{ fontWeight: 700 }}>Player</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Country</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Club/Academy</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Drill Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Upload Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(filterHasPeil ? drills.filter(d => peilSessions[d._id] > 0) : drills).map((drill) => (
                          <TableRow
                            key={drill._id}
                            hover
                            onClick={() => handleDrillClick(drill)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: selectedDrills.includes(drill._id)
                                ? 'action.selected'
                                : visitedDrills.includes(drill._id)
                                  ? 'action.hover'
                                  : 'inherit',
                            }}
                          >
                            {isSuperAdmin && (
                              <TableCell padding="checkbox">
                                <Checkbox
                                  size="small"
                                  checked={selectedDrills.includes(drill._id)}
                                  onClick={(e) => handleDrillSelect(drill._id, e)}
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  src={drill.playerProfilePicture}
                                  sx={{ width: 32, height: 32 }}
                                >
                                  {drill.playerName?.charAt(0) || '?'}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {drill.playerName || 'Unknown'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {drill.playerCountry ? (
                                <Tooltip title={drill.playerCountry}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body1" component="span">
                                      {getCountryFlag(drill.playerCountry)}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {drill.clubInfo ? (
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {drill.clubInfo.clubName}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDrillType(drill.gameType)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {drill.drillLevel ? drill.drillLevel.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {getStatusChip(drill.status)}
                                {getRejectionRatingIcon(drill)}
                                {drill.rejectionInfo && (
                                  <Tooltip
                                    title={
                                      <Box sx={{ p: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: drill.rejectionInfo.wasRejected ? 'warning.light' : 'error.light', mb: 1 }}>
                                          {drill.rejectionInfo.wasRejected ? 'Previously Rejected' : 'Rejection Details'}
                                        </Typography>
                                        {drill.rejectionInfo.wasRejected && (
                                          <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic', color: 'grey.400' }}>
                                            This drill was rejected but has since been reprocessed.
                                          </Typography>
                                        )}
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                          <strong>Classification:</strong> {drill.rejectionInfo.classification}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                          <strong>Reason:</strong> {drill.rejectionInfo.badReason || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                          <strong>Rationale:</strong> {drill.rejectionInfo.rationale || 'N/A'}
                                        </Typography>
                                        {drill.rejectionInfo.drillTypeDetected && (
                                          <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem', color: 'grey.400' }}>
                                            Detected: {drill.rejectionInfo.drillTypeDetected} | Requested: {drill.rejectionInfo.requestedDrillType}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                    arrow
                                    placement="right"
                                  >
                                    <WarningAmberIcon
                                      sx={{
                                        fontSize: 18,
                                        color: drill.rejectionInfo.wasRejected ? 'grey.500' : 'warning.main',
                                        cursor: 'help'
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                {drill.notes && drill.notes.length > 0 && (
                                  <Tooltip
                                    title={
                                      <Box sx={{ p: 1, maxWidth: 400 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                          Notes ({drill.notes.length})
                                        </Typography>
                                        {drill.notes.map((note, index) => (
                                          <Box key={index} sx={{ mb: index < drill.notes.length - 1 ? 1.5 : 0, pb: index < drill.notes.length - 1 ? 1.5 : 0, borderBottom: index < drill.notes.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                                            <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
                                              {new Date(note.createdAt).toLocaleString()} by {note.createdBy?.name || note.createdBy?.email || 'Unknown'}
                                            </Typography>
                                            {note.action && (
                                              <Chip label={note.action.replace(/_/g, ' ')} size="small" sx={{ fontSize: '0.65rem', height: 18, my: 0.5 }} />
                                            )}
                                            <Typography variant="body2">
                                              {note.message}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Box>
                                    }
                                    arrow
                                    placement="right"
                                  >
                                    <NoteIcon
                                      sx={{
                                        fontSize: 18,
                                        color: 'info.main',
                                        cursor: 'help'
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                {hasDawAccess && peilSessions[drill._id] > 0 && (
                                  <Tooltip title={`${peilSessions[drill._id]} Peil session${peilSessions[drill._id] > 1 ? 's' : ''}`}>
                                    <Avatar src={peilAvatar} sx={{ width: 18, height: 18, display: 'inline-flex', ml: 0.5, verticalAlign: 'middle' }} />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {drill.score !== null && drill.score !== undefined ? (
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {typeof drill.score === 'number' ? drill.score.toFixed(1) : drill.score}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                                {drill.patternCountInfo?.isMismatch && (
                                  <Tooltip
                                    title={
                                      <Box sx={{ p: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.light', mb: 1 }}>
                                          Pattern Count Mismatch
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                          <strong>Expected:</strong> {drill.patternCountInfo.expected ?? 'N/A'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Detected:</strong> {drill.patternCountInfo.detected ?? 'N/A'}
                                        </Typography>
                                      </Box>
                                    }
                                    arrow
                                    placement="right"
                                  >
                                    <WarningAmberIcon
                                      sx={{
                                        fontSize: 18,
                                        color: 'warning.main',
                                        cursor: 'help'
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {getUploadSourceChip(drill.uploadedFrom)}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                {formatDateTime(drill.uploadDate || drill.createdAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                        onClick={handleExportCSV}
                        disabled={drills.length === 0 || exporting}
                      >
                        {exporting ? 'Exporting...' : `Export CSV (${pagination.total})`}
                      </Button>
                      {isSuperAdmin && selectedDrills.length >= 2 && selectedDrills.length <= 4 && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CompareArrowsIcon />}
                          onClick={handleOpenComparison}
                          color="primary"
                        >
                          Compare ({selectedDrills.length})
                        </Button>
                      )}
                      {isSuperAdmin && selectedDrills.length >= 2 && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Avatar src={peilAvatar} sx={{ width: 20, height: 20 }} />}
                          onClick={() => navigate('/superadmin/cohort', { state: { drillIds: selectedDrills } })}
                          color="secondary"
                        >
                          Investigate Cohort ({selectedDrills.length})
                        </Button>
                      )}
                      {isSuperAdmin && selectedDrills.length >= 1 && hasDawAccess && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LocalOfferIcon />}
                          onClick={() => { setTagDialogMode('selected'); setTagDialogOpen(true); }}
                          color="info"
                        >
                          Tag ({selectedDrills.length})
                        </Button>
                      )}
                      {isSuperAdmin && selectedDrills.length >= 1 && hasDawAccess && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Avatar src={peilAvatar} sx={{ width: 20, height: 20 }} />}
                          onClick={() => setCommandCentreOpen(true)}
                          color="info"
                        >
                          Validate ({selectedDrills.length})
                        </Button>
                      )}
                      {isPlatformEngineering && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={loadingReportIds ? <CircularProgress size={14} color="inherit" /> : <AssessmentIcon />}
                          disabled={loadingReportIds}
                          onClick={async () => {
                            if (selectedDrills.length > 0) {
                              // Use manually selected drills
                              if (selectedDrills.length > 2000) {
                                showToast.error(`Selection exceeds report limit of 2,000 drills (${selectedDrills.length} selected). Please narrow your selection.`);
                                return;
                              }
                              navigate('/superadmin/reports', { state: { drillIds: selectedDrills } });
                            } else if (pagination.total > 0) {
                              // Fetch all filtered drill IDs
                              if (pagination.total > 2000) {
                                showToast.error(`Filtered results exceed report limit of 2,000 drills (${pagination.total.toLocaleString()} found). Please narrow your filters.`);
                                return;
                              }
                              try {
                                setLoadingReportIds(true);
                                const response = await superAdminService.searchDrills({
                                  search: searchTerm, status: statusFilter, gameType: gameTypeFilter,
                                  drillLevel: drillLevelFilter, uploadSource: uploadSourceFilter,
                                  country: countryFilter, clubId: clubFilter, dateFrom, dateTo,
                                  scoreCategory: scoreCategoryFilter, patternCountMismatchOnly,
                                  hasNotesOnly, rejectionRatingFilter: rejectionRatingFilter,
                                  drillIds: tagFilter?.drillIds,
                                  page: 1, limit: 2000,
                                });
                                const ids = (response.data || []).map(d => d._id);
                                if (ids.length === 0) {
                                  showToast.error('No drills found matching current filters');
                                  return;
                                }
                                navigate('/superadmin/reports', { state: { drillIds: ids } });
                              } catch (err) {
                                showToast.error('Failed to fetch filtered drill IDs');
                              } finally {
                                setLoadingReportIds(false);
                              }
                            } else {
                              navigate('/superadmin/reports');
                            }
                          }}
                        >
                          {selectedDrills.length > 0
                            ? `Reports (${selectedDrills.length})`
                            : pagination.total > 0
                              ? `Reports (${pagination.total.toLocaleString()} filtered)`
                              : 'Reports'}
                        </Button>
                      )}
                      {isSuperAdmin && selectedDrills.length === 0 && hasDawAccess && pagination.total > 0 && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LocalOfferIcon />}
                          onClick={() => { setTagDialogMode('allMatching'); setTagDialogOpen(true); }}
                          color="info"
                        >
                          Tag All Matching ({pagination.total})
                        </Button>
                      )}
                      {isSuperAdmin && selectedDrills.length === 1 && (
                        <Typography variant="caption" color="text.secondary">
                          Select 1 more drill to compare or investigate
                        </Typography>
                      )}
                    </Box>
                    <TablePagination
                      component="div"
                      count={pagination.total}
                      page={pagination.page}
                      onPageChange={handlePageChange}
                      rowsPerPage={pagination.limit}
                      onRowsPerPageChange={handleRowsPerPageChange}
                      rowsPerPageOptions={[10, 20, 50, 100]}
                    />
                  </Box>
                </>
              )}
            </>
          )}

          {/* Summary Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : !summary ? (
                <Alert severity="info">No summary data available.</Alert>
              ) : (
                <Grid container spacing={3}>
                  {/* Top Stats Cards */}
                  <Grid item xs={6} sm={4} md={2}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <VideoLibraryIcon color="primary" sx={{ fontSize: 40 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {summary.totalDrills?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Drills
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <ScoreIcon color="success" sx={{ fontSize: 40 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {summary.scores?.avg ? summary.scores.avg.toFixed(1) : '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Average Score
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {summary.scores?.max ? summary.scores.max.toFixed(1) : '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Max Score
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                          {summary.scores?.min ? summary.scores.min.toFixed(1) : '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Min Score
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                          {summary.scores?.count?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Scored Drills
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Upload Source Pie Chart */}
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Drills by Source (App vs Portal)
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={getUploadSourceChartData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getUploadSourceChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Status Pie Chart */}
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Drills by Status
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={getStatusChartData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getStatusChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Score Categories Pie Chart */}
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Drills by Score Range
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={getScoreCategoryChartData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getScoreCategoryChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Country Bar Chart */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Drills by Country (Top 10)
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getCountryChartData()} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={100}
                              tick={({ x, y, payload }) => (
                                <g transform={`translate(${x},${y})`}>
                                  <text x={-5} y={0} dy={4} textAnchor="end" fill="#666" fontSize={12}>
                                    {getCountryFlag(payload.value)} {payload.value}
                                  </text>
                                </g>
                              )}
                            />
                            <RechartsTooltip />
                            <Bar dataKey="value" fill="#4caf50" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Club Bar Chart */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Drills by Club/Academy (Top 10)
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getClubChartData()} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} />
                            <RechartsTooltip
                              formatter={(value, name, props) => [value, props.payload.fullName]}
                            />
                            <Bar dataKey="value" fill="#ff9800" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* Drill Types Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              {drillTypeStats && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Total: {drillTypeStats.totalDrills?.toLocaleString() || 0} drills
                </Typography>
              )}

              {loadingDrillTypeStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : !drillTypeStats ? (
                <Alert severity="info">No drill type statistics available.</Alert>
              ) : (
                <Grid container spacing={3}>
                  {/* Overall Drill Types Bar Chart */}
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Uploaded Drill Types (All Statuses)
                        </Typography>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={drillTypeStats.overallDrillTypes || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="drillTypeLabel"
                              type="category"
                              width={180}
                              tick={{ fontSize: 12 }}
                            />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill="#2196f3">
                              {(drillTypeStats.overallDrillTypes || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* PROCESSED Drills Bar Chart */}
                  {drillTypeStats.byStatus?.PROCESSED && drillTypeStats.byStatus.PROCESSED.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                            PROCESSED Drills ({drillTypeStats.statusTotals?.PROCESSED?.toLocaleString() || 0})
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={drillTypeStats.byStatus.PROCESSED} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                dataKey="drillTypeLabel"
                                type="category"
                                width={150}
                                tick={{ fontSize: 11 }}
                              />
                              <RechartsTooltip />
                              <Bar dataKey="count" fill="#4caf50">
                                {drillTypeStats.byStatus.PROCESSED.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* REJECTED Drills Bar Chart */}
                  {drillTypeStats.byStatus?.REJECTED && drillTypeStats.byStatus.REJECTED.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                            REJECTED Drills ({drillTypeStats.statusTotals?.REJECTED?.toLocaleString() || 0})
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={drillTypeStats.byStatus.REJECTED} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                dataKey="drillTypeLabel"
                                type="category"
                                width={150}
                                tick={{ fontSize: 11 }}
                              />
                              <RechartsTooltip />
                              <Bar dataKey="count" fill="#f44336">
                                {drillTypeStats.byStatus.REJECTED.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* UPLOADED Drills Bar Chart */}
                  {drillTypeStats.byStatus?.UPLOADED && drillTypeStats.byStatus.UPLOADED.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'info.main' }}>
                            Queued for Processing ({drillTypeStats.statusTotals?.UPLOADED?.toLocaleString() || 0})
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={drillTypeStats.byStatus.UPLOADED} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                dataKey="drillTypeLabel"
                                type="category"
                                width={150}
                                tick={{ fontSize: 11 }}
                              />
                              <RechartsTooltip />
                              <Bar dataKey="count" fill="#2196f3">
                                {drillTypeStats.byStatus.UPLOADED.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* FAILED Drills Bar Chart */}
                  {drillTypeStats.byStatus?.FAILED && drillTypeStats.byStatus.FAILED.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.dark' }}>
                            FAILED Drills ({drillTypeStats.statusTotals?.FAILED?.toLocaleString() || 0})
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={drillTypeStats.byStatus.FAILED} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                dataKey="drillTypeLabel"
                                type="category"
                                width={150}
                                tick={{ fontSize: 11 }}
                              />
                              <RechartsTooltip />
                              <Bar dataKey="count" fill="#d32f2f">
                                {drillTypeStats.byStatus.FAILED.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* PENDING_MANUAL_ANNOTATION Drills Bar Chart */}
                  {drillTypeStats.byStatus?.PENDING_MANUAL_ANNOTATION && drillTypeStats.byStatus.PENDING_MANUAL_ANNOTATION.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'secondary.main' }}>
                            PENDING ANNOTATION Drills ({drillTypeStats.statusTotals?.PENDING_MANUAL_ANNOTATION?.toLocaleString() || 0})
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={drillTypeStats.byStatus.PENDING_MANUAL_ANNOTATION} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                dataKey="drillTypeLabel"
                                type="category"
                                width={150}
                                tick={{ fontSize: 11 }}
                              />
                              <RechartsTooltip />
                              <Bar dataKey="count" fill="#9c27b0">
                                {drillTypeStats.byStatus.PENDING_MANUAL_ANNOTATION.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* PROCESSING Drills Bar Chart */}
                  {drillTypeStats.byStatus?.PROCESSING && drillTypeStats.byStatus.PROCESSING.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'warning.main' }}>
                            PROCESSING Drills ({drillTypeStats.statusTotals?.PROCESSING?.toLocaleString() || 0})
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={drillTypeStats.byStatus.PROCESSING} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                dataKey="drillTypeLabel"
                                type="category"
                                width={150}
                                tick={{ fontSize: 11 }}
                              />
                              <RechartsTooltip />
                              <Bar dataKey="count" fill="#ff9800">
                                {drillTypeStats.byStatus.PROCESSING.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          )}
        </Paper>
      </Container>

      {/* Comparison Wizard Drawer */}
      {isSuperAdmin && (
        <ComparisonWizardDrawer
          open={comparisonDrawerOpen}
          onClose={handleCloseComparison}
          drillIds={selectedDrills}
          drillData={selectedDrills.map((id) => {
            const d = drills.find((dr) => dr._id === id);
            return d ? { drillId: id, date: d.uploadDate || d.createdAt } : { drillId: id };
          })}
        />
      )}

      {/* Peil Command Centre */}
      {hasDawAccess && (
        <>
          <Fab
            size="medium"
            color="primary"
            onClick={() => setCommandCentreOpen(!commandCentreOpen)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: commandCentreOpen ? COMMAND_CENTRE_WIDTH + 24 : 24,
              transition: 'right 0.3s',
              zIndex: 1200,
            }}
          >
            <SmartToyIcon />
          </Fab>
          <CommandCentre
            open={commandCentreOpen}
            onClose={() => setCommandCentreOpen(false)}
            selectedDrills={selectedDrills}
            currentFilters={{
              searchTerm, statusFilter, gameTypeFilter, drillLevelFilter,
              uploadSourceFilter, countryFilter, clubFilter, dateFrom, dateTo,
              scoreCategoryFilter,
            }}
            totalFilteredCount={pagination.total}
            onTagFilter={handleTagFilter}
            onRefreshDrills={loadDrills}
          />
        </>
      )}

      {/* Tag Dialog */}
      {hasDawAccess && (
        <TagDialog
          open={tagDialogOpen}
          onClose={() => setTagDialogOpen(false)}
          drillIds={tagDialogMode === 'selected' ? selectedDrills : undefined}
          drillCount={tagDialogMode === 'allMatching' ? pagination.total : undefined}
          onGetDrillIds={tagDialogMode === 'allMatching' ? async () => {
            const response = await superAdminService.searchDrills({
              search: searchTerm,
              status: statusFilter,
              gameType: gameTypeFilter,
              drillLevel: drillLevelFilter,
              uploadSource: uploadSourceFilter,
              country: countryFilter,
              clubId: clubFilter,
              dateFrom,
              dateTo,
              scoreCategory: scoreCategoryFilter,
              patternCountMismatchOnly,
              hasNotesOnly,
              rejectionRatingFilter,
              drillIds: tagFilter?.drillIds,
              page: 1,
              limit: pagination.total,
            });
            return response.success ? response.data.map(d => d._id) : [];
          } : undefined}
          onSuccess={() => { loadAvailableTags(); loadDrills(); }}
        />
      )}
    </AppLayout>
  );
};

export default DrillsManager;
