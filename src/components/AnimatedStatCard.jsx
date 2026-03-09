import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const AnimatedStatCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary.main',
  trend,
  trendLabel,
  delay = 0,
  onClick,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUpIcon sx={{ fontSize: 16 }} />;
    if (trend < 0) return <TrendingDownIcon sx={{ fontSize: 16 }} />;
    return <TrendingFlatIcon sx={{ fontSize: 16 }} />;
  };

  const getTrendColor = () => {
    if (!trend) return 'default';
    if (trend > 0) return 'success';
    if (trend < 0) return 'error';
    return 'default';
  };

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{
        y: -4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        transition: { duration: 0.2 },
      }}
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              component={motion.div}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
              sx={{ fontWeight: 700, mb: 1 }}
            >
              {value}
            </Typography>
            {trend !== undefined && (
              <Chip
                icon={getTrendIcon()}
                label={trendLabel || `${trend > 0 ? '+' : ''}${trend}%`}
                size="small"
                color={getTrendColor()}
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
          </Box>
          <Box
            component={motion.div}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
            sx={{
              bgcolor: `${color}15`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Icon && <Icon sx={{ fontSize: 32, color }} />}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnimatedStatCard;
