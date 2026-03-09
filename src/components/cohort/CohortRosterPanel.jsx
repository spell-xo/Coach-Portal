import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import cohortService from '../../api/cohortService';

const formatGameType = (type) => {
  if (!type) return 'N/A';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PANEL_WIDTH = 340;

const CohortRosterPanel = ({
  onStartSession,
  sessionActive,
  sessionData,
  isCreating,
  initialDrillIds,
  sessions = [],
  sessionsLoading,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}) => {
  // Mode: 'threshold' or 'manual'
  const [mode, setMode] = useState(initialDrillIds ? 'manual' : 'threshold');

  // Game types
  const [gameTypes, setGameTypes] = useState([]);
  const [gameTypesLoading, setGameTypesLoading] = useState(false);

  // Threshold form
  const [selectedGameType, setSelectedGameType] = useState('');
  const [scoreThreshold, setScoreThreshold] = useState(0);
  const [maxDrills, setMaxDrills] = useState(100);

  // Manual mode
  const [manualDrillIds, setManualDrillIds] = useState(
    initialDrillIds ? initialDrillIds.join('\n') : ''
  );

  // Session switcher (visible when session is active)
  const [showSessionSwitcher, setShowSessionSwitcher] = useState(false);

  // Rename dialog
  const [renameDialog, setRenameDialog] = useState({ open: false, sessionId: null, currentTitle: '' });
  const [renameValue, setRenameValue] = useState('');

  const loadGameTypes = useCallback(async () => {
    try {
      setGameTypesLoading(true);
      const data = await cohortService.getGameTypes();
      if (data.success) {
        setGameTypes(data.data || []);
      }
    } catch (err) {
      console.error('Error loading game types:', err);
    } finally {
      setGameTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGameTypes();
  }, [loadGameTypes]);

  const handleStart = () => {
    if (mode === 'threshold') {
      if (!selectedGameType) return;
      onStartSession({
        mode: 'threshold',
        game_type: selectedGameType,
        score_threshold: scoreThreshold,
        max_drills: maxDrills,
      });
    } else {
      const ids = manualDrillIds
        .split(/[,\s]+/)
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length < 2) return;
      onStartSession({
        mode: 'manual',
        drill_ids: ids,
      });
    }
  };

  const canStart =
    mode === 'threshold'
      ? Boolean(selectedGameType)
      : manualDrillIds.split(/[,\s]+/).filter((id) => id.trim()).length >= 2;

  const openRename = (sid, currentTitle) => {
    setRenameValue(currentTitle || '');
    setRenameDialog({ open: true, sessionId: sid, currentTitle });
  };

  const handleRename = () => {
    if (renameValue.trim() && renameDialog.sessionId) {
      onRenameSession(renameDialog.sessionId, renameValue.trim());
    }
    setRenameDialog({ open: false, sessionId: null, currentTitle: '' });
  };

  // Derived session info
  const drills = sessionData?.drills || [];
  const workingCount = sessionData?.working_count ?? 0;
  const failingCount = sessionData?.failing_count ?? 0;
  const totalCount = sessionData?.drill_count ?? drills.length;
  const gameType = sessionData?.game_type;

  return (
    <Box
      sx={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Cohort Investigation
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Investigate why drills behave differently
          </Typography>
        </Box>
        {sessionActive && (
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {sessions.length > 1 && (
              <Tooltip title="Switch session">
                <IconButton size="small" onClick={() => setShowSessionSwitcher((p) => !p)}>
                  <SwapHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="New investigation">
              <IconButton size="small" onClick={onNewSession}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Session List (when no active session) */}
      {!sessionActive && sessions.length > 0 && (
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
            Past Sessions ({sessions.length})
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {sessions.map((s) => (
              <Box
                key={s.session_id}
                onClick={() => onSelectSession(s.session_id)}
                sx={{
                  px: 2,
                  py: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': { bgcolor: 'action.hover' },
                  ...(s.session_id === activeSessionId && { bgcolor: 'action.selected' }),
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem' }}>
                    {s.title || 'Untitled Session'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {formatDate(s.updated_at)}
                    </Typography>
                    {s.game_type && (
                      <Chip label={formatGameType(s.game_type)} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {s.drill_count || 0} drills
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {s.message_count || 0} msgs
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0, ml: 0.5 }}>
                  <Tooltip title="Rename">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); openRename(s.session_id, s.title); }}
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this session?')) onDeleteSession(s.session_id);
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
          <Divider />
        </Box>
      )}

      {/* Setup Form (before session) */}
      {!sessionActive && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
            New Investigation
          </Typography>

          {/* Mode tabs */}
          <Tabs
            value={mode}
            onChange={(_, v) => setMode(v)}
            variant="fullWidth"
            sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.8rem' } }}
          >
            <Tab
              value="threshold"
              label="By Threshold"
              icon={<FilterListIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
            />
            <Tab
              value="manual"
              label="Manual Pick"
              icon={<CheckBoxIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
            />
          </Tabs>

          {mode === 'threshold' ? (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>Drill Type</InputLabel>
                <Select
                  value={selectedGameType}
                  onChange={(e) => setSelectedGameType(e.target.value)}
                  label="Drill Type"
                  disabled={gameTypesLoading}
                >
                  {gameTypes.map((gt) => (
                    <MenuItem key={gt.game_type} value={gt.game_type}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {formatGameType(gt.game_type)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {gt.count}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Score Threshold"
                helperText="Drills above this score are 'working'"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(Number(e.target.value))}
                inputProps={{ min: 0, step: 1 }}
              />

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Max Drills"
                value={maxDrills}
                onChange={(e) => setMaxDrills(Number(e.target.value))}
                inputProps={{ min: 2, max: 500, step: 10 }}
              />
            </>
          ) : (
            <>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={4}
                label="Drill IDs"
                placeholder="Paste drill IDs (drillScores _id), one per line or comma-separated"
                helperText="Min 2 drills. All must be the same drill type."
                value={manualDrillIds}
                onChange={(e) => setManualDrillIds(e.target.value)}
              />
              <Typography variant="caption" color="text.secondary">
                {manualDrillIds.split(/[,\s]+/).filter((id) => id.trim()).length} drill(s) entered
              </Typography>
            </>
          )}

          <Button
            variant="contained"
            startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleStart}
            disabled={!canStart || isCreating}
            fullWidth
          >
            {isCreating ? 'Creating Session...' : 'Start Investigation'}
          </Button>
        </Box>
      )}

      {/* Session Active: Header + Summary + Roster */}
      {sessionActive && (
        <>
          {/* Session title + actions */}
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, fontSize: '0.85rem' }}>
              {sessionData?.title || 'Untitled Session'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
              <Tooltip title="Rename">
                <IconButton
                  size="small"
                  onClick={() => openRename(activeSessionId, sessionData?.title)}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (window.confirm('Delete this session?')) onDeleteSession(activeSessionId);
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Session switcher (collapsible) */}
          {showSessionSwitcher && sessions.length > 0 && (
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 0.75, pb: 0.25 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                  Switch Session ({sessions.length})
                </Typography>
                <IconButton size="small" onClick={() => setShowSessionSwitcher(false)} sx={{ p: 0.25 }}>
                  <ExpandLessIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <Box sx={{ maxHeight: 180, overflowY: 'auto', pb: 0.5 }}>
                {sessions.map((s) => (
                  <Box
                    key={s.session_id}
                    onClick={() => {
                      if (s.session_id !== activeSessionId) {
                        onSelectSession(s.session_id);
                        setShowSessionSwitcher(false);
                      }
                    }}
                    sx={{
                      px: 2,
                      py: 0.75,
                      cursor: s.session_id === activeSessionId ? 'default' : 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&:hover': s.session_id !== activeSessionId ? { bgcolor: 'action.hover' } : {},
                      ...(s.session_id === activeSessionId && { bgcolor: 'primary.50', borderLeft: '3px solid', borderColor: 'primary.main' }),
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={s.session_id === activeSessionId ? 700 : 500} noWrap sx={{ fontSize: '0.78rem' }}>
                        {s.title || 'Untitled Session'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          {formatDate(s.updated_at)}
                        </Typography>
                        {s.game_type && (
                          <Chip label={formatGameType(s.game_type)} size="small" sx={{ height: 14, fontSize: '0.55rem' }} />
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          {s.drill_count || 0} drills
                        </Typography>
                      </Box>
                    </Box>
                    {s.session_id === activeSessionId && (
                      <Chip label="Active" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem', ml: 0.5 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Summary cards */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            {gameType && (
              <Chip
                label={formatGameType(gameType)}
                size="small"
                variant="outlined"
                sx={{ mb: 1, fontSize: '0.75rem' }}
              />
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="h6" fontWeight="bold">{totalCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: 1, borderColor: 'success.main' }}>
                <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="h6" fontWeight="bold" color="success.main">{workingCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Working</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: 1, borderColor: 'error.main' }}>
                <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="h6" fontWeight="bold" color="error.main">{failingCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Failing</Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Drill roster */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {drills.filter((d) => (d.total_score || 0) > (sessionData?.score_threshold ?? 0)).length > 0 && (
              <Box sx={{ px: 2, pt: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" color="success.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Working ({workingCount})
                </Typography>
                {drills
                  .filter((d) => (d.total_score || 0) > (sessionData?.score_threshold ?? 0))
                  .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
                  .map((drill) => (
                    <DrillRosterItem key={drill.drill_id} drill={drill} status="working" />
                  ))}
              </Box>
            )}

            {drills.filter((d) => (d.total_score || 0) <= (sessionData?.score_threshold ?? 0)).length > 0 && (
              <Box sx={{ px: 2, pt: 1.5 }}>
                <Typography variant="caption" fontWeight="bold" color="error.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Failing ({failingCount})
                </Typography>
                {drills
                  .filter((d) => (d.total_score || 0) <= (sessionData?.score_threshold ?? 0))
                  .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
                  .map((drill) => (
                    <DrillRosterItem key={drill.drill_id} drill={drill} status="failing" />
                  ))}
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Rename Dialog */}
      <Dialog
        open={renameDialog.open}
        onClose={() => setRenameDialog({ open: false, sessionId: null, currentTitle: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rename Session</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Session Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog({ open: false, sessionId: null, currentTitle: '' })}>Cancel</Button>
          <Button variant="contained" onClick={handleRename} disabled={!renameValue.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DrillRosterItem = ({ drill, status }) => {
  const score = drill.total_score != null ? Math.round(drill.total_score) : null;
  const idShort = drill.drill_id?.slice(-8) || '?';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.75,
        px: 1,
        my: 0.25,
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: status === 'working' ? 'success.main' : 'error.main',
            flexShrink: 0,
          }}
        />
        <Tooltip title={drill.drill_id}>
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}
            noWrap
          >
            ...{idShort}
          </Typography>
        </Tooltip>
      </Box>
      <Typography
        variant="caption"
        fontWeight="bold"
        sx={{
          color: status === 'working' ? 'success.main' : 'error.main',
          flexShrink: 0,
          ml: 1,
        }}
      >
        {score != null ? `${score}%` : '-'}
      </Typography>
    </Box>
  );
};

export { PANEL_WIDTH };
export default CohortRosterPanel;
