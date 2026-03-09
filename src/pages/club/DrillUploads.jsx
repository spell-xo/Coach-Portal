import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  TablePagination,
  InputAdornment,
  Grid,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  VideoFile as VideoFileIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import clubService from '../../api/clubService';
import drillService from '../../api/drillService';
import { extractFirstFrame, base64ToBlob, generateUniqueFileName, constructFrameUrl } from '../../utils/videoUtils';
import { uploadExtractedFrame } from '../../components/drills/VideoFrameExtractor';
import { DRILL_STATUS, DRILL_STATUS_LABELS, DRILL_LEVELS, DRILL_TYPES } from '../../constants/drillConstants';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ProfilePictureWithHover from '../../components/ProfilePictureWithHover';

const DrillUploads = ({ hideHeader = false, hideBackButton = false }) => {
  const { clubId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [drillLevel, setDrillLevel] = useState('');
  const [drillType, setDrillType] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Player matching state
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [videoPlayerMap, setVideoPlayerMap] = useState({}); // { fileIndex: playerId }
  const [videoThumbnails, setVideoThumbnails] = useState({}); // { fileIndex: thumbnailDataUrl }

  // Individual row drill level and type state
  const [videoDrillLevelMap, setVideoDrillLevelMap] = useState({}); // { fileIndex: drillLevel }
  const [videoDrillTypeMap, setVideoDrillTypeMap] = useState({}); // { fileIndex: drillType }

  // Hover preview state
  const [hoverAnchor, setHoverAnchor] = useState(null);
  const [hoverThumbnail, setHoverThumbnail] = useState(null);

  // Profile picture hover state
  const [profilePictureHoverAnchor, setProfilePictureHoverAnchor] = useState(null);
  const [profilePictureHoverUrl, setProfilePictureHoverUrl] = useState(null);

  // Selection state
  const [selectedVideos, setSelectedVideos] = useState(new Set());

  // Video player state
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Uploaded drills state
  const [uploadedDrills, setUploadedDrills] = useState([]);
  const [loadingUploadedDrills, setLoadingUploadedDrills] = useState(false);
  const [uploadedDrillsLoaded, setUploadedDrillsLoaded] = useState(false);

  // Upload Drills tab filters and pagination
  const [uploadPage, setUploadPage] = useState(0);
  const [uploadRowsPerPage, setUploadRowsPerPage] = useState(10);
  const [uploadMatchingFilter, setUploadMatchingFilter] = useState('all'); // 'all', 'matched', 'unmatched'
  const [uploadNameSearch, setUploadNameSearch] = useState('');

  // Uploaded Drills tab filters and pagination
  const [uploadedPage, setUploadedPage] = useState(0);
  const [uploadedRowsPerPage, setUploadedRowsPerPage] = useState(10);
  const [uploadedStatusFilter, setUploadedStatusFilter] = useState('all'); // 'all', 'Uploaded', 'Processing', 'Processed'
  const [uploadedLevelFilter, setUploadedLevelFilter] = useState('all');
  const [uploadedTypeFilter, setUploadedTypeFilter] = useState('all');
  const [uploadedPlayerSearch, setUploadedPlayerSearch] = useState('');
  const [uploadedDateFrom, setUploadedDateFrom] = useState('');
  const [uploadedDateTo, setUploadedDateTo] = useState('');

  // Selection state for uploaded drills
  const [selectedUploadedDrills, setSelectedUploadedDrills] = useState(new Set());

  // Edit mode state for uploaded drills
  const [editingDrillId, setEditingDrillId] = useState(null);
  const [editValues, setEditValues] = useState({
    drillLevel: '',
    drillType: '',
    status: '',
  });
  const [updating, setUpdating] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drillToDelete, setDrillToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Use shared drill constants
  const drillLevels = DRILL_LEVELS;

  // Load club players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoadingPlayers(true);
        const response = await clubService.getPlayers(clubId);

        if (response.data) {
          setPlayers(response.data);
        }
      } catch (err) {
        console.error('Error loading players:', err);
        setError('Failed to load players from club');
      } finally {
        setLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, [clubId]);

  // Load uploaded drills when tab changes to "Uploaded Drills" (only once)
  useEffect(() => {
    const loadUploadedDrills = async () => {
      if (activeTab !== 1 || uploadedDrillsLoaded) return; // Only load when on "Uploaded Drills" tab and not already loaded

      try {
        setLoadingUploadedDrills(true);
        // TODO: Replace with actual API endpoint when available
        // const response = await clubService.getUploadedDrills(clubId);
        // setUploadedDrills(response.data);

        // For now, start with empty list - will be populated when user uploads videos
        setUploadedDrills([]);
        setUploadedDrillsLoaded(true); // Mark as loaded
      } catch (err) {
        console.error('Error loading uploaded drills:', err);
        setError('Failed to load uploaded drills');
      } finally {
        setLoadingUploadedDrills(false);
      }
    };

    loadUploadedDrills();
  }, [clubId, activeTab, uploadedDrillsLoaded]);

  // Try to match video filename with player name
  const matchPlayerByFilename = (filename) => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase().trim();

    // Try to find a player whose name matches the filename
    const matchedPlayer = players.find(player => {
      const playerName = player.name.toLowerCase().trim();
      // Check exact match or if filename contains player name
      return playerName === nameWithoutExt ||
             nameWithoutExt.includes(playerName) ||
             playerName.includes(nameWithoutExt);
    });

    return matchedPlayer || null;
  };

  // Auto-match players when files are selected
  useEffect(() => {
    if (selectedFiles.length > 0 && players.length > 0) {
      const newMap = {};
      selectedFiles.forEach((file, index) => {
        const matchedPlayer = matchPlayerByFilename(file.name);
        if (matchedPlayer) {
          newMap[index] = matchedPlayer.id;
        }
      });
      setVideoPlayerMap(newMap);
    }
  }, [selectedFiles, players]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addFiles(files);
  };

  // Handle drag and drop
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  }, []);

  // Generate thumbnail from video file
  const generateThumbnail = (file, index) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);

      video.onloadeddata = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to first frame (0.1 seconds to ensure frame is loaded)
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);

        // Clean up
        URL.revokeObjectURL(video.src);

        resolve({ index, thumbnailUrl });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({ index, thumbnailUrl: null });
      };
    });
  };

  // Add files with validation
  const addFiles = async (files) => {
    setError(null);

    // Filter for video files only
    const videoFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return ['mp4', 'mov', 'avi'].includes(extension);
    });

    if (videoFiles.length === 0) {
      setError('Please select valid video files (MP4, MOV, AVI)');
      return;
    }

    const currentCount = selectedFiles.length;
    const newCount = currentCount + videoFiles.length;

    if (newCount > 50) {
      setError(`You can only upload up to 50 videos. Current: ${currentCount}, Trying to add: ${videoFiles.length}`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...videoFiles]);

    // Auto-select newly added videos
    const startIndex = currentCount;
    const newIndices = videoFiles.map((_, idx) => startIndex + idx);
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      newIndices.forEach(index => newSet.add(index));
      return newSet;
    });

    // Generate thumbnails for new videos
    videoFiles.forEach((file, idx) => {
      generateThumbnail(file, startIndex + idx).then(({ index, thumbnailUrl }) => {
        if (thumbnailUrl) {
          setVideoThumbnails(prev => ({
            ...prev,
            [index]: thumbnailUrl
          }));
        }
      });
    });
  };

  // Handle select all checkbox
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIndices = selectedFiles.map((_, index) => index);
      setSelectedVideos(new Set(allIndices));
    } else {
      setSelectedVideos(new Set());
    }
  };

  // Handle individual video selection
  const handleSelectVideo = (index) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Handle global drill level change (updates all rows)
  const handleGlobalDrillLevelChange = (value) => {
    setDrillLevel(value);
    setDrillType(''); // Clear drill type when level changes
    // Update all individual row values
    const newLevelMap = {};
    const newTypeMap = {};
    selectedFiles.forEach((_, index) => {
      newLevelMap[index] = value;
      newTypeMap[index] = ''; // Clear row drill type when level changes
    });
    setVideoDrillLevelMap(newLevelMap);
    setVideoDrillTypeMap(newTypeMap);
  };

  // Handle global drill type change (updates all rows)
  const handleGlobalDrillTypeChange = (value) => {
    setDrillType(value);
    // Update all individual row values
    const newMap = {};
    selectedFiles.forEach((_, index) => {
      newMap[index] = value;
    });
    setVideoDrillTypeMap(newMap);
  };

  // Handle individual row drill level change
  const handleRowDrillLevelChange = (index, value) => {
    setVideoDrillLevelMap(prev => ({
      ...prev,
      [index]: value
    }));
    // Clear drill type for this row when level changes
    setVideoDrillTypeMap(prev => ({
      ...prev,
      [index]: ''
    }));
  };

  // Handle individual row drill type change
  const handleRowDrillTypeChange = (index, value) => {
    setVideoDrillTypeMap(prev => ({
      ...prev,
      [index]: value
    }));
  };

  // Remove file
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));

    // Remove from videoPlayerMap and reindex
    setVideoPlayerMap(prev => {
      const newMap = {};
      Object.keys(prev).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newMap[keyIndex] = prev[keyIndex];
        } else if (keyIndex > index) {
          newMap[keyIndex - 1] = prev[keyIndex];
        }
      });
      return newMap;
    });

    // Remove from videoThumbnails and reindex
    setVideoThumbnails(prev => {
      const newMap = {};
      Object.keys(prev).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newMap[keyIndex] = prev[keyIndex];
        } else if (keyIndex > index) {
          newMap[keyIndex - 1] = prev[keyIndex];
        }
      });
      return newMap;
    });

    // Remove from selectedVideos and reindex
    setSelectedVideos(prev => {
      const newSet = new Set();
      prev.forEach(selectedIndex => {
        if (selectedIndex < index) {
          newSet.add(selectedIndex);
        } else if (selectedIndex > index) {
          newSet.add(selectedIndex - 1);
        }
        // Don't add if selectedIndex === index (we're removing it)
      });
      return newSet;
    });
  };

  // Handle play video
  const handlePlayVideo = (index) => {
    const file = selectedFiles[index];
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setPlayingVideoIndex(index);
  };

  // Handle close video player
  const handleCloseVideoPlayer = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setPlayingVideoIndex(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Extract and upload frame for a video file
   * @param {File} file - Video file
   * @returns {Promise<{frameFileName: string, frameUrl: string}>}
   */
  const extractAndUploadFrame = async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Create object URL for video
        const videoURL = URL.createObjectURL(file);

        // Extract first frame
        extractFirstFrame(videoURL, {
          onSuccess: async (base64Image) => {
            try {
              // Upload frame to GCP
              const { frameFileName, frameUrl } = await uploadExtractedFrame(base64Image, file);

              // Clean up
              URL.revokeObjectURL(videoURL);

              resolve({ frameFileName, frameUrl });
            } catch (error) {
              URL.revokeObjectURL(videoURL);
              reject(error);
            }
          },
          onError: (error) => {
            URL.revokeObjectURL(videoURL);
            reject(error);
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  // Handle upload
  const handleUpload = async () => {
    // Validation
    if (selectedVideos.size === 0) {
      setError('Please select at least one video to upload');
      return;
    }

    // Check that all selected videos have a player assigned (including UNMATCHED)
    const selectedIndices = Array.from(selectedVideos);
    const unassignedVideos = selectedIndices.filter(index => !videoPlayerMap[index]);
    if (unassignedVideos.length > 0) {
      const unassignedFileNames = unassignedVideos
        .map(index => selectedFiles[index].name)
        .join(', ');
      setError(
        `${unassignedVideos.length} selected video(s) do not have a player assigned. ` +
        `Please select a player or mark as UNMATCHED before uploading: ${unassignedFileNames}`
      );
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // STEP 1: Generate pre-signed URLs from backend
      setUploadProgress(10);
      const videosForUpload = selectedIndices.map(index => {
        const file = selectedFiles[index];
        return {
          fileName: file.name,
          contentType: file.type || 'video/mp4',
          size: file.size,
        };
      });

      const preSignedResponse = await drillService.generateBatchPreSignedUrls(
        clubId,
        videosForUpload
      );

      if (!preSignedResponse.success || !preSignedResponse.data?.uploadUrls) {
        throw new Error('Failed to generate upload URLs');
      }

      const uploadUrls = preSignedResponse.data.uploadUrls;
      setUploadProgress(20);

      // STEP 2: Upload videos to GCS using pre-signed URLs and extract frames
      const totalVideos = selectedIndices.length;
      const uploadedVideos = [];

      for (let i = 0; i < selectedIndices.length; i++) {
        const index = selectedIndices[i];
        const file = selectedFiles[index];
        const uploadInfo = uploadUrls[i];

        try {
          // Upload file to GCS using pre-signed URL
          const uploadResponse = await fetch(uploadInfo.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type || 'video/mp4',
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name} to storage`);
          }

          // Extract and upload frame
          let frameFileName = null;
          let frameUrl = null;
          try {
            const frameData = await extractAndUploadFrame(file);
            frameFileName = frameData.frameFileName;
            frameUrl = frameData.frameUrl;
          } catch (frameError) {
            console.warn(`Failed to extract frame for ${file.name}:`, frameError);
            // Continue without frame - video will still be uploaded
          }

          // Send GCS paths to backend - backend will construct full URLs
          // Get individual row drill level and type, or use global as fallback
          const rowDrillLevel = videoDrillLevelMap[index] || drillLevel;
          const rowDrillType = videoDrillTypeMap[index] || drillType;
          const isUnmatched = videoPlayerMap[index] === 'UNMATCHED';

          uploadedVideos.push({
            fileName: file.name,
            filepath: uploadInfo.filepath, // GCS path: images/dev2/videos/...
            videoId: uploadInfo.videoId,
            bucketName: uploadInfo.bucketName,
            playerId: isUnmatched ? null : videoPlayerMap[index],
            drillLevel: rowDrillLevel,
            drillType: rowDrillType,
            status: isUnmatched ? 'UNMATCHED' : undefined, // Set status to UNMATCHED for unmatched players
            frameFileName: frameFileName,
            frameUrl: frameUrl, // Frame URL is already constructed by uploadExtractedFrame
          });

          // Update progress
          const progress = 20 + Math.floor((i + 1) / totalVideos * 60);
          setUploadProgress(progress);
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }
      }

      setUploadProgress(85);

      // STEP 3: Register batch in backend database
      const registerResponse = await drillService.registerBatchUpload(
        clubId,
        uploadedVideos,
        drillLevel || null,  // Pass null if global value is empty
        drillType || null,   // Pass null if global value is empty
        true, // performPostProcessing - always true for now
        true // generateAnnotatedVideo - always true
      );

      if (!registerResponse.success) {
        throw new Error('Failed to register batch upload in database');
      }

      setUploadProgress(100);

      // Get drill level and type labels
      const drillLevelLabel = drillLevels.find(l => l.value === drillLevel)?.label || drillLevel;
      const drillTypeLabel = DRILL_TYPES().find(t => t.value === drillType)?.label || drillType;

      // Create drill objects for local display
      const newUploadedDrills = selectedIndices.map((index, idx) => {
        const file = selectedFiles[index];
        const playerId = videoPlayerMap[index];
        const player = players.find(p => p.id === playerId);
        const thumbnail = videoThumbnails[index];
        const uploadInfo = uploadedVideos[idx];
        const videoUrl = URL.createObjectURL(file); // Create blob URL for video playback

        // Determine status: if frame was extracted, mark as pending annotation
        const status = uploadInfo.frameUrl
          ? DRILL_STATUS.PENDING_MANUAL_ANNOTATION
          : 'Uploaded';

        return {
          id: Date.now() + idx, // Temporary ID
          videoName: file.name,
          playerName: player?.name || 'Unknown Player',
          drillType: drillTypeLabel,
          drillLevel: drillLevelLabel,
          uploadedAt: new Date().toISOString(),
          status: status,
          videoFile: file, // Store the actual file for playback
          videoUrl: videoUrl, // Store blob URL for playback
          thumbnail: thumbnail, // Store thumbnail data URL
          filepath: uploadInfo.filepath,
          videoId: uploadInfo.videoId,
          frameFileName: uploadInfo.frameFileName,
          frameUrl: uploadInfo.frameUrl,
        };
      });

      // Add to uploaded drills
      setUploadedDrills(prev => [...newUploadedDrills, ...prev]);

      // Mark as loaded so useEffect doesn't overwrite our uploads
      setUploadedDrillsLoaded(true);

      // Remove uploaded videos from selected files
      const indicesToRemove = new Set(selectedIndices);
      const remainingFiles = selectedFiles.filter((_, index) => !indicesToRemove.has(index));
      setSelectedFiles(remainingFiles);

      // Clear video player mappings for removed files and reindex remaining
      const newVideoPlayerMap = {};
      let newIndex = 0;
      Object.keys(videoPlayerMap).forEach(key => {
        const oldIndex = parseInt(key);
        if (!indicesToRemove.has(oldIndex)) {
          newVideoPlayerMap[newIndex] = videoPlayerMap[oldIndex];
          newIndex++;
        }
      });
      setVideoPlayerMap(newVideoPlayerMap);

      // Clear video thumbnails for removed files and reindex remaining
      const newVideoThumbnails = {};
      newIndex = 0;
      Object.keys(videoThumbnails).forEach(key => {
        const oldIndex = parseInt(key);
        if (!indicesToRemove.has(oldIndex)) {
          newVideoThumbnails[newIndex] = videoThumbnails[oldIndex];
          newIndex++;
        }
      });
      setVideoThumbnails(newVideoThumbnails);

      // Clear selection
      setSelectedVideos(new Set());

      // Switch to Uploaded Drills tab
      setActiveTab(1);

      // Success message
      alert(`${selectedIndices.length} video(s) uploaded successfully!`);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload videos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/clubs/${clubId}/dashboard`);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter and paginate Upload Drills
  const getFilteredUploadDrills = () => {
    let filtered = selectedFiles.map((file, index) => ({ file, index }));

    // Apply matching filter
    if (uploadMatchingFilter === 'matched') {
      filtered = filtered.filter(({ index }) => videoPlayerMap[index]);
    } else if (uploadMatchingFilter === 'unmatched') {
      filtered = filtered.filter(({ index }) => !videoPlayerMap[index]);
    }

    // Apply name search
    if (uploadNameSearch.trim()) {
      const searchLower = uploadNameSearch.toLowerCase().trim();
      filtered = filtered.filter(({ file }) =>
        file.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const filteredUploadDrills = getFilteredUploadDrills();
  const paginatedUploadDrills = filteredUploadDrills.slice(
    uploadPage * uploadRowsPerPage,
    uploadPage * uploadRowsPerPage + uploadRowsPerPage
  );

  // Filter and paginate Uploaded Drills
  const getFilteredUploadedDrills = () => {
    let filtered = [...uploadedDrills];

    // Apply status filter
    if (uploadedStatusFilter !== 'all') {
      filtered = filtered.filter(drill => drill.status === uploadedStatusFilter);
    }

    // Apply level filter
    if (uploadedLevelFilter !== 'all') {
      filtered = filtered.filter(drill => drill.drillLevel === uploadedLevelFilter);
    }

    // Apply type filter
    if (uploadedTypeFilter !== 'all') {
      filtered = filtered.filter(drill => drill.drillType === uploadedTypeFilter);
    }

    // Apply player name search
    if (uploadedPlayerSearch.trim()) {
      const searchLower = uploadedPlayerSearch.toLowerCase().trim();
      filtered = filtered.filter(drill =>
        drill.playerName.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filter
    if (uploadedDateFrom) {
      const fromDate = new Date(uploadedDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(drill => {
        const drillDate = new Date(drill.uploadedAt);
        drillDate.setHours(0, 0, 0, 0);
        return drillDate >= fromDate;
      });
    }

    if (uploadedDateTo) {
      const toDate = new Date(uploadedDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(drill => {
        const drillDate = new Date(drill.uploadedAt);
        return drillDate <= toDate;
      });
    }

    return filtered;
  };

  const filteredUploadedDrills = getFilteredUploadedDrills();
  const paginatedUploadedDrills = filteredUploadedDrills.slice(
    uploadedPage * uploadedRowsPerPage,
    uploadedPage * uploadedRowsPerPage + uploadedRowsPerPage
  );

  // Pagination handlers
  const handleUploadPageChange = (event, newPage) => {
    setUploadPage(newPage);
  };

  const handleUploadRowsPerPageChange = (event) => {
    setUploadRowsPerPage(parseInt(event.target.value, 10));
    setUploadPage(0);
  };

  const handleUploadedPageChange = (event, newPage) => {
    setUploadedPage(newPage);
  };

  const handleUploadedRowsPerPageChange = (event) => {
    setUploadedRowsPerPage(parseInt(event.target.value, 10));
    setUploadedPage(0);
  };

  // Uploaded drills selection handlers
  const handleSelectAllUploadedDrills = (event) => {
    if (event.target.checked) {
      // Select all drills that are eligible for processing (status = 'Uploaded')
      const eligibleDrillIds = filteredUploadedDrills
        .filter(drill => drill.status === 'Uploaded')
        .map(drill => drill.id);
      setSelectedUploadedDrills(new Set(eligibleDrillIds));
    } else {
      setSelectedUploadedDrills(new Set());
    }
  };

  const handleSelectUploadedDrill = (drillId) => {
    setSelectedUploadedDrills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drillId)) {
        newSet.delete(drillId);
      } else {
        newSet.add(drillId);
      }
      return newSet;
    });
  };

  // Send selected drills to processing queue
  const handleSendToProcessing = async () => {
    if (selectedUploadedDrills.size === 0) {
      setError('Please select at least one drill to process');
      return;
    }

    try {
      setError(null);

      // Call API to send drills to processing
      const response = await drillService.sendToProcessing(clubId, Array.from(selectedUploadedDrills));

      console.log('Send to processing response:', response);

      // Update drill statuses to 'Processing' based on API response
      if (response.success) {
        setUploadedDrills(prev =>
          prev.map(drill =>
            selectedUploadedDrills.has(drill.id)
              ? { ...drill, status: 'Processing' }
              : drill
          )
        );

        // Clear selection
        setSelectedUploadedDrills(new Set());

        // Success message
        alert(response.message || `${selectedUploadedDrills.size} drill(s) sent to processing queue!`);
      } else {
        throw new Error(response.message || 'Failed to send drills to processing');
      }
    } catch (err) {
      console.error('Error sending drills to processing:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send drills to processing');
    }
  };

  // Handle start editing a drill
  const handleStartEdit = (drill) => {
    setEditingDrillId(drill.id);

    // Convert display labels back to values
    const drillLevelValue = drillLevels.find(l => l.label === drill.drillLevel)?.value || '';
    const drillTypeValue = DRILL_TYPES().find(t => t.label === drill.drillType)?.value || '';

    setEditValues({
      drillLevel: drillLevelValue,
      drillType: drillTypeValue,
      status: drill.status,
    });
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingDrillId(null);
    setEditValues({
      drillLevel: '',
      drillType: '',
      status: '',
    });
  };

  // Handle update drill
  const handleUpdateDrill = async (drill) => {
    setError(null);
    setUpdating(true);

    try {
      // Call API to update drill
      await drillService.updateDrill(drill.videoId || drill.id, {
        drillLevel: editValues.drillLevel,
        drillType: editValues.drillType,
        status: editValues.status,
      });

      // Update local state
      const drillLevelLabel = drillLevels.find(l => l.value === editValues.drillLevel)?.label || editValues.drillLevel;
      const drillTypeLabel = DRILL_TYPES().find(t => t.value === editValues.drillType)?.label || editValues.drillType;

      setUploadedDrills(prev =>
        prev.map(d =>
          d.id === drill.id
            ? {
                ...d,
                drillLevel: drillLevelLabel,
                drillType: drillTypeLabel,
                status: editValues.status,
              }
            : d
        )
      );

      // Exit edit mode
      setEditingDrillId(null);
      setEditValues({
        drillLevel: '',
        drillType: '',
        status: '',
      });

      alert('Drill updated successfully!');
    } catch (err) {
      console.error('Error updating drill:', err);
      setError(err.response?.data?.message || 'Failed to update drill');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (drill) => {
    setDrillToDelete(drill);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!drillToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await drillService.deleteDrill(drillToDelete.videoId || drillToDelete.id, true);

      // Remove from local state
      setUploadedDrills(prev => prev.filter(d => d.id !== drillToDelete.id));

      setDeleteDialogOpen(false);
      setDrillToDelete(null);

      // Show success message
      alert('Drill deleted successfully from database and storage!');
    } catch (err) {
      console.error('Error deleting drill:', err);
      setError(err.response?.data?.message || 'Failed to delete drill');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDrillToDelete(null);
  };

  // Render content directly if hideHeader is true (embedded mode)
  const renderContent = () => (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Show tabs only if not hiding header */}
      {!hideHeader && (
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="drill management tabs">
            <Tab label="Upload Drills" />
            <Tab label="Uploaded Drills" />
          </Tabs>
        </Paper>
      )}

      {/* Tab Panel: Upload Drills */}
      {(hideHeader || activeTab === 0) && (
            <Paper sx={{ p: 4 }}>
            {/* Drill Level and Type Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Default Drill Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set default drill level and type for all videos. You can customize individual videos later.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Drill level</InputLabel>
                    <Select
                      value={drillLevel}
                      label="Drill level"
                      onChange={(e) => handleGlobalDrillLevelChange(e.target.value)}
                    >
                      {drillLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          {level.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Drill type</InputLabel>
                    <Select
                      value={drillType}
                      label="Drill type"
                      onChange={(e) => handleGlobalDrillTypeChange(e.target.value)}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      }}
                    >
                      {DRILL_TYPES(drillLevel || null).map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* File Upload Area */}
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                mb: 3,
                textAlign: 'center',
                bgcolor: dragOver ? 'action.hover' : 'background.default',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => document.getElementById('video-file-input').click()}
            >
              <input
                id="video-file-input"
                type="file"
                multiple
                accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Click or Drag up to 50 video files here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: MP4, MOV, AVI
              </Typography>
              {selectedFiles.length > 0 && (
                <Chip
                  label={`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`}
                  color="primary"
                  sx={{ mt: 2 }}
                />
              )}
            </Box>

            {/* Selected Files and Player Matching */}
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Video Player Matching ({selectedFiles.length}/50)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${Object.keys(videoPlayerMap).length} Matched`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      icon={<WarningIcon />}
                      label={`${selectedFiles.length - Object.keys(videoPlayerMap).length} Unmatched`}
                      color="warning"
                      size="small"
                    />
                  </Box>
                </Box>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search by name"
                      value={uploadNameSearch}
                      onChange={(e) => {
                        setUploadNameSearch(e.target.value);
                        setUploadPage(0);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Matching Status</InputLabel>
                      <Select
                        value={uploadMatchingFilter}
                        label="Matching Status"
                        onChange={(e) => {
                          setUploadMatchingFilter(e.target.value);
                          setUploadPage(0);
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="matched">Matched</MenuItem>
                        <MenuItem value="unmatched">Unmatched</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1000 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedFiles.length > 0 && selectedVideos.size === selectedFiles.length}
                            indeterminate={selectedVideos.size > 0 && selectedVideos.size < selectedFiles.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Video File</TableCell>
                        <TableCell>Player</TableCell>
                        <TableCell>Drill Level</TableCell>
                        <TableCell>Drill Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUploadDrills.map(({ file, index }) => {
                        const matchedPlayerId = videoPlayerMap[index];
                        const matchedPlayer = players.find(p => p.id === matchedPlayerId);
                        const isMatched = matchedPlayerId && matchedPlayerId !== 'UNMATCHED';
                        const isUnmatched = matchedPlayerId === 'UNMATCHED';

                        // Get individual row drill level and type, or use global as fallback
                        const rowDrillLevel = videoDrillLevelMap[index] || drillLevel;
                        const rowDrillType = videoDrillTypeMap[index] || drillType;

                        return (
                          <TableRow key={index}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedVideos.has(index)}
                                onChange={() => handleSelectVideo(index)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Video Thumbnail */}
                                {videoThumbnails[index] ? (
                                  <Box
                                    sx={{
                                      position: 'relative',
                                      width: 80,
                                      height: 60,
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                      setHoverAnchor(e.currentTarget);
                                      setHoverThumbnail(videoThumbnails[index]);
                                    }}
                                    onMouseLeave={() => {
                                      setHoverAnchor(null);
                                      setHoverThumbnail(null);
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={videoThumbnails[index]}
                                      alt="Video preview"
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                          transform: 'scale(1.05)',
                                          boxShadow: 2,
                                        },
                                      }}
                                    />
                                    {/* Play Button Overlay */}
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayVideo(index);
                                      }}
                                      sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white',
                                        '&:hover': {
                                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                                        },
                                        padding: '4px',
                                      }}
                                      size="small"
                                    >
                                      <PlayArrowIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      width: 80,
                                      height: 60,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'grey.100',
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                    }}
                                  >
                                    <VideoFileIcon sx={{ color: 'grey.400' }} />
                                  </Box>
                                )}
                                {/* File Info */}
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {formatFileSize(file.size)}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Autocomplete
                                size="small"
                                options={[{ id: 'UNMATCHED', name: 'UNMATCHED', email: '' }, ...players]}
                                getOptionLabel={(option) => {
                                  if (option.id === 'UNMATCHED') return 'UNMATCHED';
                                  return `${option.name} (${option.email})`;
                                }}
                                value={isUnmatched ? { id: 'UNMATCHED', name: 'UNMATCHED', email: '' } : (matchedPlayer || null)}
                                onChange={(event, newValue) => {
                                  setVideoPlayerMap(prev => ({
                                    ...prev,
                                    [index]: newValue ? newValue.id : null
                                  }));
                                }}
                                renderOption={(props, option) => {
                                  const { key, ...otherProps } = props;
                                  if (option.id === 'UNMATCHED') {
                                    return (
                                      <Box component="li" key={key} {...otherProps}>
                                        <Typography fontWeight="medium">UNMATCHED</Typography>
                                      </Box>
                                    );
                                  }
                                  return (
                                    <Box
                                      component="li"
                                      key={key}
                                      {...otherProps}
                                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                                    >
                                      <ProfilePictureWithHover
                                        src={option.profilePicture}
                                        alt={option.name}
                                        size={32}
                                        zoomSize={150}
                                      />
                                      <Box>
                                        <Typography variant="body2" fontWeight="medium">
                                          {option.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {option.email}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  );
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Select player..."
                                    variant="outlined"
                                  />
                                )}
                                sx={{ minWidth: 250 }}
                              />
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={rowDrillLevel}
                                  onChange={(e) => handleRowDrillLevelChange(index, e.target.value)}
                                  displayEmpty
                                >
                                  {drillLevels.map((level) => (
                                    <MenuItem key={level.value} value={level.value}>
                                      {level.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={rowDrillType}
                                  onChange={(e) => handleRowDrillTypeChange(index, e.target.value)}
                                  displayEmpty
                                  MenuProps={{
                                    PaperProps: {
                                      style: {
                                        maxHeight: 300,
                                      },
                                    },
                                  }}
                                >
                                  {DRILL_TYPES(rowDrillLevel || null).map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                      {type.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              {isMatched ? (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Matched"
                                  color="success"
                                  size="small"
                                />
                              ) : isUnmatched ? (
                                <Chip
                                  label="UNMATCHED"
                                  color="default"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  icon={<WarningIcon />}
                                  label="Select Player"
                                  color="warning"
                                  size="small"
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveFile(index)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredUploadDrills.length}
                    rowsPerPage={uploadRowsPerPage}
                    page={uploadPage}
                    onPageChange={handleUploadPageChange}
                    onRowsPerPageChange={handleUploadRowsPerPageChange}
                  />
                </TableContainer>
              </Box>
            )}

            {/* Upload Progress */}
            {uploading && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Uploading videos... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={uploading || selectedVideos.size === 0}
                startIcon={<CloudUploadIcon />}
              >
                Upload Selected Videos ({selectedVideos.size})
              </Button>
            </Box>
          </Paper>
          )}

      {/* Tab Panel: Uploaded Drills */}
      {!hideHeader && activeTab === 1 && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Previously Uploaded Drills
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View and manage drills that have been uploaded to this club
                  </Typography>
                </Box>

                {/* Send to Processing Button */}
                {uploadedDrills.length > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendToProcessing}
                    disabled={selectedUploadedDrills.size === 0}
                    startIcon={<CloudUploadIcon />}
                  >
                    Send to Processing ({selectedUploadedDrills.size})
                  </Button>
                )}
              </Box>

              {/* Filters */}
              {uploadedDrills.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search player name"
                      value={uploadedPlayerSearch}
                      onChange={(e) => {
                        setUploadedPlayerSearch(e.target.value);
                        setUploadedPage(0);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={uploadedStatusFilter}
                        label="Status"
                        onChange={(e) => {
                          setUploadedStatusFilter(e.target.value);
                          setUploadedPage(0);
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="Uploaded">Uploaded</MenuItem>
                        <MenuItem value="Processing">Processing</MenuItem>
                        <MenuItem value="Processed">Processed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Level</InputLabel>
                      <Select
                        value={uploadedLevelFilter}
                        label="Level"
                        onChange={(e) => {
                          setUploadedLevelFilter(e.target.value);
                          setUploadedPage(0);
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {drillLevels.map((level) => (
                          <MenuItem key={level.value} value={level.label}>
                            {level.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Drill Type</InputLabel>
                      <Select
                        value={uploadedTypeFilter}
                        label="Drill Type"
                        onChange={(e) => {
                          setUploadedTypeFilter(e.target.value);
                          setUploadedPage(0);
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {DRILL_TYPES(uploadedLevelFilter === 'all' ? null : drillLevels.find(l => l.label === uploadedLevelFilter)?.value).map((type) => (
                          <MenuItem key={type.value} value={type.label}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date From"
                      type="date"
                      value={uploadedDateFrom}
                      onChange={(e) => {
                        setUploadedDateFrom(e.target.value);
                        setUploadedPage(0);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date To"
                      type="date"
                      value={uploadedDateTo}
                      onChange={(e) => {
                        setUploadedDateTo(e.target.value);
                        setUploadedPage(0);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
              )}

              {loadingUploadedDrills ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : uploadedDrills.length === 0 ? (
                <Alert severity="info">
                  No drills have been uploaded yet. Use the "Upload Drills" tab to upload your first drills.
                </Alert>
              ) : filteredUploadedDrills.length === 0 ? (
                <Alert severity="info">
                  No drills match your current filters. Try adjusting your search criteria.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={
                              filteredUploadedDrills.filter(d => d.status === 'Uploaded').length > 0 &&
                              filteredUploadedDrills
                                .filter(d => d.status === 'Uploaded')
                                .every(d => selectedUploadedDrills.has(d.id))
                            }
                            indeterminate={
                              selectedUploadedDrills.size > 0 &&
                              !filteredUploadedDrills
                                .filter(d => d.status === 'Uploaded')
                                .every(d => selectedUploadedDrills.has(d.id))
                            }
                            onChange={handleSelectAllUploadedDrills}
                          />
                        </TableCell>
                        <TableCell>Video</TableCell>
                        <TableCell>Player</TableCell>
                        <TableCell>Drill Type</TableCell>
                        <TableCell>Level</TableCell>
                        <TableCell>Uploaded</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUploadedDrills.map((drill) => (
                        <TableRow key={drill.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedUploadedDrills.has(drill.id)}
                              onChange={() => handleSelectUploadedDrill(drill.id)}
                              disabled={drill.status !== 'Uploaded'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {/* Video Thumbnail */}
                              {drill.thumbnail ? (
                                <Box
                                  sx={{
                                    position: 'relative',
                                    width: 80,
                                    height: 60,
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => {
                                    setHoverAnchor(e.currentTarget);
                                    setHoverThumbnail(drill.thumbnail);
                                  }}
                                  onMouseLeave={() => {
                                    setHoverAnchor(null);
                                    setHoverThumbnail(null);
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={drill.thumbnail}
                                    alt="Video preview"
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      transition: 'transform 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: 2,
                                      },
                                    }}
                                  />
                                  {/* Play Button Overlay */}
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVideoUrl(drill.videoUrl);
                                      setPlayingVideoIndex(drill.id);
                                    }}
                                    sx={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                                      color: 'white',
                                      '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                                      },
                                      padding: '4px',
                                    }}
                                    size="small"
                                  >
                                    <PlayArrowIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    width: 80,
                                    height: 60,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.100',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  <VideoFileIcon sx={{ color: 'grey.400' }} />
                                </Box>
                              )}
                              {/* File Info */}
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {drill.videoName}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{drill.playerName}</TableCell>
                          <TableCell>
                            {editingDrillId === drill.id ? (
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={editValues.drillType}
                                  onChange={(e) => setEditValues({ ...editValues, drillType: e.target.value })}
                                  MenuProps={{
                                    PaperProps: {
                                      style: {
                                        maxHeight: 300,
                                      },
                                    },
                                  }}
                                >
                                  {DRILL_TYPES(editValues.drillLevel || null).map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                      {type.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              drill.drillType
                            )}
                          </TableCell>
                          <TableCell>
                            {editingDrillId === drill.id ? (
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={editValues.drillLevel}
                                  onChange={(e) => setEditValues({ ...editValues, drillLevel: e.target.value })}
                                >
                                  {drillLevels.map((level) => (
                                    <MenuItem key={level.value} value={level.value}>
                                      {level.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              drill.drillLevel
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(drill.uploadedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {editingDrillId === drill.id ? (
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={editValues.status}
                                  onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                                >
                                  {Object.keys(DRILL_STATUS).map((statusKey) => (
                                    <MenuItem key={statusKey} value={DRILL_STATUS[statusKey]}>
                                      {DRILL_STATUS_LABELS[DRILL_STATUS[statusKey]]}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <Chip
                                label={DRILL_STATUS_LABELS[drill.status] || drill.status}
                                size="small"
                                color={
                                  drill.status === 'PROCESSED' ? 'success' :
                                  drill.status === 'UPLOADED' ? 'info' :
                                  drill.status === 'PROCESSING' ? 'warning' :
                                  drill.status === 'FAILED' ? 'error' :
                                  'default'
                                }
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {editingDrillId === drill.id ? (
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleUpdateDrill(drill)}
                                  disabled={updating}
                                >
                                  <CheckIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={handleCancelEdit}
                                  disabled={updating}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartEdit(drill)}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteClick(drill)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredUploadedDrills.length}
                    rowsPerPage={uploadedRowsPerPage}
                    page={uploadedPage}
                    onPageChange={handleUploadedPageChange}
                    onRowsPerPageChange={handleUploadedRowsPerPageChange}
                  />
                </TableContainer>
              )}
            </Paper>
          )}

      {/* Hover Preview Popover - Shared between both tabs */}
      <Popover
        open={Boolean(hoverAnchor)}
        anchorEl={hoverAnchor}
        onClose={() => {
          setHoverAnchor(null);
          setHoverThumbnail(null);
        }}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        sx={{
          pointerEvents: 'none',
        }}
        disableRestoreFocus
      >
        <Box
          component="img"
          src={hoverThumbnail}
          alt="Video preview large"
          sx={{
            maxWidth: 600,
            maxHeight: 400,
            display: 'block',
          }}
        />
      </Popover>

      {/* Profile Picture Hover Popover - DISABLED */}
      {/*
      <Popover
        open={Boolean(profilePictureHoverAnchor)}
        anchorEl={profilePictureHoverAnchor}
        onClose={() => {
          setProfilePictureHoverAnchor(null);
          setProfilePictureHoverUrl(null);
        }}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        sx={{
          pointerEvents: 'none',
        }}
        disableRestoreFocus
      >
        <Box
          component="img"
          src={profilePictureHoverUrl}
          alt="Profile picture preview"
          sx={{
            width: 200,
            height: 200,
            display: 'block',
            objectFit: 'cover',
            borderRadius: 1,
          }}
        />
      </Popover>
      */}

      {/* Video Player Dialog - Shared between both tabs */}
      <Dialog
        open={playingVideoIndex !== null}
        onClose={handleCloseVideoPlayer}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {playingVideoIndex !== null && (
            // Check if playing from Upload tab (number index) or Uploaded tab (drill id)
            typeof playingVideoIndex === 'number' && playingVideoIndex < 1000
              ? selectedFiles[playingVideoIndex]?.name
              : uploadedDrills.find(d => d.id === playingVideoIndex)?.videoName
          )}
        </DialogTitle>
        <DialogContent>
          {videoUrl && (
            <Box
              component="video"
              controls
              autoPlay
              src={videoUrl}
              sx={{
                width: '100%',
                maxHeight: '70vh',
                bgcolor: 'black',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVideoPlayer}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // Return embedded or standalone mode
  if (hideHeader) {
    // Embedded mode - just return the content
    return renderContent();
  }

  // Standalone mode - wrap with AppLayout and RequireRole
  return (
    <RequireRole roles={['head_coach', 'coach']}>
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          {!hideBackButton && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate(`/clubs/${clubId}/dashboard`)}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                  Drill Management
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => navigate(`/clubs/${clubId}/drills/manual-annotation`)}
              >
                Manual Annotation Queue
              </Button>
            </Box>
          )}

          {renderContent()}

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            aria-labelledby="delete-dialog-title"
          >
            <DialogTitle id="delete-dialog-title">
              Delete Drill?
            </DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this drill? This will permanently delete the drill from both the database and Google Cloud Storage.
              </Typography>
              {drillToDelete && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Player:</strong> {drillToDelete.playerName || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {DRILL_STATUS_LABELS[drillToDelete.status] || drillToDelete.status}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteCancel} disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                color="error"
                variant="contained"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AppLayout>
    </RequireRole>
  );
};

export default DrillUploads;
