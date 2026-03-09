import apiClient from './client';

/**
 * Get messages for a team
 * @param {string} teamId - Team ID
 * @param {number} page - Page number
 * @param {number} limit - Messages per page
 * @returns {Promise} - Promise resolving to messages data
 */
export const getTeamMessages = async (teamId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/teams/${teamId}/messages`, {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Send a message to team chat
 * @param {string} teamId - Team ID
 * @param {Object} messageData - Message content and metadata
 * @returns {Promise} - Promise resolving to created message
 */
export const sendTeamMessage = async (teamId, messageData) => {
  const response = await apiClient.post(`/teams/${teamId}/messages`, messageData);
  return response.data;
};

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @returns {Promise} - Promise resolving to success status
 */
export const deleteMessage = async (messageId) => {
  const response = await apiClient.delete(`/messages/${messageId}`);
  return response.data;
};

/**
 * Get team chat members
 * @param {string} teamId - Team ID
 * @returns {Promise} - Promise resolving to members list
 */
export const getTeamChatMembers = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}/chat/members`);
  return response.data;
};

export default {
  getTeamMessages,
  sendTeamMessage,
  deleteMessage,
  getTeamChatMembers
};
