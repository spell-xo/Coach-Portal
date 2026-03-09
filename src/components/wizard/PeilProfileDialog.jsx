import React from 'react';
import { Dialog, DialogContent, Box, Typography, Avatar, Chip, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import BugReportIcon from '@mui/icons-material/BugReport';
import PatternIcon from '@mui/icons-material/Pattern';
import TableChartIcon from '@mui/icons-material/TableChart';
import VideocamIcon from '@mui/icons-material/Videocam';
import peilProfile from '../../assets/images/peil-profile-120.png';

const CAPABILITIES = [
  { label: 'Drill Scoring Analysis', icon: <QueryStatsIcon sx={{ fontSize: 14 }} /> },
  { label: 'Ball Tracking', icon: <GpsFixedIcon sx={{ fontSize: 14 }} /> },
  { label: 'Pipeline Debugging', icon: <BugReportIcon sx={{ fontSize: 14 }} /> },
  { label: 'Pattern Recognition', icon: <PatternIcon sx={{ fontSize: 14 }} /> },
  { label: 'CSV Data Exploration', icon: <TableChartIcon sx={{ fontSize: 14 }} /> },
  { label: 'Video Annotation', icon: <VideocamIcon sx={{ fontSize: 14 }} /> },
];

const PeilProfileDialog = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: {
        background: 'linear-gradient(160deg, #0d1b2a 0%, #1b2838 50%, #243447 100%)',
        color: '#fff',
        borderRadius: 3,
        overflow: 'hidden',
      },
    }}
  >
    <IconButton
      onClick={onClose}
      sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.5)' }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
    <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 3 }}>
      <Avatar
        src={peilProfile}
        alt="Peil"
        sx={{
          width: 120,
          height: 120,
          mb: 2,
          border: '3px solid #24FF00',
          boxShadow: '0 0 20px rgba(36,255,0,0.3)',
        }}
      />
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.25 }}>
        Peil
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.6, mb: 2 }}>
        Drill Analysis Expert
      </Typography>
      <Typography variant="body2" textAlign="center" sx={{ opacity: 0.8, mb: 3, maxWidth: 320, lineHeight: 1.6 }}>
        I'm your dedicated AI analyst for the AIM platform. I can investigate drill scores, trace data
        through the analysis pipeline, annotate video, and help you understand why any drill scored the
        way it did.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
        {CAPABILITIES.map((cap) => (
          <Chip
            key={cap.label}
            icon={cap.icon}
            label={cap.label}
            size="small"
            sx={{
              bgcolor: 'rgba(36,255,0,0.1)',
              color: '#24FF00',
              border: '1px solid rgba(36,255,0,0.25)',
              fontSize: '0.72rem',
              '& .MuiChip-icon': { color: '#24FF00' },
            }}
          />
        ))}
      </Box>
    </DialogContent>
  </Dialog>
);

export default PeilProfileDialog;
