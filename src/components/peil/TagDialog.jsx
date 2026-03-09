import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import tagService from '../../api/tagService';

const TagDialog = ({ open, onClose, drillIds, drillCount, onGetDrillIds, onSuccess }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  const displayCount = drillIds?.length || drillCount || 0;

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tagService.listTags();
      setTags(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadTags();
      setSearchText('');
      setError(null);
    }
  }, [open, loadTags]);

  const filteredTags = tags.filter(tag =>
    tag.tag_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const exactMatch = tags.some(
    tag => tag.tag_name.toLowerCase() === searchText.trim().toLowerCase()
  );
  const showCreateOption = searchText.trim() && !exactMatch;

  const resolveIds = async () => {
    if (drillIds && drillIds.length > 0) return drillIds;
    if (onGetDrillIds) return await onGetDrillIds();
    return [];
  };

  const handleApply = async (tagName, isNew) => {
    try {
      setApplying(true);
      setError(null);
      const ids = await resolveIds();
      if (ids.length === 0) {
        setError('No drill IDs to tag.');
        return;
      }
      await tagService.bulkApply(tagName, ids, isNew);
      onClose();
      if (onSuccess) onSuccess(tagName);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onClose={applying ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Tag Drills
        {displayCount > 0 && (
          <Chip
            label={`${displayCount} drill${displayCount !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 1, verticalAlign: 'middle' }}
          />
        )}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search or create a tag..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          disabled={applying}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1, mt: 0.5 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 1, fontSize: '0.8rem' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {showCreateOption && (
              <ListItemButton
                onClick={() => handleApply(searchText.trim(), true)}
                disabled={applying}
                sx={{ borderRadius: 1, mb: 0.5, bgcolor: 'action.hover' }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AddIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      Create <strong>{searchText.trim()}</strong>
                    </Typography>
                  }
                />
              </ListItemButton>
            )}

            {filteredTags.length === 0 && !showCreateOption && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                {tags.length === 0 ? 'No tags yet. Type a name to create one.' : 'No matching tags.'}
              </Typography>
            )}

            {filteredTags.map((tag) => (
              <ListItemButton
                key={tag.id || tag.tag_name}
                onClick={() => handleApply(tag.tag_name, false)}
                disabled={applying}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LocalOfferIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={tag.tag_name}
                  secondary={`${tag.drill_count} drill${tag.drill_count !== 1 ? 's' : ''}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
          </List>
        )}

        {applying && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', py: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Applying tag...
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TagDialog;
