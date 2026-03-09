import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoTrimTimeline.css';

const VideoTrimTimeline = ({ duration, startTime, endTime, onChange, videoRef, videoFile, currentVideoTime, onPlayheadDrag }) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [timelineThumbnails, setTimelineThumbnails] = useState([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const thumbVideoRef = useRef(null);
  const thumbCanvasRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionFromTime = (time) => {
    return (time / duration) * 100;
  };

  const getTimeFromPosition = (pixelX) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, pixelX / rect.width));
    return percentage * duration;
  };

  const handleMouseDown = (type, event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(type);

    // Pause video when user starts dragging
    if (videoRef?.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  const handlePlayheadMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingPlayhead(true);

    // Pause video when dragging playhead
    if (videoRef?.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  const handleMouseMove = useCallback((event) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
    const newTime = percentage * duration;

    if (isDraggingPlayhead) {
      // Constrain playhead to non-trimmed area
      const constrainedTime = Math.max(startTime, Math.min(newTime, endTime));

      if (videoRef?.current) {
        videoRef.current.currentTime = constrainedTime;
      }

      // Update parent's currentVideoTime state for immediate visual feedback
      if (onPlayheadDrag) {
        onPlayheadDrag(constrainedTime);
      }
    } else if (isDragging) {
      if (isDragging === 'start') {
        const newStart = Math.max(0, Math.min(newTime, endTime - 1));
        onChange(newStart, endTime);
      } else if (isDragging === 'end') {
        const newEnd = Math.max(startTime + 1, Math.min(newTime, duration));
        onChange(startTime, newEnd);
      }
    }
  }, [isDragging, isDraggingPlayhead, startTime, endTime, duration, onChange, videoRef, onPlayheadDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setIsDraggingPlayhead(false);
  }, []);

  useEffect(() => {
    if (isDragging || isDraggingPlayhead) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isDraggingPlayhead, handleMouseMove, handleMouseUp]);

  // Generate timeline thumbnails
  useEffect(() => {
    const generateTimelineThumbnails = async () => {
      console.log('Starting thumbnail generation...', { videoFile, duration, hasVideo: !!thumbVideoRef.current, hasCanvas: !!thumbCanvasRef.current });

      if (!thumbVideoRef.current || !thumbCanvasRef.current || !videoFile || duration === 0) {
        console.log('Skipping thumbnail generation - missing requirements');
        return;
      }

      setIsGeneratingThumbnails(true);
      const video = thumbVideoRef.current;
      const canvas = thumbCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        setIsGeneratingThumbnails(false);
        return;
      }

      try {
        if (video.readyState < 2) {
          console.log('Waiting for video to load...');
          await new Promise((resolve) => {
            video.onloadeddata = () => {
              console.log('Video loaded successfully');
              resolve();
            };
          });
        }

        const thumbCount = 10;
        const newThumbnails = [];

        console.log(`Generating ${thumbCount} thumbnails for duration ${duration}s`);

        for (let i = 0; i < thumbCount; i++) {
          const time = i * (duration / thumbCount);

          await new Promise((resolve) => {
            let timeoutId;

            const cleanup = () => {
              if (timeoutId) clearTimeout(timeoutId);
              video.removeEventListener('seeked', seekedHandler);
              video.removeEventListener('error', errorHandler);
            };

            const seekedHandler = () => {
              cleanup();
              try {
                canvas.width = 200;
                canvas.height = 112;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                newThumbnails.push(dataUrl);
                console.log(`✓ Generated thumbnail ${i + 1}/${thumbCount} at ${time.toFixed(1)}s`);
                resolve();
              } catch (err) {
                console.warn(`Failed to generate thumbnail ${i + 1}:`, err);
                resolve();
              }
            };

            const errorHandler = () => {
              cleanup();
              console.warn(`Video error at ${time.toFixed(1)}s`);
              resolve();
            };

            timeoutId = setTimeout(() => {
              cleanup();
              console.warn(`Timeout at ${time.toFixed(1)}s`);
              resolve();
            }, 3000);

            video.addEventListener('seeked', seekedHandler);
            video.addEventListener('error', errorHandler);
            video.currentTime = time;
          });
        }

        console.log(`✓ Generated ${newThumbnails.length} thumbnails`);
        setTimelineThumbnails(newThumbnails);
      } catch (error) {
        console.error('Error generating thumbnails:', error);
      } finally {
        setIsGeneratingThumbnails(false);
      }
    };

    generateTimelineThumbnails();
  }, [videoFile, duration]);

  const startPos = getPositionFromTime(startTime);
  const endPos = getPositionFromTime(endTime);
  const segmentWidth = endPos - startPos;

  return (
    <div className="video-trim-timeline-container">
      {videoFile && (
        <>
          <video
            ref={thumbVideoRef}
            src={URL.createObjectURL(videoFile)}
            style={{ display: 'none' }}
            muted
          />
          <canvas ref={thumbCanvasRef} style={{ display: 'none' }} />
        </>
      )}

      <div className="trim-timeline-wrapper">
        <div ref={timelineRef} className="trim-timeline">
          {/* Time markers */}
          <div className="trim-time-markers">
            {Array.from({ length: 11 }).map((_, i) => {
              const percentage = (i / 10) * 100;
              const time = (duration * percentage) / 100;
              const isMajorMarker = i % 2 === 0;

              return (
                <div
                  key={i}
                  className={`trim-time-marker ${isMajorMarker ? '' : 'minor-marker'}`}
                  style={{ left: `${percentage}%` }}
                >
                  <div className="trim-marker-line" />
                  {isMajorMarker && <span className="trim-marker-label">{formatTime(time)}</span>}
                </div>
              );
            })}
          </div>

          {/* Timeline track with thumbnails */}
          <div className="trim-timeline-track">
            {isGeneratingThumbnails && (
              <div className="trim-thumbnail-loading">
                <div className="trim-loading-spinner"></div>
                <span>Generating preview...</span>
              </div>
            )}

            {timelineThumbnails.length > 0 && (
              <div className="trim-timeline-thumbnails">
                {timelineThumbnails.map((thumb, index) => (
                  <div
                    key={index}
                    className="trim-timeline-thumb"
                    style={{
                      left: `${(index / timelineThumbnails.length) * 100}%`,
                      width: `${100 / timelineThumbnails.length}%`
                    }}
                  >
                    <img src={thumb} alt={`Frame ${index}`} />
                  </div>
                ))}
              </div>
            )}

            {/* Left trimmed section (will be removed) */}
            <div
              className="trim-trimmed-section"
              style={{
                left: 0,
                width: `${startPos}%`,
              }}
            />

            {/* Right trimmed section (will be removed) */}
            <div
              className="trim-trimmed-section"
              style={{
                left: `${endPos}%`,
                width: `${100 - endPos}%`,
              }}
            />

            {/* Playhead indicator */}
            {currentVideoTime !== undefined && (
              <div
                className={`trim-timeline-playhead ${isDraggingPlayhead ? 'dragging' : ''}`}
                style={{
                  left: `${(currentVideoTime / duration) * 100}%`,
                }}
                onMouseDown={handlePlayheadMouseDown}
              />
            )}

            {/* Selected segment overlay */}
            <div
              className="trim-timeline-segment"
              style={{
                left: `${startPos}%`,
                width: `${segmentWidth}%`,
              }}
            >
              {/* Start handle */}
              <div
                className={`trim-timeline-handle trim-handle-start ${isDragging === 'start' ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown('start', e)}
              >
                <div className="trim-handle-grip" />
              </div>

              {/* End handle */}
              <div
                className={`trim-timeline-handle trim-handle-end ${isDragging === 'end' ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown('end', e)}
              >
                <div className="trim-handle-grip" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time info */}
      <div className="trim-timeline-info">
        <div className="trim-time-display">
          <span className="trim-time-label">Start:</span>
          <span className="trim-time-value">{formatTime(startTime)}</span>
        </div>
        <div className="trim-time-display">
          <span className="trim-time-label">End:</span>
          <span className="trim-time-value">{formatTime(endTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoTrimTimeline;
