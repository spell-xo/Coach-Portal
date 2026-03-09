/**
 * Navigation utility for handling club context-aware routing
 * Ensures that when in club context, all navigation preserves the clubId parameter
 */

/**
 * Build a path based on current context
 * @param {string} basePath - The base path (e.g., 'teams', 'players', 'dashboard')
 * @param {Object} activeContext - The current active context from Redux
 * @param {boolean} forcePersonal - Force personal context route even if in club context
 * @returns {string} The context-aware path
 */
export const buildContextPath = (basePath, activeContext, forcePersonal = false) => {
  // If not in club context or forcing personal, return personal path
  if (!activeContext || activeContext.type !== 'club' || forcePersonal) {
    return `/${basePath}`;
  }

  // In club context, prepend club ID
  const clubId = activeContext.clubId;
  return `/clubs/${clubId}/${basePath}`;
};

/**
 * Get the appropriate dashboard path based on context
 * @param {Object} activeContext - The current active context from Redux
 * @param {string} primaryRole - The user's primary role
 * @returns {string} The dashboard path
 */
export const getDashboardPath = (activeContext, primaryRole) => {
  // Club context
  if (activeContext && activeContext.type === 'club') {
    return `/clubs/${activeContext.clubId}/dashboard`;
  }

  // Personal context
  if (primaryRole === 'player') {
    return '/player/dashboard';
  }

  return '/dashboard';
};

/**
 * Get the appropriate teams path based on context
 * @param {Object} activeContext - The current active context from Redux
 * @param {string} primaryRole - The user's primary role
 * @returns {string} The teams path
 */
export const getTeamsPath = (activeContext, primaryRole) => {
  // Club context
  if (activeContext && activeContext.type === 'club') {
    return `/clubs/${activeContext.clubId}/teams`;
  }

  // Personal context
  if (primaryRole === 'player') {
    return '/player/teams';
  }

  return '/teams';
};

/**
 * Get the appropriate players path based on context
 * @param {Object} activeContext - The current active context from Redux
 * @returns {string} The players path
 */
export const getPlayersPath = (activeContext) => {
  if (activeContext && activeContext.type === 'club') {
    return `/clubs/${activeContext.clubId}/players`;
  }

  return '/players';
};

/**
 * Get the appropriate messages path based on context
 * @param {Object} activeContext - The current active context from Redux
 * @returns {string} The messages path
 */
export const getMessagesPath = (activeContext) => {
  if (activeContext && activeContext.type === 'club') {
    return `/clubs/${activeContext.clubId}/messages`;
  }

  return '/messages';
};

/**
 * Get the appropriate analytics path based on context
 * @param {Object} activeContext - The current active context from Redux
 * @returns {string} The analytics path
 */
export const getAnalyticsPath = (activeContext) => {
  if (activeContext && activeContext.type === 'club') {
    return `/clubs/${activeContext.clubId}/analytics`;
  }

  return '/analytics';
};

/**
 * Get the appropriate drill uploads path based on context
 * @param {Object} activeContext - The current active context from Redux
 * @returns {string} The drill uploads path
 */
export const getDrillUploadsPath = (activeContext) => {
  if (activeContext && activeContext.type === 'club') {
    return `/clubs/${activeContext.clubId}/drill-uploads`;
  }

  return '/drill-uploads';
};
