import React, { useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import peilProfile from '../../assets/images/peil-profile-120.png';
import PeilProfileDialog from './PeilProfileDialog';

const TAGLINES = {
  drill: "I'll help you understand why this drill scored the way it did. Ask me anything about the scores, CSV data, or analysis pipeline.",
  cohort: "I'll help you investigate patterns across this cohort. Ask me to compare drills, find anomalies, or diagnose failures.",
  report: "I'll help you query and report on drill data using natural language. Ask me for distributions, comparisons, or filtered lists.",
};

const PeilWelcomeBanner = ({ sessionType = 'drill' }) => {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, px: 2 }}>
        <Avatar
          src={peilProfile}
          alt="Peil"
          onClick={() => setProfileOpen(true)}
          sx={{
            width: 80,
            height: 80,
            mb: 1.5,
            cursor: 'pointer',
            transition: 'box-shadow 0.3s ease',
            '&:hover': { boxShadow: '0 0 16px rgba(36,255,0,0.35)' },
          }}
        />
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
          Peil
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ maxWidth: 320, lineHeight: 1.5 }}>
          {TAGLINES[sessionType] || TAGLINES.drill}
        </Typography>
      </Box>
      <PeilProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};

export default PeilWelcomeBanner;
