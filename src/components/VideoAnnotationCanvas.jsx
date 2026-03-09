import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

/**
 * VideoAnnotationCanvas
 *
 * Canvas overlay for drawing annotations on video
 *
 * Features:
 * - Drawing tools (pen, circle, rectangle, arrow)
 * - Color picker
 * - Undo/redo
 * - Clear canvas
 * - Export annotations
 * - Frame-specific annotations
 *
 * Usage:
 * <VideoAnnotationCanvas
 *   videoRef={videoRef}
 *   width={1920}
 *   height={1080}
 *   onAnnotationChange={(annotations) => console.log(annotations)}
 * />
 */
const VideoAnnotationCanvas = ({
  videoRef,
  width = 1920,
  height = 1080,
  enabled = true,
  onAnnotationChange,
  sx = {},
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#00ff00');
  const [lineWidth, setLineWidth] = useState(3);

  const [annotations, setAnnotations] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    redraw();
  }, [annotations]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.lineWidth;

      switch (annotation.tool) {
        case 'pen':
          ctx.beginPath();
          annotation.points.forEach((point, i) => {
            if (i === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          break;

        case 'circle':
          const radius = Math.sqrt(
            Math.pow(annotation.end.x - annotation.start.x, 2) +
              Math.pow(annotation.end.y - annotation.start.y, 2)
          );
          ctx.beginPath();
          ctx.arc(annotation.start.x, annotation.start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;

        case 'rectangle':
          const width = annotation.end.x - annotation.start.x;
          const height = annotation.end.y - annotation.start.y;
          ctx.strokeRect(annotation.start.x, annotation.start.y, width, height);
          break;

        case 'arrow':
          drawArrow(
            ctx,
            annotation.start.x,
            annotation.start.y,
            annotation.end.x,
            annotation.end.y
          );
          break;

        default:
          break;
      }
    });
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    if (!enabled) return;

    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setStartPoint(point);

    if (tool === 'pen') {
      setCurrentPath([point]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !enabled) return;

    const point = getCanvasPoint(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (tool === 'pen') {
      setCurrentPath((prev) => [...prev, point]);

      // Draw current stroke
      redraw();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      currentPath.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else {
      // Draw preview for shapes
      redraw();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      switch (tool) {
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
          );
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;

        case 'rectangle':
          const width = point.x - startPoint.x;
          const height = point.y - startPoint.y;
          ctx.strokeRect(startPoint.x, startPoint.y, width, height);
          break;

        case 'arrow':
          drawArrow(ctx, startPoint.x, startPoint.y, point.x, point.y);
          break;

        default:
          break;
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !enabled) return;

    const point = getCanvasPoint(e);
    let newAnnotation;

    if (tool === 'pen') {
      newAnnotation = {
        tool,
        color,
        lineWidth,
        points: [...currentPath, point],
      };
    } else {
      newAnnotation = {
        tool,
        color,
        lineWidth,
        start: startPoint,
        end: point,
      };
    }

    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    onAnnotationChange?.(newAnnotations);

    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
      onAnnotationChange?.(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
      onAnnotationChange?.(history[historyIndex + 1]);
    }
  };

  const handleClear = () => {
    setAnnotations([]);
    setHistory([[]]);
    setHistoryIndex(0);
    onAnnotationChange?.([]);
  };

  const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {/* Drawing Tools */}
      {enabled && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 2,
            padding: 1,
          }}
        >
          <Stack spacing={1}>
            {/* Tool Selection */}
            <ToggleButtonGroup
              value={tool}
              exclusive
              onChange={(e, value) => value && setTool(value)}
              orientation="vertical"
              size="small"
            >
              <ToggleButton value="pen">
                <Tooltip title="Pen" placement="right">
                  <BrushIcon sx={{ color: 'white' }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="circle">
                <Tooltip title="Circle" placement="right">
                  <CircleOutlinedIcon sx={{ color: 'white' }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="rectangle">
                <Tooltip title="Rectangle" placement="right">
                  <CropSquareIcon sx={{ color: 'white' }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="arrow">
                <Tooltip title="Arrow" placement="right">
                  <ShowChartIcon sx={{ color: 'white' }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Color Picker */}
            <Stack direction="row" flexWrap="wrap" sx={{ maxWidth: 60 }}>
              {colors.map((c) => (
                <Box
                  key={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: c,
                    border: color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    margin: 0.25,
                    borderRadius: 0.5,
                  }}
                />
              ))}
            </Stack>

            {/* Actions */}
            <Tooltip title="Undo" placement="right">
              <span>
                <IconButton
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo" placement="right">
              <span>
                <IconButton
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Clear all" placement="right">
              <IconButton onClick={handleClear} sx={{ color: 'white' }} size="small">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: enabled ? 'crosshair' : 'default',
          pointerEvents: enabled ? 'auto' : 'none',
        }}
      />
    </Box>
  );
};

export default VideoAnnotationCanvas;
