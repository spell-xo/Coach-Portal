import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import tagService from '../../api/tagService';
import TagDialog from './TagDialog';

const TagsPanel = ({ selectedDrills, onTagFilter, onRefreshDrills }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

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
    loadTags();
  }, [loadTags]);

  const handleDelete = async (tagName, e) => {
    e.stopPropagation();
    try {
      await tagService.deleteTag(tagName);
      if (activeFilter === tagName) {
        setActiveFilter(null);
        if (onTagFilter) onTagFilter(null);
      }
      await loadTags();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTagClick = async (tagName) => {
    if (activeFilter === tagName) {
      setActiveFilter(null);
      if (onTagFilter) onTagFilter(null);
    } else {
      try {
        const result = await tagService.getTagDrills(tagName);
        setActiveFilter(tagName);
        if (onTagFilter) onTagFilter({ tagName, drillIds: result.drill_ids });
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleTagSuccess = async () => {
    await loadTags();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tag Drills Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="caption" fontWeight="bold" color="text.secondary">
          YOUR TAGS
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setTagDialogOpen(true)}
          disabled={selectedDrills.length === 0}
          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
        >
          Tag Drills
          {selectedDrills.length > 0 && ` (${selectedDrills.length})`}
        </Button>
      </Box>

      {/* Active Filter Indicator */}
      {activeFilter && (
        <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem', py: 0 }} onClose={() => { setActiveFilter(null); if (onTagFilter) onTagFilter(null); }}>
          Filtering by tag: <strong>{activeFilter}</strong>
        </Alert>
      )}

      {/* Tag List */}
      {tags.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No tags yet. Select drills and create a tag to organise them.
        </Typography>
      ) : (
        tags.map((tag) => (
          <Box
            key={tag.id || tag.tag_name}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              mb: 0.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: activeFilter === tag.tag_name ? 'primary.main' : 'divider',
              bgcolor: activeFilter === tag.tag_name ? 'primary.50' : 'transparent',
              cursor: 'pointer',
              '&:hover': { bgcolor: activeFilter === tag.tag_name ? 'primary.50' : 'action.hover' },
            }}
            onClick={() => handleTagClick(tag.tag_name)}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {tag.tag_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tag.drill_count} drill{tag.drill_count !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Filter drills by this tag">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleTagClick(tag.tag_name); }}>
                  <FilterListIcon fontSize="small" color={activeFilter === tag.tag_name ? 'primary' : 'action'} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={(e) => handleDelete(tag.tag_name, e)}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Box>
          </Box>
        ))
      )}

      {/* Tag Dialog */}
      <TagDialog
        open={tagDialogOpen}
        onClose={() => setTagDialogOpen(false)}
        drillIds={selectedDrills}
        onSuccess={handleTagSuccess}
      />
    </Box>
  );
};

export default TagsPanel;
