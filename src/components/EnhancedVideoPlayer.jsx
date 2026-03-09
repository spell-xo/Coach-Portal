import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Slider, Typography, Menu, MenuItem, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SpeedIcon from '@mui/icons-material/Speed';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import BrushIcon from '@mui/icons-material/Brush';
import BookmarkIcon from '@mui/icons-material/Bookmark';

/**
 * EnhancedVideoPlayer
 *
 * Professional video player with advanced controls and annotations
 *
 * Features:
 * - Custom controls (play, pause, volume, fullscreen)
 * - Playback speed (0.25x - 2x)
 * - Frame-by-frame navigation (← →)
 * - Timeline with annotations
 * - Drawing canvas for cone detection
 * - Keyboard shortcuts
 * - Touch-optimized controls
 *
 * Usage:
 * <EnhancedVideoPlayer
 *   src="video.mp4"
 *   annotations={[
 *     { time: 5.2, label: 'Cone 1', color: '#ff0000' },
 *     { time: 10.5, label: 'Cone 2', color: '#00ff00' },
 *   ]}
 *   onAnnotationAdd={(annotation) => console.log('Added:', annotation)}
 * />
 */
const EnhancedVideoPlayer = ({
  src,
  poster,
  annotations = [],
  onAnnotationAdd,
  onAnnotationDelete,
  allowDrawing = true,
  sx = {},
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingEnabled, setDrawingEnabled] = useState(false);

  const [speedAnchorEl, setSpeedAnchorEl] = useState(null);

  const hideControlsTimeout = useRef(null);

  // Playback speed options
  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipFrames(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipFrames(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case ',':
          e.preventDefault();
          skipFrames(-1);
          break;
        case '.':
          e.preventDefault();
          skipFrames(1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-hide controls
  const resetHideControlsTimer = () => {
    setShowControls(true);

    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    resetHideControlsTimer();
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const skipFrames = (frames) => {
    const video = videoRef.current;
    if (!video) return;

    const fps = 30; // Assume 30fps
    const frameTime = 1 / fps;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + frames * frameTime));
  };

  const changeVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (event, newValue) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = newValue;
    setCurrentTime(newValue);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setSpeedAnchorEl(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      ref={containerRef}
      onMouseMove={resetHideControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      sx={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
        aspectRatio: '16/9',
        ...sx,
      }}
    >
      {/* Video Element */}
      <Box
        component="video"
        ref={videoRef}
        src={src}
        poster={poster}
        onClick={togglePlay}
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
        }}
      />

      {/* Drawing Canvas */}
      {allowDrawing && drawingEnabled && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: drawingEnabled ? 'auto' : 'none',
            cursor: 'crosshair',
          }}
        />
      )}

      {/* Timeline Annotations */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          height: 4,
          pointerEvents: 'none',
        }}
      >
        {annotations.map((annotation, index) => (
          <Tooltip key={index} title={annotation.label} arrow>
            <Box
              sx={{
                position: 'absolute',
                left: `${(annotation.time / duration) * 100}%`,
                top: -4,
                width: 4,
                height: 12,
                backgroundColor: annotation.color || 'primary.main',
                borderRadius: 1,
                transform: 'translateX(-50%)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                '&:hover': {
                  height: 16,
                  top: -6,
                },
              }}
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = annotation.time;
                }
              }}
            />
          </Tooltip>
        ))}
      </Box>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
              padding: 2,
              paddingTop: 4,
            }}
          >
            {/* Timeline */}
            <Box sx={{ marginBottom: 2, paddingX: 1 }}>
              <Slider
                value={currentTime}
                min={0}
                max={duration || 100}
                onChange={handleSeek}
                sx={{
                  color: 'primary.main',
                  height: 6,
                  '& .MuiSlider-thumb': {
                    width: 14,
                    height: 14,
                  },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {formatTime(duration)}
                </Typography>
              </Box>
            </Box>

            {/* Controls */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {/* Play/Pause */}
              <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              {/* Frame Navigation */}
              <Tooltip title="Previous frame (←)">
                <IconButton onClick={() => skipFrames(-1)} sx={{ color: 'white' }}>
                  <SkipPreviousIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next frame (→)">
                <IconButton onClick={() => skipFrames(1)} sx={{ color: 'white' }}>
                  <SkipNextIcon />
                </IconButton>
              </Tooltip>

              {/* Volume */}
              <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
              <Slider
                value={isMuted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={(e, val) => {
                  setVolume(val);
                  if (videoRef.current) {
                    videoRef.current.volume = val;
                  }
                  setIsMuted(val === 0);
                }}
                sx={{
                  width: 100,
                  color: 'white',
                }}
              />

              <Box sx={{ flex: 1 }} />

              {/* Drawing Tool */}
              {allowDrawing && (
                <Tooltip title="Drawing tools">
                  <IconButton
                    onClick={() => setDrawingEnabled(!drawingEnabled)}
                    sx={{
                      color: drawingEnabled ? 'primary.main' : 'white',
                    }}
                  >
                    <BrushIcon />
                  </IconButton>
                </Tooltip>
              )}

              {/* Add Annotation */}
              <Tooltip title="Add marker">
                <IconButton
                  onClick={() => {
                    onAnnotationAdd?.({
                      time: currentTime,
                      label: `Marker ${annotations.length + 1}`,
                      color: '#00ff00',
                    });
                  }}
                  sx={{ color: 'white' }}
                >
                  <BookmarkIcon />
                </IconButton>
              </Tooltip>

              {/* Playback Speed */}
              <Tooltip title="Playback speed">
                <IconButton
                  onClick={(e) => setSpeedAnchorEl(e.currentTarget)}
                  sx={{ color: 'white' }}
                >
                  <SpeedIcon />
                  <Typography variant="caption" sx={{ marginLeft: 0.5 }}>
                    {playbackRate}x
                  </Typography>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={speedAnchorEl}
                open={Boolean(speedAnchorEl)}
                onClose={() => setSpeedAnchorEl(null)}
              >
                {playbackSpeeds.map((speed) => (
                  <MenuItem
                    key={speed}
                    selected={speed === playbackRate}
                    onClick={() => handleSpeedChange(speed)}
                  >
                    {speed}x
                  </MenuItem>
                ))}
              </Menu>

              {/* Fullscreen */}
              <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default EnhancedVideoPlayer;
