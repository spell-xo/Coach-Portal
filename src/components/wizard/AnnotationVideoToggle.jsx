import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';

const AnnotationVideoToggle = ({ originalUrl, annotationUrl, onToggle }) => {
  const [mode, setMode] = useState('original');
  const videoRef = useRef(null);
  const pendingSeek = useRef(null);

  const handleToggle = useCallback((event, newMode) => {
    if (!newMode) return;

    // Capture current playback position before switching
    const video = videoRef.current;
    const currentTime = video?.currentTime || 0;
    const wasPlaying = video && !video.paused;

    // Store the seek target for after the new source loads
    pendingSeek.current = { time: currentTime, play: wasPlaying };

    setMode(newMode);
    onToggle?.(newMode);
  }, [onToggle]);

  // When the video element loads new metadata, restore the playback position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      if (pendingSeek.current) {
        const { time, play } = pendingSeek.current;
        pendingSeek.current = null;
        video.currentTime = time;
        if (play) {
          video.play().catch(() => {});
        }
      }
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  });

  const videoSrc = mode === 'annotated' && annotationUrl ? annotationUrl : originalUrl;

  return (
    <Box>
      {/* Toggle control — only visible when annotation is available */}
      {annotationUrl && (
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleToggle}
          size="small"
          sx={{ mb: 1 }}
        >
          <ToggleButton
            value="original"
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              px: 2,
              py: 0.5,
              '&.Mui-selected': { bgcolor: 'grey.900', color: 'white', '&:hover': { bgcolor: 'grey.800' } },
            }}
          >
            Original
          </ToggleButton>
          <ToggleButton
            value="annotated"
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              px: 2,
              py: 0.5,
              '&.Mui-selected': { bgcolor: '#24FF00', color: 'black', '&:hover': { bgcolor: '#1ecc00' } },
            }}
          >
            Annotated
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      <video
        ref={videoRef}
        key={videoSrc}
        controls
        style={{ width: '100%', borderRadius: '8px' }}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
};

export default AnnotationVideoToggle;
