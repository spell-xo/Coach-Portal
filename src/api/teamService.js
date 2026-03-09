import apiClient from './client';

const teamService = {
  /**
   * Create a new team
   */
  createTeam: async (teamData) => {
    const response = await apiClient.post('/teams', teamData);
    return response.data;
  },

  /**
   * Get all teams for logged-in coach
   */
  getMyTeams: async () => {
    const response = await apiClient.get('/teams');
    return response.data;
  },

  /**
   * Get team by ID with roster
   */
  getTeamById: async (teamId) => {
    const response = await apiClient.get(`/teams/${teamId}`);
    return response.data;
  },

  /**
   * Update team details
   */
  updateTeam: async (teamId, updates) => {
    const response = await apiClient.put(`/teams/${teamId}`, updates);
    return response.data;
  },

  /**
   * Delete team
   */
  deleteTeam: async (teamId) => {
    const response = await apiClient.delete(`/teams/${teamId}`);
    return response.data;
  },

  /**
   * Add player to roster
   */
  addPlayerToRoster: async (teamId, playerData) => {
    const response = await apiClient.post(`/teams/${teamId}/roster`, playerData);
    return response.data;
  },

  /**
   * Update roster entry
   */
  updateRosterEntry: async (teamId, playerId, updates) => {
    const response = await apiClient.put(`/teams/${teamId}/roster/${playerId}`, updates);
    return response.data;
  },

  /**
   * Remove player from roster
   */
  removePlayerFromRoster: async (teamId, playerId) => {
    const response = await apiClient.delete(`/teams/${teamId}/roster/${playerId}`);
    return response.data;
  },

  /**
   * Create player invitation
   */
  createInvitation: async (teamId, email) => {
    const response = await apiClient.post(`/teams/${teamId}/invitations`, { email });
    return response.data;
  },

  /**
   * Get team invitations
   */
  getTeamInvitations: async (teamId) => {
    const response = await apiClient.get(`/teams/${teamId}/invitations`);
    return response.data;
  },

  /**
   * Cancel invitation
   */
  cancelInvitation: async (teamId, invitationId) => {
    const response = await apiClient.delete(`/teams/${teamId}/invitations/${invitationId}`);
    return response.data;
  },

  /**
   * Add coach to team
   * @param {string} teamId - Team ID
   * @param {string} coachUserId - User ID of coach to add
   * @returns {Promise} Updated team
   */
  addCoachToTeam: async (teamId, coachUserId) => {
    const response = await apiClient.post(`/teams/${teamId}/coaches`, { coachUserId });
    return response.data;
  },

  /**
   * Remove coach from team
   * @param {string} teamId - Team ID
   * @param {string} coachId - Coach ID to remove
   * @returns {Promise} Updated team
   */
  removeCoachFromTeam: async (teamId, coachId) => {
    const response = await apiClient.delete(`/teams/${teamId}/coaches/${coachId}`);
    return response.data;
  },

  /**
   * Get all coaches for a team
   * @param {string} teamId - Team ID
   * @returns {Promise} List of coaches
   */
  getTeamCoaches: async (teamId) => {
    const response = await apiClient.get(`/teams/${teamId}/coaches`);
    return response.data;
  },
};

export default teamService;
