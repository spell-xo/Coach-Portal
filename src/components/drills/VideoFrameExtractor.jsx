/**
 * Video Frame Extractor Component
 * Handles extracting and uploading video frames to GCP
 * Based on PRD: Bulk upload Manual annotation
 */

import { base64ToBlob, generateUniqueFileName, constructFrameUrl } from "../../utils/videoUtils";
import axios from "axios";
import apiClient from "../../api/client";

/**
 * Upload extracted frame to GCP
 * @param {string} base64Image - Base64 encoded image
 * @param {File} videoFile - Original video file (for filename generation)
 * @returns {Promise<{frameFileName: string, frameUrl: string}>}
 */
export const uploadExtractedFrame = async (base64Image, videoFile) => {
  try {
    // Convert base64 to blob
    const frameBlob = base64ToBlob(base64Image, "image/jpeg");

    // Generate unique filename
    const frameFileName = generateUniqueFileName(videoFile, "_frame", "jpg");

    // Get pre-signed URL for frame upload using batch endpoint with single file
    const signedUrlResponse = await apiClient.post("/uploads/batch/presigned-urls", {
      videos: [
        {
          fileName: frameFileName,
          contentType: "image/jpeg",
          size: frameBlob.size,
        },
      ],
    });

    if (!signedUrlResponse.data.success || !signedUrlResponse.data.data?.uploadUrls?.[0]) {
      throw new Error("Failed to get pre-signed URL for frame");
    }

    const uploadInfo = signedUrlResponse.data.data.uploadUrls[0];
    const signedUrl = uploadInfo.uploadUrl;

    // Upload to GCP
    await axios.put(signedUrl, frameBlob, {
      headers: {
        "Content-Type": "image/jpeg",
      },
    });

    // Construct public frame URL
    const frameUrl = constructFrameUrl(frameFileName);

    return {
      frameFileName,
      frameUrl,
    };
  } catch (error) {
    console.error("Frame upload error:", error);
    throw new Error(`Failed to upload frame: ${error.message}`);
  }
};

/**
 * Get pre-signed URL for file upload
 * @param {string} fileName - Unique file name
 * @param {string} contentType - Content type (e.g., "image/jpeg", "video/mp4")
 * @param {number} size - File size in bytes
 * @returns {Promise<string>} Pre-signed URL
 */
export const getSignedUrl = async (fileName, contentType = "image/jpeg", size = 0) => {
  try {
    const response = await apiClient.post("/uploads/batch/presigned-urls", {
      videos: [
        {
          fileName: fileName,
          contentType: contentType,
          size: size,
        },
      ],
    });

    if (!response.data.success || !response.data.data?.uploadUrls?.[0]) {
      throw new Error("Failed to get pre-signed URL");
    }

    return response.data.data.uploadUrls[0].uploadUrl;
  } catch (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }
};

/**
 * Upload file to GCP using pre-signed URL
 * @param {string} signedUrl - Pre-signed upload URL
 * @param {File|Blob} file - File to upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<void>}
 */
export const uploadToGCP = async (signedUrl, file, onProgress) => {
  try {
    await axios.put(signedUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

const VideoFrameExtractor = {
  uploadExtractedFrame,
  getSignedUrl,
  uploadToGCP,
};

export default VideoFrameExtractor;
