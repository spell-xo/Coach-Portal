import React from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AppLayout from '../components/AppLayout';
import { selectActiveContext, selectIsClubContext } from '../store/authSlice';

const PlayerDrills = () => {
  const activeContext = useSelector(selectActiveContext);
  const isClubContext = useSelector(selectIsClubContext);

  return (
    <AppLayout>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isClubContext && activeContext?.clubName
            ? `${activeContext.clubName} - My Drills`
            : 'My Drills'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isClubContext && activeContext?.clubName
            ? `View and practice your drills from ${activeContext.clubName}`
            : 'View and practice your drills'}
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
          <PlayCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Drills Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This feature is currently under development. You'll soon be able to view your assigned drills, track your progress, and improve your skills.
          </Typography>
        </Paper>
      </Container>
    </AppLayout>
  );
};

export default PlayerDrills;
