import React from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AppLayout from '../components/AppLayout';
import { selectActiveContext, selectIsClubContext } from '../store/authSlice';

const PlayerChallenges = () => {
  const activeContext = useSelector(selectActiveContext);
  const isClubContext = useSelector(selectIsClubContext);

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isClubContext && activeContext?.clubName
            ? `${activeContext.clubName} - My Challenges`
            : 'My Challenges'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isClubContext && activeContext?.clubName
            ? `Compete in challenges and earn rewards at ${activeContext.clubName}`
            : 'Compete in challenges and earn rewards'}
        </Typography>

        <Paper
          sx={{
            p: 8,
            textAlign: 'center',
            backgroundColor: 'background.default',
            border: '2px dashed',
            borderColor: 'divider'
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Challenges Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This feature is currently under development. You'll soon be able to participate in challenges, compete with teammates, and earn achievements.
          </Typography>
        </Paper>
      </Container>
    </AppLayout>
  );
};

export default PlayerChallenges;
