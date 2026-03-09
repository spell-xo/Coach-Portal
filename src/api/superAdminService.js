import apiClient from './client';

const superAdminService = {
  /**
   * Get all clubs
   */
  getAllClubs: async () => {
    const response = await apiClient.get('/superadmin/clubs');
    return response.data;
  },

  /**
   * Get aggregate statistics (optionally filtered by clubId or clubIds array)
   * @param {string|string[]|null} clubIds - Optional club ID(s) to filter by
   */
  getAggregateStats: async (clubIds = null) => {
    let url = '/superadmin/stats';
    if (clubIds) {
      if (Array.isArray(clubIds)) {
        // Multiple club IDs: ?clubIds=id1,id2,id3
        url = `/superadmin/stats?clubIds=${clubIds.join(',')}`;
      } else {
        // Single club ID (backward compatibility)
        url = `/superadmin/stats?clubId=${clubIds}`;
      }
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get detailed breakdown of stats for each club
   */
  getClubBreakdown: async () => {
    const response = await apiClient.get('/superadmin/clubs/breakdown');
    return response.data;
  },

  /**
   * Seed training exercises and recommendation rules (TEMPORARY)
   */
  seedTrainingRecommendations: async () => {
    const response = await apiClient.post('/superadmin/seed-training-recommendations');
    return response.data;
  },

  /**
   * Get drills breakdown by level and type with status counts
   * @param {string[]|null} clubIds - Optional club IDs to filter by
   */
  getDrillsBreakdown: async (clubIds = null) => {
    let url = '/superadmin/drills/breakdown';
    if (clubIds && Array.isArray(clubIds) && clubIds.length > 0) {
      url = `/superadmin/drills/breakdown?clubIds=${clubIds.join(',')}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get all drill settings
   */
  getAllDrillSettings: async () => {
    const response = await apiClient.get('/superadmin/drill-settings');
    return response.data;
  },

  /**
   * Get a single drill setting by ID
   * @param {string} id - Drill setting ID
   */
  getDrillSettingById: async (id) => {
    const response = await apiClient.get(`/superadmin/drill-settings/${id}`);
    return response.data;
  },

  /**
   * Update a drill setting
   * @param {string} id - Drill setting ID
   * @param {object} updates - Fields to update
   */
  updateDrillSetting: async (id, updates) => {
    const response = await apiClient.put(`/superadmin/drill-settings/${id}`, updates);
    return response.data;
  },

  /**
   * Get all drill metadata
   */
  getAllDrillMetadata: async () => {
    const response = await apiClient.get('/superadmin/drill-metadata');
    return response.data;
  },

  /**
   * Get a single drill metadata by ID
   * @param {string} id - Drill metadata ID
   */
  getDrillMetadataById: async (id) => {
    const response = await apiClient.get(`/superadmin/drill-metadata/${id}`);
    return response.data;
  },

  /**
   * Update drill metadata
   * @param {string} id - Drill metadata ID
   * @param {object} updates - Fields to update
   */
  updateDrillMetadata: async (id, updates) => {
    const response = await apiClient.put(`/superadmin/drill-metadata/${id}`, updates);
    return response.data;
  },

  // ============================================
  // User Management
  // ============================================

  /**
   * Create a new portal user
   * @param {object} userData - User data (name, email, password, role, country, gender)
   */
  createUser: async (userData) => {
    const response = await apiClient.post('/superadmin/users', userData);
    return response.data;
  },

  /**
   * Search users with filters and pagination
   * @param {object} params - Search parameters
   * @param {string} params.search - Search term for name/email/handle
   * @param {string} params.role - Filter by role
   * @param {string} params.status - Filter by status (enabled/disabled)
   * @param {string} params.country - Filter by country
   * @param {string} params.dateFrom - Filter users created after this date
   * @param {string} params.dateTo - Filter users created before this date
   * @param {string} params.sortBy - Field to sort by (name, userId, country, birthday, drillCount, createdDate)
   * @param {string} params.sortOrder - Sort order (asc, desc)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   */
  searchUsers: async ({ search, role, status, country, dateFrom, dateTo, sortBy, sortOrder, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    if (country) params.append('country', country);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    params.append('page', page);
    params.append('limit', limit);

    const response = await apiClient.get(`/superadmin/users?${params.toString()}`);
    return response.data;
  },

  /**
   * Get user statistics for dashboard
   * @param {object} params - Filter parameters
   * @param {string} params.dateFrom - Filter users created after this date
   * @param {string} params.dateTo - Filter users created before this date
   */
  getUserStatistics: async ({ dateFrom, dateTo } = {}) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const url = params.toString() ? `/superadmin/users/statistics?${params.toString()}` : '/superadmin/users/statistics';
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get a single user by ID
   * @param {string} id - User ID
   */
  getUserById: async (id) => {
    const response = await apiClient.get(`/superadmin/users/${id}`);
    return response.data;
  },

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {object} updates - Fields to update
   */
  updateUser: async (id, updates) => {
    const response = await apiClient.put(`/superadmin/users/${id}`, updates);
    return response.data;
  },

  /**
   * Delete a user (soft delete)
   * @param {string} id - User ID
   */
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/superadmin/users/${id}`);
    return response.data;
  },

  /**
   * Reset user password
   * @param {string} id - User ID
   * @param {string} newPassword - New password
   */
  resetUserPassword: async (id, newPassword) => {
    const response = await apiClient.post(`/superadmin/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  // ============================================
  // Parental Consent Request Management
  // ============================================

  /**
   * Get parental consent requests with filters and pagination
   * @param {object} params - Search parameters
   */
  getParentalConsentRequests: async ({ search, status, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);

    const response = await apiClient.get(`/superadmin/parental-consent-requests?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single parental consent request by ID
   * @param {string} id - Request ID
   */
  getParentalConsentRequestById: async (id) => {
    const response = await apiClient.get(`/superadmin/parental-consent-requests/${id}`);
    return response.data;
  },

  /**
   * Update a parental consent request
   * @param {string} id - Request ID
   * @param {object} updates - Fields to update
   */
  updateParentalConsentRequest: async (id, updates) => {
    const response = await apiClient.put(`/superadmin/parental-consent-requests/${id}`, updates);
    return response.data;
  },

  /**
   * Delete a parental consent request
   * @param {string} id - Request ID
   */
  deleteParentalConsentRequest: async (id) => {
    const response = await apiClient.delete(`/superadmin/parental-consent-requests/${id}`);
    return response.data;
  },

  // ============================================
  // Drill Management
  // ============================================

  /**
   * Search drills with filters and pagination
   * @param {object} params - Search parameters
   * @param {string} params.search - Search by player name
   * @param {string} params.status - Filter by status
   * @param {string} params.gameType - Filter by game type
   * @param {string} params.drillLevel - Filter by drill level
   * @param {string} params.uploadSource - Filter by upload source
   * @param {string} params.country - Filter by country
   * @param {string} params.clubId - Filter by club ID
   * @param {string} params.dateFrom - Filter by start date (YYYY-MM-DD)
   * @param {string} params.dateTo - Filter by end date (YYYY-MM-DD)
   * @param {string} params.scoreCategory - Filter by score category (0, 1-20, 21-40, 41-60, 61-80, 81-100)
   * @param {boolean} params.patternCountMismatchOnly - Filter to show only drills with pattern count mismatch
   * @param {boolean} params.hasNotesOnly - Filter to show only drills with notes
   * @param {string} params.rejectionRatingFilter - Filter by rejection rating (correct, incorrect, unrated)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   */
  searchDrills: async ({ search, status, gameType, drillLevel, uploadSource, country, clubId, dateFrom, dateTo, scoreCategory, patternCountMismatchOnly, hasNotesOnly, rejectionRatingFilter, drillIds, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (gameType) params.append('gameType', gameType);
    if (drillLevel) params.append('drillLevel', drillLevel);
    if (uploadSource) params.append('uploadSource', uploadSource);
    if (country) params.append('country', country);
    if (clubId) params.append('clubId', clubId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (scoreCategory) params.append('scoreCategory', scoreCategory);
    if (patternCountMismatchOnly) params.append('patternCountMismatchOnly', 'true');
    if (hasNotesOnly) params.append('hasNotesOnly', 'true');
    if (rejectionRatingFilter) params.append('rejectionRatingFilter', rejectionRatingFilter);
    if (drillIds && drillIds.length > 0) params.append('drillIds', drillIds.join(','));
    params.append('page', page);
    params.append('limit', limit);

    const response = await apiClient.get(`/superadmin/drills?${params.toString()}`);
    return response.data;
  },

  /**
   * Get drill details by ID (superadmin)
   * @param {string} drillId - Drill ID
   */
  getDrillById: async (drillId) => {
    const response = await apiClient.get(`/superadmin/drills/${drillId}`);
    return response.data;
  },

  /**
   * Get drill scores by drill ID (superadmin)
   * @param {string} drillId - Drill ID
   */
  getDrillScoresById: async (drillId) => {
    const response = await apiClient.get(`/superadmin/drills/${drillId}/scores`);
    return response.data;
  },

  /**
   * Get drill highlights by drill ID (superadmin)
   * @param {string} drillId - Drill ID
   */
  getDrillHighlightsById: async (drillId) => {
    const response = await apiClient.get(`/superadmin/drills/${drillId}/highlights`);
    return response.data;
  },

  /**
   * Get player info by ID (superadmin)
   * @param {string} playerId - Player ID
   */
  getPlayerById: async (playerId) => {
    const response = await apiClient.get(`/superadmin/players/${playerId}`);
    return response.data;
  },

  /**
   * Skip pre-classifier and requeue video for processing (superadmin)
   * @param {string} drillId - Drill ID
   * @param {string} note - Required note explaining why the drill is being requeued
   */
  skipPreClassifierAndRequeue: async (drillId, note) => {
    const response = await apiClient.post(`/superadmin/drills/${drillId}/skip-preclassifier-requeue`, { note });
    return response.data;
  },

  /**
   * Add a note to a drill (superadmin)
   * @param {string} drillId - Drill ID
   * @param {string} note - Note message
   */
  addNoteToDrill: async (drillId, note) => {
    const response = await apiClient.post(`/superadmin/drills/${drillId}/notes`, { note });
    return response.data;
  },

  /**
   * Get drill type statistics (drill types by status)
   * @param {object} params - Filter parameters
   * @param {string} params.search - Search by player name
   * @param {string} params.status - Filter by status
   * @param {string} params.gameType - Filter by game type
   * @param {string} params.drillLevel - Filter by drill level
   * @param {string} params.uploadSource - Filter by upload source
   * @param {string} params.country - Filter by country
   * @param {string} params.clubId - Filter by club ID
   * @param {string} params.dateFrom - Filter drills uploaded after this date
   * @param {string} params.dateTo - Filter drills uploaded before this date
   * @param {string} params.scoreCategory - Filter by score category
   */
  getDrillTypeStatistics: async ({ search, status, gameType, drillLevel, uploadSource, country, clubId, dateFrom, dateTo, scoreCategory } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (gameType) params.append('gameType', gameType);
    if (drillLevel) params.append('drillLevel', drillLevel);
    if (uploadSource) params.append('uploadSource', uploadSource);
    if (country) params.append('country', country);
    if (clubId) params.append('clubId', clubId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (scoreCategory) params.append('scoreCategory', scoreCategory);

    const url = params.toString() ? `/superadmin/drills/type-statistics?${params.toString()}` : '/superadmin/drills/type-statistics';
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Rate a rejection (correctly or incorrectly rejected)
   * @param {string} drillId - Drill ID
   * @param {string} rating - Rating ('correct' or 'incorrect')
   */
  rateRejection: async (drillId, rating) => {
    const response = await apiClient.post(`/superadmin/drills/${drillId}/rate-rejection`, { rating });
    return response.data;
  },

  /**
   * Add a user to a club/academy
   * @param {string} userId - User ID
   * @param {string} clubId - Club ID
   * @param {string} role - Role in the club (e.g., 'PLAYER', 'COACH')
   */
  addUserToClub: async (userId, clubId, role) => {
    const response = await apiClient.post(`/superadmin/users/${userId}/add-to-club`, { clubId, role });
    return response.data;
  },

  /**
   * Remove a user from a club/academy
   * @param {string} userId - User ID
   * @param {string} clubId - Club ID
   */
  removeUserFromClub: async (userId, clubId) => {
    const response = await apiClient.post(`/superadmin/users/${userId}/remove-from-club`, { clubId });
    return response.data;
  }
};

export default superAdminService;
