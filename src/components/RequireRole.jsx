import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Alert } from '@mui/material';
import { selectActiveClubRole, selectIsClubContext, selectIsPlatformAdmin } from '../store/authSlice';

/**
 * Higher-Order Component to conditionally render children based on user's role
 * @param {Object} props
 * @param {string[]} props.roles - Array of allowed roles (e.g., ['club_manager', 'head_coach'])
 * @param {React.ReactNode} props.children - Content to render if user has required role
 * @param {React.ReactNode} props.fallback - Content to render if user lacks permission (optional)
 * @param {boolean} props.showError - Whether to show error message if unauthorized (default: false)
 */
const RequireRole = ({ roles = [], children, fallback = null, showError = false }) => {
  const activeClubRole = useSelector(selectActiveClubRole);
  const isClubContext = useSelector(selectIsClubContext);
  const isPlatformAdmin = useSelector(selectIsPlatformAdmin);

  // Platform admins have full access to everything
  if (isPlatformAdmin) {
    return <>{children}</>;
  }

  // If not in club context, don't enforce role restrictions (legacy behavior)
  if (!isClubContext) {
    return <>{children}</>;
  }

  // Check if roles is a valid array
  if (!Array.isArray(roles) || roles.length === 0) {
    console.warn('RequireRole: roles prop must be a non-empty array');
    return fallback;
  }

  // Check if user's active club role is in the allowed roles (case-insensitive)
  const normalizedActiveRole = activeClubRole?.toLowerCase();
  const normalizedAllowedRoles = roles.map(role => role.toLowerCase());
  const hasPermission = normalizedAllowedRoles.includes(normalizedActiveRole);

  if (hasPermission) {
    return <>{children}</>;
  }

  // User doesn't have permission
  if (showError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          You don't have permission to access this feature. Required role: {roles.join(' or ')}
        </Alert>
      </Box>
    );
  }

  return fallback;
};

export default RequireRole;
