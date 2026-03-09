import React from 'react';
import { Avatar, Badge, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import PresenceIndicator from './PresenceIndicator';

/**
 * Styled Badge for presence indicator positioning
 */
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      content: '""',
    },
  },
}));

/**
 * PresenceAvatar component
 *
 * User avatar with presence indicator badge
 *
 * Features:
 * - Avatar with user image or initials
 * - Presence indicator badge (online/offline/away)
 * - Customizable size
 * - Status tooltip
 * - Supports clickable avatars
 */
const PresenceAvatar = ({
  src,
  alt,
  name,
  status = 'offline',
  lastSeen = null,
  size = 40,
  showPresence = true,
  onClick,
  sx = {},
}) => {
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatar = (
    <Avatar
      src={src}
      alt={alt || name}
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        fontSize: size * 0.4,
        fontWeight: 600,
        ...sx,
      }}
    >
      {!src && name && getInitials(name)}
    </Avatar>
  );

  if (!showPresence) {
    return avatar;
  }

  return (
    <StyledBadge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <PresenceIndicator
          status={status}
          lastSeen={lastSeen}
          size={size > 40 ? 'medium' : 'small'}
          showTooltip={true}
          withPulse={true}
        />
      }
    >
      {avatar}
    </StyledBadge>
  );
};

export default PresenceAvatar;
