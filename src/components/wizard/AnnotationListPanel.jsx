import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MovieIcon from '@mui/icons-material/Movie';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const statusIcons = {
  processing: <HourglassEmptyIcon sx={{ fontSize: 16, color: 'info.main' }} />,
  completed: <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />,
  failed: <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />,
};

const AnnotationListPanel = ({ annotations = [], savedAnnotations = [], onView, onSave, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const sessionAnnotations = annotations.filter((a) => !a.saved);
  const total = sessionAnnotations.length + savedAnnotations.length;

  if (total === 0) return null;

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      {/* Header toggle */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.50' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MovieIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600}>
            Annotations
          </Typography>
          <Chip label={total} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {/* This Session */}
        {sessionAnnotations.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>
              This Session
            </Typography>
            <List dense disablePadding>
              {sessionAnnotations.map((ann) => (
                <ListItem key={ann.id} sx={{ px: 2, py: 0.5 }}>
                  <Box sx={{ mr: 1 }}>{statusIcons[ann.status] || statusIcons.processing}</Box>
                  <ListItemText
                    primary={ann.description || `Annotation ${ann.id.slice(-6)}`}
                    primaryTypographyProps={{ variant: 'caption', fontSize: '0.75rem', noWrap: true }}
                    secondary={ann.status === 'completed' && ann.duration != null ? `${ann.duration.toFixed(1)}s` : ann.statusText}
                    secondaryTypographyProps={{ variant: 'caption', fontSize: '0.65rem' }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      {ann.status === 'completed' && ann.videoUrl && (
                        <>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => onView?.(ann.videoUrl)}>
                              <VisibilityIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small" component="a" href={ann.videoUrl} target="_blank" rel="noopener noreferrer" download>
                              <DownloadIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Save">
                            <IconButton size="small" onClick={() => onSave?.(ann.id)}>
                              <SaveIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Saved */}
        {savedAnnotations.length > 0 && (
          <Box>
            {sessionAnnotations.length > 0 && <Divider />}
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>
              Saved
            </Typography>
            <List dense disablePadding>
              {savedAnnotations.map((ann) => (
                <ListItem key={ann.id} sx={{ px: 2, py: 0.5 }}>
                  <Box sx={{ mr: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <ListItemText
                    primary={ann.name || ann.description || `Saved ${ann.id.slice(-6)}`}
                    primaryTypographyProps={{ variant: 'caption', fontSize: '0.75rem', noWrap: true }}
                    secondary={ann.duration != null ? `${ann.duration.toFixed(1)}s` : undefined}
                    secondaryTypographyProps={{ variant: 'caption', fontSize: '0.65rem' }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      {ann.videoUrl && (
                        <>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => onView?.(ann.videoUrl)}>
                              <VisibilityIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small" component="a" href={ann.videoUrl} target="_blank" rel="noopener noreferrer" download>
                              <DownloadIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onDelete?.(ann.id)} sx={{ color: 'error.main' }}>
                          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

export default AnnotationListPanel;
