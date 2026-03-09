import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Collapse,
  Snackbar,
  Alert,
  Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import wizardService from '../../api/wizardService';
import ScriptEditDialog from './ScriptEditDialog';

const DRILL_TYPE_FILTERS = [
  'TRIPLE_CONE',
  'SINGLE_CONE',
  'WALL_JUGGLE',
  'FREESTYLE',
  'PASSING',
];

const ScriptLibraryDialog = ({ open, onClose, onSelectScript, drillType }) => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wizardService.getScripts(activeFilter || undefined, search || undefined);
      setScripts(data.scripts || []);
    } catch (err) {
      console.error('Failed to load scripts:', err);
      setScripts([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search]);

  useEffect(() => {
    if (open) {
      fetchScripts();
      setSelected(new Set());
    }
  }, [open, fetchScripts]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === scripts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(scripts.map((s) => s.id)));
    }
  };

  const handleDelete = async (scriptId) => {
    try {
      await wizardService.deleteScript(scriptId);
      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
      setSelected((prev) => { const next = new Set(prev); next.delete(scriptId); return next; });
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete script:', err);
    }
  };

  const handleUseScript = (script) => {
    onSelectScript?.(`Use annotation script: ${script.name || script.description}`);
    onClose();
  };

  const handleOpenEdit = async (script) => {
    try {
      const full = await wizardService.getScript(script.id);
      setEditingScript(full);
      setEditDialogOpen(true);
    } catch (err) {
      console.error('Failed to load script details:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingScript(null);
    setEditDialogOpen(true);
  };

  const handleSave = async (data, scriptId) => {
    try {
      if (scriptId) {
        await wizardService.updateScript(scriptId, data);
      } else {
        await wizardService.createScript(data);
      }
      fetchScripts();
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to save script';
      setSnackbar({ open: true, message, severity: 'error' });
      throw err;
    }
  };

  const handleCopy = async (scriptId) => {
    try {
      await wizardService.copyScript(scriptId);
      fetchScripts();
    } catch (err) {
      console.error('Failed to copy script:', err);
    }
  };

  const handleFilterClick = (type) => {
    setActiveFilter((prev) => (prev === type ? null : type));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const ids = selected.size > 0 ? Array.from(selected) : undefined;
      const data = await wizardService.exportScripts(ids);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annotation-scripts-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: `Exported ${data.count} script${data.count !== 1 ? 's' : ''}`, severity: 'success' });
    } catch (err) {
      console.error('Export failed:', err);
      setSnackbar({ open: true, message: 'Failed to export scripts', severity: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const items = json.items || [];
        if (items.length === 0) {
          setSnackbar({ open: true, message: 'No scripts found in file', severity: 'warning' });
          return;
        }
        const result = await wizardService.importScripts(items, 'skip');
        const { imported, skipped, overwritten } = result.results;
        const parts = [];
        if (imported) parts.push(`${imported} imported`);
        if (skipped) parts.push(`${skipped} skipped (duplicate name)`);
        if (overwritten) parts.push(`${overwritten} overwritten`);
        setSnackbar({ open: true, message: parts.join(', ') || 'Import complete', severity: imported > 0 ? 'success' : 'info' });
        fetchScripts();
      } catch (err) {
        console.error('Import failed:', err);
        setSnackbar({ open: true, message: err?.message || 'Failed to import scripts', severity: 'error' });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const hasSelection = selected.size > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <MovieCreationIcon />
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          Annotation Script Library
        </Typography>
        <Tooltip title="Import scripts from JSON file">
          <span>
            <IconButton size="small" onClick={handleImport} disabled={importing}>
              {importing ? <CircularProgress size={18} /> : <FileUploadIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={hasSelection ? `Export ${selected.size} selected` : 'Export all scripts as JSON'}>
          <span>
            <IconButton size="small" onClick={handleExport} disabled={exporting || scripts.length === 0}>
              {exporting ? <CircularProgress size={18} /> : <FileDownloadIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ textTransform: 'none' }}
        >
          Create New
        </Button>
      </DialogTitle>

      <DialogContent>
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search scripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchScripts()}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
          }}
          sx={{ mb: 2 }}
        />

        {/* Drill type filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {DRILL_TYPE_FILTERS.map((type) => (
            <Chip
              key={type}
              label={type.replace(/_/g, ' ')}
              size="small"
              variant={activeFilter === type ? 'filled' : 'outlined'}
              color={activeFilter === type ? 'primary' : 'default'}
              onClick={() => handleFilterClick(type)}
              sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
            />
          ))}
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Select all / selection info */}
        {scripts.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, ml: -0.5 }}>
            <Checkbox
              size="small"
              checked={selected.size === scripts.length && scripts.length > 0}
              indeterminate={selected.size > 0 && selected.size < scripts.length}
              onChange={toggleSelectAll}
              sx={{ p: 0.5 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {hasSelection ? `${selected.size} selected` : 'Select all'}
            </Typography>
          </Box>
        )}

        {/* Script list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : scripts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MovieCreationIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No annotation scripts found.
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Scripts are saved when you use "Save" on a generated annotation.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {scripts.map((script) => {
              const hasMetadata = script.purpose || script.when_to_use || script.what_to_look_for;
              const isSelected = selected.has(script.id);
              return (
                <Box key={script.id}>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: hasMetadata && expandedId === script.id ? 0 : 0.5,
                      '&:hover': { bgcolor: 'grey.50' },
                      bgcolor: isSelected ? 'action.selected' : undefined,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => toggleSelect(script.id)}
                      sx={{ p: 0.5, mr: 1 }}
                    />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => handleOpenEdit(script)}
                          >
                            {script.name || 'Untitled Script'}
                          </Typography>
                          {script.usage_count != null && (
                            <Chip label={`Used ${script.usage_count}x`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                          {hasMetadata && (
                            <IconButton
                              size="small"
                              onClick={() => setExpandedId((prev) => (prev === script.id ? null : script.id))}
                              sx={{
                                p: 0.25,
                                transform: expandedId === script.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            >
                              <ExpandMoreIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {script.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {script.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {script.applicable_drill_types?.map((type) => (
                              <Chip
                                key={type}
                                label={type.replace(/_/g, ' ')}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            ))}
                            {script.last_used && (
                              <Typography variant="caption" color="text.disabled" sx={{ ml: 1, fontSize: '0.65rem' }}>
                                Last used: {new Date(script.last_used).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(script)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => handleCopy(script.id)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleUseScript(script)}
                          sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.25 }}
                        >
                          Use
                        </Button>
                        {deleteConfirm === script.id ? (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDelete(script.id)}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.25, minWidth: 'auto' }}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setDeleteConfirm(null)}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.25, minWidth: 'auto' }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Tooltip title="Delete script">
                            <IconButton size="small" onClick={() => setDeleteConfirm(script.id)} sx={{ color: 'error.main' }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {hasMetadata && (
                    <Collapse in={expandedId === script.id}>
                      <Box sx={{ px: 2, pb: 1, ml: 2, mb: 0.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {script.purpose && (
                          <Box sx={{ mb: 0.5 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              Purpose
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {script.purpose}
                            </Typography>
                          </Box>
                        )}
                        {script.when_to_use && (
                          <Box sx={{ mb: 0.5 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              When to use
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {script.when_to_use}
                            </Typography>
                          </Box>
                        )}
                        {script.what_to_look_for && (
                          <Box>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              What to look for
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {script.what_to_look_for}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <ScriptEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        script={editingScript}
        onSave={handleSave}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ScriptLibraryDialog;
