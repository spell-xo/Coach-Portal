import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import clubService from '../../api/clubService';
import teamService from '../../api/teamService';

const teamColours = [
  { value: "red", label: "Red", hex: "#EF4444" },
  { value: "blue", label: "Blue", hex: "#3B82F6" },
  { value: "green", label: "Green", hex: "#22C55E" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "orange", label: "Orange", hex: "#F97316" },
  { value: "purple", label: "Purple", hex: "#A855F7" },
  { value: "pink", label: "Pink", hex: "#EC4899" },
  { value: "cyan", label: "Cyan", hex: "#06B6D4" },
  { value: "grey", label: "Grey", hex: "#6B7280" },
  { value: "black", label: "Black", hex: "#1F2937" },
];

const getColourHex = (colourValue) => {
  const colour = teamColours.find(c => c.value === colourValue);
  return colour ? colour.hex : null;
};

const ClubTeams = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [colourFilter, setColourFilter] = useState('');

  useEffect(() => {
    loadTeams();
  }, [clubId]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await clubService.getTeams(clubId);

      // Transform API response
      const transformedTeams = response.data.map(team => ({
        id: team._id,
        name: team.name,
        ageGroup: team.ageGroup,
        description: team.description || '',
        colour: team.colour || null,
        playerCount: team.playerCount || 0,
        coachCount: team.coachCount || 0,
        status: team.status || 'Active',
        createdAt: team.createdDate || team.createdAt || new Date().toISOString(),
      }));

      setTeams(transformedTeams);
      setError(null);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;

    try {
      setDeleting(true);
      await teamService.deleteTeam(teamToDelete.id);
      setTeams(teams.filter(t => t.id !== teamToDelete.id));
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
      setError(null);
    } catch (err) {
      console.error('Error deleting team:', err);
      setError(err.response?.data?.message || 'Failed to delete team');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColour = !colourFilter || team.colour === colourFilter;
    return matchesSearch && matchesColour;
  });

  const TeamCard = ({ team }) => (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: team.colour ? `4px solid ${getColourHex(team.colour)}` : 'none',
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {team.colour && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: getColourHex(team.colour),
                  flexShrink: 0,
                }}
              />
            )}
            <Typography variant="h6" component="div">
              {team.name}
            </Typography>
          </Box>
          <Chip
            label={team.status}
            color={team.status === 'Active' ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          {team.description}
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {team.ageGroup && (
            <Chip
              label={team.ageGroup}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          <Chip
            icon={<GroupIcon />}
            label={`${team.playerCount} players`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${team.coachCount} coaches`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
          Created: {new Date(team.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button size="small" onClick={() => navigate(`/clubs/${clubId}/teams/${team.id}`)}>
          View Details
        </Button>
        <RequireRole roles={['head_coach', 'club_manager']}>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(team)}
            aria-label="delete team"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </RequireRole>
      </CardActions>
    </Card>
  );

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Teams
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your club's teams and rosters
            </Typography>
          </Box>

          <RequireRole roles={['head_coach', 'club_manager']}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/clubs/${clubId}/teams/create`)}
            >
              Create Team
            </Button>
          </RequireRole>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            sx={{ flexGrow: 1, minWidth: 200 }}
            placeholder="Search teams..."
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Colour:</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box
                onClick={() => setColourFilter('')}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: !colourFilter ? '2px solid #000' : '1px solid #ccc',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
                title="All colours"
              >
                All
              </Box>
              {teamColours.map((colour) => (
                <Box
                  key={colour.value}
                  onClick={() => setColourFilter(colourFilter === colour.value ? '' : colour.value)}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: colour.hex,
                    cursor: 'pointer',
                    border: colourFilter === colour.value ? '2px solid #000' : '1px solid transparent',
                    '&:hover': { transform: 'scale(1.1)' },
                    transition: 'all 0.2s',
                  }}
                  title={colour.label}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredTeams.length === 0 ? (
          <Alert severity="info">
            {searchTerm ? 'No teams found matching your search.' : 'No teams yet. Create your first team to get started.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredTeams.map((team) => (
              <Grid item xs={12} sm={6} md={4} key={team.id}>
                <TeamCard team={team} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
        >
          <DialogTitle id="delete-dialog-title">
            Delete Team
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
              All players will be removed from the roster.
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
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default ClubTeams;
