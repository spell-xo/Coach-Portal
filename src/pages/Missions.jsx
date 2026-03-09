import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import AppLayout from '../components/AppLayout';
import missionService from '../api/missionService';
import showToast from '../utils/toast';

const STATUS_COLORS = {
  DRAFT: '#F59E0B',     // Orange
  SENT: '#10B981',      // Green
  ARCHIVED: '#6B7280',  // Gray
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ARCHIVED: 'Archived',
};

const Missions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missions, setMissions] = useState([]);
  const [activeTab, setActiveTab] = useState('DRAFT');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMissions();
  }, [activeTab]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const response = await missionService.getMissions(activeTab);

      if (response.success) {
        setMissions(response.data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading missions:', err);
      setError(err.response?.data?.message || 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateMission = () => {
    navigate('/missions/create');
  };

  const handleViewMission = (missionId) => {
    navigate(`/missions/${missionId}`);
  };

  const handleMenuOpen = (event, mission) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedMission(mission);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMission(null);
  };

  const handleArchiveMission = async () => {
    if (!selectedMission) return;

    try {
      setActionLoading(true);
      await missionService.archiveMission(selectedMission._id);
      showToast.success('Mission archived successfully');
      handleMenuClose();
      loadMissions();
    } catch (err) {
      console.error('Error archiving mission:', err);
      showToast.error(err.response?.data?.message || 'Failed to archive mission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMission = async () => {
    if (!selectedMission) return;

    try {
      setActionLoading(true);
      await missionService.deleteMission(selectedMission._id);
      showToast.success('Mission deleted successfully');
      setDeleteDialogOpen(false);
      handleMenuClose();
      loadMissions();
    } catch (err) {
      console.error('Error deleting mission:', err);
      showToast.error(err.response?.data?.message || 'Failed to delete mission');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const MissionCard = ({ mission }) => {
    const recipientCount = mission.totalRecipients || 0;

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 6,
          },
        }}
        onClick={() => handleViewMission(mission._id)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Chip
              label={STATUS_LABELS[mission.status]}
              size="small"
              sx={{
                backgroundColor: STATUS_COLORS[mission.status],
                color: 'white',
                fontWeight: 600,
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, mission)}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom>
            {mission.title}
          </Typography>

          {mission.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {mission.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GroupIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}
              </Typography>
            </Box>
            {mission.createdBy && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Created by {mission.createdBy.name || mission.createdBy.email || 'Unknown'} on {formatDate(mission.createdAt)}
                </Typography>
              </Box>
            )}
          </Box>

          {mission.dueDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Due {formatDate(mission.dueDate)}
              </Typography>
            </Box>
          )}

          {mission.status === 'SENT' && mission.stats && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {mission.stats.totalRead || 0} of {mission.stats.totalSent || 0} read
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Drills: {mission.stats.totalDrillsCompleted || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Exercises: {mission.stats.totalExercisesAcked || 0}
                </Typography>
              </Box>
            </Box>
          )}

          {mission.sentAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Sent {formatDate(mission.sentAt)}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Performance Missions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateMission}
          >
            Create Mission
          </Button>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Drafts" value="DRAFT" />
            <Tab label="Sent" value="SENT" />
            <Tab label="Archived" value="ARCHIVED" />
          </Tabs>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : missions.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {STATUS_LABELS[activeTab].toLowerCase()} missions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {activeTab === 'DRAFT' && 'Create a new mission to send personalized training content to your players'}
              {activeTab === 'SENT' && 'Missions you send will appear here'}
              {activeTab === 'ARCHIVED' && 'Archived missions will appear here'}
            </Typography>
            {activeTab === 'DRAFT' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateMission}
              >
                Create Mission
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {missions.map((mission) => (
              <Grid item xs={12} sm={6} md={4} key={mission._id}>
                <MissionCard mission={mission} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          {selectedMission?.status === 'DRAFT' && (
            <MenuItem onClick={() => { handleMenuClose(); handleViewMission(selectedMission._id); }}>
              <SendIcon fontSize="small" sx={{ mr: 1 }} />
              Edit & Send
            </MenuItem>
          )}
          {selectedMission?.status === 'SENT' && (
            <MenuItem onClick={handleArchiveMission} disabled={actionLoading}>
              <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
              Archive
            </MenuItem>
          )}
          {selectedMission?.status === 'DRAFT' && (
            <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Mission</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete "{selectedMission?.title}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteMission}
              color="error"
              disabled={actionLoading}
            >
              {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppLayout>
  );
};

export default Missions;
