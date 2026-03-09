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
  Grid,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadIcon from '@mui/icons-material/Upload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable } from '../../components/skeletons';
import ConfirmDialog from '../../components/ConfirmDialog';
import RequireRole from '../../components/RequireRole';
import ProfilePictureWithHover from '../../components/ProfilePictureWithHover';
import clubService from '../../api/clubService';
import playerService from '../../api/playerService';
import ManagePlayerTeams from '../../components/club/ManagePlayerTeams';
import UploadDrillDialog from '../../components/club/UploadDrillDialog';
import EditPlayerDialog from '../../components/club/EditPlayerDialog';
import showToast from '../../utils/toast';
import { getComparator, stableSort, createSortHandler } from '../../utils/tableSorting';

const ClubPlayers = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [manageTeamsOpen, setManageTeamsOpen] = useState(false);
  const [uploadDrillOpen, setUploadDrillOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'gallery'

  // Sorting state
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // Filter state
  const [teamFilter, setTeamFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onboardingFilter, setOnboardingFilter] = useState('all');
  const [lastActiveDateFrom, setLastActiveDateFrom] = useState('');
  const [lastActiveDateTo, setLastActiveDateTo] = useState('');
  const [dateCreatedFrom, setDateCreatedFrom] = useState('');
  const [dateCreatedTo, setDateCreatedTo] = useState('');
  const [birthYearFilter, setBirthYearFilter] = useState('all');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debug logging
  console.log('ClubPlayers state:', { uploadDrillOpen, selectedPlayer });

  // Debounce search term to avoid losing focus on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadPlayers();
    loadTeams();
  }, [clubId, debouncedSearchTerm]);

  const loadTeams = async () => {
    try {
      const response = await clubService.getTeams(clubId);
      setTeams(response.data || []);
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  };

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await clubService.getPlayers(clubId, { search: debouncedSearchTerm });

      // Transform API response
      const transformedPlayers = response.data.map(player => {
        // Extract birth year from birthday if available
        let birthYear = null;
        if (player.birthday) {
          birthYear = new Date(player.birthday).getFullYear();
        }
        return {
          id: player.id,
          name: player.name,
          email: player.email,
          profilePicture: player.profilePicture || null,
          teams: player.teams?.map(t => t.teamName) || [],
          position: player.position || '-',
          jerseyNumber: player.jerseyNumber || '-',
          status: player.status || 'Active',
          accountStatus: player.accountStatus || 'active',
          lastActive: player.lastActive || new Date().toISOString().split('T')[0],
          drillCount: player.drillCount || 0,
          birthYear: birthYear,
        };
      });

      setPlayers(transformedPlayers);
      setError(null);
    } catch (err) {
      console.error('Error loading players:', err);
      setError(err.response?.data?.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  // Get unique positions for filter dropdown
  const uniquePositions = [...new Set(players.map(p => p.position).filter(p => p && p !== '-'))].sort();

  // Get unique birth years for filter dropdown (sorted descending - newest first)
  const uniqueBirthYears = [...new Set(players.map(p => p.birthYear).filter(y => y !== null))].sort((a, b) => b - a);

  const handleRequestSort = createSortHandler(orderBy, order, setOrderBy, setOrder, setPage);

  // Client-side filtering
  const filteredPlayers = players.filter(player => {
    // Team filter
    if (teamFilter !== 'all') {
      if (!player.teams.includes(teamFilter)) return false;
    }

    // Position filter
    if (positionFilter !== 'all') {
      if (player.position !== positionFilter) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (player.status !== statusFilter) return false;
    }

    // Onboarding filter
    if (onboardingFilter !== 'all') {
      if (player.accountStatus !== onboardingFilter) return false;
    }

    // Birth year filter
    if (birthYearFilter !== 'all') {
      if (player.birthYear !== parseInt(birthYearFilter, 10)) return false;
    }

    // Last Active date range filter
    if (lastActiveDateFrom) {
      const fromDate = new Date(lastActiveDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const playerDate = new Date(player.lastActive);
      playerDate.setHours(0, 0, 0, 0);
      if (playerDate < fromDate) return false;
    }

    if (lastActiveDateTo) {
      const toDate = new Date(lastActiveDateTo);
      toDate.setHours(23, 59, 59, 999);
      const playerDate = new Date(player.lastActive);
      if (playerDate > toDate) return false;
    }

    // Date created filter (if we have createdAt field)
    if (dateCreatedFrom && player.createdAt) {
      const fromDate = new Date(dateCreatedFrom);
      fromDate.setHours(0, 0, 0, 0);
      const playerDate = new Date(player.createdAt);
      playerDate.setHours(0, 0, 0, 0);
      if (playerDate < fromDate) return false;
    }

    if (dateCreatedTo && player.createdAt) {
      const toDate = new Date(dateCreatedTo);
      toDate.setHours(23, 59, 59, 999);
      const playerDate = new Date(player.createdAt);
      if (playerDate > toDate) return false;
    }

    return true;
  });

  // Sort filtered players
  const sortedPlayers = React.useMemo(() => {
    // Determine if the field is numeric
    const numericFields = ['jerseyNumber', 'drillCount'];
    const isNumeric = numericFields.includes(orderBy);
    return stableSort(filteredPlayers, getComparator(order, orderBy, isNumeric));
  }, [filteredPlayers, order, orderBy]);

  // Paginate sorted players
  const paginatedPlayers = sortedPlayers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Pagination handlers
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, player) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlayer(player);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlayer(null);
  };

  const handleViewProfile = () => {
    navigate(`/players/${selectedPlayer.id}`);
    handleMenuClose();
  };

  const handleManageTeams = () => {
    setManageTeamsOpen(true);
    setAnchorEl(null); // Close menu but keep selectedPlayer
  };

  const handleEditPlayer = () => {
    setEditDialogOpen(true);
    setAnchorEl(null); // Close menu but keep selectedPlayer
  };

  const handleSavePlayer = async (updates) => {
    try {
      setEditLoading(true);
      await clubService.updatePlayer(clubId, selectedPlayer.id, updates);
      await loadPlayers();
      setEditDialogOpen(false);
      setSelectedPlayer(null);
      showToast.success('Player updated successfully!');
    } catch (err) {
      console.error('Error updating player:', err);
      showToast.error(err.response?.data?.message || 'Failed to update player');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUploadDrill = () => {
    setUploadDrillOpen(true);
    setAnchorEl(null); // Close menu but keep selectedPlayer
  };

  const handleUploadDrillSubmit = async (formData) => {
    try {
      await playerService.uploadDrillForPlayer(selectedPlayer.id, formData);
      setUploadDrillOpen(false);
      setSelectedPlayer(null);
      showToast.success('Drill uploaded successfully!');
    } catch (err) {
      console.error('Error uploading drill:', err);
      showToast.error(err.response?.data?.message || 'Failed to upload drill');
      throw err;
    }
  };

  const handleRemovePlayer = async () => {
    // Note: Club-level player removal requires removing from all teams
    // This functionality will be implemented to handle multi-team scenarios
    if (window.confirm(`Remove ${selectedPlayer.name} from all teams in this club? This action cannot be undone.`)) {
      try {
        alert('Bulk player removal coming soon! For now, please remove players individually from each team using "Manage Teams".');
        // Future implementation:
        // await clubService.removePlayer(clubId, selectedPlayer.id);
        // await loadPlayers();
      } catch (err) {
        console.error('Error removing player:', err);
        alert(err.response?.data?.message || 'Failed to remove player');
      }
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Breadcrumbs />
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>Players</Typography>
          </Box>
          <SkeletonTable rows={10} columns={10} />
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
              Players
            </Typography>
            <Typography variant="body1" color="text.secondary">
              All players across club teams {players.length > 0 && `(${filteredPlayers.length} total)`}
            </Typography>
          </Box>

          <RequireRole roles={['club_manager', 'head_coach']}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => navigate(`/clubs/${clubId}/players/bulk-import`)}
              >
                Bulk Player Import
              </Button>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={() => navigate(`/clubs/${clubId}/players/bulk-profile-pic-upload`)}
              >
                Bulk Profile Pic Import
              </Button>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate(`/clubs/${clubId}/invitations`)}
              >
                Invite Player
              </Button>
            </Box>
          </RequireRole>
        </Box>

        {/* Search and View Toggle */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            sx={{ flexGrow: 1 }}
            placeholder="Search players by name or email..."
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
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => {
              if (newMode !== null) {
                setViewMode(newMode);
              }
            }}
            size="small"
          >
            <ToggleButton value="list">
              <Tooltip title="List View">
                <ViewListIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="grid">
              <Tooltip title="Grid View">
                <GridViewIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="gallery">
              <Tooltip title="Gallery View">
                <ViewModuleIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Filters */}
        {players.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Filters
            </Typography>
            <Grid container spacing={2}>
              {/* First Row: Team, Position, Status, Onboarding */}
              {/* Team Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Team</InputLabel>
                  <Select
                    value={teamFilter}
                    label="Team"
                    onChange={(e) => setTeamFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Teams</MenuItem>
                    {teams.map((team) => (
                      <MenuItem key={team._id} value={team.name}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Position Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={positionFilter}
                    label="Position"
                    onChange={(e) => setPositionFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Positions</MenuItem>
                    {uniquePositions.map((position) => (
                      <MenuItem key={position} value={position}>
                        {position}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Onboarding Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Onboarding</InputLabel>
                  <Select
                    value={onboardingFilter}
                    label="Onboarding"
                    onChange={(e) => setOnboardingFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="provisioned">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="active">Complete</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Birth Year Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Birth Year</InputLabel>
                  <Select
                    value={birthYearFilter}
                    label="Birth Year"
                    onChange={(e) => setBirthYearFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Years</MenuItem>
                    {uniqueBirthYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Second Row: Date Filters */}
              {/* Last Active From */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Last Active From"
                  type="date"
                  value={lastActiveDateFrom}
                  onChange={(e) => setLastActiveDateFrom(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Last Active To */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Last Active To"
                  type="date"
                  value={lastActiveDateTo}
                  onChange={(e) => setLastActiveDateTo(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Date Created From */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date Created From"
                  type="date"
                  value={dateCreatedFrom}
                  onChange={(e) => setDateCreatedFrom(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Date Created To */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date Created To"
                  type="date"
                  value={dateCreatedTo}
                  onChange={(e) => setDateCreatedTo(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Clear Filters Button */}
              <Grid item xs={12}>
                <Button
                  size="small"
                  onClick={() => {
                    setTeamFilter('all');
                    setPositionFilter('all');
                    setStatusFilter('all');
                    setOnboardingFilter('all');
                    setBirthYearFilter('all');
                    setLastActiveDateFrom('');
                    setLastActiveDateTo('');
                    setDateCreatedFrom('');
                    setDateCreatedTo('');
                  }}
                >
                  Clear All Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Content */}
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredPlayers.length === 0 ? (
          <EmptyState
            icon={PersonIcon}
            title={searchTerm ? 'No players found' : 'No players yet'}
            description={
              searchTerm
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by inviting players to your club.'
            }
            actionLabel={!searchTerm ? 'Invite Player' : undefined}
            onAction={!searchTerm ? () => navigate(`/clubs/${clubId}/invitations`) : undefined}
          />
        ) : viewMode === 'list' ? (
          /* List View */
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        Player
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'email'}
                        direction={orderBy === 'email' ? order : 'asc'}
                        onClick={() => handleRequestSort('email')}
                      >
                        Email
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Teams</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'position'}
                        direction={orderBy === 'position' ? order : 'asc'}
                        onClick={() => handleRequestSort('position')}
                      >
                        Position
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'jerseyNumber'}
                        direction={orderBy === 'jerseyNumber' ? order : 'asc'}
                        onClick={() => handleRequestSort('jerseyNumber')}
                      >
                        Jersey #
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'drillCount'}
                        direction={orderBy === 'drillCount' ? order : 'asc'}
                        onClick={() => handleRequestSort('drillCount')}
                      >
                        Drills
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'accountStatus'}
                        direction={orderBy === 'accountStatus' ? order : 'asc'}
                        onClick={() => handleRequestSort('accountStatus')}
                      >
                        Onboarding
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleRequestSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'lastActive'}
                        direction={orderBy === 'lastActive' ? order : 'asc'}
                        onClick={() => handleRequestSort('lastActive')}
                      >
                        Last Active
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPlayers.map((player) => (
                    <TableRow
                      key={player.id}
                      hover
                      onClick={() => navigate(`/players/${player.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <ProfilePictureWithHover
                            src={player.profilePicture}
                            alt={player.name}
                            size={40}
                            zoomSize={200}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {player.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{player.email}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {player.teams.map((team, idx) => (
                            <Chip key={idx} label={team} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell>{player.jerseyNumber}</TableCell>
                      <TableCell>{player.drillCount}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            player.accountStatus === 'provisioned' ? 'Pending' :
                            player.accountStatus === 'partial' ? 'Partial' :
                            'Complete'
                          }
                          size="small"
                          color={
                            player.accountStatus === 'provisioned' ? 'warning' :
                            player.accountStatus === 'partial' ? 'info' :
                            'success'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={player.status}
                          size="small"
                          color={player.status === 'Active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(player.lastActive).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleMenuOpen(e, player);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={sortedPlayers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </TableContainer>
          </Paper>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <>
            <Grid container spacing={3}>
              {paginatedPlayers.map((player) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={player.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar
                          src={player.profilePicture}
                          alt={player.name}
                          sx={{ width: 56, height: 56 }}
                        >
                          {player.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            {player.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {player.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                        {player.teams.slice(0, 2).map((team, idx) => (
                          <Chip key={idx} label={team} size="small" variant="outlined" />
                        ))}
                        {player.teams.length > 2 && (
                          <Chip label={`+${player.teams.length - 2}`} size="small" />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        {player.position && player.position !== '-' && (
                          <Chip label={player.position} size="small" color="primary" variant="outlined" />
                        )}
                        {player.jerseyNumber && player.jerseyNumber !== '-' && (
                          <Chip label={`#${player.jerseyNumber}`} size="small" variant="outlined" />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {player.drillCount} drills
                        </Typography>
                        <Chip
                          label={player.status}
                          size="small"
                          color={player.status === 'Active' ? 'success' : 'default'}
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, player);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[8, 16, 32, 64]}
                component="div"
                count={sortedPlayers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </Box>
          </>
        ) : (
          /* Gallery View */
          <>
            <Grid container spacing={2}>
              {paginatedPlayers.map((player) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={player.id}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <Avatar
                      src={player.profilePicture}
                      alt={player.name}
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 1,
                        fontSize: '2rem',
                      }}
                    >
                      {player.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                      {player.name}
                    </Typography>
                    {player.position && player.position !== '-' && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {player.position}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, player);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[12, 24, 48, 96]}
                component="div"
                count={sortedPlayers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </Box>
          </>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewProfile}>View Profile</MenuItem>
          <MenuItem onClick={handleUploadDrill}>
            <UploadFileIcon fontSize="small" sx={{ mr: 1 }} />
            Upload Drill
          </MenuItem>
          <RequireRole roles={['club_manager', 'head_coach']}>
            <MenuItem onClick={handleManageTeams}>Manage Teams</MenuItem>
            <MenuItem onClick={handleEditPlayer}>Edit Details</MenuItem>
            <MenuItem onClick={handleRemovePlayer} sx={{ color: 'error.main' }}>
              Remove from Club
            </MenuItem>
          </RequireRole>
        </Menu>

        {/* Manage Player Teams Dialog */}
        <ManagePlayerTeams
          open={manageTeamsOpen}
          onClose={() => {
            setManageTeamsOpen(false);
            setSelectedPlayer(null);
          }}
          clubId={clubId}
          player={selectedPlayer}
          onUpdate={loadPlayers}
        />

        {/* Upload Drill Dialog */}
        <UploadDrillDialog
          open={uploadDrillOpen}
          onClose={() => {
            setUploadDrillOpen(false);
            setSelectedPlayer(null);
          }}
          player={selectedPlayer}
          onSubmit={handleUploadDrillSubmit}
        />

        {/* Edit Player Dialog */}
        <EditPlayerDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedPlayer(null);
          }}
          player={selectedPlayer}
          onSave={handleSavePlayer}
          loading={editLoading}
        />

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          severity={confirmDialog.severity}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ open: false })}
        />
      </Container>
    </AppLayout>
  );
};

export default ClubPlayers;
