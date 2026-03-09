import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PersonIcon from '@mui/icons-material/Person';
import playerService from '../api/playerService';
import AppLayout from '../components/AppLayout';
import { getComparator, stableSort, createSortHandler } from '../utils/tableSorting';

const AllPlayers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  // Restore state when coming back from player profile
  useEffect(() => {
    if (location.state?.searchTerm !== undefined) {
      setSearchTerm(location.state.searchTerm);
      setPage(location.state.page || 0);
      setRowsPerPage(location.state.rowsPerPage || 25);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [searchTerm, page, rowsPerPage]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await playerService.searchPlayers({
        search: searchTerm,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });

      if (response.success) {
        setPlayers(response.data);
        setTotalCount(response.meta?.total || response.data.length);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewPlayer = (playerId) => {
    navigate(`/players/${playerId}`, {
      state: {
        from: '/players',
        searchTerm,
        page,
        rowsPerPage,
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'injured':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleRequestSort = createSortHandler(orderBy, order, setOrderBy, setOrder, setPage);

  // Sort players client-side
  const sortedPlayers = React.useMemo(() => {
    return stableSort(players, getComparator(order, orderBy));
  }, [players, order, orderBy]);

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            All Players
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View all players across your teams
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by player name, email..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end" size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : players.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No players found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Players will appear here once they join your teams'}
              </Typography>
            </Box>
          ) : (
            <>
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
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'teamName'}
                          direction={orderBy === 'teamName' ? order : 'asc'}
                          onClick={() => handleRequestSort('teamName')}
                        >
                          Team
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
                          active={orderBy === 'position'}
                          direction={orderBy === 'position' ? order : 'asc'}
                          onClick={() => handleRequestSort('position')}
                        >
                          Position
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
                          active={orderBy === 'joinedAt'}
                          direction={orderBy === 'joinedAt' ? order : 'asc'}
                          onClick={() => handleRequestSort('joinedAt')}
                        >
                          Joined
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedPlayers.map((player) => (
                      <TableRow
                        key={player.playerId}
                        hover
                        onClick={() => handleViewPlayer(player.playerId)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={player.profilePicture}
                              alt={player.name}
                              sx={{ width: 40, height: 40 }}
                            >
                              {player.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {player.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {player.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{player.teamName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {player.jerseyNumber || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {player.position || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={player.status}
                            size="small"
                            color={getStatusColor(player.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(player.joinedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Container>
    </AppLayout>
  );
};

export default AllPlayers;
