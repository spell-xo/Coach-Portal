import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * StatCard Component
 * Displays a quick stat card with icon, count, and action button
 *
 * @param {ReactNode} icon - Icon component to display
 * @param {string} title - Card title
 * @param {number} count - Count to display
 * @param {string} label - Label for the count (e.g., "new", "pending")
 * @param {function} onClick - Click handler for the view button
 * @param {string} color - Background color for the icon
 */
const StatCard = ({ icon, title, count, label, onClick, color = '#1976d2' }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            color: color,
          }}
        >
          {icon}
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
          {title}
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', my: 1 }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
            {count}
          </Typography>
          {label && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1, fontWeight: 500 }}
            >
              {label}
            </Typography>
          )}
        </Box>

        {onClick && (
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{
              alignSelf: 'flex-start',
              textTransform: 'none',
              fontWeight: 600,
              p: 0,
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            View
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
