import apiClient from './client';

const drillService = {
  /**
   * Get distinct drill types from drillsettings collection
   */
  getDrillTypes: async () => {
    const response = await apiClient.get('/drills/types');
    return response.data;
  },

  /**
   * Generate pre-signed URLs for batch video uploads
   * @param {string} clubId - Club ID (optional)
   * @param {Array} videos - Array of { fileName, contentType, size }
   * @returns {Promise<Object>} Response with uploadUrls array
   */
  generateBatchPreSignedUrls: async (clubId, videos) => {
    console.log('🌐 [drillService] generateBatchPreSignedUrls called');
    console.log('📊 [drillService] clubId:', clubId);
    console.log('📊 [drillService] videos count:', videos.length);
    console.log('📊 [drillService] videos:', videos);
    console.log('📊 [drillService] API endpoint: POST /uploads/batch/presigned-urls');

    const response = await apiClient.post('/uploads/batch/presigned-urls', {
      clubId,
      videos,
    });

    console.log('✅ [drillService] API response received:', response.data);
    return response.data;
  },

  /**
   * Register batch upload after successful GCS upload
   * @param {string} clubId - Club ID (optional)
   * @param {Array} videos - Array of { fileName, filepath, videoId, bucketName }
   * @param {string} drillLevel - Drill level (level_one to level_five)
   * @param {string} drillType - Drill type (e.g., 7_CONE_WEAVE)
   * @param {boolean} performPostProcessing - Whether to perform post-processing
   * @param {boolean} generateAnnotatedVideo - Whether to generate annotated video
   * @returns {Promise<Object>} Response with batch information
   */
  registerBatchUpload: async (
    clubId,
    videos,
    drillLevel,
    drillType,
    performPostProcessing,
    generateAnnotatedVideo
  ) => {
    const response = await apiClient.post('/uploads/batch/register', {
      clubId,
      videos,
      drillLevel,
      drillType,
      performPostProcessing,
      generateAnnotatedVideo,
    });
    return response.data;
  },

  /**
   * Get status of batch upload
   * @param {Array} videoUploadIds - Array of video upload IDs
   * @returns {Promise<Object>} Response with batch status
   */
  getBatchUploadStatus: async (videoUploadIds) => {
    const response = await apiClient.post('/uploads/batch/status', {
      videoUploadIds,
    });
    return response.data;
  },

  /**
   * Upload bulk drills (legacy method - to be deprecated)
   */
  uploadBulkDrills: async (clubId, formData) => {
    const response = await apiClient.post(
      `/clubs/${clubId}/drills/bulk-upload`,
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
   * Get drills by status
   * @param {string} clubId - Club ID (optional)
   * @param {string} status - Drill status (e.g., 'PENDING_MANUAL_ANNOTATION')
   * @param {Object} options - Additional query options (page, limit, etc.)
   * @returns {Promise<Object>} Response with drills array
   */
  getDrillsByStatus: async (clubId, status, options = {}) => {
    const params = {
      status,
      clubId,
      ...options,
    };

    const response = await apiClient.get('/uploads/drills', { params });
    return response.data;
  },

  /**
   * Update drill with manual annotations
   * @param {string} drillId - Drill ID
   * @param {Object} annotations - Manual annotations data
   * @param {string} newStatus - New status (e.g., 'UPLOADED')
   * @param {string} gameType - Optional updated drill type
   * @returns {Promise<Object>} Response with updated drill
   */
  updateDrillAnnotations: async (drillId, annotations, newStatus = 'UPLOADED', gameType = null) => {
    const payload = {
      manualAnnotation: annotations,
      status: newStatus,
    };
    if (gameType) {
      payload.gameType = gameType;
    }
    const response = await apiClient.patch(`/uploads/drills/${drillId}`, payload);
    return response.data;
  },

  /**
   * Update drill status
   * @param {string} drillId - Drill ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Response with updated drill
   */
  updateDrillStatus: async (drillId, status) => {
    const response = await apiClient.patch(`/uploads/drills/${drillId}`, {
      status,
    });
    return response.data;
  },

  /**
   * Batch update drill status
   * @param {Array<string>} drillIds - Array of drill IDs
   * @param {string} status - New status
   * @returns {Promise<Object>} Response with updated drills
   */
  batchUpdateDrillStatus: async (drillIds, status) => {
    const response = await apiClient.post('/drills/batch/update-status', {
      drillIds,
      status,
    });
    return response.data;
  },

  /**
   * Update drill details (level, type, status)
   * @param {string} drillId - Drill ID
   * @param {Object} updates - Fields to update { drillLevel, drillType, status }
   * @returns {Promise<Object>} Response with updated drill
   */
  updateDrill: async (drillId, updates) => {
    const response = await apiClient.patch(`/uploads/drills/${drillId}`, updates);
    return response.data;
  },

  /**
   * Send drills to processing queue (manually trigger Pub/Sub)
   * @param {string} clubId - Club ID (unused, kept for compatibility)
   * @param {Array<string>} videoUploadIds - Array of video upload IDs
   * @returns {Promise<Object>} Response with processing results
   */
  sendToProcessing: async (clubId, videoUploadIds) => {
    const response = await apiClient.post('/uploads/drills/process', {
      videoUploadIds,
    });
    return response.data;
  },

  /**
   * Delete a single drill
   * @param {string} drillId - Drill ID to delete
   * @param {boolean} deleteFromGCS - Whether to delete from Google Cloud Storage (default: true)
   * @returns {Promise<Object>} Response with deletion results
   */
  deleteDrill: async (drillId, deleteFromGCS = true) => {
    const response = await apiClient.delete(`/uploads/drills/${drillId}`, {
      params: { deleteFromGCS },
    });
    return response.data;
  },

  /**
   * Reprocess a drill (delete related records and reset status)
   * @param {string} drillId - Drill ID to reprocess
   * @param {string} mode - 'immediate' (default) to reprocess now, 'pending_annotation' to set as pending annotation
   * @returns {Promise<Object>} Response with reprocessing results
   */
  reprocessDrill: async (drillId, mode = 'immediate') => {
    const response = await apiClient.post(`/uploads/drills/${drillId}/reprocess`, { mode });
    return response.data;
  },

  /**
   * Skip pre-classifier and requeue video for processing
   * Only allowed for REJECTED videos
   * @param {string} drillId - Drill/VideoUpload ID
   * @param {string} playerId - Player user ID
   * @returns {Promise<Object>} Response with requeue results
   */
  skipPreClassifierAndRequeue: async (drillId, playerId) => {
    const response = await apiClient.post(`/coach/players/${playerId}/drills/${drillId}/skip-preclassifier-requeue`);
    return response.data;
  },

  /**
   * Put back an uploaded video into the Pub/Sub processing queue
   * Only works for videos in UPLOADED state with updatedAt older than 6 hours
   * @param {string} videoUploadId - Video upload ID
   * @returns {Promise<Object>} Response with requeue results
   */
  putBackUploadedVideoPubsubQueue: async (videoUploadId) => {
    const response = await apiClient.post('/uploads/drills/put-back-uploaded-video-pubsub-queue', { videoUploadId });
    return response.data;
  },
};

export default drillService;
