import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Modal,
  Backdrop,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  VideoLibrary as VideoLibraryIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ContentCut as ContentCutIcon,
  CloudUpload as CloudUploadIcon,
  SwapHoriz as SwapHorizIcon,
  RestartAlt as RestartAltIcon,
  Grade as GradeIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useDropzone } from 'react-dropzone';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import PatternCountWarning from '../../components/PatternCountWarning';
import ConeCountWarning from '../../components/ConeCountWarning';
import ManualConeDetection from '../../components/drills/ManualConeDetection';
import Timeline from '../../components/video-splitter/Timeline';
import DropZone from '../../components/video-splitter/DropZone';
import VideoPlayerMatchingTable from '../../components/drills/VideoPlayerMatchingTable';
import ManualScoringModal from '../../components/drills/ManualScoringModal';
import ScoreComparisonModal from '../../components/drills/ScoreComparisonModal';
import drillService from '../../api/drillService';
import manualScoringService from '../../api/manualScoringService';
import clubService from '../../api/clubService';
import { extractFirstFrame } from '../../utils/videoUtils';
import { uploadExtractedFrame } from '../../components/drills/VideoFrameExtractor';
import { DRILL_STATUS, DRILL_STATUS_LABELS, DRILL_STATUS_COLORS, DRILL_LEVELS, DRILL_TYPES } from '../../constants/drillConstants';
import '../../pages/club/DrillUpload.css';
import { getComparator, stableSort, createSortHandler } from '../../utils/tableSorting';

function DrillsManagement() {
  const navigate = useNavigate();
  const { clubId } = useParams();

  // Use shared drill constants
  const drillLevels = DRILL_LEVELS;

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Upload mode state (for Upload Drills tab)
  const [uploadMode, setUploadMode] = useState('multiple'); // 'multiple' or 'single'

  // Upload functionality state
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [extractedRanges, setExtractedRanges] = useState([]);

  // Shared upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [videoPlayerMap, setVideoPlayerMap] = useState({});
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [videoDrillLevelMap, setVideoDrillLevelMap] = useState({});
  const [videoDrillTypeMap, setVideoDrillTypeMap] = useState({});
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [drillLevel, setDrillLevel] = useState('');
  const [drillType, setDrillType] = useState('');
  const [uploadPage, setUploadPage] = useState(0);
  const [uploadRowsPerPage, setUploadRowsPerPage] = useState(10);
  const [uploadMatchingFilter, setUploadMatchingFilter] = useState('all');
  const [uploadNameSearch, setUploadNameSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  // Uploaded Drills state
  const [uploadedDrills, setUploadedDrills] = useState([]);
  const [loadingUploaded, setLoadingUploaded] = useState(false);
  const [uploadedError, setUploadedError] = useState(null);
  const [uploadedPage, setUploadedPage] = useState(0);
  const [uploadedRowsPerPage, setUploadedRowsPerPage] = useState(10);
  const [uploadedSearch, setUploadedSearch] = useState('');
  const [uploadedStatusFilter, setUploadedStatusFilter] = useState('all');
  const [uploadedPlayerFilter, setUploadedPlayerFilter] = useState('all');
  const [uploadedLevelFilter, setUploadedLevelFilter] = useState('all');
  const [uploadedTypeFilter, setUploadedTypeFilter] = useState('all');
  const [uploadedDateFrom, setUploadedDateFrom] = useState('');
  const [uploadedDateTo, setUploadedDateTo] = useState('');
  const [uploadedOrder, setUploadedOrder] = useState('desc');
  const [uploadedOrderBy, setUploadedOrderBy] = useState('createdAt');

  // Image zoom modal state
  const [zoomedImage, setZoomedImage] = useState(null);

  // Edit mode state for uploaded drills
  const [editingDrillId, setEditingDrillId] = useState(null);
  const [editValues, setEditValues] = useState({
    drillLevel: '',
    drillType: '',
    status: '',
    playerId: '',
    playerName: '',
  });
  const [updating, setUpdating] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drillToDelete, setDrillToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reprocess dialog state
  const [reprocessDialogOpen, setReprocessDialogOpen] = useState(false);
  const [drillToReprocess, setDrillToReprocess] = useState(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessMode, setReprocessMode] = useState('immediate'); // 'immediate' or 'pending_annotation'

  // Video player modal state
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState({});

  // Annotation dialog state
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [selectedDrillForAnnotation, setSelectedDrillForAnnotation] = useState(null);
  const [submittingAnnotation, setSubmittingAnnotation] = useState(false);

  // Manual scoring modal state
  const [manualScoringOpen, setManualScoringOpen] = useState(false);
  const [selectedDrillForScoring, setSelectedDrillForScoring] = useState(null);

  // Score comparison modal state
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedDrillForComparison, setSelectedDrillForComparison] = useState(null);

  // Processed Drills state
  const [processedDrills, setProcessedDrills] = useState([]);
  const [loadingProcessed, setLoadingProcessed] = useState(false);
  const [processedError, setProcessedError] = useState(null);
  const [processedPage, setProcessedPage] = useState(0);
  const [processedRowsPerPage, setProcessedRowsPerPage] = useState(10);
  const [processedSearch, setProcessedSearch] = useState('');
  const [processedPlayerFilter, setProcessedPlayerFilter] = useState('all');

  // Failed Drills state
  const [failedDrills, setFailedDrills] = useState([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [failedError, setFailedError] = useState(null);
  const [failedPage, setFailedPage] = useState(0);
  const [failedRowsPerPage, setFailedRowsPerPage] = useState(10);
  const [failedSearch, setFailedSearch] = useState('');
  const [failedPlayerFilter, setFailedPlayerFilter] = useState('all');

  // Rejected Drills state
  const [rejectedDrills, setRejectedDrills] = useState([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [rejectedError, setRejectedError] = useState(null);
  const [rejectedPage, setRejectedPage] = useState(0);
  const [rejectedRowsPerPage, setRejectedRowsPerPage] = useState(10);
  const [rejectedSearch, setRejectedSearch] = useState('');
  const [rejectedPlayerFilter, setRejectedPlayerFilter] = useState('all');
  const [requeuing, setRequeuing] = useState({});

  // Put back to queue state (for Uploaded Drills tab)
  const [requeueingUploaded, setRequeueingUploaded] = useState({});
  const [requeueUploadedSuccess, setRequeueUploadedSuccess] = useState(null);
  const [requeueUploadedError, setRequeueUploadedError] = useState(null);

  const [processedLevelFilter, setProcessedLevelFilter] = useState('all');
  const [processedTypeFilter, setProcessedTypeFilter] = useState('all');
  const [processedDateFrom, setProcessedDateFrom] = useState('');
  const [processedDateTo, setProcessedDateTo] = useState('');
  const [processedOrder, setProcessedOrder] = useState('desc');
  const [processedOrderBy, setProcessedOrderBy] = useState('createdAt');
  const [showPatternMismatchOnly, setShowPatternMismatchOnly] = useState(false);
  const [showConeCountMismatchOnly, setShowConeCountMismatchOnly] = useState(false);
  const [showManuallyScoredOnly, setShowManuallyScoredOnly] = useState(false);
  const [detectionVersionFilter, setDetectionVersionFilter] = useState('all');
  const [analysisVersionFilter, setAnalysisVersionFilter] = useState('all');
  const [scoringVersionFilter, setScoringVersionFilter] = useState('all');

  // Load appropriate drills based on active tab
  // Players are loaded inside each drill loading function
  useEffect(() => {
    if (activeTab === 0) {
      // Load players for the Upload Drills tab (needed for VideoPlayerMatchingTable)
      loadPlayers();
    } else if (activeTab === 1) {
      loadUploadedDrills();
    } else if (activeTab === 2) {
      loadProcessedDrills();
    } else if (activeTab === 3) {
      loadFailedDrills();
    } else if (activeTab === 4) {
      loadRejectedDrills();
    }
  }, [clubId, activeTab]);

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const response = await clubService.getPlayers(clubId);
      setPlayers(response.data || []);
    } catch (err) {
      console.error('Error loading players:', err);
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const loadUploadedDrills = async () => {
    try {
      setLoadingUploaded(true);
      setUploadedError(null);

      // Load players first to ensure we have fresh data for enrichment
      const playersResponse = await clubService.getPlayers(clubId);
      console.log('Raw playersResponse:', playersResponse);
      console.log('playersResponse keys:', Object.keys(playersResponse));
      console.log('playersResponse.data:', playersResponse.data);

      const playersList = playersResponse.data || [];
      console.log('Loaded players for enrichment:', playersList.length);
      console.log('playersList is array?', Array.isArray(playersList));

      if (playersList.length > 0) {
        console.log('Sample player:', playersList[0]);
        console.log('Sample player keys:', Object.keys(playersList[0]));
        console.log('Sample player _id:', playersList[0]._id);
        console.log('Sample player userId:', playersList[0].userId);
        console.log('Sample player id:', playersList[0].id);
      }

      // Fetch drills that are uploaded but not yet processing (i.e., UNMATCHED, UPLOADED, PENDING_MANUAL_ANNOTATION, FAILED)
      const statuses = [
        'UNMATCHED',
        DRILL_STATUS.UPLOADED,
        DRILL_STATUS.PENDING_MANUAL_ANNOTATION,
        DRILL_STATUS.FAILED
      ];

      // Fetch all statuses in parallel instead of sequentially
      const promises = statuses.map(status =>
        drillService.getDrillsByStatus(clubId, status, { limit: 300 })
          .then(response => response.data || [])
          .catch(err => {
            console.log(`No drills found with status: ${status}`);
            return [];
          })
      );

      const results = await Promise.all(promises);
      const allDrills = results.flat();

      console.log('Loaded uploaded drills:', allDrills.length);
      if (allDrills.length > 0) {
        console.log('Sample drill data:', allDrills[0]);
        console.log('Drill keys:', Object.keys(allDrills[0]));
      }

      // Enrich drills with player names by matching drill.user (ObjectId) against players
      const enrichedDrills = allDrills.map(drill => {
        // The drill.user field contains the player's ObjectId (as string when using .lean())
        const userId = drill.user;

        console.log(`Drill ${drill._id}: user field = ${userId}, type = ${typeof userId}`);

        // Try to find player by matching against id field (players use 'id' not '_id')
        if (userId) {
          const player = playersList.find(p =>
            String(p.id) === String(userId)
          );

          if (player) {
            console.log(`Drill ${drill._id}: matched player=${player.name} (email: ${player.email})`);
            return {
              ...drill,
              playerName: player.name // Add playerName for UI display
            };
          } else {
            console.log(`Drill ${drill._id}: no player match found for userId=${userId} (player may be inactive or removed)`);
            return {
              ...drill,
              playerName: 'Unknown Player (Inactive)' // Player not in active players list
            };
          }
        } else {
          console.log(`Drill ${drill._id}: no user field found`);
          return {
            ...drill,
            playerName: 'No Player Assigned'
          };
        }

        return drill;
      });

      setUploadedDrills(enrichedDrills);
      setPlayers(playersList); // Update players state for the edit dropdown
    } catch (err) {
      console.error('Error loading uploaded drills:', err);
      setUploadedError('Failed to load uploaded drills');
    } finally {
      setLoadingUploaded(false);
    }
  };

  const loadProcessedDrills = async () => {
    try {
      setLoadingProcessed(true);
      setProcessedError(null);

      // Load players and scored video IDs in parallel
      const [playersResponse, scoredResponse] = await Promise.all([
        clubService.getPlayers(clubId),
        manualScoringService.getScoredVideoIds().catch(err => {
          console.log('Failed to load scored video IDs:', err);
          return { data: [] };
        })
      ]);

      const playersList = playersResponse.data || [];
      const scoredVideoIds = (scoredResponse.data || []).map(id => String(id));

      // Fetch drills that are processing or have been processed
      const statuses = [
        DRILL_STATUS.PROCESSING,
        DRILL_STATUS.PROCESSED
      ];

      // Fetch in parallel for performance
      const promises = statuses.map(status =>
        drillService.getDrillsByStatus(clubId, status, { limit: 300 })
          .then(response => response.data || [])
          .catch(err => {
            console.log(`No drills found with status: ${status}`);
            return [];
          })
      );

      const results = await Promise.all(promises);
      const allDrills = results.flat();

      // Create a Set for quick lookup of manually scored video IDs
      const scoredVideoIdsSet = new Set(scoredVideoIds);

      // Enrich with player names and manual scoring status
      const enrichedDrills = allDrills.map(drill => {
        const userId = drill.user;
        const isManuallyScored = scoredVideoIdsSet.has(String(drill._id));

        let playerName = 'No Player Assigned';
        if (userId) {
          const player = playersList.find(p => String(p.id) === String(userId));
          playerName = player ? player.name : 'Unknown Player (Inactive)';
        }

        return {
          ...drill,
          playerName,
          isManuallyScored
        };
      });

      console.log('Manually scored video IDs:', scoredVideoIds);
      console.log('Drills with isManuallyScored:', enrichedDrills.map(d => ({ id: d._id, isManuallyScored: d.isManuallyScored })));

      setProcessedDrills(enrichedDrills);
      setPlayers(playersList);
    } catch (err) {
      console.error('Error loading processed drills:', err);
      setProcessedError('Failed to load processed drills');
    } finally {
      setLoadingProcessed(false);
    }
  };

  const loadFailedDrills = async () => {
    try {
      setLoadingFailed(true);
      setFailedError(null);

      // Load players first for enrichment
      const playersResponse = await clubService.getPlayers(clubId);
      const playersList = playersResponse.data || [];

      // Fetch drills with FAILED status
      const response = await drillService.getDrillsByStatus(clubId, DRILL_STATUS.FAILED, { limit: 300 });
      const drills = response.data || [];

      // Enrich with player names
      const enrichedDrills = drills.map(drill => {
        const userId = drill.user;
        if (userId) {
          const player = playersList.find(p => p._id === userId);
          if (player) {
            return {
              ...drill,
              playerName: player.name
            };
          } else {
            return {
              ...drill,
              playerName: 'Unknown Player (Inactive)'
            };
          }
        }

        return {
          ...drill,
          playerName: 'No Player Assigned'
        };
      });

      setFailedDrills(enrichedDrills);
      setPlayers(playersList);
    } catch (err) {
      console.error('Error loading failed drills:', err);
      setFailedError('Failed to load failed drills');
    } finally {
      setLoadingFailed(false);
    }
  };

  const loadRejectedDrills = async () => {
    try {
      setLoadingRejected(true);
      setRejectedError(null);

      // Load players first for enrichment
      const playersResponse = await clubService.getPlayers(clubId);
      const playersList = playersResponse.data || [];

      // Fetch drills with REJECTED status
      const response = await drillService.getDrillsByStatus(clubId, DRILL_STATUS.REJECTED, { limit: 300 });
      const drills = response.data || [];

      // Enrich with player names - match by converting both to strings (same as Uploaded Drills tab)
      const enrichedDrills = drills.map(drill => {
        const userId = drill.user;
        if (userId) {
          const player = playersList.find(p => String(p.id) === String(userId));
          if (player) {
            return {
              ...drill,
              playerName: player.name
            };
          } else {
            return {
              ...drill,
              playerName: 'Unknown Player'
            };
          }
        }

        return {
          ...drill,
          playerName: 'No Player Assigned'
        };
      });

      setRejectedDrills(enrichedDrills);
      setPlayers(playersList);
    } catch (err) {
      console.error('Error loading rejected drills:', err);
      setRejectedError('Failed to load rejected drills');
    } finally {
      setLoadingRejected(false);
    }
  };

  const handleSkipPreClassifierRequeue = async (drill) => {
    try {
      setRequeuing(prev => ({ ...prev, [drill._id]: true }));
      await drillService.skipPreClassifierAndRequeue(drill._id, drill.user);
      // Refresh the list after successful requeue
      await loadRejectedDrills();
    } catch (err) {
      console.error('Error requeuing drill:', err);
      setRejectedError('Failed to requeue drill');
    } finally {
      setRequeuing(prev => ({ ...prev, [drill._id]: false }));
    }
  };

  // === Upload functionality handlers ===

  // FFmpeg initialization
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        setProcessingProgress(`Processing: ${Math.round(progress * 100)}%`);
      });

      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
      }
    };

    loadFFmpeg();
  }, []);

  // Auto-match players when files are added
  useEffect(() => {
    if (selectedFiles.length > 0 && players.length > 0) {
      const newMap = {};
      selectedFiles.forEach((file, index) => {
        if (!videoPlayerMap[index]) {
          const matchedPlayer = matchPlayerByFilename(file.name);
          if (matchedPlayer) {
            newMap[index] = matchedPlayer.id;
          }
        }
      });
      if (Object.keys(newMap).length > 0) {
        setVideoPlayerMap(prev => ({ ...prev, ...newMap }));
      }
    }
  }, [selectedFiles.length, players]);

  const matchPlayerByFilename = (filename) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase().trim();
    const matchedPlayer = players.find(player => {
      const playerName = player.name.toLowerCase().trim();
      return playerName === nameWithoutExt ||
        nameWithoutExt.includes(playerName) ||
        playerName.includes(nameWithoutExt);
    });
    return matchedPlayer || null;
  };

  const generateThumbnail = (file, index) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(video.src);
        resolve({ index, thumbnailUrl });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({ index, thumbnailUrl: null });
      };
    });
  };

  // Bulk upload handlers
  const onDrop = (acceptedFiles) => {
    const videoFiles = acceptedFiles.filter(file => file.type.startsWith('video/'));
    if (videoFiles.length === 0) {
      setUploadError('Please select valid video files');
      return;
    }

    const currentCount = selectedFiles.length;
    setSelectedFiles(prev => [...prev, ...videoFiles]);

    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      videoFiles.forEach((_, idx) => {
        newSet.add(currentCount + idx);
      });
      return newSet;
    });

    videoFiles.forEach((file, idx) => {
      const actualIndex = currentCount + idx;
      generateThumbnail(file, actualIndex).then(({ index, thumbnailUrl }) => {
        if (thumbnailUrl) {
          setVideoThumbnails(prev => ({
            ...prev,
            [index]: thumbnailUrl
          }));
        }
      });
    });
  };

  // Unified dropzone for both modes
  const onUnifiedDrop = (acceptedFiles) => {
    if (uploadMode === 'multiple') {
      onDrop(acceptedFiles);
    } else {
      // Single file mode for video splitting
      if (acceptedFiles.length > 0) {
        handleVideoLoad(acceptedFiles[0]);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUnifiedDrop,
    accept: { 'video/*': [] },
    multiple: uploadMode === 'multiple',
  });

  // Split video handlers
  const handleVideoLoad = (file) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      const defaultSegmentDuration = Math.max(30, Math.min(duration * 0.2, duration));
      setStartTime(0);
      setEndTime(defaultSegmentDuration);
    }
  };

  const handleTimelineChange = (start, end) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleDrop = async () => {
    if (!videoFile || !ffmpegLoaded) {
      alert('Please wait for FFmpeg to load and select a video');
      return;
    }

    if (startTime >= endTime) {
      alert('Invalid time range');
      return;
    }

    const duration = endTime - startTime;
    if (duration < 30) {
      alert('Segment must be at least 30 seconds long');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress('Initializing...');

    try {
      const ffmpeg = ffmpegRef.current;
      const inputFileName = 'input.mp4';
      const outputFileName = `segment_${Date.now()}.mp4`;

      setProcessingProgress('Loading video...');
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      setProcessingProgress('Trimming video...');
      const segmentDuration = endTime - startTime;

      // Use input seeking (-ss before -i) to seek to nearest keyframe first
      // This avoids the frozen video frames issue at the start
      await ffmpeg.exec([
        '-ss', startTime.toString(),       // Input seeking - fast, seeks to keyframe
        '-i', inputFileName,
        '-t', segmentDuration.toString(),
        '-c', 'copy',                      // Copy streams without re-encoding
        '-avoid_negative_ts', 'make_zero', // Fix timestamp issues
        outputFileName
      ]);

      setProcessingProgress('Finalizing...');
      const data = await ffmpeg.readFile(outputFileName);

      const blob = new Blob([data], { type: 'video/mp4' });
      const file = new File([blob], outputFileName, { type: 'video/mp4' });

      const currentCount = selectedFiles.length;
      setSelectedFiles(prev => [...prev, file]);

      setSelectedVideos(prev => {
        const newSet = new Set(prev);
        newSet.add(currentCount);
        return newSet;
      });

      generateThumbnail(file, currentCount).then(({ index, thumbnailUrl }) => {
        if (thumbnailUrl) {
          setVideoThumbnails(prev => ({
            ...prev,
            [index]: thumbnailUrl
          }));
        }
      });

      const newExtractedRanges = [...extractedRanges, { startTime, endTime }];
      setExtractedRanges(newExtractedRanges);

      const extractedDuration = endTime - startTime;
      const newStart = endTime;
      const newDuration = Math.max(30, extractedDuration);
      const newEnd = Math.min(newStart + newDuration, videoDuration);
      setStartTime(newStart);
      setEndTime(newEnd);

      setProcessingProgress('Complete!');
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress('');
      }, 2000);

      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

    } catch (error) {
      console.error('Error processing video:', error);
      alert('Error processing video. Please try again.');
      setIsProcessing(false);
      setProcessingProgress('');
    }
  };

  const handleResetTimeline = () => {
    setExtractedRanges([]);
    setStartTime(0);
    setEndTime(Math.max(30, Math.min(videoDuration * 0.2, videoDuration)));
  };

  const handleChangeVideo = () => {
    setVideoFile(null);
    setVideoUrl('');
    setExtractedRanges([]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));

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

    setVideoDrillLevelMap(prev => {
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

    setVideoDrillTypeMap(prev => {
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

    setSelectedVideos(prev => {
      const newSet = new Set();
      prev.forEach(selectedIndex => {
        if (selectedIndex < index) {
          newSet.add(selectedIndex);
        } else if (selectedIndex > index) {
          newSet.add(selectedIndex - 1);
        }
      });
      return newSet;
    });
  };

  const handleUpdateFile = (index, newFile) => {
    console.log('📝 [DrillsManagement] handleUpdateFile called for index:', index);
    console.log('📝 [DrillsManagement] New file:', newFile.name, 'Size:', newFile.size);

    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = newFile;
      return newFiles;
    });

    // Also regenerate thumbnail for the trimmed video
    const videoURL = URL.createObjectURL(newFile);
    console.log('📝 [DrillsManagement] Created video URL for thumbnail extraction');

    extractFirstFrame(videoURL, {
      onSuccess: (thumbnail) => {
        console.log('✅ [DrillsManagement] Thumbnail extracted successfully');
        setVideoThumbnails(prev => ({
          ...prev,
          [index]: thumbnail
        }));
        // Clean up the URL after extraction
        URL.revokeObjectURL(videoURL);
      },
      onError: (err) => {
        console.error('❌ [DrillsManagement] Error generating thumbnail:', err);
        // Clean up the URL even on error
        URL.revokeObjectURL(videoURL);
      }
    });
  };

  const handleUpload = async () => {
    console.log('🚀 [DrillsManagement] handleUpload called');
    console.log('📊 [DrillsManagement] selectedVideos.size:', selectedVideos.size);
    console.log('📊 [DrillsManagement] selectedFiles.length:', selectedFiles.length);
    console.log('📊 [DrillsManagement] videoPlayerMap:', videoPlayerMap);

    if (selectedVideos.size === 0) {
      console.log('❌ [DrillsManagement] Early exit: No videos selected');
      setUploadError('Please select at least one video to upload');
      return;
    }

    const selectedIndices = Array.from(selectedVideos);
    console.log('📊 [DrillsManagement] selectedIndices:', selectedIndices);

    const unassignedVideos = selectedIndices.filter(index => !videoPlayerMap[index]);
    console.log('📊 [DrillsManagement] unassignedVideos:', unassignedVideos);

    if (unassignedVideos.length > 0) {
      const unassignedFileNames = unassignedVideos
        .map(index => selectedFiles[index].name)
        .join(', ');
      console.log('❌ [DrillsManagement] Early exit: Unassigned videos found:', unassignedFileNames);
      setUploadError(
        `${unassignedVideos.length} selected video(s) do not have a player assigned. ` +
        `Please select a player or mark as UNMATCHED before uploading: ${unassignedFileNames}`
      );
      return;
    }

    console.log('✅ [DrillsManagement] Validation passed, proceeding with upload');
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(10);
      const videosForUpload = selectedIndices.map(index => {
        const file = selectedFiles[index];
        return {
          fileName: file.name,
          contentType: file.type || 'video/mp4',
          size: file.size,
        };
      });

      console.log('📤 [DrillsManagement] Calling generateBatchPreSignedUrls with clubId:', clubId);
      console.log('📤 [DrillsManagement] videosForUpload:', videosForUpload);

      const preSignedResponse = await drillService.generateBatchPreSignedUrls(
        clubId,
        videosForUpload
      );

      console.log('✅ [DrillsManagement] preSignedResponse received:', preSignedResponse);

      if (!preSignedResponse.success || !preSignedResponse.data?.uploadUrls) {
        throw new Error('Failed to generate upload URLs');
      }

      const uploadUrls = preSignedResponse.data.uploadUrls;
      setUploadProgress(20);

      const totalVideos = selectedIndices.length;
      const uploadedVideos = [];

      for (let i = 0; i < selectedIndices.length; i++) {
        const index = selectedIndices[i];
        const file = selectedFiles[index];
        const uploadInfo = uploadUrls[i];

        try {
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

          let frameFileName = null;
          let frameUrl = null;
          try {
            const videoURL = URL.createObjectURL(file);
            const base64Image = await new Promise((resolve, reject) => {
              extractFirstFrame(videoURL, {
                onSuccess: resolve,
                onError: reject,
              });
            });
            const frameData = await uploadExtractedFrame(base64Image, file);
            frameFileName = frameData.frameFileName;
            frameUrl = frameData.frameUrl;
            URL.revokeObjectURL(videoURL);
          } catch (frameError) {
            console.warn(`Failed to extract frame for ${file.name}:`, frameError);
          }

          const rowDrillLevel = videoDrillLevelMap[index] || drillLevel;
          const rowDrillType = videoDrillTypeMap[index] || drillType;
          const isUnmatched = videoPlayerMap[index] === 'UNMATCHED';

          uploadedVideos.push({
            fileName: file.name,
            filepath: uploadInfo.filepath,
            videoId: uploadInfo.videoId,
            bucketName: uploadInfo.bucketName,
            playerId: isUnmatched ? null : videoPlayerMap[index],
            drillLevel: rowDrillLevel,
            drillType: rowDrillType,
            status: isUnmatched ? 'UNMATCHED' : undefined,
            frameFileName: frameFileName,
            frameUrl: frameUrl,
          });

          const progress = 20 + Math.floor((i + 1) / totalVideos * 60);
          setUploadProgress(progress);
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }
      }

      setUploadProgress(85);

      const registerResponse = await drillService.registerBatchUpload(
        clubId,
        uploadedVideos,
        drillLevel || null,
        drillType || null,
        true,
        false
      );

      if (!registerResponse.success) {
        throw new Error('Failed to register batch upload in database');
      }

      setUploadProgress(100);

      const indicesToRemove = new Set(selectedIndices);
      const remainingFiles = selectedFiles.filter((_, index) => !indicesToRemove.has(index));
      setSelectedFiles(remainingFiles);

      const newVideoPlayerMap = {};
      const newVideoThumbnails = {};
      const newVideoDrillLevelMap = {};
      const newVideoDrillTypeMap = {};
      let newIndex = 0;
      Object.keys(videoPlayerMap).forEach(key => {
        const oldIndex = parseInt(key);
        if (!indicesToRemove.has(oldIndex)) {
          newVideoPlayerMap[newIndex] = videoPlayerMap[oldIndex];
          if (videoThumbnails[oldIndex]) {
            newVideoThumbnails[newIndex] = videoThumbnails[oldIndex];
          }
          if (videoDrillLevelMap[oldIndex]) {
            newVideoDrillLevelMap[newIndex] = videoDrillLevelMap[oldIndex];
          }
          if (videoDrillTypeMap[oldIndex]) {
            newVideoDrillTypeMap[newIndex] = videoDrillTypeMap[oldIndex];
          }
          newIndex++;
        }
      });
      setVideoPlayerMap(newVideoPlayerMap);
      setVideoThumbnails(newVideoThumbnails);
      setVideoDrillLevelMap(newVideoDrillLevelMap);
      setVideoDrillTypeMap(newVideoDrillTypeMap);

      setSelectedVideos(new Set());

      alert(`${selectedIndices.length} video(s) uploaded successfully!`);

      // Refresh uploaded drills list
      loadUploadedDrills();

    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload videos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // === End upload functionality handlers ===

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUploadModeChange = (event, newMode) => {
    if (newMode !== null) {
      setUploadMode(newMode);
      // Clear video when switching modes for clean state
      if (videoFile) {
        setVideoFile(null);
        setVideoUrl('');
        setStartTime(0);
        setEndTime(0);
        setVideoDuration(0);
        setExtractedRanges([]);
      }
    }
  };

  const handleStatusChange = async (drillId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [drillId]: true }));

      // Call the API to update drill status
      await drillService.updateDrillStatus(drillId, newStatus);

      // Update local state
      setUploadedDrills(prev =>
        prev.map(drill =>
          drill._id === drillId ? { ...drill, status: newStatus } : drill
        )
      );

      // If status changed to UPLOADED, automatically send to Pub/Sub for processing
      if (newStatus === DRILL_STATUS.UPLOADED || newStatus === 'UPLOADED') {
        try {
          console.log(`Sending drill ${drillId} to Pub/Sub after status change to UPLOADED`);
          const pubSubResult = await drillService.sendToProcessing(clubId, [drillId]);
          console.log('Pub/Sub publish result:', pubSubResult);

          if (pubSubResult.success) {
            console.log(`Successfully published ${pubSubResult.data.successCount} drill(s) to Pub/Sub`);
          } else {
            console.warn('Pub/Sub publishing failed:', pubSubResult);
          }
        } catch (pubSubError) {
          // Log the error but don't block the UI - status was updated successfully
          console.error('Error publishing to Pub/Sub:', pubSubError);
          setUploadedError('Status updated, but failed to send to processing queue. You may need to manually trigger processing.');
        }
      }
    } catch (error) {
      console.error('Error updating drill status:', error);
      setUploadedError('Failed to update drill status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [drillId]: false }));
    }
  };

  const handleImageClick = (imageUrl) => {
    setZoomedImage(imageUrl);
  };

  const handleCloseZoom = () => {
    setZoomedImage(null);
  };

  const handleVideoClick = (video) => {
    setCurrentVideo(video);
    setVideoPlayerOpen(true);
  };

  const handleCloseVideoPlayer = () => {
    setVideoPlayerOpen(false);
    setCurrentVideo(null);
  };

  // Handle annotate button click
  const handleAnnotateClick = (drill) => {
    console.log("handleAnnotateClick",drill)
    setSelectedDrillForAnnotation(drill);
    setAnnotationDialogOpen(true);
  };

  // Handle start editing a drill
  const handleStartEdit = (drill) => {
    setEditingDrillId(drill._id);

    // Find the drill type value from gameType
    const drillTypeValue = DRILL_TYPES().find(t => t.label === drill.gameType)?.value || drill.gameType || '';
    const drillLevelValue = drillLevels.find(l => l.label === drill.drillLevel)?.value || drill.drillLevel || '';

    setEditValues({
      drillLevel: drillLevelValue,
      drillType: drillTypeValue,
      status: drill.status || '',
      playerId: drill.user || '', // Use drill.user (ObjectId) as the player ID
      playerName: drill.playerName || '', // Use the enriched playerName from our mapping
    });
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingDrillId(null);
    setEditValues({
      drillLevel: '',
      drillType: '',
      status: '',
      playerId: '',
      playerName: '',
    });
  };

  // Handle update drill
  const handleUpdateDrill = async (drill) => {
    setUploadedError(null);
    setUpdating(true);

    try {
      // Prepare update payload
      const updatePayload = {
        drillLevel: editValues.drillLevel,
        gameType: editValues.drillType,
        status: editValues.status,
      };

      // Update the user field (player ID) if selected
      if (editValues.playerId) {
        updatePayload.user = editValues.playerId; // Update the user field with player's ObjectId
      }

      // Call API to update drill
      await drillService.updateDrill(drill._id, updatePayload);

      // Update local state
      const drillLevelLabel = drillLevels.find(l => l.value === editValues.drillLevel)?.label || editValues.drillLevel;
      const drillTypeLabel = DRILL_TYPES().find(t => t.value === editValues.drillType)?.label || editValues.drillType;

      setUploadedDrills(prev =>
        prev.map(d =>
          d._id === drill._id
            ? {
                ...d,
                drillLevel: drillLevelLabel,
                gameType: drillTypeLabel,
                status: editValues.status,
                user: editValues.playerId, // Update user field
                playerName: editValues.playerName, // Update enriched playerName
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
        playerId: '',
        playerName: '',
      });
    } catch (err) {
      console.error('Error updating drill:', err);
      setUploadedError(err.response?.data?.message || 'Failed to update drill');
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
    setUploadedError(null);

    try {
      await drillService.deleteDrill(drillToDelete._id, true);

      // Remove from local state
      setUploadedDrills(prev => prev.filter(d => d._id !== drillToDelete._id));

      setDeleteDialogOpen(false);
      setDrillToDelete(null);

      // Show success message
      alert('Drill deleted successfully from database and storage!');
    } catch (err) {
      console.error('Error deleting drill:', err);
      setUploadedError(err.response?.data?.message || 'Failed to delete drill');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDrillToDelete(null);
  };

  // Manual scoring handlers
  const handleManualScoreClick = (drill) => {
    setSelectedDrillForScoring(drill);
    setManualScoringOpen(true);
  };

  const handleManualScoreSubmitted = (drillId) => {
    // Update the drill's isManuallyScored flag in the processedDrills state
    setProcessedDrills(prev => prev.map(drill =>
      String(drill._id) === String(drillId)
        ? { ...drill, isManuallyScored: true }
        : drill
    ));
  };

  // Score comparison handlers
  const handleComparisonClick = (drill) => {
    setSelectedDrillForComparison(drill);
    setComparisonOpen(true);
  };

  // Reprocess drill handlers
  const handleReprocessClick = (drill) => {
    setDrillToReprocess(drill);
    setReprocessMode('immediate'); // Reset to default
    setReprocessDialogOpen(true);
  };

  const handleReprocessConfirm = async () => {
    if (!drillToReprocess) return;

    setReprocessing(true);
    setProcessedError(null);
    setFailedError(null);

    try {
      const response = await drillService.reprocessDrill(drillToReprocess._id, reprocessMode);

      // Remove from current tab's state
      setProcessedDrills(prev => prev.filter(d => d._id !== drillToReprocess._id));
      setFailedDrills(prev => prev.filter(d => d._id !== drillToReprocess._id));

      setReprocessDialogOpen(false);
      setDrillToReprocess(null);

      // Show success message based on mode
      const modeMessage = reprocessMode === 'pending_annotation'
        ? 'Drill set to pending annotation!'
        : 'Drill queued for reprocessing!';
      alert(`${modeMessage} ${response.data?.recordsDeleted?.scores || 0} score records and ${response.data?.recordsDeleted?.analysis || 0} analysis records were deleted.`);
    } catch (err) {
      console.error('Error reprocessing drill:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reprocess drill';
      setProcessedError(errorMessage);
      setFailedError(errorMessage);
    } finally {
      setReprocessing(false);
    }
  };

  const handleReprocessCancel = () => {
    setReprocessDialogOpen(false);
    setDrillToReprocess(null);
  };

  // Put back uploaded video to Pub/Sub queue
  const handlePutBackToQueue = async (drill) => {
    try {
      setRequeueingUploaded(prev => ({ ...prev, [drill._id]: true }));
      setRequeueUploadedError(null);
      setRequeueUploadedSuccess(null);

      const result = await drillService.putBackUploadedVideoPubsubQueue(drill._id);

      if (result.success) {
        setRequeueUploadedSuccess(`Successfully requeued "${drill.title || drill._id}" into processing queue`);
        // Refresh the uploaded drills list
        loadUploadedDrills();
      } else {
        setRequeueUploadedError(result.message || 'Failed to requeue video');
      }
    } catch (err) {
      console.error('Error putting video back to queue:', err);
      setRequeueUploadedError(err.response?.data?.message || 'Failed to put video back into queue');
    } finally {
      setRequeueingUploaded(prev => ({ ...prev, [drill._id]: false }));
    }
  };

  // Check if a video's updatedAt is older than 6 hours
  const isOlderThan6Hours = (dateStr) => {
    if (!dateStr) return true;
    return (Date.now() - new Date(dateStr).getTime()) > 6 * 60 * 60 * 1000;
  };

  // Handle annotation submission
  const handleAnnotationSubmit = async (markers, updatedGameType) => {
    if (!selectedDrillForAnnotation) return;

    try {
      setSubmittingAnnotation(true);
      setUploadedError(null);

      // Format markers as required by API
      const manualAnnotation = {};
      markers.forEach((marker, index) => {
        manualAnnotation[index + 1] = {
          position: [marker.x, marker.y],
          detection_method: marker.detection_method,
          confidence: marker.confidence || null,
        };
      });

      // Determine if gameType was changed
      const originalGameType = selectedDrillForAnnotation.gameType;
      const gameTypeChanged = updatedGameType && updatedGameType !== originalGameType;

      // Update drill record with annotations and change status to UPLOADED
      await drillService.updateDrillAnnotations(
        selectedDrillForAnnotation._id,
        manualAnnotation,
        DRILL_STATUS.UPLOADED,
        gameTypeChanged ? updatedGameType : undefined
      );

      // Update local state to reflect the change
      setUploadedDrills(prev =>
        prev.map(drill =>
          drill._id === selectedDrillForAnnotation._id
            ? {
                ...drill,
                status: DRILL_STATUS.UPLOADED,
                manualAnnotation,
                ...(gameTypeChanged ? { gameType: updatedGameType } : {})
              }
            : drill
        )
      );

      // Automatically send to Pub/Sub for processing
      try {
        console.log(`Sending drill ${selectedDrillForAnnotation._id} to Pub/Sub after annotation submission`);
        const pubSubResult = await drillService.sendToProcessing(clubId, [selectedDrillForAnnotation._id]);
        console.log('Pub/Sub publish result:', pubSubResult);

        if (pubSubResult.success) {
          console.log(`Successfully published ${pubSubResult.data.successCount} drill(s) to Pub/Sub`);
        } else {
          console.warn('Pub/Sub publishing failed:', pubSubResult);
        }
      } catch (pubSubError) {
        // Log the error but don't block the UI - annotation was saved successfully
        console.error('Error publishing to Pub/Sub:', pubSubError);
        // Optionally show a warning to the user that publishing failed
        setUploadedError('Annotation saved, but failed to send to processing queue. You may need to manually trigger processing.');
      }

      // Close dialog
      setAnnotationDialogOpen(false);
      setSelectedDrillForAnnotation(null);
    } catch (err) {
      console.error('Error submitting annotations:', err);
      setUploadedError(err.response?.data?.message || 'Failed to submit annotations');
    } finally {
      setSubmittingAnnotation(false);
    }
  };

  // Handle annotation dialog close
  const handleAnnotationDialogClose = () => {
    if (!submittingAnnotation) {
      setAnnotationDialogOpen(false);
      setSelectedDrillForAnnotation(null);
    }
  };

  // Sort handlers
  const handleUploadedRequestSort = createSortHandler(uploadedOrderBy, uploadedOrder, setUploadedOrderBy, setUploadedOrder, setUploadedPage);
  const handleProcessedRequestSort = createSortHandler(processedOrderBy, processedOrder, setProcessedOrderBy, setProcessedOrder, setProcessedPage);

  return (
    <AppLayout>
      <RequireRole roles={['club_manager', 'head_coach', 'coach']}>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/clubs/${clubId}/dashboard`)}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <VideoLibraryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1">
                  Drill Video Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload, manage, and process drill videos
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="drill management tabs">
              <Tab label="Upload Drills" />
              <Tab label="Uploaded Drills" />
              <Tab label="Processed Drills" />
              <Tab label="Failed Drills" />
              <Tab label="Rejected Drills" />
            </Tabs>
          </Paper>

          {/* Tab Panel: Upload Drills */}
          {activeTab === 0 && (
            <Box>
              {/* Upload Mode Toggle */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <ToggleButtonGroup
                    value={uploadMode}
                    exclusive
                    onChange={handleUploadModeChange}
                    aria-label="upload mode"
                    size="large"
                    sx={{
                      '& .MuiToggleButton-root': {
                        border: '2px solid',
                        borderRadius: '12px',
                        mx: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="multiple" aria-label="multiple files">
                      <Box sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <CloudUploadIcon sx={{ fontSize: 40 }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Multiple Files
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Upload multiple drill videos at once
                        </Typography>
                      </Box>
                    </ToggleButton>
                    <ToggleButton value="single" aria-label="single file">
                      <Box sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <ContentCutIcon sx={{ fontSize: 40 }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Single File
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Split a large video into segments
                        </Typography>
                      </Box>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Paper>

              {/* Unified Dropzone for both modes */}
              {!videoFile && (
                <Paper
                  sx={{
                    p: 4,
                    mt: 2,
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                >
                  <div {...getRootProps()} className="bulk-upload-dropzone" style={{ background: 'white' }}>
                    <input {...getInputProps()} />
                    {uploadMode === 'multiple' ? (
                      <CloudUploadIcon
                        className="upload-icon"
                        sx={{
                          color: 'primary.main',
                          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                        }}
                      />
                    ) : (
                      <ContentCutIcon
                        className="upload-icon"
                        sx={{
                          color: 'primary.main',
                          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                        }}
                      />
                    )}
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                      {isDragActive
                        ? 'Drop video(s) here...'
                        : uploadMode === 'multiple'
                          ? 'Drag & Drop Videos Here'
                          : 'Drag & Drop Video Here'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                      or click to browse files
                    </Typography>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        borderRadius: 2,
                        maxWidth: '500px',
                        mx: 'auto',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {uploadMode === 'multiple' ? (
                          <>
                            <VideoLibraryIcon fontSize="small" />
                            Upload multiple drill videos at once (MP4, MOV, AVI, etc.)
                          </>
                        ) : (
                          <>
                            <ContentCutIcon fontSize="small" />
                            Select a video to split into segments (MP4, MOV, AVI, etc.)
                          </>
                        )}
                      </Typography>
                    </Box>
                  </div>
                </Paper>
              )}

              {/* Split Video Mode - Video Editor */}
              {uploadMode === 'single' && videoFile && (
                <Box className="video-splitter-app">
                  <Box className="video-splitter-container">
                      {!ffmpegLoaded && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Loading FFmpeg... Please wait.
                        </Alert>
                      )}

                      <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <video
                            ref={videoRef}
                            src={videoUrl}
                            style={{ display: 'none' }}
                            onLoadedMetadata={(e) => {
                              const duration = e.target.duration;
                              setVideoDuration(duration);
                              const defaultSegmentDuration = Math.max(30, Math.min(duration * 0.2, duration));
                              setEndTime(defaultSegmentDuration);
                            }}
                          />

                          <Timeline
                            duration={videoDuration}
                            startTime={startTime}
                            endTime={endTime}
                            onChange={handleTimelineChange}
                            videoRef={videoRef}
                            videoFile={videoFile}
                            extractedRanges={extractedRanges}
                          />

                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                              variant="contained"
                              startIcon={<SwapHorizIcon />}
                              onClick={() => {
                                setVideoFile(null);
                                setVideoUrl('');
                                setStartTime(0);
                                setEndTime(0);
                                setVideoDuration(0);
                                setExtractedRanges([]);
                              }}
                              sx={{
                                px: 3,
                                py: 1.5,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              Change Video
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<RestartAltIcon />}
                              onClick={() => {
                                setExtractedRanges([]);
                              }}
                              sx={{
                                px: 3,
                                py: 1.5,
                                borderWidth: '2px',
                                '&:hover': {
                                  borderWidth: '2px',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              Reset Timeline
                            </Button>
                          </Box>
                        </Box>
                      </Paper>

                      <Paper sx={{ p: 3 }}>
                        <DropZone
                          onDrop={handleDrop}
                          isProcessing={isProcessing}
                          processingProgress={processingProgress}
                        />
                      </Paper>
                    </Box>
                </Box>
              )}

              {/* Video Player Matching Table */}
              {selectedFiles.length > 0 && (
                <VideoPlayerMatchingTable
                  selectedFiles={selectedFiles}
                  players={players}
                  videoPlayerMap={videoPlayerMap}
                  setVideoPlayerMap={setVideoPlayerMap}
                  videoThumbnails={videoThumbnails}
                  videoDrillLevelMap={videoDrillLevelMap}
                  setVideoDrillLevelMap={setVideoDrillLevelMap}
                  videoDrillTypeMap={videoDrillTypeMap}
                  setVideoDrillTypeMap={setVideoDrillTypeMap}
                  selectedVideos={selectedVideos}
                  setSelectedVideos={setSelectedVideos}
                  drillLevel={drillLevel}
                  setDrillLevel={setDrillLevel}
                  drillType={drillType}
                  setDrillType={setDrillType}
                  uploadPage={uploadPage}
                  setUploadPage={setUploadPage}
                  uploadRowsPerPage={uploadRowsPerPage}
                  setUploadRowsPerPage={setUploadRowsPerPage}
                  uploadMatchingFilter={uploadMatchingFilter}
                  setUploadMatchingFilter={setUploadMatchingFilter}
                  uploadNameSearch={uploadNameSearch}
                  setUploadNameSearch={setUploadNameSearch}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  onRemoveFile={handleRemoveFile}
                  onUpload={handleUpload}
                  onUpdateFile={handleUpdateFile}
                />
              )}
            </Box>
          )}

          {/* Tab Panel: Uploaded Drills */}
          {activeTab === 1 && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Uploaded Drills
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    View and manage drills that have been uploaded (awaiting processing)
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/clubs/${clubId}/drills/manual-annotation`)}
                >
                  Manual Annotation Queue
                </Button>
              </Box>

              {requeueUploadedSuccess && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRequeueUploadedSuccess(null)}>
                  {requeueUploadedSuccess}
                </Alert>
              )}
              {requeueUploadedError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRequeueUploadedError(null)}>
                  {requeueUploadedError}
                </Alert>
              )}

              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      value={uploadedSearch}
                      onChange={(e) => {
                        setUploadedSearch(e.target.value);
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
                        <MenuItem value="UNMATCHED">Unmatched</MenuItem>
                        <MenuItem value={DRILL_STATUS.UPLOADED}>Uploaded</MenuItem>
                        <MenuItem value={DRILL_STATUS.PENDING_MANUAL_ANNOTATION}>Pending Annotation</MenuItem>
                        <MenuItem value={DRILL_STATUS.FAILED}>Failed</MenuItem>
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
                          <MenuItem key={level.value} value={level.value}>
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
                        {DRILL_TYPES(uploadedLevelFilter === 'all' ? null : uploadedLevelFilter).map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
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
                  <Grid item xs={12} sm={6} md={2}>
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

              {uploadedError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {uploadedError}
                </Alert>
              )}

              {loadingUploaded ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : uploadedDrills.length === 0 ? (
                <Alert severity="info">
                  No uploaded drills found. Upload videos to get started.
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Video</TableCell>
                          <TableCell>Video Frame</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={uploadedOrderBy === 'playerName'}
                              direction={uploadedOrderBy === 'playerName' ? uploadedOrder : 'asc'}
                              onClick={() => handleUploadedRequestSort('playerName')}
                            >
                              Player
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={uploadedOrderBy === 'drillLevel'}
                              direction={uploadedOrderBy === 'drillLevel' ? uploadedOrder : 'asc'}
                              onClick={() => handleUploadedRequestSort('drillLevel')}
                            >
                              Level
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={uploadedOrderBy === 'gameType'}
                              direction={uploadedOrderBy === 'gameType' ? uploadedOrder : 'asc'}
                              onClick={() => handleUploadedRequestSort('gameType')}
                            >
                              Drill Type
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={uploadedOrderBy === 'createdAt'}
                              direction={uploadedOrderBy === 'createdAt' ? uploadedOrder : 'asc'}
                              onClick={() => handleUploadedRequestSort('createdAt')}
                            >
                              Upload Date
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={uploadedOrderBy === 'analysedAt'}
                              direction={uploadedOrderBy === 'analysedAt' ? uploadedOrder : 'asc'}
                              onClick={() => handleUploadedRequestSort('analysedAt')}
                            >
                              Analysed
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={uploadedOrderBy === 'status'}
                              direction={uploadedOrderBy === 'status' ? uploadedOrder : 'asc'}
                              onClick={() => handleUploadedRequestSort('status')}
                            >
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadedDrills
                          .filter(drill => {
                            // Apply status filter
                            if (uploadedStatusFilter !== 'all' && drill.status !== uploadedStatusFilter) {
                              return false;
                            }
                            // Apply level filter
                            if (uploadedLevelFilter !== 'all' && drill.drillLevel !== uploadedLevelFilter) {
                              return false;
                            }
                            // Apply type filter
                            if (uploadedTypeFilter !== 'all' && drill.gameType !== uploadedTypeFilter) {
                              return false;
                            }
                            // Apply search filter
                            if (uploadedSearch.trim()) {
                              const searchLower = uploadedSearch.toLowerCase();
                              if (!(drill.title?.toLowerCase().includes(searchLower) ||
                                  drill.playerName?.toLowerCase().includes(searchLower))) {
                                return false;
                              }
                            }
                            // Apply date range filter
                            if (uploadedDateFrom) {
                              const fromDate = new Date(uploadedDateFrom);
                              fromDate.setHours(0, 0, 0, 0);
                              const drillDate = new Date(drill.uploadDate);
                              drillDate.setHours(0, 0, 0, 0);
                              if (drillDate < fromDate) {
                                return false;
                              }
                            }
                            if (uploadedDateTo) {
                              const toDate = new Date(uploadedDateTo);
                              toDate.setHours(23, 59, 59, 999);
                              const drillDate = new Date(drill.uploadDate);
                              if (drillDate > toDate) {
                                return false;
                              }
                            }
                            return true;
                          })
                          .sort(getComparator(uploadedOrder, uploadedOrderBy))
                          .slice(uploadedPage * uploadedRowsPerPage, uploadedPage * uploadedRowsPerPage + uploadedRowsPerPage)
                          .map((drill) => (
                            <TableRow key={drill._id} hover>
                              <TableCell>
                                {drill.videoUrl ? (
                                  <Box
                                    onClick={() => handleVideoClick(drill)}
                                    sx={{
                                      cursor: 'pointer',
                                      position: 'relative',
                                      width: 120,
                                      height: 80,
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      transition: 'transform 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                      },
                                    }}
                                  >
                                    <video
                                      src={drill.videoUrl}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                      muted
                                    />
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        '&:hover': {
                                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        },
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: '50%',
                                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            width: 0,
                                            height: 0,
                                            borderLeft: '12px solid #1976d2',
                                            borderTop: '8px solid transparent',
                                            borderBottom: '8px solid transparent',
                                            marginLeft: '4px',
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        position: 'absolute',
                                        bottom: 4,
                                        left: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '2px 4px',
                                        borderRadius: 0.5,
                                        fontSize: '0.7rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {drill.title}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2">N/A</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                  {drill.frameUrl ? (
                                    <>
                                      <Box
                                        component="img"
                                        src={drill.frameUrl}
                                        alt="Video frame"
                                        onClick={() => handleImageClick(drill.frameUrl)}
                                        sx={{
                                          width: 80,
                                          height: 60,
                                          objectFit: 'cover',
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          cursor: 'pointer',
                                          transition: 'transform 0.2s',
                                          '&:hover': {
                                            transform: 'scale(1.1)',
                                          },
                                        }}
                                      />
                                      <Link
                                        component="button"
                                        variant="body2"
                                        onClick={() => handleAnnotateClick(drill)}
                                        sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                      >
                                        Annotate
                                      </Link>
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth>
                                    <Select
                                      value={editValues.playerId}
                                      onChange={(e) => {
                                        const selectedPlayer = players.find(p => p.id === e.target.value);
                                        setEditValues({
                                          ...editValues,
                                          playerId: e.target.value,
                                          playerName: selectedPlayer ? selectedPlayer.name : ''
                                        });
                                      }}
                                      displayEmpty
                                    >
                                      <MenuItem value="">
                                        <em>Not assigned</em>
                                      </MenuItem>
                                      {players.map((player) => (
                                        <MenuItem key={player.id} value={player.id}>
                                          {player.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  drill.playerName || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
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
                                  drill.drillLevel || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
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
                                  drill.gameType || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {drill.uploadDate ? new Date(drill.uploadDate).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {drill.analysedAt ? new Date(drill.analysedAt).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth>
                                    <Select
                                      value={editValues.status}
                                      onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                                    >
                                      <MenuItem value="UNMATCHED">Unmatched</MenuItem>
                                      <MenuItem value="PENDING_MANUAL_ANNOTATION">Pending Annotation</MenuItem>
                                      <MenuItem value="UPLOADED">Uploaded</MenuItem>
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <FormControl size="small" fullWidth disabled={updatingStatus[drill._id]}>
                                    <Select
                                      value={drill.status || ''}
                                      onChange={(e) => handleStatusChange(drill._id, e.target.value)}
                                      sx={{ minWidth: 120 }}
                                    >
                                      <MenuItem value="UNMATCHED">Unmatched</MenuItem>
                                      <MenuItem value="PENDING_MANUAL_ANNOTATION">Pending Annotation</MenuItem>
                                      <MenuItem value="UPLOADED">Uploaded</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {editingDrillId === drill._id ? (
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
                                    {drill.status === 'UPLOADED' && (
                                      <Tooltip
                                        title={
                                          !isOlderThan6Hours(drill.updatedAt)
                                            ? 'Video updated less than 6 hours ago. It may still be in the queue.'
                                            : 'Put back into processing queue'
                                        }
                                      >
                                        <span>
                                          <IconButton
                                            size="small"
                                            color="warning"
                                            onClick={() => handlePutBackToQueue(drill)}
                                            disabled={!isOlderThan6Hours(drill.updatedAt) || requeueingUploaded[drill._id]}
                                          >
                                            {requeueingUploaded[drill._id] ? (
                                              <CircularProgress size={18} />
                                            ) : (
                                              <RestartAltIcon />
                                            )}
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    )}
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
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={uploadedDrills.filter(drill => {
                      if (uploadedStatusFilter !== 'all' && drill.status !== uploadedStatusFilter) {
                        return false;
                      }
                      if (uploadedLevelFilter !== 'all' && drill.drillLevel !== uploadedLevelFilter) {
                        return false;
                      }
                      if (uploadedTypeFilter !== 'all' && drill.gameType !== uploadedTypeFilter) {
                        return false;
                      }
                      if (uploadedSearch.trim()) {
                        const searchLower = uploadedSearch.toLowerCase();
                        if (!(drill.title?.toLowerCase().includes(searchLower) ||
                            drill.playerName?.toLowerCase().includes(searchLower))) {
                          return false;
                        }
                      }
                      if (uploadedDateFrom) {
                        const fromDate = new Date(uploadedDateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        const drillDate = new Date(drill.uploadDate);
                        drillDate.setHours(0, 0, 0, 0);
                        if (drillDate < fromDate) {
                          return false;
                        }
                      }
                      if (uploadedDateTo) {
                        const toDate = new Date(uploadedDateTo);
                        toDate.setHours(23, 59, 59, 999);
                        const drillDate = new Date(drill.uploadDate);
                        if (drillDate > toDate) {
                          return false;
                        }
                      }
                      return true;
                    }).length}
                    rowsPerPage={uploadedRowsPerPage}
                    page={uploadedPage}
                    onPageChange={(event, newPage) => setUploadedPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setUploadedRowsPerPage(parseInt(event.target.value, 10));
                      setUploadedPage(0);
                    }}
                  />
                </>
              )}
            </Paper>
          )}

          {/* Tab Panel: Processed Drills */}
          {activeTab === 2 && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Processed Drills
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  View drills that are processing or have been fully processed
                </Typography>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      value={processedSearch}
                      onChange={(e) => {
                        setProcessedSearch(e.target.value);
                        setProcessedPage(0);
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
                      <InputLabel>Level</InputLabel>
                      <Select
                        value={processedLevelFilter}
                        label="Level"
                        onChange={(e) => {
                          setProcessedLevelFilter(e.target.value);
                          setProcessedPage(0);
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {drillLevels.map((level) => (
                          <MenuItem key={level.value} value={level.value}>
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
                        value={processedTypeFilter}
                        label="Drill Type"
                        onChange={(e) => {
                          setProcessedTypeFilter(e.target.value);
                          setProcessedPage(0);
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
                        {DRILL_TYPES(processedLevelFilter === 'all' ? null : processedLevelFilter).map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Processed Date From"
                      type="date"
                      value={processedDateFrom}
                      onChange={(e) => {
                        setProcessedDateFrom(e.target.value);
                        setProcessedPage(0);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Processed Date To"
                      type="date"
                      value={processedDateTo}
                      onChange={(e) => {
                        setProcessedDateTo(e.target.value);
                        setProcessedPage(0);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Version Filters Row */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Detection Version</InputLabel>
                      <Select
                        value={detectionVersionFilter}
                        label="Detection Version"
                        onChange={(e) => {
                          setDetectionVersionFilter(e.target.value);
                          setProcessedPage(0);
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {[...new Set(processedDrills.map(d => d.model_detection_version).filter(Boolean))].sort((a, b) => b - a).map((version) => (
                          <MenuItem key={version} value={version}>
                            v{version}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Analysis Version</InputLabel>
                      <Select
                        value={analysisVersionFilter}
                        label="Analysis Version"
                        onChange={(e) => {
                          setAnalysisVersionFilter(e.target.value);
                          setProcessedPage(0);
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {[...new Set(processedDrills.map(d => d.analysis_version).filter(Boolean))].sort((a, b) => b - a).map((version) => (
                          <MenuItem key={version} value={version}>
                            v{version}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Scoring Version</InputLabel>
                      <Select
                        value={scoringVersionFilter}
                        label="Scoring Version"
                        onChange={(e) => {
                          setScoringVersionFilter(e.target.value);
                          setProcessedPage(0);
                        }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {[...new Set(processedDrills.map(d => d.scoring_metrics_version).filter(Boolean))].sort((a, b) => b - a).map((version) => (
                          <MenuItem key={version} value={version}>
                            v{version}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Filter Checkboxes - Only visible to authorized roles */}
                <RequireRole roles={['club_manager', 'head_coach']}>
                  <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showPatternMismatchOnly}
                          onChange={(e) => {
                            setShowPatternMismatchOnly(e.target.checked);
                            setProcessedPage(0);
                          }}
                          color="warning"
                        />
                      }
                      label="Show pattern count mismatches only"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showConeCountMismatchOnly}
                          onChange={(e) => {
                            setShowConeCountMismatchOnly(e.target.checked);
                            setProcessedPage(0);
                          }}
                          color="warning"
                        />
                      }
                      label="Show cone count mismatches only"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showManuallyScoredOnly}
                          onChange={(e) => {
                            setShowManuallyScoredOnly(e.target.checked);
                            setProcessedPage(0);
                          }}
                          color="success"
                        />
                      }
                      label="Show manually scored drills only"
                    />
                  </Box>
                </RequireRole>
              </Box>

              {processedError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {processedError}
                </Alert>
              )}

              {loadingProcessed ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : processedDrills.length === 0 ? (
                <Alert severity="info">
                  No processed drills found. Drills will appear here once processing is complete.
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'title'}
                              direction={processedOrderBy === 'title' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('title')}
                            >
                              Video Name
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'playerName'}
                              direction={processedOrderBy === 'playerName' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('playerName')}
                            >
                              Player
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'drillLevel'}
                              direction={processedOrderBy === 'drillLevel' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('drillLevel')}
                            >
                              Level
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'gameType'}
                              direction={processedOrderBy === 'gameType' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('gameType')}
                            >
                              Drill Type
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'overallScore'}
                              direction={processedOrderBy === 'overallScore' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('overallScore')}
                            >
                              Score
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'createdAt'}
                              direction={processedOrderBy === 'createdAt' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('createdAt')}
                            >
                              Upload Date
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'analysedAt'}
                              direction={processedOrderBy === 'analysedAt' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('analysedAt')}
                            >
                              Analysed
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'status'}
                              direction={processedOrderBy === 'status' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('status')}
                            >
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'model_detection_version'}
                              direction={processedOrderBy === 'model_detection_version' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('model_detection_version')}
                            >
                              Detection
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'analysis_version'}
                              direction={processedOrderBy === 'analysis_version' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('analysis_version')}
                            >
                              Analysis
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={processedOrderBy === 'scoring_metrics_version'}
                              direction={processedOrderBy === 'scoring_metrics_version' ? processedOrder : 'asc'}
                              onClick={() => handleProcessedRequestSort('scoring_metrics_version')}
                            >
                              Scoring
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {processedDrills
                          .filter(drill => {
                            // Apply level filter
                            if (processedLevelFilter !== 'all' && drill.drillLevel !== processedLevelFilter) {
                              return false;
                            }
                            // Apply type filter
                            if (processedTypeFilter !== 'all' && drill.gameType !== processedTypeFilter) {
                              return false;
                            }
                            // Apply search filter
                            if (processedSearch.trim()) {
                              const searchLower = processedSearch.toLowerCase();
                              if (!(drill.title?.toLowerCase().includes(searchLower) ||
                                  drill.playerName?.toLowerCase().includes(searchLower))) {
                                return false;
                              }
                            }
                            // Apply date range filter
                            if (processedDateFrom) {
                              const fromDate = new Date(processedDateFrom);
                              fromDate.setHours(0, 0, 0, 0);
                              const drillDate = new Date(drill.uploadDate);
                              drillDate.setHours(0, 0, 0, 0);
                              if (drillDate < fromDate) {
                                return false;
                              }
                            }
                            if (processedDateTo) {
                              const toDate = new Date(processedDateTo);
                              toDate.setHours(23, 59, 59, 999);
                              const drillDate = new Date(drill.uploadDate);
                              if (drillDate > toDate) {
                                return false;
                              }
                            }
                            // Apply pattern count mismatch filter
                            if (showPatternMismatchOnly && !drill.isPatternCountMismatch) {
                              return false;
                            }
                            // Apply cone count mismatch filter
                            if (showConeCountMismatchOnly && !drill.isConeCountMismatch) {
                              return false;
                            }
                            // Apply manually scored filter
                            if (showManuallyScoredOnly && !drill.isManuallyScored) {
                              return false;
                            }
                            // Apply version filters
                            if (detectionVersionFilter !== 'all' && drill.model_detection_version !== detectionVersionFilter) {
                              return false;
                            }
                            if (analysisVersionFilter !== 'all' && drill.analysis_version !== analysisVersionFilter) {
                              return false;
                            }
                            if (scoringVersionFilter !== 'all' && drill.scoring_metrics_version !== scoringVersionFilter) {
                              return false;
                            }
                            return true;
                          })
                          .sort(getComparator(processedOrder, processedOrderBy, processedOrderBy === 'overallScore'))
                          .slice(processedPage * processedRowsPerPage, processedPage * processedRowsPerPage + processedRowsPerPage)
                          .map((drill) => (
                            <TableRow
                              key={drill._id}
                              hover
                              onClick={(e) => {
                                // Only navigate if not clicking on edit controls
                                if (editingDrillId !== drill._id &&
                                    !e.target.closest('button') &&
                                    !e.target.closest('.MuiSelect-root') &&
                                    drill.user && drill._id) {
                                  navigate(`/players/${drill.user}/drills/${drill._id}`);
                                }
                              }}
                              sx={{ cursor: editingDrillId === drill._id ? 'default' : (drill.user && drill._id ? 'pointer' : 'default') }}
                            >
                              <TableCell>{drill.title || 'N/A'}</TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={editValues.playerId}
                                      onChange={(e) => {
                                        const selectedPlayer = players.find(p => p.id === e.target.value);
                                        setEditValues({
                                          ...editValues,
                                          playerId: e.target.value,
                                          playerName: selectedPlayer ? selectedPlayer.name : ''
                                        });
                                      }}
                                      displayEmpty
                                    >
                                      <MenuItem value="">
                                        <em>Not assigned</em>
                                      </MenuItem>
                                      {players.map((player) => (
                                        <MenuItem key={player.id} value={player.id}>
                                          {player.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  drill.playerName || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth onClick={(e) => e.stopPropagation()}>
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
                                  drill.drillLevel || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth onClick={(e) => e.stopPropagation()}>
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
                                  drill.gameType || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>{drill.overallScore ? `${Math.round(drill.overallScore)}%` : 'N/A'}</TableCell>
                              <TableCell>
                                {drill.uploadDate ? new Date(drill.uploadDate).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {drill.analysedAt ? new Date(drill.analysedAt).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={editValues.status}
                                      onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                                    >
                                      <MenuItem value="UNMATCHED">Unmatched</MenuItem>
                                      <MenuItem value="PENDING_MANUAL_ANNOTATION">Pending Annotation</MenuItem>
                                      <MenuItem value="UPLOADED">Uploaded</MenuItem>
                                      <MenuItem value="PROCESSING">Processing</MenuItem>
                                      <MenuItem value="PROCESSED">Processed</MenuItem>
                                      <MenuItem value="FAILED">Failed</MenuItem>
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                      label={DRILL_STATUS_LABELS[drill.status] || drill.status}
                                      size="small"
                                      color={DRILL_STATUS_COLORS[drill.status] || 'default'}
                                    />
                                    {drill.status === 'PROCESSED' && (
                                      <>
                                        <PatternCountWarning drill={drill} size="small" />
                                        <ConeCountWarning drill={drill} size="small" />
                                      </>
                                    )}
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell>
                                {drill.model_detection_version ? (
                                  <Chip label={`v${drill.model_detection_version}`} size="small" variant="outlined" />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {drill.analysis_version ? (
                                  <Chip label={`v${drill.analysis_version}`} size="small" variant="outlined" />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {drill.scoring_metrics_version ? (
                                  <Chip label={`v${drill.scoring_metrics_version}`} size="small" variant="outlined" />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                {editingDrillId === drill._id ? (
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
                                      onClick={() => handleManualScoreClick(drill)}
                                      title={drill.isManuallyScored ? 'View/Edit manual score' : 'Add manual score'}
                                    >
                                      <GradeIcon style={{ color: drill.isManuallyScored ? '#4caf50' : undefined }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleComparisonClick(drill)}
                                      title={drill.isManuallyScored ? 'Compare AI vs Manual scores' : 'No manual scores yet'}
                                    >
                                      <CompareIcon style={{ color: drill.isManuallyScored ? '#1976d2' : undefined }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleStartEdit(drill)}
                                      title="Edit drill"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleReprocessClick(drill)}
                                      title="Reprocess drill"
                                    >
                                      <RestartAltIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick(drill)}
                                      title="Delete drill"
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
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={processedDrills.filter(drill => {
                      if (processedLevelFilter !== 'all' && drill.drillLevel !== processedLevelFilter) {
                        return false;
                      }
                      if (processedTypeFilter !== 'all' && drill.gameType !== processedTypeFilter) {
                        return false;
                      }
                      if (processedSearch.trim()) {
                        const searchLower = processedSearch.toLowerCase();
                        if (!(drill.title?.toLowerCase().includes(searchLower) ||
                            drill.playerName?.toLowerCase().includes(searchLower))) {
                          return false;
                        }
                      }
                      if (processedDateFrom) {
                        const fromDate = new Date(processedDateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        const drillDate = new Date(drill.uploadDate);
                        drillDate.setHours(0, 0, 0, 0);
                        if (drillDate < fromDate) {
                          return false;
                        }
                      }
                      if (processedDateTo) {
                        const toDate = new Date(processedDateTo);
                        toDate.setHours(23, 59, 59, 999);
                        const drillDate = new Date(drill.uploadDate);
                        if (drillDate > toDate) {
                          return false;
                        }
                      }
                      if (showPatternMismatchOnly && !drill.isPatternCountMismatch) {
                        return false;
                      }
                      if (showConeCountMismatchOnly && !drill.isConeCountMismatch) {
                        return false;
                      }
                      if (showManuallyScoredOnly && !drill.isManuallyScored) {
                        return false;
                      }
                      // Apply version filters
                      if (detectionVersionFilter !== 'all' && drill.model_detection_version !== detectionVersionFilter) {
                        return false;
                      }
                      if (analysisVersionFilter !== 'all' && drill.analysis_version !== analysisVersionFilter) {
                        return false;
                      }
                      if (scoringVersionFilter !== 'all' && drill.scoring_metrics_version !== scoringVersionFilter) {
                        return false;
                      }
                      return true;
                    }).length}
                    rowsPerPage={processedRowsPerPage}
                    page={processedPage}
                    onPageChange={(event, newPage) => setProcessedPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setProcessedRowsPerPage(parseInt(event.target.value, 10));
                      setProcessedPage(0);
                    }}
                  />
                </>
              )}
            </Paper>
          )}

          {/* Tab Panel: Failed Drills */}
          {activeTab === 3 && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Failed Drills
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  View drills that failed during processing
                </Typography>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      value={failedSearch}
                      onChange={(e) => {
                        setFailedSearch(e.target.value);
                        setFailedPage(0);
                      }}
                      placeholder="Search by title or player..."
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
                      <InputLabel>Player</InputLabel>
                      <Select
                        value={failedPlayerFilter}
                        label="Player"
                        onChange={(e) => {
                          setFailedPlayerFilter(e.target.value);
                          setFailedPage(0);
                        }}
                      >
                        <MenuItem value="all">All Players</MenuItem>
                        {players.map((player) => (
                          <MenuItem key={player._id} value={player._id}>
                            {player.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {failedError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {failedError}
                </Alert>
              )}

              {loadingFailed ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Player</TableCell>
                          <TableCell>Drill Type</TableCell>
                          <TableCell>Level</TableCell>
                          <TableCell>Upload Date</TableCell>
                          <TableCell>Analysed</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Error Message</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {failedDrills
                          .filter(drill => {
                            if (failedPlayerFilter !== 'all' && drill.user !== failedPlayerFilter) {
                              return false;
                            }
                            if (failedSearch.trim()) {
                              const searchLower = failedSearch.toLowerCase();
                              if (!(drill.title?.toLowerCase().includes(searchLower) ||
                                    drill.playerName?.toLowerCase().includes(searchLower))) {
                                return false;
                              }
                            }
                            return true;
                          })
                          .slice(failedPage * failedRowsPerPage, failedPage * failedRowsPerPage + failedRowsPerPage)
                          .map((drill) => (
                            <TableRow key={drill._id} hover>
                              <TableCell>{drill.title || 'N/A'}</TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth>
                                    <Select
                                      value={editValues.playerId}
                                      onChange={(e) => {
                                        const selectedPlayer = players.find(p => p.id === e.target.value);
                                        setEditValues({
                                          ...editValues,
                                          playerId: e.target.value,
                                          playerName: selectedPlayer ? selectedPlayer.name : ''
                                        });
                                      }}
                                      displayEmpty
                                    >
                                      <MenuItem value="">
                                        <em>Not assigned</em>
                                      </MenuItem>
                                      {players.map((player) => (
                                        <MenuItem key={player.id} value={player.id}>
                                          {player.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  drill.playerName || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
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
                                  drill.gameType || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
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
                                  drill.drillLevel || 'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {drill.uploadDate ? new Date(drill.uploadDate).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {drill.analysedAt ? new Date(drill.analysedAt).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <FormControl size="small" fullWidth>
                                    <Select
                                      value={editValues.status}
                                      onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                                    >
                                      <MenuItem value="UNMATCHED">Unmatched</MenuItem>
                                      <MenuItem value="PENDING_MANUAL_ANNOTATION">Pending Annotation</MenuItem>
                                      <MenuItem value="UPLOADED">Uploaded</MenuItem>
                                      <MenuItem value="PROCESSING">Processing</MenuItem>
                                      <MenuItem value="PROCESSED">Processed</MenuItem>
                                      <MenuItem value="FAILED">Failed</MenuItem>
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Chip
                                    label={DRILL_STATUS_LABELS[drill.status] || drill.status}
                                    size="small"
                                    color={DRILL_STATUS_COLORS[drill.status] || 'default'}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="error" sx={{ maxWidth: 300 }}>
                                  {drill.errorMessage || 'Processing failed'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {editingDrillId === drill._id ? (
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleUpdateDrill(drill)}
                                      disabled={updating}
                                      title="Save changes"
                                    >
                                      <CheckIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={handleCancelEdit}
                                      disabled={updating}
                                      title="Cancel"
                                    >
                                      <CloseIcon />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleStartEdit(drill)}
                                      title="Edit drill"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleReprocessClick(drill)}
                                      title="Reprocess drill"
                                    >
                                      <RestartAltIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick(drill)}
                                      title="Delete drill"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        {failedDrills.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                No failed drills found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={failedDrills.filter(drill => {
                      if (failedPlayerFilter !== 'all' && drill.user !== failedPlayerFilter) {
                        return false;
                      }
                      if (failedSearch.trim()) {
                        const searchLower = failedSearch.toLowerCase();
                        if (!(drill.title?.toLowerCase().includes(searchLower) ||
                              drill.playerName?.toLowerCase().includes(searchLower))) {
                          return false;
                        }
                      }
                      return true;
                    }).length}
                    rowsPerPage={failedRowsPerPage}
                    page={failedPage}
                    onPageChange={(event, newPage) => setFailedPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setFailedRowsPerPage(parseInt(event.target.value, 10));
                      setFailedPage(0);
                    }}
                  />
                </>
              )}
            </Paper>
          )}

          {/* Rejected Drills Tab */}
          {activeTab === 4 && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Rejected Drills
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  View drills that were rejected by the AI pre-classifier. You can skip the pre-classifier and requeue them for processing.
                </Typography>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      value={rejectedSearch}
                      onChange={(e) => {
                        setRejectedSearch(e.target.value);
                        setRejectedPage(0);
                      }}
                      placeholder="Search by title or player..."
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
                      <InputLabel>Player</InputLabel>
                      <Select
                        value={rejectedPlayerFilter}
                        label="Player"
                        onChange={(e) => {
                          setRejectedPlayerFilter(e.target.value);
                          setRejectedPage(0);
                        }}
                      >
                        <MenuItem value="all">All Players</MenuItem>
                        {players.map((player) => (
                          <MenuItem key={player._id} value={player._id}>
                            {player.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {rejectedError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {rejectedError}
                </Alert>
              )}

              {loadingRejected ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Player</TableCell>
                          <TableCell>Drill Type</TableCell>
                          <TableCell>Level</TableCell>
                          <TableCell>Upload Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Rejection Reason</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rejectedDrills
                          .filter(drill => {
                            if (rejectedPlayerFilter !== 'all' && drill.user !== rejectedPlayerFilter) {
                              return false;
                            }
                            if (rejectedSearch.trim()) {
                              const searchLower = rejectedSearch.toLowerCase();
                              if (!(drill.title?.toLowerCase().includes(searchLower) ||
                                    drill.playerName?.toLowerCase().includes(searchLower))) {
                                return false;
                              }
                            }
                            return true;
                          })
                          .slice(rejectedPage * rejectedRowsPerPage, rejectedPage * rejectedRowsPerPage + rejectedRowsPerPage)
                          .map((drill) => (
                            <TableRow key={drill._id} hover>
                              <TableCell>{drill.title || 'N/A'}</TableCell>
                              <TableCell>{drill.playerName || 'N/A'}</TableCell>
                              <TableCell>{drill.gameType || 'N/A'}</TableCell>
                              <TableCell>{drill.drillLevel || 'N/A'}</TableCell>
                              <TableCell>
                                {drill.uploadDate ? new Date(drill.uploadDate).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={DRILL_STATUS_LABELS[drill.status] || drill.status}
                                  size="small"
                                  color={DRILL_STATUS_COLORS[drill.status] || 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Tooltip title={drill.gemini_validation?.bad_reason || drill.gemini_validation?.rationale || drill.rejection_reason || drill.errorMessage || 'No reason provided'}>
                                  <Typography
                                    variant="body2"
                                    color="error"
                                    sx={{
                                      maxWidth: 200,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {drill.gemini_validation?.bad_reason || drill.gemini_validation?.rationale || drill.rejection_reason || drill.errorMessage || 'No reason provided'}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleSkipPreClassifierRequeue(drill)}
                                    disabled={requeuing[drill._id]}
                                    startIcon={requeuing[drill._id] ? <CircularProgress size={16} /> : <RestartAltIcon />}
                                  >
                                    {requeuing[drill._id] ? 'Requeuing...' : 'Skip & Requeue'}
                                  </Button>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteClick(drill)}
                                    title="Delete drill"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        {rejectedDrills.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                No rejected drills found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={rejectedDrills.filter(drill => {
                      if (rejectedPlayerFilter !== 'all' && drill.user !== rejectedPlayerFilter) {
                        return false;
                      }
                      if (rejectedSearch.trim()) {
                        const searchLower = rejectedSearch.toLowerCase();
                        if (!(drill.title?.toLowerCase().includes(searchLower) ||
                              drill.playerName?.toLowerCase().includes(searchLower))) {
                          return false;
                        }
                      }
                      return true;
                    }).length}
                    rowsPerPage={rejectedRowsPerPage}
                    page={rejectedPage}
                    onPageChange={(event, newPage) => setRejectedPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setRejectedRowsPerPage(parseInt(event.target.value, 10));
                      setRejectedPage(0);
                    }}
                  />
                </>
              )}
            </Paper>
          )}

          {/* Image Zoom Modal */}
          <Modal
            open={Boolean(zoomedImage)}
            onClose={handleCloseZoom}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
              timeout: 500,
            }}
          >
            <Fade in={Boolean(zoomedImage)}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'background.paper',
                  boxShadow: 24,
                  p: 2,
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  overflow: 'auto',
                }}
                onClick={handleCloseZoom}
              >
                {zoomedImage && (
                  <Box
                    component="img"
                    src={zoomedImage}
                    alt="Zoomed video frame"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '85vh',
                      display: 'block',
                    }}
                  />
                )}
              </Box>
            </Fade>
          </Modal>

          {/* Video Player Modal */}
          <Modal
            open={videoPlayerOpen}
            onClose={handleCloseVideoPlayer}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
              timeout: 500,
            }}
          >
            <Fade in={videoPlayerOpen}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'background.paper',
                  boxShadow: 24,
                  p: 3,
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  borderRadius: 2,
                }}
              >
                {currentVideo && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{currentVideo.title}</Typography>
                      <Button onClick={handleCloseVideoPlayer} variant="outlined" size="small">
                        Close
                      </Button>
                    </Box>
                    <Box
                      component="video"
                      src={currentVideo.videoUrl}
                      controls
                      autoPlay
                      sx={{
                        width: '100%',
                        maxHeight: '75vh',
                        display: 'block',
                        borderRadius: 1,
                      }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Level:</strong> {currentVideo.drillLevel || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Type:</strong> {currentVideo.gameType || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Upload Date:</strong> {currentVideo.uploadDate ? new Date(currentVideo.uploadDate).toLocaleString() : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Status:</strong> {DRILL_STATUS_LABELS[currentVideo.status] || currentVideo.status}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Fade>
          </Modal>

          {/* Annotation Dialog */}
          <Dialog
            open={annotationDialogOpen}
            onClose={handleAnnotationDialogClose}
            maxWidth="lg"
            fullWidth
            disableEscapeKeyDown={submittingAnnotation}
          >
            <DialogTitle>
              Manual Cone Annotation: {selectedDrillForAnnotation?.title || 'Video'}
            </DialogTitle>
            <DialogContent>
              {selectedDrillForAnnotation && selectedDrillForAnnotation.frameUrl && (
                <ManualConeDetection
                  frameUrl={selectedDrillForAnnotation.frameUrl}
                  onSubmit={handleAnnotationSubmit}
                  autoRunYolo={true}
                  gameType={selectedDrillForAnnotation.gameType}
                />
              )}
              {submittingAnnotation && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <CircularProgress size={20} />
                  <Typography>Submitting annotations...</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAnnotationDialogClose} disabled={submittingAnnotation}>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this drill? This will remove it from both the database and cloud storage.
              </Typography>
              {drillToDelete && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2"><strong>Title:</strong> {drillToDelete.title || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Player:</strong> {drillToDelete.playerName || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Level:</strong> {drillToDelete.drillLevel || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {drillToDelete.gameType || 'N/A'}</Typography>
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
                startIcon={deleting ? <CircularProgress size={16} /> : null}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Reprocess Confirmation Dialog */}
          <Dialog
            open={reprocessDialogOpen}
            onClose={handleReprocessCancel}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Reprocess Drill</DialogTitle>
            <DialogContent>
              {drillToReprocess && (
                <>
                  {/* Drill Info */}
                  <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 3 }}>
                    <Typography variant="body2"><strong>Title:</strong> {drillToReprocess.title || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Player:</strong> {drillToReprocess.playerName || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Level:</strong> {drillToReprocess.drillLevel || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Type:</strong> {drillToReprocess.gameType || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Current Status:</strong> {drillToReprocess.status || 'N/A'}</Typography>
                  </Box>

                  {/* Annotation Info */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Annotation Status
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: drillToReprocess.manualAnnotation ? 'success.50' : 'warning.50', borderRadius: 1, mb: 3, border: 1, borderColor: drillToReprocess.manualAnnotation ? 'success.light' : 'warning.light' }}>
                    {drillToReprocess.manualAnnotation ? (
                      <>
                        <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 600 }}>
                          Manual annotation exists
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cones/markers have been manually annotated for this drill.
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                          No manual annotation
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This drill relies on automatic cone detection.
                        </Typography>
                      </>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Reprocess Mode Selection */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Choose Reprocess Action
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This will delete existing scores and analysis data.
                  </Typography>

                  <FormControl component="fieldset">
                    <RadioGroup
                      value={reprocessMode}
                      onChange={(e) => setReprocessMode(e.target.value)}
                    >
                      <FormControlLabel
                        value="immediate"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Immediately Reprocess
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Delete data and send directly for AI analysis
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="pending_annotation"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Set as Pending Annotation
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Delete data and allow manual cone annotation first
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleReprocessCancel} disabled={reprocessing}>
                Cancel
              </Button>
              <Button
                onClick={handleReprocessConfirm}
                color="primary"
                variant="contained"
                disabled={reprocessing}
                startIcon={reprocessing ? <CircularProgress size={16} /> : <RestartAltIcon />}
              >
                {reprocessing ? 'Processing...' : (reprocessMode === 'pending_annotation' ? 'Set Pending' : 'Reprocess Now')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Manual Scoring Modal */}
          <ManualScoringModal
            open={manualScoringOpen}
            onClose={() => {
              setManualScoringOpen(false);
              setSelectedDrillForScoring(null);
            }}
            drill={selectedDrillForScoring}
            onScoreSubmitted={handleManualScoreSubmitted}
          />

          {/* Score Comparison Modal */}
          <ScoreComparisonModal
            open={comparisonOpen}
            onClose={() => {
              setComparisonOpen(false);
              setSelectedDrillForComparison(null);
            }}
            drill={selectedDrillForComparison}
          />
        </Container>
      </RequireRole>
    </AppLayout>
  );
}

export default DrillsManagement;
