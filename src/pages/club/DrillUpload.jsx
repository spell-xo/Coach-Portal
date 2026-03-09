import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Paper,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useDropzone } from 'react-dropzone';
import AppLayout from '../../components/AppLayout';
import RequireRole from '../../components/RequireRole';
import VideoLoader from '../../components/video-splitter/VideoLoader';
import Timeline from '../../components/video-splitter/Timeline';
import DropZone from '../../components/video-splitter/DropZone';
import VideoPlayerMatchingTable from '../../components/drills/VideoPlayerMatchingTable';
import clubService from '../../api/clubService';
import drillService from '../../api/drillService';
import { extractFirstFrame } from '../../utils/videoUtils';
import { uploadExtractedFrame } from '../../components/drills/VideoFrameExtractor';
import './DrillUpload.css';

const DrillUpload = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();

  // Mode state
  const [mode, setMode] = useState(0); // 0 = Bulk Upload, 1 = Split Video

  // Split video state
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [extractedRanges, setExtractedRanges] = useState([]);
  const [timelineResetKey, setTimelineResetKey] = useState(0);

  // Shared state for both modes
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [videoPlayerMap, setVideoPlayerMap] = useState({});
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [videoDrillLevelMap, setVideoDrillLevelMap] = useState({});
  const [videoDrillTypeMap, setVideoDrillTypeMap] = useState({});
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [drillLevel, setDrillLevel] = useState('');
  const [drillType, setDrillType] = useState('');

  // Pagination and filtering
  const [uploadPage, setUploadPage] = useState(0);
  const [uploadRowsPerPage, setUploadRowsPerPage] = useState(10);
  const [uploadMatchingFilter, setUploadMatchingFilter] = useState('all');
  const [uploadNameSearch, setUploadNameSearch] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Players
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  // Load FFmpeg
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
      } finally {
        setLoadingPlayers(false);
      }
    };

    if (clubId) {
      loadPlayers();
    }
  }, [clubId]);

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

  // Generate thumbnail from video file
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

  // ===== BULK UPLOAD MODE =====
  const onDrop = (acceptedFiles) => {
    const videoFiles = acceptedFiles.filter(file => file.type.startsWith('video/'));
    if (videoFiles.length === 0) {
      setError('Please select valid video files');
      return;
    }

    const currentCount = selectedFiles.length;
    setSelectedFiles(prev => [...prev, ...videoFiles]);

    // Auto-select newly added videos
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      videoFiles.forEach((_, idx) => {
        newSet.add(currentCount + idx);
      });
      return newSet;
    });

    // Generate thumbnails
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    multiple: true,
  });

  // ===== SPLIT VIDEO MODE =====
  const handleVideoLoad = (file) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      // Default segment is 20% of video duration (minimum 30 seconds)
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

      await ffmpeg.exec([
        '-ss', startTime.toString(),
        '-i', inputFileName,
        '-t', segmentDuration.toString(),
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
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

  const handleResetTimeline = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Reset Timeline clicked');
    setExtractedRanges([]);
    setStartTime(0);
    // Set to 20% of video duration (minimum 30 seconds)
    setEndTime(Math.max(30, Math.min(videoDuration * 0.2, videoDuration)));
    // Reset zoom to 100% by forcing Timeline remount
    setTimelineResetKey(prev => prev + 1);
  };

  const handleChangeVideo = () => {
    setVideoFile(null);
    setVideoUrl('');
    setExtractedRanges([]);
  };

  // ===== SHARED FUNCTIONS =====
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

  const handleUpload = async () => {
    if (selectedVideos.size === 0) {
      setError('Please select at least one video to upload');
      return;
    }

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

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload videos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <RequireRole roles={['head_coach', 'coach']}>
      <AppLayout>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => navigate(`/clubs/${clubId}/drill-uploads`)}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1">
                Upload Drill Videos
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Mode Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={mode} onChange={(e, newValue) => setMode(newValue)}>
              <Tab label="Bulk Upload" />
              <Tab label="Split Video" />
            </Tabs>
          </Paper>

          {/* Bulk Upload Mode */}
          {mode === 0 && (
            <Paper sx={{ p: 4, mb: 3 }}>
              <div
                {...getRootProps()}
                className={`bulk-upload-dropzone ${isDragActive ? 'drag-active' : ''}`}
              >
                <input {...getInputProps()} />
                <svg
                  className="upload-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {isDragActive ? (
                  <Typography variant="h6">Drop the videos here...</Typography>
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Drag & drop videos here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      or click to select files
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supports MP4, MOV, AVI, and more
                    </Typography>
                  </>
                )}
              </div>
            </Paper>
          )}

          {/* Split Video Mode */}
          {mode === 1 && (
            <div className="video-splitter-app">
              {!videoFile ? (
                <div className="video-splitter-container">
                  {!ffmpegLoaded && (
                    <div className="loading-banner">
                      Loading FFmpeg... Please wait.
                    </div>
                  )}
                  <VideoLoader onVideoLoad={handleVideoLoad} />
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleVideoMetadata}
                    style={{ display: 'none' }}
                  />

                  {videoDuration > 0 && (
                    <div className="timeline-full-width">
                      <Timeline
                        key={timelineResetKey}
                        duration={videoDuration}
                        startTime={startTime}
                        endTime={endTime}
                        onChange={handleTimelineChange}
                        videoRef={videoRef}
                        videoFile={videoFile}
                        extractedRanges={extractedRanges}
                      />
                    </div>
                  )}

                  <div className="video-splitter-container">
                    {!ffmpegLoaded && (
                      <div className="loading-banner">
                        Loading FFmpeg... Please wait.
                      </div>
                    )}

                    <div className="video-editor">
                      <DropZone
                        onDrop={handleDrop}
                        isProcessing={isProcessing}
                        processingProgress={processingProgress}
                      />

                      <div className="button-group">
                        {extractedRanges.length > 0 && (
                          <button
                            className="reset-timeline-btn"
                            onClick={handleResetTimeline}
                          >
                            Reset Timeline
                          </button>
                        )}
                        <button
                          className="change-video-btn"
                          onClick={handleChangeVideo}
                        >
                          Change Video
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Shared Video Player Matching Table */}
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
          />
        </Container>
      </AppLayout>
    </RequireRole>
  );
};

export default DrillUpload;
