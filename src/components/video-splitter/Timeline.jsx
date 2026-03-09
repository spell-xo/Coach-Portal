import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Timeline.css';

const Timeline = ({
  duration,
  startTime,
  endTime,
  onChange,
  videoRef,
  videoFile,
  extractedRanges = []
}) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [previewThumbnail, setPreviewThumbnail] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [timelineThumbnails, setTimelineThumbnails] = useState([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [thumbnailCache, setThumbnailCache] = useState(new Map());
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [userControlsZoom, setUserControlsZoom] = useState(false);
  const skipAutoZoomRef = useRef(false);
  const timelineWrapperRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const segmentVideoRef = useRef(null);
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
    setHasUserInteracted(true);
  };

  const generateThumbnail = useCallback(async (time) => {
    const cacheKey = Math.round(time * 10) / 10;

    if (thumbnailCache.has(cacheKey)) {
      setPreviewThumbnail(thumbnailCache.get(cacheKey));
      return;
    }

    if (!videoRef.current || !previewCanvasRef.current) {
      console.warn('Video or canvas not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available');
      return;
    }

    if (video.readyState < 2) {
      console.warn('Video not loaded enough for preview');
      return;
    }

    const originalTime = video.currentTime;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        video.removeEventListener('seeked', seekedHandler);
        video.removeEventListener('error', errorHandler);
        console.warn(`Preview timeout at ${cacheKey}s`);
        video.currentTime = originalTime;
        resolve();
      }, 500);

      const seekedHandler = () => {
        clearTimeout(timeout);
        video.removeEventListener('seeked', seekedHandler);
        video.removeEventListener('error', errorHandler);

        try {
          canvas.width = 160;
          canvas.height = 90;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

          setThumbnailCache(prev => {
            const newCache = new Map(prev);
            newCache.set(cacheKey, dataUrl);
            if (newCache.size > 500) {
              const firstKey = newCache.keys().next().value;
              if (firstKey !== undefined) {
                newCache.delete(firstKey);
              }
            }
            return newCache;
          });

          setPreviewThumbnail(dataUrl);
          console.log(`✓ Cached preview at ${cacheKey}s`);

          setTimeout(() => {
            video.currentTime = originalTime;
          }, 50);

          resolve();
        } catch (err) {
          console.error('Error generating preview:', err);
          video.currentTime = originalTime;
          resolve();
        }
      };

      const errorHandler = () => {
        clearTimeout(timeout);
        video.removeEventListener('seeked', seekedHandler);
        video.removeEventListener('error', errorHandler);
        console.warn(`Preview error at ${cacheKey}s`);
        video.currentTime = originalTime;
        resolve();
      };

      video.addEventListener('seeked', seekedHandler, { once: true });
      video.addEventListener('error', errorHandler, { once: true });

      video.currentTime = cacheKey;
    });
  }, [thumbnailCache, videoRef]);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
    const newTime = percentage * duration;

    const MINIMUM_DURATION = 30;

    if (isDragging === 'start') {
      const maxStart = endTime - MINIMUM_DURATION;
      const newStart = Math.max(0, Math.min(newTime, maxStart));

      if (endTime - newStart >= MINIMUM_DURATION) {
        onChange(newStart, endTime);
        generateThumbnail(newStart);
      }
    } else if (isDragging === 'end') {
      const minEnd = startTime + MINIMUM_DURATION;
      const newEnd = Math.max(minEnd, Math.min(newTime, duration));

      if (newEnd - startTime >= MINIMUM_DURATION) {
        onChange(startTime, newEnd);
        generateThumbnail(newEnd);
      }
    } else if (isDragging === 'segment') {
      const deltaX = mouseX - dragStartX;
      const deltaTime = (deltaX / rect.width) * duration;

      const segmentDuration = endTime - startTime;
      let newStart = dragStartTime + deltaTime;
      let newEnd = newStart + segmentDuration;

      if (newStart < 0) {
        newStart = 0;
        newEnd = segmentDuration;
      } else if (newEnd > duration) {
        newEnd = duration;
        newStart = duration - segmentDuration;
      }

      onChange(newStart, newEnd);
      generateThumbnail(newStart);

      if (timelineWrapperRef.current) {
        const wrapper = timelineWrapperRef.current;
        const segmentCenter = (newStart + newEnd) / 2;
        const segmentCenterPercent = segmentCenter / duration;
        const timelineWidth = rect.width;
        const segmentCenterPosition = timelineWidth * segmentCenterPercent;

        const wrapperWidth = wrapper.offsetWidth;
        const scrollLeft = wrapper.scrollLeft;
        const viewportLeft = scrollLeft;
        const viewportRight = scrollLeft + wrapperWidth;

        const edgeMargin = wrapperWidth * 0.2;

        if (segmentCenterPosition < viewportLeft + edgeMargin) {
          const distance = viewportLeft + edgeMargin - segmentCenterPosition;
          const scrollAmount = Math.min(distance * 0.1, 20);
          wrapper.scrollLeft = Math.max(0, scrollLeft - scrollAmount);
        } else if (segmentCenterPosition > viewportRight - edgeMargin) {
          const distance = segmentCenterPosition - (viewportRight - edgeMargin);
          const scrollAmount = Math.min(distance * 0.1, 20);
          const maxScroll = timelineWidth - wrapperWidth;
          wrapper.scrollLeft = Math.min(maxScroll, scrollLeft + scrollAmount);
        }
      }
    }
  }, [isDragging, startTime, endTime, duration, onChange, generateThumbnail, dragStartX, dragStartTime]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setPreviewThumbnail(null);
    setHoverPosition(null);
  }, []);

  const applyZoom = useCallback((newZoom) => {
    const segmentCenter = (startTime + endTime) / 2;
    const segmentCenterPercent = segmentCenter / duration;

    setZoomLevel(newZoom);

    setTimeout(() => {
      if (timelineWrapperRef.current && timelineRef.current) {
        const wrapper = timelineWrapperRef.current;
        const timeline = timelineRef.current;

        const timelineWidth = timeline.offsetWidth;
        const segmentCenterPosition = timelineWidth * segmentCenterPercent;

        const wrapperWidth = wrapper.offsetWidth;
        const scrollLeft = segmentCenterPosition - (wrapperWidth / 2);

        wrapper.scrollLeft = Math.max(0, scrollLeft);
      }
    }, 50);
  }, [startTime, endTime, duration]);

  useEffect(() => {
    if (skipAutoZoomRef.current) {
      return;
    }

    if (!hasUserInteracted) {
      return;
    }

    if (userControlsZoom) {
      return;
    }

    const segmentDuration = endTime - startTime;
    const segmentPercentage = (segmentDuration / duration) * 100;

    if (duration < 120) {
      return;
    }

    let targetZoom = 1;

    if (segmentPercentage < 5) {
      targetZoom = 5;
    } else if (segmentPercentage < 10) {
      targetZoom = 4;
    } else if (segmentPercentage < 20) {
      targetZoom = 3;
    } else if (segmentPercentage < 30) {
      targetZoom = 2;
    } else if (segmentPercentage < 50) {
      targetZoom = 1.5;
    } else {
      targetZoom = 1;
    }

    if (Math.abs(zoomLevel - targetZoom) > 0.1) {
      applyZoom(targetZoom);
    }
  }, [startTime, endTime, duration, zoomLevel, applyZoom, hasUserInteracted, userControlsZoom]);

  const handleTimelineMouseMove = (event) => {
    if (isDragging || !timelineRef.current) return;

    const target = event.target;
    if (target.classList.contains('segment-drag-extract') ||
        target.classList.contains('segment-drag-move') ||
        target.closest('.segment-drag-extract') ||
        target.closest('.segment-drag-move')) {
      setHoverPosition(null);
      setPreviewThumbnail(null);
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
    const time = percentage * duration;

    setHoverPosition({ time, x: mouseX });
    generateThumbnail(time);
  };

  const handleTimelineMouseLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
      setPreviewThumbnail(null);
    }
  };

  const handleHandleMouseEnter = (type) => {
    const time = type === 'start' ? startTime : endTime;
    generateThumbnail(time);
  };

  const handlePreviewMouseEnter = () => {
    setShowPreview(true);
  };

  const handlePreviewMouseLeave = () => {
    setShowPreview(false);
    if (segmentVideoRef.current) {
      segmentVideoRef.current.pause();
      segmentVideoRef.current.currentTime = startTime;
    }
  };

  const handleZoomChange = (event) => {
    const newZoom = parseFloat(event.target.value);
    setUserControlsZoom(true);
    applyZoom(newZoom);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 5);
    setUserControlsZoom(true);
    applyZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 1);
    setUserControlsZoom(true);
    applyZoom(newZoom);
  };

  const handleTimeframePreset = (seconds) => {
    const MINIMUM_DURATION = 30;
    const targetDuration = Math.max(MINIMUM_DURATION, seconds);

    const currentCenter = (startTime + endTime) / 2;

    let newStart = currentCenter - (targetDuration / 2);
    let newEnd = currentCenter + (targetDuration / 2);

    if (newStart < 0) {
      newStart = 0;
      newEnd = Math.min(targetDuration, duration);
    } else if (newEnd > duration) {
      newEnd = duration;
      newStart = Math.max(0, duration - targetDuration);
    }

    skipAutoZoomRef.current = true;
    onChange(newStart, newEnd);

    setTimeout(() => {
      skipAutoZoomRef.current = false;
    }, 100);
  };

  useEffect(() => {
    const generateTimelineThumbnails = async () => {
      if (!thumbVideoRef.current || !thumbCanvasRef.current || !videoFile || duration === 0) {
        console.log('Skipping thumbnail generation: missing requirements', {
          hasVideo: !!thumbVideoRef.current,
          hasCanvas: !!thumbCanvasRef.current,
          hasFile: !!videoFile,
          duration
        });
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

        const markerCount = Math.round(10 * zoomLevel + 1);
        const thumbCount = markerCount - 1;
        const newThumbnails = [];

        console.log(`Generating ${thumbCount} thumbnails for ${(duration / 60).toFixed(1)} min video at ${zoomLevel.toFixed(1)}x zoom`);

        for (let i = 0; i < thumbCount; i++) {
          const time = i * (duration / thumbCount);
          const nextTime = (i + 1) * (duration / thumbCount);
          console.log(`Generating thumbnail ${i + 1}/${thumbCount} at ${time.toFixed(1)}s (covers ${time.toFixed(1)}s - ${nextTime.toFixed(1)}s)`);

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
                console.log(`✓ Generated thumbnail ${i + 1}/${thumbCount}`);
                resolve();
              } catch (err) {
                console.warn(`Failed to draw frame ${i + 1}/${thumbCount}:`, err);
                resolve();
              }
            };

            const errorHandler = () => {
              cleanup();
              console.warn(`Video error at ${time.toFixed(2)}s, skipping frame ${i + 1}/${thumbCount}`);
              resolve();
            };

            timeoutId = setTimeout(() => {
              cleanup();
              console.warn(`Timeout seeking to ${time.toFixed(2)}s, skipping frame`);
              resolve();
            }, 3000);

            video.addEventListener('seeked', seekedHandler);
            video.addEventListener('error', errorHandler);
            video.currentTime = time;
          });
        }

        setTimelineThumbnails(newThumbnails);
        const successRate = newThumbnails.length > 0 ? ((newThumbnails.length / thumbCount) * 100).toFixed(0) : 0;
        console.log(`✓ Generated ${newThumbnails.length}/${thumbCount} thumbnails (${successRate}% success)`);
      } catch (error) {
        console.error('Error generating thumbnails:', error);
      } finally {
        setIsGeneratingThumbnails(false);
      }
    };

    generateTimelineThumbnails();
  }, [videoFile, duration, zoomLevel]);

  useEffect(() => {
    const playPreview = async () => {
      if (showPreview && segmentVideoRef.current && videoFile) {
        const video = segmentVideoRef.current;
        video.currentTime = startTime;
        try {
          await video.play();
        } catch (error) {
          console.error('Error playing preview:', error);
        }
      } else if (!showPreview && segmentVideoRef.current) {
        segmentVideoRef.current.pause();
        segmentVideoRef.current.currentTime = startTime;
      }
    };
    playPreview();
  }, [showPreview, videoFile, startTime]);

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (segmentVideoRef.current && showPreview) {
        const currentTime = segmentVideoRef.current.currentTime;
        if (currentTime >= endTime) {
          segmentVideoRef.current.currentTime = startTime;
          if (segmentVideoRef.current.paused) {
            segmentVideoRef.current.play().catch(err => {
              console.error('Error looping preview:', err);
            });
          }
        }
        if (currentTime < startTime) {
          segmentVideoRef.current.currentTime = startTime;
        }
      }
    };

    const videoElement = segmentVideoRef.current;
    if (videoElement && showPreview) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [startTime, endTime, showPreview]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTimelineClick = (event) => {
    if (isDragging) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = event.clientX - rect.left;
      const clickTime = getTimeFromPosition(clickX);

      if (videoRef.current) {
        videoRef.current.currentTime = clickTime;
      }
    }
  };

  const handleDragStart = (event) => {
    event.dataTransfer.setData('text/plain', 'video-segment');
    event.dataTransfer.effectAllowed = 'copy';
  };

  const startPos = getPositionFromTime(startTime);
  const endPos = getPositionFromTime(endTime);
  const segmentWidth = endPos - startPos;

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="timeline-header-content">
          <div>
            <h3>Timeline</h3>
          </div>
          <div className="timeline-top-controls">
            <div className="zoom-slider-container">
              <button
                className="zoom-icon-button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                title="Zoom Out"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="zoom-icon">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  <path d="M4 6.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </button>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={zoomLevel}
                onChange={handleZoomChange}
                className="zoom-slider"
                title={`Zoom: ${(zoomLevel * 100).toFixed(0)}%`}
              />
              <button
                className="zoom-icon-button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 5}
                title="Zoom In"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="zoom-icon">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  <path d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>
                </svg>
              </button>
              <span className="zoom-percentage">{(zoomLevel * 100).toFixed(0)}%</span>
            </div>

            <div className="preview-timeframe-container">
              <div
                className="preview-button-container"
                onMouseEnter={handlePreviewMouseEnter}
                onMouseLeave={handlePreviewMouseLeave}
              >
                <button className="segment-preview-button">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                  </svg>
                  Preview Selected Segment
                </button>

                {videoFile && (
                  <div className="segment-preview-tooltip" style={{ display: showPreview ? 'block' : 'none' }}>
                    <video
                      ref={segmentVideoRef}
                      src={URL.createObjectURL(videoFile)}
                      className="preview-video"
                    />
                    <div className="preview-info">
                      <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="timeframe-buttons">
                <button
                  className="timeframe-button"
                  onClick={() => handleTimeframePreset(60)}
                  title="Set segment to 1 minute"
                >
                  1 min
                </button>
                <button
                  className="timeframe-button"
                  onClick={() => handleTimeframePreset(120)}
                  title="Set segment to 2 minutes"
                >
                  2 min
                </button>
                <button
                  className="timeframe-button"
                  onClick={() => handleTimeframePreset(180)}
                  title="Set segment to 3 minutes"
                >
                  3 min
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {videoFile && (
        <>
          <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
          <video
            ref={thumbVideoRef}
            src={URL.createObjectURL(videoFile)}
            style={{ display: 'none' }}
            muted
          />
          <canvas ref={thumbCanvasRef} style={{ display: 'none' }} />
        </>
      )}

      <div ref={timelineWrapperRef} className="timeline-zoom-wrapper">
        <div
          ref={timelineRef}
          className="timeline"
          style={{
            width: `${zoomLevel * 100}%`,
            minWidth: '100%'
          }}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
        >
        {(hoverPosition || isDragging) && (() => {
          const rect = timelineRef.current?.getBoundingClientRect();
          if (!rect) return null;

          let leftPosition;
          if (isDragging) {
            const pos = isDragging === 'start' ? startPos : endPos;
            leftPosition = rect.left + (rect.width * pos / 100);
          } else if (hoverPosition) {
            leftPosition = rect.left + hoverPosition.x;
          } else {
            return null;
          }

          const topPosition = rect.top;

          return (
            <div
              className="thumbnail-preview"
              style={{
                left: `${leftPosition}px`,
                top: `${topPosition}px`,
              }}
            >
              {previewThumbnail ? (
                <img src={previewThumbnail} alt="Preview" />
              ) : (
                <div style={{ width: 240, height: 135, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', color: 'white', fontSize: 12 }}>
                  Loading...
                </div>
              )}
              <span className="preview-time">
                {formatTime(isDragging
                  ? (isDragging === 'start' ? startTime : endTime)
                  : hoverPosition?.time || 0
                )}
              </span>
            </div>
          );
        })()}

        <div className="time-markers">
          {(() => {
            const markerCount = Math.round(10 * zoomLevel + 1);

            return Array.from({ length: markerCount }).map((_, i) => {
              const percentage = (i / (markerCount - 1)) * 100;
              const time = (duration * percentage) / 100;

              const isMajorMarker = i % Math.max(1, Math.round((markerCount - 1) / 10)) === 0;

              return (
                <div
                  key={i}
                  className={`time-marker ${isMajorMarker ? '' : 'minor-marker'}`}
                  style={{ left: `${percentage}%` }}
                >
                  <div className="marker-line" />
                  {isMajorMarker && <span className="marker-label">{formatTime(time)}</span>}
                </div>
              );
            });
          })()}
        </div>

        <div className="timeline-track">
          {isGeneratingThumbnails && (
            <div className="thumbnail-loading">
              <div className="loading-spinner"></div>
              <span>
                Generating 10 preview frames{duration >= 300 ? ' (this may take a moment for longer videos)' : ''}...
              </span>
            </div>
          )}

          {timelineThumbnails.length > 0 && (
            <div className="timeline-thumbnails">
              {timelineThumbnails.map((thumb, index) => (
                <div
                  key={index}
                  className="timeline-thumb"
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

          {extractedRanges.map((range, index) => {
            const extractedStartPos = getPositionFromTime(range.startTime);
            const extractedEndPos = getPositionFromTime(range.endTime);
            const extractedWidth = extractedEndPos - extractedStartPos;

            return (
              <div
                key={index}
                className="extracted-segment"
                style={{
                  left: `${extractedStartPos}%`,
                  width: `${extractedWidth}%`,
                }}
                title={`Extracted: ${formatTime(range.startTime)} - ${formatTime(range.endTime)}`}
              >
                <div className={`extracted-overlay ${extractedWidth < 8 ? 'hide-text' : ''}`} />
              </div>
            );
          })}

          <div
            className={`timeline-segment ${isDragging === 'segment' ? 'dragging-segment' : ''}`}
            style={{
              left: `${startPos}%`,
              width: `${segmentWidth}%`,
            }}
          >
            <div
              className="segment-drag-extract"
              draggable={true}
              onDragStart={handleDragStart}
            >
              {segmentWidth > 8 && <span className="drag-extract-hint">Drop to Extract</span>}
            </div>

            <div
              className="segment-drag-move"
              onMouseDown={(e) => {
                if ((e.target).closest('.timeline-handle')) {
                  return;
                }
                e.preventDefault();
                e.stopPropagation();
                if (timelineRef.current) {
                  const rect = timelineRef.current.getBoundingClientRect();
                  setDragStartX(e.clientX - rect.left);
                  setDragStartTime(startTime);
                  setIsDragging('segment');
                }
              }}
            >
              {segmentWidth > 8 && <span className="drag-move-hint">{isDragging === 'segment' ? 'Moving...' : 'Hold to Slide'}</span>}
            </div>

            <div
              className={`timeline-handle handle-start ${isDragging === 'start' ? 'dragging' : ''}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown('start', e);
              }}
              onMouseEnter={() => handleHandleMouseEnter('start')}
            >
              <div className="handle-grip" />
            </div>

            <div
              className={`timeline-handle handle-end ${isDragging === 'end' ? 'dragging' : ''}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown('end', e);
              }}
              onMouseEnter={() => handleHandleMouseEnter('end')}
            >
              <div className="handle-grip" />
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="timeline-info">
        <div className="time-display">
          <span className="time-label">Start:</span>
          <span className="time-value">{formatTime(startTime)}</span>
        </div>
        <div className="time-display">
          <span className="time-label">End:</span>
          <span className="time-value">{formatTime(endTime)}</span>
        </div>
        <div className="time-display duration-highlight">
          <span className="time-label">Duration:</span>
          <span className="time-value">{formatTime(endTime - startTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
