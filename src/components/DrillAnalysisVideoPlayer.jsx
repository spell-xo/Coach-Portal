import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import VideoAnnotationCanvas from './VideoAnnotationCanvas';

/**
 * DrillAnalysisVideoPlayer
 *
 * Complete drill analysis interface with video player and annotations
 *
 * Features:
 * - Enhanced video controls
 * - Frame-by-frame analysis
 * - Annotation markers
 * - Drawing tools for cone detection
 * - Annotation timeline
 * - Export annotations
 *
 * Usage:
 * <DrillAnalysisVideoPlayer
 *   src="drill-video.mp4"
 *   drillName="Speed Training - Session 1"
 * />
 */
const DrillAnalysisVideoPlayer = ({
  src,
  poster,
  drillName = 'Drill Analysis',
  initialAnnotations = [],
}) => {
  const videoRef = useRef(null);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const handleAnnotationAdd = (annotation) => {
    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);
    console.log('[Annotation] Added:', annotation);
  };

  const handleAnnotationDelete = (index) => {
    const newAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(newAnnotations);
  };

  const handleExportAnnotations = () => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${drillName.replace(/\s+/g, '-')}-annotations.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="xl" sx={{ paddingY: 4 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, marginBottom: 1 }}>
          {drillName}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label="Video Analysis" color="primary" size="small" />
          <Chip label={`${annotations.length} Annotations`} size="small" />
          <Chip label="Frame-by-frame Enabled" size="small" />
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Video Player */}
        <Card>
          <CardContent sx={{ padding: 0 }}>
            <EnhancedVideoPlayer
              src={src}
              poster={poster}
              annotations={annotations}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationDelete={handleAnnotationDelete}
              allowDrawing={true}
            />
          </CardContent>
        </Card>

        {/* Annotations Panel */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Annotations
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton
                  size="small"
                  onClick={handleExportAnnotations}
                  disabled={annotations.length === 0}
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton size="small">
                  <ShareIcon />
                </IconButton>
              </Stack>
            </Box>

            <Divider sx={{ marginBottom: 2 }} />

            {annotations.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  paddingY: 6,
                  color: 'text.secondary',
                }}
              >
                <BookmarkIcon sx={{ fontSize: 48, marginBottom: 2, opacity: 0.3 }} />
                <Typography variant="body2">No annotations yet</Typography>
                <Typography variant="caption">
                  Click the bookmark icon to add markers
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {annotations
                  .sort((a, b) => a.time - b.time)
                  .map((annotation, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleAnnotationDelete(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{
                        borderLeft: `4px solid ${annotation.color}`,
                        marginBottom: 1,
                        backgroundColor:
                          selectedAnnotation === index ? 'action.selected' : 'transparent',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => {
                        setSelectedAnnotation(index);
                        if (videoRef.current) {
                          videoRef.current.currentTime = annotation.time;
                        }
                      }}
                    >
                      <ListItemIcon>
                        <BookmarkIcon sx={{ color: annotation.color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={annotation.label}
                        secondary={formatTime(annotation.time)}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Keyboard Shortcuts Reference */}
      <Card sx={{ marginTop: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 2 }}>
            Keyboard Shortcuts
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            <ShortcutItem shortcut="Space / K" description="Play/Pause" />
            <ShortcutItem shortcut="← / →" description="Previous/Next frame" />
            <ShortcutItem shortcut="↑ / ↓" description="Volume up/down" />
            <ShortcutItem shortcut="J / L" description="Skip -10s / +10s" />
            <ShortcutItem shortcut="F" description="Fullscreen" />
            <ShortcutItem shortcut="M" description="Mute" />
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

const ShortcutItem = ({ shortcut, description }) => (
  <Box>
    <Chip label={shortcut} size="small" sx={{ fontFamily: 'monospace', marginBottom: 0.5 }} />
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

export default DrillAnalysisVideoPlayer;
