import React, { useState, useRef, useEffect } from "react";
import { Paper, Grid, FormControl, InputLabel, Select, MenuItem, Checkbox, TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Button, Autocomplete, LinearProgress, Typography, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Fade } from "@mui/material";
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, VideoFile as VideoFileIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon, Search as SearchIcon, ContentCut as ContentCutIcon, Close as CloseIcon, Restore as RestoreIcon, PlayArrow as PlayArrowIcon, Pause as PauseIcon } from "@mui/icons-material";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import ProfilePictureWithHover from "../ProfilePictureWithHover";
import VideoTrimTimeline from "./VideoTrimTimeline";
import { DRILL_LEVELS, DRILL_TYPES } from "../../constants/drillConstants";

const VideoPlayerMatchingTable = ({
  selectedFiles,
  players,
  videoPlayerMap,
  setVideoPlayerMap,
  videoThumbnails,
  videoDrillLevelMap,
  setVideoDrillLevelMap,
  videoDrillTypeMap,
  setVideoDrillTypeMap,
  selectedVideos,
  setSelectedVideos,
  drillLevel,
  setDrillLevel,
  drillType,
  setDrillType,
  uploadPage,
  setUploadPage,
  uploadRowsPerPage,
  setUploadRowsPerPage,
  uploadMatchingFilter,
  setUploadMatchingFilter,
  uploadNameSearch,
  setUploadNameSearch,
  uploading,
  uploadProgress,
  onRemoveFile,
  onUpload,
  onUpdateFile, // Callback to update a file at a specific index
}) => {
  // Video preview state
  const [hoveringVideoIndex, setHoveringVideoIndex] = useState(null);

  // Video trimming state
  const [trimmingModalOpen, setTrimmingModalOpen] = useState(false);
  const [currentTrimmingIndex, setCurrentTrimmingIndex] = useState(null);
  const [trimmedVideos, setTrimmedVideos] = useState(new Set());
  const [originalFiles, setOriginalFiles] = useState({}); // Store original files before trimming: { index: originalFile }
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState("");
  const [isTrimming, setIsTrimming] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const trimVideoRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());

  // Use shared drill constants
  const drillLevels = DRILL_LEVELS;

  // Video preview handlers
  const handlePreviewMouseEnter = (index) => {
    setHoveringVideoIndex(index);
  };

  const handlePreviewMouseLeave = () => {
    setHoveringVideoIndex(null);
  };

  // FFmpeg initialization
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      try {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        setFfmpegLoaded(true);
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
      }
    };
    loadFFmpeg();
  }, []);

  // Handle trim button click
  const handleTrimClick = (index) => {
    const file = selectedFiles[index];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setTrimmedVideoUrl(url);
    setCurrentTrimmingIndex(index);
    setTrimmingModalOpen(true);
    hasInitializedPlayhead.current = false;

    // Create temporary video to get duration
    const tempVideo = document.createElement("video");
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;
      setVideoDuration(duration);
      setTrimStart(0);
      setTrimEnd(duration);

      // Set initial playhead position 3 seconds ahead of start
      const initialPosition = Math.min(3, duration);
      setCurrentVideoTime(initialPosition);
      hasInitializedPlayhead.current = true;

      // Set video to that position when modal video loads
      setTimeout(() => {
        if (trimVideoRef.current) {
          trimVideoRef.current.currentTime = initialPosition;
        }
      }, 100);
    };
  };

  // Handle timeline change
  const handleTimelineChange = (newStartTime, newEndTime) => {
    setTrimStart(newStartTime);
    setTrimEnd(newEndTime);
  };

  // Debounce timer ref
  const debounceTimerRef = useRef(null);
  const [isAdjustingTrim, setIsAdjustingTrim] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const playIconTimerRef = useRef(null);
  const videoScrubberRef = useRef(null);
  const hasInitializedPlayhead = useRef(false);

  // Global keyboard listener for space bar play/pause
  useEffect(() => {
    if (!trimmingModalOpen) return;

    const handleGlobalKeyDown = async (event) => {
      // Check if space bar is pressed and not typing in an input
      if ((event.key === " " || event.code === "Space") && event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
        event.preventDefault();

        const video = trimVideoRef.current;
        if (!video) return;

        try {
          if (video.paused) {
            await video.play();
          } else {
            video.pause();
          }
        } catch (error) {
          console.error("Error toggling play/pause:", error);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [trimmingModalOpen]);

  // Update current video time and play state for scrubber
  useEffect(() => {
    const video = trimVideoRef.current;
    if (!video || !trimmingModalOpen) return;

    const handleTimeUpdate = () => {
      setCurrentVideoTime(video.currentTime);

      // Also pause at trim end if actively playing within trim range
      if (!video.paused && video.currentTime >= trimEnd && video.currentTime <= trimEnd + 0.5) {
        video.pause();
        video.currentTime = trimEnd;
      }
    };

    const handlePlay = () => {
      // If starting from outside trim range, jump to trim start
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }

      setIsPlaying(true);

      // Show play icon for 0.5 seconds then fade away
      setShowPlayIcon(true);

      // Clear any existing timer
      if (playIconTimerRef.current) {
        clearTimeout(playIconTimerRef.current);
      }

      // Hide play icon after 0.5 seconds
      playIconTimerRef.current = setTimeout(() => {
        setShowPlayIcon(false);
      }, 500);
    };

    const handlePause = () => {
      setIsPlaying(false);

      // Clear play icon timer when paused
      if (playIconTimerRef.current) {
        clearTimeout(playIconTimerRef.current);
        playIconTimerRef.current = null;
      }

      // Hide play icon immediately when paused (pause icon will show instead)
      setShowPlayIcon(false);
    };

    const handleLoadedMetadata = () => {
      setCurrentVideoTime(video.currentTime);
    };

    const handleSeeked = () => {
      setCurrentVideoTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);

    // Initialize current time
    if (video.readyState >= 1) {
      setCurrentVideoTime(video.currentTime);
    }

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);

      // Clear timer on cleanup
      if (playIconTimerRef.current) {
        clearTimeout(playIconTimerRef.current);
      }
    };
  }, [trimmingModalOpen, trimStart, trimEnd]);

  // Debounced video preview update when trim times change
  useEffect(() => {
    if (!trimVideoRef.current || !trimmingModalOpen || !hasInitializedPlayhead.current) return;

    // Mark that we're adjusting trim
    setIsAdjustingTrim(true);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to update video after 2 seconds
    debounceTimerRef.current = setTimeout(() => {
      const video = trimVideoRef.current;
      if (video) {
        video.pause();
        // Only reset to trimStart if current position is outside trim bounds
        if (video.currentTime < trimStart || video.currentTime > trimEnd) {
          const newPosition = Math.min(trimStart + 3, trimEnd);
          video.currentTime = newPosition;
          setCurrentVideoTime(newPosition);
        }
        setIsAdjustingTrim(false);
      }
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [trimStart, trimEnd, trimmingModalOpen]);

  // Handle trim save
  const handleSaveTrim = async () => {
    console.log("handleSaveTrim called");
    console.log("FFmpeg loaded:", ffmpegLoaded);
    console.log("Trim start:", trimStart, "Trim end:", trimEnd);

    if (!ffmpegLoaded) {
      alert("FFmpeg is still loading. Please wait.");
      return;
    }

    if (trimStart >= trimEnd) {
      alert("Start time must be before end time");
      return;
    }

    setIsTrimming(true);
    const ffmpeg = ffmpegRef.current;

    try {
      const file = selectedFiles[currentTrimmingIndex];
      console.log("Processing file:", file.name);

      const inputFileName = "input.mp4";
      const outputFileName = "output.mp4";

      // Write input file to FFmpeg file system
      console.log("Writing input file...");
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));

      // Trim video using input seeking
      const duration = trimEnd - trimStart;
      console.log("Executing FFmpeg with duration:", duration);

      await ffmpeg.exec(["-ss", trimStart.toString(), "-i", inputFileName, "-t", duration.toString(), "-c", "copy", "-avoid_negative_ts", "make_zero", outputFileName]);

      console.log("Reading output file...");
      // Read output file
      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data.buffer], { type: "video/mp4" });
      const trimmedFile = new File([blob], file.name, { type: "video/mp4" });

      console.log("Trimmed file created:", trimmedFile.name, "Size:", trimmedFile.size);

      // Save original file before replacing (only if not already saved)
      if (!originalFiles[currentTrimmingIndex]) {
        console.log("Saving original file for index:", currentTrimmingIndex);
        setOriginalFiles((prev) => ({
          ...prev,
          [currentTrimmingIndex]: file,
        }));
      }

      // Update the selected files array with trimmed version
      if (onUpdateFile) {
        console.log("Calling onUpdateFile...");
        onUpdateFile(currentTrimmingIndex, trimmedFile);
      } else {
        console.warn("onUpdateFile callback not provided");
      }

      // Mark as trimmed
      setTrimmedVideos(new Set([...trimmedVideos, currentTrimmingIndex]));

      // Close modal
      setTrimmingModalOpen(false);
      setIsTrimming(false);

      alert("Video trimmed successfully!");
    } catch (error) {
      console.error("Trimming failed:", error);
      alert(`Failed to trim video: ${error.message}`);
      setIsTrimming(false);
    }
  };

  // Handle close trimming modal
  const handleCloseTrimModal = () => {
    if (!isTrimming) {
      setTrimmingModalOpen(false);
      setCurrentTrimmingIndex(null);
      hasInitializedPlayhead.current = false;
      if (trimmedVideoUrl) {
        URL.revokeObjectURL(trimmedVideoUrl);
        setTrimmedVideoUrl("");
      }
    }
  };

  // Handle reset to original video
  const handleResetToOriginal = (index) => {
    console.log("🔄 [VideoPlayerMatchingTable] Resetting video at index:", index);

    const originalFile = originalFiles[index];
    if (!originalFile) {
      console.warn("No original file found for index:", index);
      alert("No original video found to restore");
      return;
    }

    // Restore the original file
    if (onUpdateFile) {
      console.log("Restoring original file:", originalFile.name);
      onUpdateFile(index, originalFile);
    }

    // Remove from trimmed videos set
    const newTrimmedVideos = new Set(trimmedVideos);
    newTrimmedVideos.delete(index);
    setTrimmedVideos(newTrimmedVideos);

    // Remove from original files map
    const newOriginalFiles = { ...originalFiles };
    delete newOriginalFiles[index];
    setOriginalFiles(newOriginalFiles);

    console.log("✅ [VideoPlayerMatchingTable] Video restored to original");
    alert("Video restored to original version");
  };

  // Handle reset trim
  const handleResetTrim = () => {
    setTrimStart(0);
    setTrimEnd(videoDuration);
    if (trimVideoRef.current) {
      trimVideoRef.current.currentTime = 0;
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle scrubber click to seek
  const handleScrubberClick = (event) => {
    if (!videoScrubberRef.current || !trimVideoRef.current) return;

    const rect = videoScrubberRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * videoDuration;

    trimVideoRef.current.currentTime = newTime;
  };

  // Handle play/pause toggle
  const handlePlayPause = async () => {
    if (!trimVideoRef.current) return;

    const video = trimVideoRef.current;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  // Handle video click to toggle play/pause
  const handleVideoClick = (e) => {
    e.preventDefault();
    handlePlayPause();
  };

  // Handle playhead drag
  const handlePlayheadDrag = (newTime) => {
    setCurrentVideoTime(newTime);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIndices = selectedFiles.map((_, index) => index);
      setSelectedVideos(new Set(allIndices));
    } else {
      setSelectedVideos(new Set());
    }
  };

  const handleSelectVideo = (index) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleGlobalDrillLevelChange = (value) => {
    setDrillLevel(value);
    setDrillType(''); // Clear drill type when level changes
    const newLevelMap = {};
    const newTypeMap = {};
    selectedFiles.forEach((_, index) => {
      newLevelMap[index] = value;
      newTypeMap[index] = ''; // Clear row drill type when level changes
    });
    setVideoDrillLevelMap(newLevelMap);
    setVideoDrillTypeMap(newTypeMap);
  };

  const handleGlobalDrillTypeChange = (value) => {
    setDrillType(value);
    const newMap = {};
    selectedFiles.forEach((_, index) => {
      newMap[index] = value;
    });
    setVideoDrillTypeMap(newMap);
  };

  const handleRowDrillLevelChange = (index, value) => {
    setVideoDrillLevelMap((prev) => ({
      ...prev,
      [index]: value,
    }));
    // Clear drill type for this row when level changes
    setVideoDrillTypeMap((prev) => ({
      ...prev,
      [index]: '',
    }));
  };

  const handleRowDrillTypeChange = (index, value) => {
    setVideoDrillTypeMap((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFilteredVideos = () => {
    let filtered = selectedFiles.map((file, index) => ({ file, index }));

    if (uploadMatchingFilter === "matched") {
      filtered = filtered.filter(({ index }) => videoPlayerMap[index]);
    } else if (uploadMatchingFilter === "unmatched") {
      filtered = filtered.filter(({ index }) => !videoPlayerMap[index]);
    }

    if (uploadNameSearch.trim()) {
      const searchLower = uploadNameSearch.toLowerCase().trim();
      filtered = filtered.filter(({ file }) => file.name.toLowerCase().includes(searchLower));
    }

    return filtered;
  };

  const filteredVideos = getFilteredVideos();
  const paginatedVideos = filteredVideos.slice(uploadPage * uploadRowsPerPage, uploadPage * uploadRowsPerPage + uploadRowsPerPage);

  const handleUploadPageChange = (event, newPage) => {
    setUploadPage(newPage);
  };

  const handleUploadRowsPerPageChange = (event) => {
    setUploadRowsPerPage(parseInt(event.target.value, 10));
    setUploadPage(0);
  };

  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom>
          Default Drill Settings
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}>
          Set default drill level and type for all videos. You can customize individual videos later.
        </Typography>
        <Grid
          container
          spacing={2}>
          <Grid
            item
            xs={12}
            sm={6}>
            <FormControl fullWidth>
              <InputLabel>Drill level</InputLabel>
              <Select
                value={drillLevel}
                label="Drill level"
                onChange={(e) => handleGlobalDrillLevelChange(e.target.value)}>
                {drillLevels.map((level) => (
                  <MenuItem
                    key={level.value}
                    value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}>
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
                }}>
                {DRILL_TYPES(drillLevel || null).map((type) => (
                  <MenuItem
                    key={type.value}
                    value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          variant="subtitle1"
          fontWeight="bold">
          Video Player Matching ({selectedFiles.length} videos)
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
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

      <Grid
        container
        spacing={2}
        sx={{ mb: 2 }}>
        <Grid
          item
          xs={12}
          sm={6}
          md={4}>
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
        <Grid
          item
          xs={12}
          sm={6}
          md={4}>
          <FormControl
            fullWidth
            size="small">
            <InputLabel>Matching Status</InputLabel>
            <Select
              value={uploadMatchingFilter}
              label="Matching Status"
              onChange={(e) => {
                setUploadMatchingFilter(e.target.value);
                setUploadPage(0);
              }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="matched">Matched</MenuItem>
              <MenuItem value="unmatched">Unmatched</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ overflowX: "auto" }}>
        <Table
          size="small"
          sx={{ minWidth: 1000 }}>
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
            {paginatedVideos.map(({ file, index }) => {
              const matchedPlayerId = videoPlayerMap[index];
              const matchedPlayer = players.find((p) => p.id === matchedPlayerId);
              const isMatched = matchedPlayerId && matchedPlayerId !== "UNMATCHED";
              const isUnmatched = matchedPlayerId === "UNMATCHED";

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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {videoThumbnails[index] ? (
                        <Box
                          sx={{
                            width: 80,
                            height: 60,
                            cursor: "pointer",
                            position: "relative",
                            "&:hover": {
                              opacity: 0.8,
                              borderColor: "primary.main",
                            },
                          }}
                          onMouseEnter={() => handlePreviewMouseEnter(index)}
                          onMouseLeave={handlePreviewMouseLeave}>
                          <Box
                            component="img"
                            src={videoThumbnails[index]}
                            alt="Video preview"
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "2px solid",
                              borderColor: "divider",
                              pointerEvents: "none",
                            }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 80,
                            height: 60,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "grey.100",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                          }}>
                          <VideoFileIcon sx={{ color: "grey.400" }} />
                        </Box>
                      )}
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight="medium">
                          {file.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block">
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={[{ id: "UNMATCHED", name: "UNMATCHED", email: "" }, ...players]}
                      getOptionLabel={(option) => {
                        if (option.id === "UNMATCHED") return "UNMATCHED";
                        return `${option.name} (${option.email})`;
                      }}
                      value={isUnmatched ? { id: "UNMATCHED", name: "UNMATCHED", email: "" } : matchedPlayer || null}
                      onChange={(event, newValue) => {
                        setVideoPlayerMap((prev) => ({
                          ...prev,
                          [index]: newValue ? newValue.id : null,
                        }));
                      }}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        if (option.id === "UNMATCHED") {
                          return (
                            <Box
                              component="li"
                              key={key}
                              {...otherProps}>
                              <Typography fontWeight="medium">UNMATCHED</Typography>
                            </Box>
                          );
                        }
                        return (
                          <Box
                            component="li"
                            key={key}
                            {...otherProps}
                            sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <ProfilePictureWithHover
                              src={option.profilePicture}
                              alt={option.name}
                              size={32}
                              zoomSize={150}
                            />
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight="medium">
                                {option.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary">
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
                    <FormControl
                      size="small"
                      fullWidth>
                      <Select
                        value={rowDrillLevel}
                        onChange={(e) => handleRowDrillLevelChange(index, e.target.value)}
                        displayEmpty>
                        {drillLevels.map((level) => (
                          <MenuItem
                            key={level.value}
                            value={level.value}>
                            {level.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl
                      size="small"
                      fullWidth>
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
                        }}>
                        {DRILL_TYPES(rowDrillLevel || null).map((type) => (
                          <MenuItem
                            key={type.value}
                            value={type.value}>
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
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <IconButton
                        size="small"
                        onClick={() => handleTrimClick(index)}
                        color={trimmedVideos.has(index) ? "primary" : "default"}
                        sx={{
                          backgroundColor: trimmedVideos.has(index) ? "rgba(25, 118, 210, 0.15)" : "transparent",
                          border: trimmedVideos.has(index) ? "2px solid rgba(25, 118, 210, 0.5)" : "none",
                          "&:hover": {
                            backgroundColor: trimmedVideos.has(index) ? "rgba(25, 118, 210, 0.25)" : "rgba(25, 118, 210, 0.08)",
                          },
                        }}>
                        <ContentCutIcon fontSize="small" />
                      </IconButton>
                      {trimmedVideos.has(index) && (
                        <IconButton
                          size="small"
                          onClick={() => handleResetToOriginal(index)}
                          color="warning"
                          title="Reset to original video"
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(237, 108, 2, 0.08)",
                            },
                          }}>
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => onRemoveFile(index)}
                        color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredVideos.length}
          rowsPerPage={uploadRowsPerPage}
          page={uploadPage}
          onPageChange={handleUploadPageChange}
          onRowsPerPageChange={handleUploadRowsPerPageChange}
        />
      </TableContainer>

      {uploading && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom>
            Uploading videos... {uploadProgress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
          />
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
        <Button
          variant="contained"
          onClick={() => {
            console.log("🔘 [VideoPlayerMatchingTable] Upload button clicked");
            console.log("📊 [VideoPlayerMatchingTable] selectedVideos.size:", selectedVideos.size);
            console.log("📊 [VideoPlayerMatchingTable] uploading:", uploading);
            console.log("📊 [VideoPlayerMatchingTable] onUpload type:", typeof onUpload);
            if (onUpload) {
              onUpload();
            } else {
              console.error("❌ [VideoPlayerMatchingTable] onUpload is not defined!");
            }
          }}
          disabled={uploading || selectedVideos.size === 0}
          startIcon={<CloudUploadIcon />}>
          Upload Selected Videos ({selectedVideos.size})
        </Button>
      </Box>

      {/* Video Preview Tooltip */}
      {hoveringVideoIndex !== null && selectedFiles[hoveringVideoIndex] && (
        <Box
          sx={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#1a1a1a",
            border: "3px solid",
            borderColor: "primary.main",
            borderRadius: 3,
            padding: 1.5,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "fadeIn 0.2s ease",
            "@keyframes fadeIn": {
              from: {
                opacity: 0,
                transform: "translate(-50%, -45%)",
              },
              to: {
                opacity: 1,
                transform: "translate(-50%, -50%)",
              },
            },
          }}>
          <video
            src={URL.createObjectURL(selectedFiles[hoveringVideoIndex])}
            autoPlay
            loop
            muted={false}
            style={{
              width: "480px",
              maxWidth: "90vw",
              height: "auto",
              maxHeight: "70vh",
              borderRadius: "8px",
              display: "block",
              backgroundColor: "#000",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              marginTop: 1,
              textAlign: "center",
              color: "white",
              fontWeight: 600,
              backgroundColor: "primary.main",
              padding: "6px 12px",
              borderRadius: 1,
            }}>
            {selectedFiles[hoveringVideoIndex].name}
          </Typography>
        </Box>
      )}

      {/* Video Trimming Modal */}
      <Dialog
        open={trimmingModalOpen}
        onClose={handleCloseTrimModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: "80vh",
            maxHeight: "90vh",
          },
        }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ContentCutIcon />
            Trim Video
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <Typography
              variant="body2"
              color="text.secondary">
              Total Duration: <strong>{formatTime(videoDuration)}</strong>
            </Typography>
            <Typography
              variant="body2"
              color="primary.main">
              New Duration: <strong>{formatTime(trimEnd - trimStart)}</strong>
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseTrimModal}
            disabled={isTrimming}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}>
          {/* Video Preview */}
          <Box
            sx={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}>
            <video
              ref={trimVideoRef}
              src={trimmedVideoUrl}
              style={{
                width: "100%",
                maxHeight: "400px",
                display: "block",
                cursor: "pointer",
              }}
              onClick={handleVideoClick}
              onLoadedMetadata={(e) => {
                if (!hasInitializedPlayhead.current) {
                  const initialPosition = Math.min(3, e.target.duration);
                  e.target.currentTime = initialPosition;
                  setCurrentVideoTime(initialPosition);
                }
              }}
            />

            {/* Play/Pause Icon Overlay */}
            {!isPlaying && !showPlayIcon && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "50%",
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 10,
                  animation: "zoomOut 0.3s ease-out",
                  "@keyframes zoomOut": {
                    "0%": {
                      transform: "translate(-50%, -50%) scale(1.5)",
                      opacity: 0,
                    },
                    "100%": {
                      transform: "translate(-50%, -50%) scale(1)",
                      opacity: 1,
                    },
                  },
                }}>
                <PauseIcon sx={{ fontSize: 48, color: "white", opacity: 0.9 }} />
              </Box>
            )}

            {isPlaying && showPlayIcon && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "50%",
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 10,
                  animation: "zoomInFade 0.5s ease-out forwards",
                  "@keyframes zoomInFade": {
                    "0%": {
                      transform: "translate(-50%, -50%) scale(0.5)",
                      opacity: 0,
                    },
                    "50%": {
                      transform: "translate(-50%, -50%) scale(1)",
                      opacity: 1,
                    },
                    "100%": {
                      transform: "translate(-50%, -50%) scale(1.2)",
                      opacity: 0,
                    },
                  },
                }}>
                <PlayArrowIcon sx={{ fontSize: 48, color: "white", opacity: 0.9 }} />
              </Box>
            )}

            {/* Duration Overlay - Bottom Right */}
            <Box
              sx={{
                position: "absolute",
                bottom: 12,
                right: 12,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "white",
                padding: "6px 12px",
                borderRadius: 1,
                fontSize: "13px",
                fontWeight: 600,
                pointerEvents: "none",
                zIndex: 10,
                fontFamily: "monospace",
              }}>
              {formatTime(currentVideoTime)} / {formatTime(videoDuration)}
            </Box>

            {isAdjustingTrim && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: 2,
                  fontSize: "14px",
                  fontWeight: 600,
                  pointerEvents: "none",
                  zIndex: 11,
                }}>
                Adjusting trim range...
              </Box>
            )}
          </Box>

          {/* Timeline Controls */}
          <VideoTrimTimeline
            duration={videoDuration}
            startTime={trimStart}
            endTime={trimEnd}
            onChange={handleTimelineChange}
            videoRef={trimVideoRef}
            videoFile={selectedFiles[currentTrimmingIndex]}
            currentVideoTime={currentVideoTime}
            onPlayheadDrag={handlePlayheadDrag}
          />

          {!ffmpegLoaded && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <LinearProgress />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}>
                Loading FFmpeg... Please wait.
              </Typography>
            </Box>
          )}

          {isTrimming && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <LinearProgress />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}>
                Trimming video... This may take a moment.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, justifyContent: "space-between" }}>
          <Button
            onClick={handleResetTrim}
            disabled={isTrimming}
            startIcon={<RestoreIcon />}
            sx={{
              color: "#1565c0",
              "&:hover": {
                backgroundColor: "rgba(21, 101, 192, 0.08)",
              },
            }}>
            Reset
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={handleCloseTrimModal}
              disabled={isTrimming}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveTrim}
              disabled={!ffmpegLoaded || isTrimming || trimStart >= trimEnd}
              startIcon={<ContentCutIcon />}>
              {isTrimming ? "Trimming..." : "Trim Video"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default VideoPlayerMatchingTable;
