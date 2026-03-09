import apiClient from './client';

const ratingsService = {
  /**
   * Update drill rating
   * @param {string} drillId - Drill ID
   * @param {object} ratings - Rating data (attitude, teamplay, respect, ambition, effort, humility, comments)
   */
  updateDrillRating: async (drillId, ratings) => {
    const response = await apiClient.patch(`/drills/${drillId}/ratings`, ratings);
    return response.data;
  },

  /**
   * Get drill rating
   * @param {string} drillId - Drill ID
   */
  getDrillRating: async (drillId) => {
    const response = await apiClient.get(`/drills/${drillId}/ratings`);
    return response.data;
  },

  /**
   * Update player overall rating
   * @param {string} playerId - Player ID
   * @param {object} ratings - Rating data (attitude, teamplay, respect, ambition, effort, humility, comments)
   */
  updatePlayerRating: async (playerId, ratings) => {
    const response = await apiClient.patch(`/players/${playerId}/ratings`, ratings);
    return response.data;
  },

  /**
   * Get player overall rating
   * @param {string} playerId - Player ID
   */
  getPlayerRating: async (playerId) => {
    const response = await apiClient.get(`/players/${playerId}/ratings`);
    return response.data;
  },

  /**
   * Get complete player ratings (overall + aggregated drill ratings)
   * @param {string} playerId - Player ID
   */
  getCompletePlayerRatings: async (playerId) => {
    const response = await apiClient.get(`/players/${playerId}/ratings/complete`);
    return response.data;
  },

  /**
   * Get all drill ratings for a player
   * @param {string} playerId - Player ID
   */
  getPlayerDrillRatings: async (playerId) => {
    const response = await apiClient.get(`/players/${playerId}/drill-ratings`);
    return response.data;
  },

  /**
   * Export drill report as PDF
   * @param {string} drillId - Drill ID
   */
  exportDrillPDF: async (drillId) => {
    const response = await apiClient.get(`/drills/${drillId}/pdf`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drill-report-${drillId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export player report as PDF
   * @param {string} playerId - Player ID
   */
  exportPlayerPDF: async (playerId) => {
    const response = await apiClient.get(`/players/${playerId}/pdf`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `player-report-${playerId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export club report as PDF
   * @param {string} clubId - Club ID
   */
  exportClubPDF: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/pdf`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `club-report-${clubId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default ratingsService;
