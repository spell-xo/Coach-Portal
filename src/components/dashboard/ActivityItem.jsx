import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MailIcon from '@mui/icons-material/Mail';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { formatDistanceToNow } from 'date-fns';

const ACTIVITY_TYPES = {
  drill_completed: {
    icon: CheckCircleIcon,
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  message: {
    icon: MessageIcon,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  challenge_joined: {
    icon: EmojiEventsIcon,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  invitation: {
    icon: MailIcon,
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  team_joined: {
    icon: GroupAddIcon,
    color: '#06B6D4',
    bgColor: '#ECFEFF',
  },
};

/**
 * ActivityItem Component
 * Displays a single activity item in the feed
 *
 * @param {string} type - Activity type ('drill_completed', 'message', 'challenge_joined', 'invitation', 'team_joined')
 * @param {string} message - Activity message
 * @param {Date|string} timestamp - When the activity occurred
 * @param {function} onAccept - Handler for accept button (for invitations)
 * @param {function} onDecline - Handler for decline button (for invitations)
 * @param {function} onClick - Handler for clicking the activity item
 */
const ActivityItem = ({
  type,
  message,
  timestamp,
  onAccept,
  onDecline,
  onClick,
}) => {
  const config = ACTIVITY_TYPES[type] || ACTIVITY_TYPES.message;
  const ActivityIcon = config.icon;
  const isInvitation = type === 'invitation';

  const formattedTime = timestamp
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : '';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: onClick && !isInvitation ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick && !isInvitation ? {
          borderColor: config.color,
          backgroundColor: config.bgColor,
          boxShadow: 1,
        } : {},
      }}
      onClick={!isInvitation ? onClick : undefined}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          backgroundColor: config.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ActivityIcon sx={{ fontSize: 20, color: config.color }} />
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            lineHeight: 1.5,
          }}
        >
          {message}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {formattedTime}
        </Typography>

        {/* Invitation Actions */}
        {isInvitation && (onAccept || onDecline) && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            {onAccept && (
              <Button
                variant="contained"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                sx={{ textTransform: 'none' }}
              >
                Accept
              </Button>
            )}
            {onDecline && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline();
                }}
                sx={{ textTransform: 'none' }}
              >
                Decline
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ActivityItem;
