import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import llmConfigService from '../../api/llmConfigService';

const ModelUsageDialog = ({ open, onClose, modelId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (open && modelId) {
      const loadUsage = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await llmConfigService.getModelUsage(modelId);
          setUsage(res.data || res);
        } catch (err) {
          setError(err.message || 'Failed to load usage');
        } finally {
          setLoading(false);
        }
      };
      loadUsage();
    }
  }, [open, modelId]);

  const references = usage?.references || usage?.usage || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Model Usage: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{modelId}</Typography>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!loading && !error && references.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            This model is not referenced by any component configurations.
          </Typography>
        )}
        {!loading && !error && references.length > 0 && (
          <List dense>
            {references.map((ref, idx) => (
              <ListItem key={idx} divider={idx < references.length - 1}>
                <ListItemText
                  primary={ref.component}
                  secondary={ref.tool ? `Tool: ${ref.tool}` : undefined}
                />
                <Chip
                  label={ref.tier || 'default'}
                  size="small"
                  variant="outlined"
                  color={ref.tier === 'default' ? 'primary' : 'default'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModelUsageDialog;
