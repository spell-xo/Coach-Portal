import apiClient from './client';

const playerService = {
  /**
   * Get invitation details by token (public, no auth required)
   */
  getInvitationByToken: async (token) => {
    const response = await apiClient.get(`/players/invitations/${token}`);
    return response.data;
  },

  /**
   * Accept team invitation
   */
  acceptInvitation: async (token) => {
    const response = await apiClient.post(`/players/invitations/${token}/accept`);
    return response.data;
  },

  /**
   * Decline team invitation
   */
  declineInvitation: async (token) => {
    const response = await apiClient.post(`/players/invitations/${token}/decline`);
    return response.data;
  },

  /**
   * Get all teams for logged-in player
   */
  getPlayerTeams: async () => {
    const response = await apiClient.get('/players/teams');
    return response.data;
  },

  /**
   * Get team roster (all players on a team)
   */
  getTeamRoster: async (teamId) => {
    const response = await apiClient.get(`/players/teams/${teamId}/roster`);
    return response.data;
  },

  /**
   * Get pending player/team invitations for logged-in player
   */
  getPlayerInvitations: async () => {
    const response = await apiClient.get('/invitations/pending', {
      params: { type: 'player' }
    });
    return response.data;
  },

  /**
   * Get pending staff invitations for logged-in user
   */
  getStaffInvitations: async () => {
    const response = await apiClient.get('/invitations/pending', {
      params: { type: 'staff' }
    });
    return response.data;
  },

  /**
   * Accept staff invitation
   * @param {string} token - Invitation token
   */
  acceptStaffInvitation: async (token) => {
    const response = await apiClient.post(`/clubs/staff-invitations/${token}/accept`);
    return response.data;
  },

  /**
   * Decline staff invitation
   * @param {string} token - Invitation token
   */
  declineStaffInvitation: async (token) => {
    const response = await apiClient.post(`/clubs/staff-invitations/${token}/decline`);
    return response.data;
  },

  /**
   * Leave a team
   */
  leaveTeam: async (teamId) => {
    const response = await apiClient.delete(`/players/teams/${teamId}`);
    return response.data;
  },

  /**
   * Search players across all coach's teams (Coach feature)
   */
  searchPlayers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.teamId) params.append('teamId', filters.teamId);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await apiClient.get(`/coach/players?${params.toString()}`);
    return response.data;
  },

  /**
   * Get all players across all coach's teams (Coach feature)
   * Used for challenge participant selection
   */
  getAllPlayers: async () => {
    const response = await apiClient.get('/coach/players', {
      params: { limit: 500 }
    });
    return response.data;
  },

  /**
   * Get player statistics (Coach feature)
   */
  getPlayerStats: async (playerId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/stats`);
    return response.data;
  },

  /**
   * Get player drill history (Coach feature - high-level only)
   */
  getPlayerDrills: async (playerId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.drillType) params.append('drillType', filters.drillType);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/coach/players/${playerId}/drills?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed drill information with video URL and versions (Coach feature)
   */
  getDrillDetails: async (playerId, drillId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/drills/${drillId}`);
    return response.data;
  },

  /**
   * Get drill scores (Coach feature)
   */
  getDrillScores: async (playerId, drillId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/drills/${drillId}/scores`);
    return response.data;
  },

  /**
   * Get drill highlights/analysis (Coach feature)
   */
  getDrillHighlights: async (playerId, drillId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/drills/${drillId}/highlights`);
    return response.data;
  },

  /**
   * Get player AI chat history (Coach feature - read-only)
   */
  getPlayerChats: async (playerId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await apiClient.get(`/coach/players/${playerId}/chats?${params.toString()}`);
    return response.data;
  },

  /**
   * Upload drill video on behalf of a player (Coach feature)
   */
  uploadDrillForPlayer: async (playerId, formData) => {
    const response = await apiClient.post(
      `/coach/players/${playerId}/drills/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get player dashboard statistics
   */
  getDashboardStats: async () => {
    const response = await apiClient.get('/players/dashboard/stats');
    return response.data;
  },

  /**
   * Get player's current level and drill status
   */
  getCurrentLevelDrills: async () => {
    const response = await apiClient.get('/players/drills/current-level');
    return response.data;
  },

  /**
   * Get player's recent activity feed
   */
  getActivityFeed: async (limit = 10) => {
    const response = await apiClient.get('/players/activity/recent', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get all drills for a specific level (for new players or level progression)
   */
  getLevelDrills: async (level) => {
    const response = await apiClient.get(`/players/drills/level/${level}`);
    return response.data;
  },

  /**
   * Get player's own drill history (for PlayerDashboard drill history tab)
   */
  getMyDrills: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.drillType) params.append('drillType', filters.drillType);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/players/drills?${params.toString()}`);
    return response.data;
  },

  /**
   * Get player's own AI chat history (for PlayerDashboard chats tab)
   */
  getMyChats: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await apiClient.get(`/players/chats?${params.toString()}`);
    return response.data;
  },

  /**
   * Get player performance report (from database if exists)
   */
  getPlayerReport: async (playerId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/report`);
    return response.data;
  },

  /**
   * Generate/regenerate player performance report
   */
  generatePlayerReport: async (playerId) => {
    const response = await apiClient.post(`/coach/players/${playerId}/report/generate`);
    return response.data;
  },

  /**
   * Update coach notes on player report
   */
  updateReportNotes: async (playerId, notes) => {
    const response = await apiClient.patch(`/coach/players/${playerId}/report/notes`, { notes });
    return response.data;
  },

  /**
   * Get player level data for level badge display
   */
  getPlayerLevelData: async (playerId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/level`);
    return response.data;
  },

  /**
   * Get player badge data for badge header display
   * Returns highest achievement level with skills stats
   */
  getPlayerBadge: async (playerId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/badge`);
    return response.data;
  },

  /**
   * Get player's own drill details (Player feature)
   */
  getMyDrillDetails: async (drillId) => {
    const response = await apiClient.get(`/players/drills/${drillId}`);
    return response.data;
  },

  /**
   * Get player's own drill scores (Player feature)
   */
  getMyDrillScores: async (drillId) => {
    const response = await apiClient.get(`/players/drills/${drillId}/scores`);
    return response.data;
  },

  /**
   * Get player's own drill highlights (Player feature)
   */
  getMyDrillHighlights: async (drillId) => {
    const response = await apiClient.get(`/players/drills/${drillId}/highlights`);
    return response.data;
  },

  /**
   * Guardian Management API functions
   */

  /**
   * Invite guardian for a player (Coach feature)
   * @param {string} playerId - Player ID
   * @param {Object} invitationData - { email, name, relationship }
   */
  inviteGuardian: async (playerId, invitationData) => {
    const response = await apiClient.post(`/coach/players/${playerId}/guardians/invite`, invitationData);
    return response.data;
  },

  /**
   * Get all guardians for a player (Coach feature)
   * @param {string} playerId - Player ID
   */
  getPlayerGuardians: async (playerId) => {
    const response = await apiClient.get(`/coach/players/${playerId}/guardians`);
    return response.data;
  },

  /**
   * Remove guardian access (Coach feature)
   * @param {string} playerId - Player ID
   * @param {string} guardianId - Guardian invitation ID
   */
  removeGuardian: async (playerId, guardianId) => {
    const response = await apiClient.delete(`/coach/players/${playerId}/guardians/${guardianId}`);
    return response.data;
  },

  /**
   * Resend guardian invitation (Coach feature)
   * @param {string} playerId - Player ID
   * @param {string} guardianId - Guardian invitation ID
   */
  resendGuardianInvitation: async (playerId, guardianId) => {
    const response = await apiClient.post(`/coach/players/${playerId}/guardians/${guardianId}/resend`);
    return response.data;
  },

  /**
   * Skip pre-classifier and requeue video for processing (Coach feature)
   * Only allowed for REJECTED videos
   * @param {string} playerId - Player ID
   * @param {string} drillId - Drill/VideoUpload ID
   */
  skipPreClassifierAndRequeue: async (playerId, drillId) => {
    const response = await apiClient.post(`/coach/players/${playerId}/drills/${drillId}/skip-preclassifier-requeue`);
    return response.data;
  },
};

export default playerService;
