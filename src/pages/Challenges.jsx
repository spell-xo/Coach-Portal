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
  CardActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AppLayout from '../components/AppLayout';
import challengeService from '../api/challengeService';
import showToast from '../utils/toast';

const STATUS_COLORS = {
  pending: '#F59E0B',    // Orange
  active: '#10B981',     // Green
  completed: '#6366F1',  // Purple
  cancelled: '#6B7280',  // Gray
};

const CHALLENGE_TYPE_LABELS = {
  '1v1': '1v1',
  'best-of-3': 'Best of 3',
  'group': 'Group',
  'weekly': 'Weekly',
};

const Challenges = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'completed'
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  useEffect(() => {
    loadChallenges();
  }, [activeTab]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const response = await challengeService.getUserChallenges(activeTab, 1, 50);

      if (response.success) {
        setChallenges(response.data.challenges || []);
        setPagination(response.data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
        setError(null);
      }
    } catch (err) {
      console.error('Error loading challenges:', err);
      setError(err.response?.data?.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateChallenge = () => {
    navigate('/challenges/create');
  };

  const handleViewChallenge = (challengeId) => {
    navigate(`/challenges/${challengeId}`);
  };

  const handleViewWeekly = () => {
    navigate('/challenges/weekly');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const ChallengeCard = ({ challenge }) => {
    const drillCount = challenge.version === 'v2'
      ? challenge.challengeDrills?.length || 0
      : 1;

    const participantCount = challenge.participants?.length || 0;

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
        onClick={() => handleViewChallenge(challenge._id)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Chip
              label={CHALLENGE_TYPE_LABELS[challenge.challengeType] || challenge.challengeType}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={challenge.status}
              size="small"
              sx={{
                backgroundColor: STATUS_COLORS[challenge.status],
                color: 'white',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Box>

          <Typography variant="h6" component="h3" gutterBottom>
            {challenge.title}
          </Typography>

          {challenge.description && (
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
              {challenge.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GroupIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {drillCount} {drillCount === 1 ? 'drill' : 'drills'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Ends {formatDate(challenge.endDate)}
            </Typography>
          </Box>

          {challenge.winner && challenge.status === 'completed' && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmojiEventsIcon fontSize="small" sx={{ color: '#F59E0B' }} />
              <Typography variant="body2" fontWeight={600}>
                Winner: {challenge.winner.name || 'Unknown'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Challenges
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EmojiEventsIcon />}
              onClick={handleViewWeekly}
            >
              Weekly Challenge
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateChallenge}
            >
              Create Challenge
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Active" value="active" />
            <Tab label="Pending" value="pending" />
            <Tab label="Completed" value="completed" />
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
        ) : challenges.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {activeTab} challenges
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {activeTab === 'active' && 'Create a new challenge to get started'}
              {activeTab === 'pending' && 'You have no pending challenge invitations'}
              {activeTab === 'completed' && 'Complete challenges will appear here'}
            </Typography>
            {activeTab === 'active' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateChallenge}
              >
                Create Challenge
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {challenges.map((challenge) => (
              <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                <ChallengeCard challenge={challenge} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </AppLayout>
  );
};

export default Challenges;
