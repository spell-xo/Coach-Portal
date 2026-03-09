/**
 * Manual Cone Detection Component
 * Allows manual annotation of cone positions with YOLO auto-detection
 * Based on PRD: Bulk upload Manual annotation
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";
import { drillConeConfig, drillTypeOptions } from "../../utils/drillConeConfig";

/**
 * ManualConeDetection Component
 * @param {Object} props
 * @param {string} props.frameUrl - Public URL of the frame image
 * @param {Function} props.onSubmit - Callback when markers are submitted
 * @param {boolean} props.autoRunYolo - Auto-run YOLO on mount (default: true)
 * @param {string} props.gameType - The drill type (e.g., "7_CONE_WEAVE")
 */
function ManualConeDetection({ frameUrl, onSubmit, autoRunYolo = true, gameType = null }) {
  const [yoloMarkers, setYoloMarkers] = useState([]);
  const [manualMarkers, setManualMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [annotationEnabled, setAnnotationEnabled] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState(gameType);
  const [detectionComplete, setDetectionComplete] = useState(false);
  const imageRef = useRef(null);

  // Update selectedGameType when prop changes
  useEffect(() => {
    setSelectedGameType(gameType);
  }, [gameType]);

  // Cone count validation
  const totalConeCount = yoloMarkers.length + manualMarkers.length;
  const coneConfig = selectedGameType ? drillConeConfig[selectedGameType] : null;
  const requiresConeValidation = coneConfig != null;
  const isConeCountInvalid = requiresConeValidation &&
                             (totalConeCount < coneConfig.min || totalConeCount > coneConfig.max);

  const handleGameTypeChange = (newType) => {
    setSelectedGameType(newType);
  };

  // Get AI API base URL from environment
  const AI_API_BASE = window._env_?.REACT_APP_AI_API_URL || process.env.REACT_APP_AI_API_URL || "https://aim-ai-restapi-dev-gmgjjvjmpq-nw.a.run.app/api";

  // Auto-run YOLO detection on mount
  useEffect(() => {
    if (frameUrl && autoRunYolo) {
      runConeDetectionFromUrl();
    }
  }, [frameUrl, autoRunYolo]);

  /**
   * Run YOLO cone detection from URL
   */
  const runConeDetectionFromUrl = async () => {
    if (!frameUrl) {
      setError("No frame URL available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${AI_API_BASE}/yolo/detect_cones_from_url`,
        {
          image_url: frameUrl,
          confidence_threshold: 0.2,
          manual_markers: [],
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      if (response?.data?.success && response?.data?.detection_results?.yolo_detections) {
        const detections = response.data.detection_results.yolo_detections.map((det, idx) => ({
          x: det.x,
          y: det.y,
          confidence: det.confidence,
          bbox: det.bbox || null,
          width: det.width || null,
          height: det.height || null,
          area: det.area || null,
          detection_method: "auto",
          id: `yolo-${Date.now()}-${idx}`,
        }));
        setYoloMarkers(detections);
      } else {
        setError("No cones detected");
      }
    } catch (err) {
      console.error("YOLO detection error:", err);
      setError(err.message || "Detection failed");
    } finally {
      setLoading(false);
      setDetectionComplete(true);
    }
  };

  /**
   * Remove a marker by id
   */
  const removeMarker = (marker) => {
    if (marker.detection_method === "auto") {
      setYoloMarkers(yoloMarkers.filter((m) => m.id !== marker.id));
    } else {
      setManualMarkers(manualMarkers.filter((m) => m.id !== marker.id));
    }
  };

  /**
   * Handle frame click to add/remove markers
   */
  const handleFrameClick = (event) => {
    // Only allow adding new markers when annotation mode is enabled
    if (!annotationEnabled) return;

    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Calculate aspect ratios
    const naturalAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = img.clientWidth / img.clientHeight;

    let actualDisplayWidth, actualDisplayHeight;
    let offsetX = 0,
      offsetY = 0;

    if (naturalAspectRatio > containerAspectRatio) {
      // Letterboxed vertically
      actualDisplayWidth = img.clientWidth;
      actualDisplayHeight = img.clientWidth / naturalAspectRatio;
      offsetY = (img.clientHeight - actualDisplayHeight) / 2;
    } else {
      // Pillarboxed horizontally
      actualDisplayHeight = img.clientHeight;
      actualDisplayWidth = img.clientHeight * naturalAspectRatio;
      offsetX = (img.clientWidth - actualDisplayWidth) / 2;
    }

    // Adjust for letterbox/pillarbox
    const adjustedClickX = clickX - offsetX;
    const adjustedClickY = clickY - offsetY;

    // Check if click is outside the actual image area
    if (
      adjustedClickX < 0 ||
      adjustedClickX > actualDisplayWidth ||
      adjustedClickY < 0 ||
      adjustedClickY > actualDisplayHeight
    ) {
      return; // Click on letterbox/pillarbox
    }

    // Scale to original resolution
    const scaleX = img.naturalWidth / actualDisplayWidth;
    const scaleY = img.naturalHeight / actualDisplayHeight;
    const x = Math.round(adjustedClickX * scaleX);
    const y = Math.round(adjustedClickY * scaleY);

    // Check if clicking on existing marker to remove
    const clickedMarker = [...yoloMarkers, ...manualMarkers].find((marker) => {
      const markerDisplayX = marker.x / scaleX + offsetX;
      const markerDisplayY = marker.y / scaleY + offsetY;
      const distance = Math.sqrt(
        Math.pow(clickX - markerDisplayX, 2) + Math.pow(clickY - markerDisplayY, 2)
      );
      return distance < 10; // 10px click tolerance
    });

    if (clickedMarker) {
      // Remove marker
      if (clickedMarker.detection_method === "auto") {
        setYoloMarkers(yoloMarkers.filter((m) => m.id !== clickedMarker.id));
      } else {
        setManualMarkers(manualMarkers.filter((m) => m.id !== clickedMarker.id));
      }
    } else {
      // Add manual marker
      addManualMarker(x, y);
    }
  };

  /**
   * Add a manual marker
   */
  const addManualMarker = (x, y) => {
    const newMarker = {
      x,
      y,
      detection_method: "manual",
      id: `manual-${Date.now()}`,
    };
    setManualMarkers([...manualMarkers, newMarker]);
  };

  /**
   * Render a marker on the image
   */
  const renderMarker = (marker) => {
    const img = imageRef.current;
    if (!img) return null;

    const naturalAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = img.clientWidth / img.clientHeight;

    let actualDisplayWidth, actualDisplayHeight;
    let offsetX = 0,
      offsetY = 0;

    if (naturalAspectRatio > containerAspectRatio) {
      actualDisplayWidth = img.clientWidth;
      actualDisplayHeight = img.clientWidth / naturalAspectRatio;
      offsetY = (img.clientHeight - actualDisplayHeight) / 2;
    } else {
      actualDisplayHeight = img.clientHeight;
      actualDisplayWidth = img.clientHeight * naturalAspectRatio;
      offsetX = (img.clientWidth - actualDisplayWidth) / 2;
    }

    const scaleX = img.naturalWidth / actualDisplayWidth;
    const scaleY = img.naturalHeight / actualDisplayHeight;

    const displayX = marker.x / scaleX + offsetX;
    const displayY = marker.y / scaleY + offsetY;

    return (
      <div
        key={marker.id}
        onClick={(e) => {
          e.stopPropagation();
          removeMarker(marker);
        }}
        style={{
          position: "absolute",
          left: `${displayX}px`,
          top: `${displayY}px`,
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor: marker.detection_method === "auto" ? "green" : "yellow",
          border: "2px solid white",
          transform: "translate(-50%, -50%)",
          cursor: "pointer",
          zIndex: 10,
          pointerEvents: "auto",
        }}
        title={
          marker.detection_method === "auto"
            ? `Auto (${(marker.confidence * 100).toFixed(1)}%) - Click to remove`
            : "Manual - Click to remove"
        }
      />
    );
  };

  /**
   * Handle submit
   */
  const handleSubmit = () => {
    const allMarkers = [...yoloMarkers, ...manualMarkers];
    onSubmit(allMarkers, selectedGameType);
  };

  // Helper to get expected cones display text
  const getExpectedConesText = () => {
    if (!coneConfig) return 'N/A';
    return coneConfig.min === coneConfig.max ? coneConfig.expected : `${coneConfig.min}-${coneConfig.max}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Drill Type Info / Dropdown - Only show after detection complete */}
      {!loading && detectionComplete && (
        <Box sx={{ mb: 2, p: 2, bgcolor: isConeCountInvalid ? '#fff3cd' : '#e3f2fd', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {isConeCountInvalid ? (
              <>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Drill Type</InputLabel>
                  <Select
                    value={selectedGameType || ''}
                    label="Drill Type"
                    onChange={(e) => handleGameTypeChange(e.target.value)}
                  >
                    {drillTypeOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label} {opt.expectedCones ? `(${opt.expectedCones} cones)` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography color="warning.dark">
                  Cone count mismatch! Expected: {getExpectedConesText()}, Got: {totalConeCount}. Select correct drill type or adjust markers.
                </Typography>
              </>
            ) : (
              <Typography>
                <strong>Drill Type:</strong> {selectedGameType || 'N/A'} |
                <strong> Expected Cones:</strong> {getExpectedConesText()}
              </Typography>
            )}
            <Typography sx={{ ml: 'auto' }}>
              <strong>Current:</strong> {totalConeCount} cones
            </Typography>
          </Box>
        </Box>
      )}

      {/* Controls */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={annotationEnabled}
              onChange={(e) => setAnnotationEnabled(e.target.checked)}
            />
          }
          label="Enable Manual Annotation Mode"
        />
        <Button variant="outlined" onClick={runConeDetectionFromUrl} disabled={loading}>
          Re-run YOLO Detection
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !detectionComplete ||
            (yoloMarkers.length === 0 && manualMarkers.length === 0) ||
            isConeCountInvalid
          }
        >
          Submit Annotations ({totalConeCount} markers)
        </Button>
      </Box>

      {/* Loading/Error States */}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography>Running cone detection...</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Image with Markers */}
      <Box sx={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
        <img
          ref={imageRef}
          src={frameUrl}
          alt="Drill frame"
          onClick={handleFrameClick}
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            cursor: annotationEnabled ? "crosshair" : "default",
            userSelect: "none",
            display: "block",
          }}
          draggable={false}
        />
        {[...yoloMarkers, ...manualMarkers].map(renderMarker)}
      </Box>

      {/* Marker Stats */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Auto Detections:</strong> {yoloMarkers.length} (green) |{" "}
          <strong>Manual Markers:</strong> {manualMarkers.length} (yellow) |{" "}
          <strong>Total:</strong> {yoloMarkers.length + manualMarkers.length}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          <strong>Remove:</strong> Click on any marker to remove false detected cones.
          <br />
          <strong>Add:</strong> Enable annotation mode and click on image to add cones which were not auto detected.
        </Typography>
      </Box>
    </Box>
  );
}

export default ManualConeDetection;
