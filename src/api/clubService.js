import apiClient from './client';

export const clubService = {
  /**
   * Get club dashboard data
   * @param {string} clubId - Club ID
   * @returns {Promise} Dashboard data with stats, teams, and staff
   */
  getDashboard: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/dashboard`);
    return response.data;
  },

  /**
   * Get all teams for a club
   * @param {string} clubId - Club ID
   * @returns {Promise} List of teams
   */
  getTeams: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/teams`);
    return response.data;
  },

  /**
   * Create a new team
   * @param {string} clubId - Club ID
   * @param {Object} teamData - Team creation data
   * @returns {Promise} Created team
   */
  createTeam: async (clubId, teamData) => {
    const response = await apiClient.post(`/clubs/${clubId}/teams`, teamData);
    return response.data;
  },

  /**
   * Get all staff members for a club
   * @param {string} clubId - Club ID
   * @returns {Promise} List of staff
   */
  getStaff: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/staff`);
    return response.data;
  },

  /**
   * Assign head coach role to a user
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID to assign
   * @returns {Promise} Updated user
   */
  assignHeadCoach: async (clubId, userId) => {
    const response = await apiClient.post(`/clubs/${clubId}/staff/head-coach`, { userId });
    return response.data;
  },

  /**
   * Remove staff member from club
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID to remove
   * @returns {Promise} Success status
   */
  removeStaffMember: async (clubId, userId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/staff/${userId}`);
    return response.data;
  },

  /**
   * Get all players in a club
   * @param {string} clubId - Club ID
   * @param {Object} filters - Optional filters (search, team, position, etc.)
   * @returns {Promise} List of players
   */
  getPlayers: async (clubId, filters = {}) => {
    const response = await apiClient.get(`/clubs/${clubId}/players`, { params: filters });
    return response.data;
  },

  /**
   * Get club analytics
   * @param {string} clubId - Club ID
   * @param {string} dateRange - Date range ('7d', '30d', '90d')
   * @returns {Promise} Analytics data
   */
  getAnalytics: async (clubId, dateRange = '30d') => {
    const response = await apiClient.get(`/clubs/${clubId}/analytics`, {
      params: { dateRange }
    });
    return response.data;
  },

  /**
   * Invite staff member to club
   * @param {string} clubId - Club ID
   * @param {Object} invitationData - Invitation data (email, name, role, customMessage)
   * @returns {Promise} Created invitation
   */
  inviteStaffMember: async (clubId, invitationData) => {
    const response = await apiClient.post(`/clubs/${clubId}/staff/invite`, invitationData);
    return response.data;
  },

  /**
   * Get staff invitations for a club
   * @param {string} clubId - Club ID
   * @param {Object} filters - Optional filters (status, role)
   * @returns {Promise} List of invitations
   */
  getStaffInvitations: async (clubId, filters = {}) => {
    const response = await apiClient.get(`/clubs/${clubId}/staff/invitations`, { params: filters });
    return response.data;
  },

  /**
   * Cancel staff invitation
   * @param {string} clubId - Club ID
   * @param {string} invitationId - Invitation ID
   * @returns {Promise} Success status
   */
  cancelStaffInvitation: async (clubId, invitationId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/staff/invitations/${invitationId}`);
    return response.data;
  },

  /**
   * Resend staff invitation
   * @param {string} clubId - Club ID
   * @param {string} invitationId - Invitation ID
   * @returns {Promise} Updated invitation
   */
  resendStaffInvitation: async (clubId, invitationId) => {
    const response = await apiClient.post(`/clubs/${clubId}/staff/invitations/${invitationId}/resend`);
    return response.data;
  },

  /**
   * Get player invitations for a club
   * @param {string} clubId - Club ID
   * @param {Object} filters - Optional filters (status, teamId)
   * @returns {Promise} List of invitations
   */
  getPlayerInvitations: async (clubId, filters = {}) => {
    const response = await apiClient.get(`/clubs/${clubId}/invitations`, { params: filters });
    return response.data;
  },

  /**
   * Resend player invitation
   * @param {string} clubId - Club ID
   * @param {string} invitationId - Invitation ID
   * @returns {Promise} Updated invitation
   */
  resendPlayerInvitation: async (clubId, invitationId) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations/${invitationId}/resend`);
    return response.data;
  },

  /**
   * Cancel player invitation
   * @param {string} clubId - Club ID
   * @param {string} invitationId - Invitation ID
   * @returns {Promise} Success status
   */
  cancelPlayerInvitation: async (clubId, invitationId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/invitations/${invitationId}`);
    return response.data;
  },

  /**
   * Validate bulk import CSV
   * @param {string} clubId - Club ID
   * @param {FormData} formData - FormData containing CSV file
   * @returns {Promise} Validation results
   */
  validateBulkImport: async (clubId, formData) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations/bulk-import/validate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Start bulk import process
   * @param {string} clubId - Club ID
   * @param {FormData} formData - FormData containing CSV file
   * @returns {Promise} Import job details
   */
  startBulkImport: async (clubId, formData) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations/bulk-import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get bulk import job status
   * @param {string} clubId - Club ID
   * @param {string} jobId - Job ID
   * @returns {Promise} Job status and progress
   */
  getBulkImportJobStatus: async (clubId, jobId) => {
    const response = await apiClient.get(`/clubs/${clubId}/invitations/bulk-import/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Get all bulk import jobs for a club
   * @param {string} clubId - Club ID
   * @returns {Promise} List of import jobs
   */
  getBulkImportJobs: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/invitations/bulk-import/jobs`);
    return response.data;
  },

  /**
   * Download error report for bulk import job
   * @param {string} clubId - Club ID
   * @param {string} jobId - Job ID
   * @returns {Promise} CSV error report
   */
  downloadBulkImportErrors: async (clubId, jobId) => {
    const response = await apiClient.get(`/clubs/${clubId}/invitations/bulk-import/jobs/${jobId}/errors`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Get all invitations for a club
   * @param {string} clubId - Club ID
   * @param {Object} filters - Optional filters (status, teamId)
   * @returns {Promise} List of invitations
   */
  getClubInvitations: async (clubId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/clubs/${clubId}/invitations?${params}`);
    return response.data;
  },

  /**
   * Get invitation statistics for a club
   * @param {string} clubId - Club ID
   * @returns {Promise} Invitation statistics
   */
  getInvitationStats: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/invitations/stats`);
    return response.data;
  },

  /**
   * Resend an invitation
   * @param {string} clubId - Club ID
   * @param {string} invitationId - Invitation ID
   * @returns {Promise} Updated invitation
   */
  resendInvitation: async (clubId, invitationId) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations/${invitationId}/resend`);
    return response.data;
  },

  /**
   * Cancel an invitation
   * @param {string} clubId - Club ID
   * @param {string} invitationId - Invitation ID
   * @returns {Promise} Success status
   */
  cancelInvitation: async (clubId, invitationId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/invitations/${invitationId}`);
    return response.data;
  },

  /**
   * Get pre-signed URL for profile picture upload
   * @param {string} clubId - Club ID
   * @param {string} email - Player email
   * @param {string} fileName - File name
   * @param {string} contentType - Content type (e.g., 'image/jpeg')
   * @returns {Promise<Object>} Upload URL data { uploadUrl, filepath, publicUrl }
   */
  getProfilePictureUploadUrl: async (clubId, email, fileName, contentType) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations/profile-picture-upload-url`, {
      email,
      fileName,
      contentType
    });
    return response.data;
  },

  /**
   * Create a single player invitation
   * @param {string} clubId - Club ID
   * @param {Object} invitationData - Invitation data (email, name, gender, teamId, profilePictureUrl, etc.)
   * @returns {Promise} Created invitation
   */
  createPlayerInvitation: async (clubId, invitationData) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations`, invitationData);
    return response.data;
  },

  /**
   * Get all teams a player belongs to
   * @param {string} clubId - Club ID
   * @param {string} playerId - Player ID
   * @returns {Promise} List of teams
   */
  getPlayerTeams: async (clubId, playerId) => {
    const response = await apiClient.get(`/clubs/${clubId}/players/${playerId}/teams`);
    return response.data;
  },

  /**
   * Add player to a team
   * @param {string} clubId - Club ID
   * @param {string} playerId - Player ID
   * @param {string} teamId - Team ID
   * @param {Object} rosterData - Jersey number and position
   * @returns {Promise} Updated player
   */
  addPlayerToTeam: async (clubId, playerId, teamId, rosterData = {}) => {
    const response = await apiClient.post(`/clubs/${clubId}/players/${playerId}/teams/${teamId}`, rosterData);
    return response.data;
  },

  /**
   * Remove player from a team
   * @param {string} clubId - Club ID
   * @param {string} playerId - Player ID
   * @param {string} teamId - Team ID
   * @returns {Promise} Success status
   */
  removePlayerFromTeam: async (clubId, playerId, teamId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/players/${playerId}/teams/${teamId}`);
    return response.data;
  },

  /**
   * Update player team assignment
   * @param {string} clubId - Club ID
   * @param {string} playerId - Player ID
   * @param {string} teamId - Team ID
   * @param {Object} updates - Jersey number, position updates
   * @returns {Promise} Updated player
   */
  updatePlayerTeamAssignment: async (clubId, playerId, teamId, updates) => {
    const response = await apiClient.put(`/clubs/${clubId}/players/${playerId}/teams/${teamId}`, updates);
    return response.data;
  },

  /**
   * Get club by ID
   * @param {string} clubId - Club ID
   * @returns {Promise} Club details
   */
  getClubById: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}`);
    return response.data;
  },

  /**
   * Update club profile
   * @param {string} clubId - Club ID
   * @param {Object} profileData - Profile update data
   * @returns {Promise} Updated club
   */
  updateClubProfile: async (clubId, profileData) => {
    const response = await apiClient.put(`/clubs/${clubId}/profile`, profileData);
    return response.data;
  },

  /**
   * Upload club badge
   * @param {string} clubId - Club ID
   * @param {string} imageUrl - Badge image URL
   * @returns {Promise} Updated club
   */
  uploadClubBadge: async (clubId, imageUrl) => {
    const response = await apiClient.post(`/clubs/${clubId}/upload/badge`, { imageUrl });
    return response.data;
  },

  /**
   * Upload club kit image
   * @param {string} clubId - Club ID
   * @param {string} kitType - Kit type (home/away/third)
   * @param {string} imageUrl - Kit image URL
   * @returns {Promise} Updated club
   */
  uploadClubKit: async (clubId, kitType, imageUrl) => {
    const response = await apiClient.post(`/clubs/${clubId}/upload/kit`, { kitType, imageUrl });
    return response.data;
  },

  /**
   * Upload club image (new implementation with file upload)
   * @param {string} clubId - Club ID
   * @param {File} file - Image file
   * @param {string} type - Image type ('badge', 'home', 'away', 'third')
   * @returns {Promise} Upload result with image variants
   */
  uploadClubImage: async (clubId, file, type) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    const response = await apiClient.post(`/clubs/${clubId}/images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Replace club badge image
   * @param {string} clubId - Club ID
   * @param {File} file - New image file
   * @returns {Promise} Upload result
   */
  replaceClubBadge: async (clubId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.put(`/clubs/${clubId}/images/badge`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Replace club kit image
   * @param {string} clubId - Club ID
   * @param {string} kitType - Kit type (home/away/third)
   * @param {File} file - New image file
   * @returns {Promise} Upload result
   */
  replaceClubKit: async (clubId, kitType, file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.put(`/clubs/${clubId}/images/kit/${kitType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete club badge
   * @param {string} clubId - Club ID
   * @returns {Promise} Success status
   */
  deleteClubBadge: async (clubId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/images/badge`);
    return response.data;
  },

  /**
   * Delete club kit image
   * @param {string} clubId - Club ID
   * @param {string} kitType - Kit type (home/away/third)
   * @returns {Promise} Success status
   */
  deleteClubKit: async (clubId, kitType) => {
    const response = await apiClient.delete(`/clubs/${clubId}/images/kit/${kitType}`);
    return response.data;
  },

  /**
   * Get all club images
   * @param {string} clubId - Club ID
   * @returns {Promise} Club images with variants
   */
  getClubImages: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/images`);
    return response.data;
  },

  /**
   * Batch auto-accept invitations
   * @param {string} clubId - Club ID
   * @param {Array<string>} invitationIds - Array of invitation IDs
   * @param {boolean} sendEmails - Whether to send notification emails
   * @returns {Promise} Results of batch operation
   */
  batchAutoAcceptInvitations: async (clubId, invitationIds, sendEmails = true) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations/batch-auto-accept`, {
      invitationIds,
      sendEmails
    });
    return response.data;
  },

  /**
   * Regenerate invitation tokens
   * @param {string} clubId - Club ID
   * @param {Array<string>} invitationIds - Array of invitation IDs
   * @param {boolean} sendEmails - Whether to send notification emails
   * @returns {Promise} Results of regeneration operation
   */
  regenerateInvitationTokens: async (clubId, invitationIds, sendEmails = true) => {
    const response = await apiClient.post(`/clubs/${clubId}/invitations/regenerate-tokens`, {
      invitationIds,
      sendEmails
    });
    return response.data;
  },

  /**
   * Update player profile
   * @param {string} clubId - Club ID
   * @param {string} playerId - Player ID
   * @param {Object} updates - Profile updates
   * @returns {Promise} Updated player
   */
  updatePlayer: async (clubId, playerId, updates) => {
    const response = await apiClient.put(`/clubs/${clubId}/players/${playerId}`, updates);
    return response.data;
  },

  /**
   * Get pre-signed URL for player profile picture upload
   * @param {string} clubId - Club ID
   * @param {string} playerId - Player ID
   * @param {string} fileName - File name
   * @param {string} contentType - Content type (e.g., 'image/jpeg')
   * @returns {Promise<Object>} Upload URL data { uploadUrl, filepath, publicUrl }
   */
  getPlayerProfilePictureUploadUrl: async (clubId, playerId, fileName, contentType) => {
    const response = await apiClient.post(
      `/clubs/${clubId}/players/${playerId}/profile-picture-upload-url`,
      {
        fileName,
        contentType,
      }
    );
    return response.data;
  },

  // Batch profile picture upload
  getBatchProfilePictureUploadUrls: async (clubId, images) => {
    const response = await apiClient.post(
      `/clubs/${clubId}/players/batch/profile-picture-upload-urls`,
      {
        images,
      }
    );
    return response.data;
  },

  updateBatchPlayerProfilePictures: async (clubId, updates) => {
    const response = await apiClient.put(
      `/clubs/${clubId}/players/batch/profile-pictures`,
      {
        updates,
      }
    );
    return response.data;
  },
};

export default clubService;
