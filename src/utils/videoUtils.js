/**
 * Video Utilities
 * Utilities for extracting frames, converting formats, and generating filenames
 * Based on PRD: Bulk upload Manual annotation
 */

/**
 * Extract first frame from video
 * @param {string} videoURL - Video URL or object URL
 * @param {Object} callbacks - Success/error callbacks
 * @param {Function} callbacks.onSuccess - Called with base64 image string
 * @param {Function} callbacks.onError - Called with error
 */
export const extractFirstFrame = (videoURL, callbacks) => {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  let hasTriedFallback = false;

  video.crossOrigin = "anonymous";
  video.src = videoURL;
  video.muted = true;
  video.playsInline = true;

  const isFrameBlack = (ctx, width, height) => {
    const stepX = Math.max(1, Math.floor(width / 20));
    const stepY = Math.max(1, Math.floor(height / 20));
    let total = 0;
    let count = 0;
    const imageData = ctx.getImageData(0, 0, width, height);
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const i = (y * width + x) * 4;
        total += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        count++;
      }
    }
    return count > 0 && total / count < 10;
  };

  video.addEventListener("loadedmetadata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    video.currentTime = 0.1; // Seek past potential black leading frame
  });

  video.addEventListener("seeked", () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (!hasTriedFallback && isFrameBlack(context, canvas.width, canvas.height)) {
      hasTriedFallback = true;
      video.currentTime = Math.min(0.5, video.duration - 0.1);
      return;
    }

    const base64Image = canvas.toDataURL("image/jpeg", 0.95);

    if (callbacks?.onSuccess) {
      callbacks.onSuccess(base64Image);
    }

    video.remove();
    canvas.remove();
  });

  video.addEventListener("error", (error) => {
    if (callbacks?.onError) {
      callbacks.onError(error);
    }
  });

  video.load();
};

/**
 * Convert base64 to blob for upload
 * @param {string} base64 - Base64 image string
 * @param {string} mime - MIME type (default: image/jpeg)
 * @returns {Blob} Blob object
 */
export const base64ToBlob = (base64, mime = "image/jpeg") => {
  const byteString = atob(base64.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mime });
};

/**
 * Generate unique filename with timestamp and random suffix
 * @param {File} file - Original file
 * @param {string} suffix - Suffix to add (e.g., "_frame")
 * @param {string} extension - File extension (e.g., "jpg")
 * @returns {string} Unique filename
 */
export const generateUniqueFileName = (file, suffix = "", extension = null) => {
  const baseName = file.name.split(".")[0].replace(/\s+/g, '_'); // Replace spaces with underscores
  const ext = extension || file.name.split(".").pop();
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random

  return `${baseName}_${timestamp}${random}${suffix}.${ext}`;
};

/**
 * Get environment from REACT_APP_ENVIRONMENT variable
 * @returns {string} Environment name ('dev2', 'dev1', 'prod', etc.)
 */
export const getEnvironment = () => {
  const env = process.env.REACT_APP_ENVIRONMENT || 'dev2';

  // Debug logging
  console.log('[getEnvironment] REACT_APP_ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);
  console.log('[getEnvironment] resolved env:', env);

  // Return environment directly (prod, dev1, dev2)
  if (env === 'prod') return 'prod';
  if (env === 'dev1') return 'dev1';
  if (env === 'dev2') return 'dev2';

  // Default to dev2
  return 'dev2';
};

/**
 * Construct public frame URL via admin UI domain
 * @param {string} frameFileName - Frame filename
 * @returns {string} Public URL
 */
export const constructFrameUrl = (frameFileName) => {
  const environment = getEnvironment();
  console.log('environment==========', environment);
  if(environment === 'prod') {
    return `https://admin-ui.aim-football.com/images/prod/frames/${frameFileName}`;
  }
  return `https://dev-admin-ui.aim-football.com/images/${environment}/frames/${frameFileName}`;
};

/**
 * Format time in HH:MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
export const formatVideoTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse time string to seconds
 * @param {string} timeString - Time string (HH:MM:SS or MM:SS)
 * @returns {number} Time in seconds
 */
export const parseTimeToSeconds = (timeString) => {
  const parts = timeString.split(':').reverse();
  let seconds = 0;

  parts.forEach((part, index) => {
    seconds += parseFloat(part) * Math.pow(60, index);
  });

  return seconds;
};

/**
 * Get video metadata
 * @param {File} file - Video file
 * @returns {Promise} Resolves with metadata object
 */
export const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      });
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Capture video thumbnail at specific time
 * @param {HTMLVideoElement} videoElement - Video element
 * @param {number} time - Time in seconds
 * @returns {Promise<Blob>} Thumbnail blob
 */
export const captureVideoThumbnail = (videoElement, time = 0) => {
  return new Promise((resolve, reject) => {
    const video = videoElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const captureFrame = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture thumbnail'));
        }
      }, 'image/jpeg');
    };

    if (time === 0 && video.readyState >= 2) {
      captureFrame();
    } else {
      video.currentTime = time;
      video.onseeked = () => {
        captureFrame();
        video.onseeked = null;
      };
    }
  });
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate video file
 * @param {File} file - Video file
 * @returns {Object} Validation result with valid flag and errors array
 */
export const validateVideoFile = (file) => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/mov'];
  const validExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const maxSize = 500 * 1024 * 1024; // 500MB

  const errors = [];

  // Check MIME type first, but also allow by extension (Windows often misdetects MOV files)
  const fileExtension = file.name ? file.name.toLowerCase().slice(file.name.lastIndexOf('.')) : '';
  const isValidType = validTypes.includes(file.type) ||
                      validExtensions.includes(fileExtension) ||
                      file.type === '' || // Empty MIME type - rely on extension
                      file.type === 'application/octet-stream'; // Generic binary - rely on extension

  if (!isValidType) {
    errors.push(`Invalid file type: ${file.type}. Supported: MP4, WebM, OGG, MOV`);
  }

  if (file.size > maxSize) {
    errors.push(`File too large: ${formatFileSize(file.size)}. Maximum: ${formatFileSize(maxSize)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check browser video codec support
 * @returns {Object} Object with codec support flags
 */
export const checkCodecSupport = () => {
  const video = document.createElement('video');

  return {
    h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
    h265: video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') !== '',
    vp8: video.canPlayType('video/webm; codecs="vp8"') !== '',
    vp9: video.canPlayType('video/webm; codecs="vp9"') !== '',
    av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== '',
  };
};

/**
 * Generate video timeline markers
 * @param {number} duration - Video duration in seconds
 * @param {number} interval - Interval between markers in seconds
 * @returns {Array} Array of marker objects
 */
export const generateTimelineMarkers = (duration, interval = 10) => {
  const markers = [];
  for (let time = 0; time <= duration; time += interval) {
    markers.push({
      time,
      label: formatVideoTime(time),
    });
  }
  return markers;
};
