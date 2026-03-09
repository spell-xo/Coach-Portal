import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const parseDiffLines = (diff) => {
  if (!diff) return [];
  return diff.split('\n').map((line, index) => {
    let type = 'context';
    if (line.startsWith('+++') || line.startsWith('---')) {
      type = 'header';
    } else if (line.startsWith('@@')) {
      type = 'hunk';
    } else if (line.startsWith('+')) {
      type = 'addition';
    } else if (line.startsWith('-')) {
      type = 'deletion';
    }
    return { text: line, type, index };
  });
};

const lineStyles = {
  context: { bgcolor: 'transparent' },
  header: { bgcolor: 'grey.100', fontWeight: 600 },
  hunk: { bgcolor: 'info.50', color: 'info.main' },
  addition: { bgcolor: 'rgba(46, 160, 67, 0.15)', color: 'success.dark' },
  deletion: { bgcolor: 'rgba(248, 81, 73, 0.15)', color: 'error.dark' },
};

const DiffViewerModal = ({ open, onClose, patch }) => {
  const lines = parseDiffLines(patch?.diff || patch?.cumulative_diff);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="span">
            Code Diff
          </Typography>
          {patch && (
            <Typography variant="body2" color="text.secondary">
              {patch.patch_id} (v{patch.version || 1})
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {lines.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No diff available.
            </Typography>
          </Box>
        ) : (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 0,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              overflow: 'auto',
            }}
          >
            {lines.map((line) => (
              <Box
                key={line.index}
                sx={{
                  px: 2,
                  py: 0.1,
                  whiteSpace: 'pre',
                  ...lineStyles[line.type],
                }}
              >
                {line.text}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiffViewerModal;
