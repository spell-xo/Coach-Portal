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
  Snackbar,
  Alert,
  Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import BoltIcon from '@mui/icons-material/Bolt';
import wizardService from '../../api/wizardService';
import ShortcutEditDialog from './ShortcutEditDialog';

const DRILL_TYPE_FILTERS = [
  'TRIPLE_CONE',
  'SINGLE_CONE',
  'WALL_JUGGLE',
  'FREESTYLE',
  'PASSING',
];

const CATEGORY_FILTERS = [
  'Scoring',
  'Tracking',
  'Detection',
  'Validation',
  'General',
];

const ShortcutLibraryDialog = ({ open, onClose, onSelectShortcut, drillType }) => {
  const [shortcuts, setShortcuts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeDrillFilter, setActiveDrillFilter] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const fetchShortcuts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wizardService.getShortcuts(
        activeDrillFilter || undefined,
        activeCategoryFilter || undefined,
        search || undefined
      );
      setShortcuts(data.shortcuts || []);
    } catch (err) {
      console.error('Failed to load shortcuts:', err);
      setShortcuts([]);
    } finally {
      setLoading(false);
    }
  }, [activeDrillFilter, activeCategoryFilter, search]);

  useEffect(() => {
    if (open) {
      fetchShortcuts();
      setSelected(new Set());
    }
  }, [open, fetchShortcuts]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === shortcuts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(shortcuts.map((s) => s.id)));
    }
  };

  const buildShortcutMessage = (shortcut) => {
    const workflow = shortcut.workflow || {};
    const lines = [`Run analysis shortcut: "${shortcut.name}"`, ''];

    if (workflow.summary) {
      lines.push(`Workflow: ${workflow.summary}`, '');
    }

    if (workflow.steps?.length > 0) {
      workflow.steps.forEach((step, i) => {
        lines.push(`Step ${i + 1}: ${step.title} — ${step.description}`);
        if (step.reasoning) lines.push(`Reasoning: ${step.reasoning}`);
        if (step.expected_outcome) lines.push(`Look for: ${step.expected_outcome}`);
        lines.push('');
      });
    }

    if (workflow.scripts?.length > 0) {
      lines.push('Scripts:');
      workflow.scripts.forEach((s) => {
        lines.push(`${s.name}: \`\`\`python`);
        lines.push(s.script);
        lines.push('```');
        lines.push('');
      });
    }

    if (workflow.conclusion_template) {
      lines.push(`Conclusion approach: ${workflow.conclusion_template}`, '');
    }

    lines.push('Follow these steps to analyze the current drill. Adapt to this drill\'s data.');

    return lines.join('\n');
  };

  const handleRunShortcut = async (shortcut) => {
    setRunningId(shortcut.id);
    try {
      const fullShortcut = await wizardService.useShortcut(shortcut.id);
      const message = buildShortcutMessage(fullShortcut);
      onSelectShortcut?.(message);
      onClose();
    } catch (err) {
      console.error('Failed to run shortcut:', err);
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (shortcutId) => {
    try {
      await wizardService.deleteShortcut(shortcutId);
      setShortcuts((prev) => prev.filter((s) => s.id !== shortcutId));
      setSelected((prev) => { const next = new Set(prev); next.delete(shortcutId); return next; });
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete shortcut:', err);
    }
  };

  const handleOpenEdit = async (shortcut) => {
    try {
      const full = await wizardService.getShortcut(shortcut.id);
      setEditingShortcut(full);
      setEditDialogOpen(true);
    } catch (err) {
      console.error('Failed to load shortcut details:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingShortcut(null);
    setEditDialogOpen(true);
  };

  const handleSave = async (data, shortcutId) => {
    if (shortcutId) {
      await wizardService.updateShortcut(shortcutId, data);
    } else {
      await wizardService.createShortcut(data);
    }
    fetchShortcuts();
  };

  const handleCopy = async (shortcutId) => {
    try {
      await wizardService.copyShortcut(shortcutId);
      fetchShortcuts();
    } catch (err) {
      console.error('Failed to copy shortcut:', err);
    }
  };

  const handleDrillFilterClick = (type) => {
    setActiveDrillFilter((prev) => (prev === type ? null : type));
  };

  const handleCategoryFilterClick = (category) => {
    setActiveCategoryFilter((prev) => (prev === category ? null : category));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const ids = selected.size > 0 ? Array.from(selected) : undefined;
      const data = await wizardService.exportShortcuts(ids);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-shortcuts-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: `Exported ${data.count} shortcut${data.count !== 1 ? 's' : ''}`, severity: 'success' });
    } catch (err) {
      console.error('Export failed:', err);
      setSnackbar({ open: true, message: 'Failed to export shortcuts', severity: 'error' });
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
          setSnackbar({ open: true, message: 'No shortcuts found in file', severity: 'warning' });
          return;
        }
        const result = await wizardService.importShortcuts(items, 'skip');
        const { imported, skipped, overwritten } = result.results;
        const parts = [];
        if (imported) parts.push(`${imported} imported`);
        if (skipped) parts.push(`${skipped} skipped (duplicate name)`);
        if (overwritten) parts.push(`${overwritten} overwritten`);
        setSnackbar({ open: true, message: parts.join(', ') || 'Import complete', severity: imported > 0 ? 'success' : 'info' });
        fetchShortcuts();
      } catch (err) {
        console.error('Import failed:', err);
        setSnackbar({ open: true, message: err?.message || 'Failed to import shortcuts', severity: 'error' });
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
        <BoltIcon />
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          Analysis Shortcut Library
        </Typography>
        <Tooltip title="Import shortcuts from JSON file">
          <span>
            <IconButton size="small" onClick={handleImport} disabled={importing}>
              {importing ? <CircularProgress size={18} /> : <FileUploadIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={hasSelection ? `Export ${selected.size} selected` : 'Export all shortcuts as JSON'}>
          <span>
            <IconButton size="small" onClick={handleExport} disabled={exporting || shortcuts.length === 0}>
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
          placeholder="Search shortcuts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchShortcuts()}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
          }}
          sx={{ mb: 2 }}
        />

        {/* Category filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
          {CATEGORY_FILTERS.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              variant={activeCategoryFilter === cat ? 'filled' : 'outlined'}
              color={activeCategoryFilter === cat ? 'secondary' : 'default'}
              onClick={() => handleCategoryFilterClick(cat)}
              sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
            />
          ))}
        </Box>

        {/* Drill type filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {DRILL_TYPE_FILTERS.map((type) => (
            <Chip
              key={type}
              label={type.replace(/_/g, ' ')}
              size="small"
              variant={activeDrillFilter === type ? 'filled' : 'outlined'}
              color={activeDrillFilter === type ? 'primary' : 'default'}
              onClick={() => handleDrillFilterClick(type)}
              sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
            />
          ))}
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Select all / selection info */}
        {shortcuts.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, ml: -0.5 }}>
            <Checkbox
              size="small"
              checked={selected.size === shortcuts.length && shortcuts.length > 0}
              indeterminate={selected.size > 0 && selected.size < shortcuts.length}
              onChange={toggleSelectAll}
              sx={{ p: 0.5 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {hasSelection ? `${selected.size} selected` : 'Select all'}
            </Typography>
          </Box>
        )}

        {/* Shortcut list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : shortcuts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BoltIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No analysis shortcuts found.
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Shortcuts are saved when you ask the wizard to save an analysis workflow.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {shortcuts.map((shortcut) => {
              const isSelected = selected.has(shortcut.id);
              return (
                <ListItem
                  key={shortcut.id}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': { bgcolor: 'grey.50' },
                    bgcolor: isSelected ? 'action.selected' : undefined,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={() => toggleSelect(shortcut.id)}
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => handleOpenEdit(shortcut)}
                        >
                          {shortcut.name || 'Untitled Shortcut'}
                        </Typography>
                        {shortcut.category && (
                          <Chip
                            label={shortcut.category}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                        {shortcut.usage_count != null && (
                          <Chip label={`Used ${shortcut.usage_count}x`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {shortcut.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {shortcut.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                          {shortcut.step_count != null && (
                            <Chip
                              label={`${shortcut.step_count} steps`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.6rem' }}
                            />
                          )}
                          {shortcut.script_count != null && shortcut.script_count > 0 && (
                            <Chip
                              label={`${shortcut.script_count} scripts`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.6rem' }}
                            />
                          )}
                          {shortcut.applicable_drill_types?.map((type) => (
                            <Chip
                              key={type}
                              label={type.replace(/_/g, ' ')}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.6rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(shortcut)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={() => handleCopy(shortcut.id)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={runningId === shortcut.id ? <CircularProgress size={12} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleRunShortcut(shortcut)}
                        disabled={runningId !== null}
                        sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.25 }}
                      >
                        Run
                      </Button>
                      {deleteConfirm === shortcut.id ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDelete(shortcut.id)}
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
                        <Tooltip title="Delete shortcut">
                          <IconButton size="small" onClick={() => setDeleteConfirm(shortcut.id)} sx={{ color: 'error.main' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <ShortcutEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        shortcut={editingShortcut}
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

export default ShortcutLibraryDialog;
