import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Autocomplete,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AppLayout from '../../components/AppLayout';
import Breadcrumbs from '../../components/Breadcrumbs';
import ReportChatPanel from '../../components/peil/ReportChatPanel';
import { selectIsPlatformEngineering } from '../../store/authSlice';
import wizardService from '../../api/wizardService';
import tagService from '../../api/tagService';
import { showToast } from '../../utils/toast';

const PANEL_WIDTH = 360;
const REPORT_MAX_DRILLS = 2000;

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PeilReports = () => {
  const isPlatformEngineering = useSelector(selectIsPlatformEngineering);
  const location = useLocation();

  // Accept drill IDs from route state (e.g. navigated from DrillsManager)
  const initialDrillIds = location.state?.drillIds || null;

  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // New session form state
  const [scope, setScope] = useState(initialDrillIds ? 'drill_ids' : 'all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [drillIdsText, setDrillIdsText] = useState(initialDrillIds ? initialDrillIds.join('\n') : '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [maxDrills, setMaxDrills] = useState(500);

  // Session switcher
  const [showSessionSwitcher, setShowSessionSwitcher] = useState(false);

  // Rename dialog
  const [renameDialog, setRenameDialog] = useState({ open: false, sessionId: null, currentTitle: '' });
  const [renameValue, setRenameValue] = useState('');

  // Load report sessions on mount
  useEffect(() => {
    if (isPlatformEngineering && !initialDrillIds) {
      loadSessions();
    } else {
      setSessionsLoading(false);
    }
  }, [isPlatformEngineering]);

  // Load available tags for the dropdown
  useEffect(() => {
    if (isPlatformEngineering) {
      setTagsLoading(true);
      tagService.listTags()
        .then((data) => {
          const tags = (data.data || data.tags || data || []).map((t) => ({
            tag_name: t.tag_name,
            drill_count: t.drill_count || 0,
          }));
          setAvailableTags(tags);
        })
        .catch((err) => console.error('Failed to load tags:', err))
        .finally(() => setTagsLoading(false));
    }
  }, [isPlatformEngineering]);

  // Auto-create session if navigated with drillIds
  useEffect(() => {
    if (initialDrillIds && initialDrillIds.length > 0 && isPlatformEngineering) {
      handleStartSession();
    }
  }, []); // Run once on mount

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await wizardService.getSessions(null, 50, 0, 'report');
      setSessions(data.sessions || []);
      // Auto-resume the most recent session if one exists
      if (data.sessions && data.sessions.length > 0 && !sessionId) {
        await loadSession(data.sessions[0].session_id);
      }
    } catch (err) {
      console.error('Failed to load report sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSession = async (sid) => {
    try {
      const data = await wizardService.getSession(sid);
      setSessionId(data.session_id);
      setSessionData({
        session_id: data.session_id,
        title: data.title,
        drill_count: data.drill_count,
        scope: data.scope,
        messages: data.messages || [],
      });
    } catch (err) {
      console.error('Failed to load session:', err);
      showToast.error('Failed to load session');
    }
  };

  const handleStartSession = useCallback(async () => {
    try {
      setIsCreating(true);

      const params = {
        scope,
        max_drills: maxDrills,
      };

      if (scope === 'tag' && selectedTags.length > 0) {
        params.tag_names = selectedTags.map((t) => t.tag_name);
        // Validate estimated drill count from tags
        const estimatedCount = selectedTags.reduce((sum, t) => sum + (t.drill_count || 0), 0);
        if (estimatedCount > REPORT_MAX_DRILLS) {
          showToast.error(
            `Selected tags contain ~${estimatedCount.toLocaleString()} drills, exceeding the ${REPORT_MAX_DRILLS.toLocaleString()} limit. Please select fewer tags or use date filters to narrow scope.`
          );
          setIsCreating(false);
          return;
        }
      }

      if (scope === 'drill_ids') {
        const ids = (drillIdsText || (initialDrillIds || []).join('\n'))
          .split(/[,\s]+/)
          .map((id) => id.trim())
          .filter(Boolean);
        if (ids.length === 0) {
          showToast.error('Please enter at least one drill ID');
          setIsCreating(false);
          return;
        }
        if (ids.length > REPORT_MAX_DRILLS) {
          showToast.error(
            `${ids.length.toLocaleString()} drill IDs provided, exceeding the ${REPORT_MAX_DRILLS.toLocaleString()} limit. Please reduce the number of drills.`
          );
          setIsCreating(false);
          return;
        }
        params.drill_ids = ids;
      }

      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const data = await wizardService.createReportSession(params);
      setSessionId(data.session_id);
      setSessionData(data);
      showToast.success(
        `Report session created: ${data.drill_count || 0} drills loaded`
      );
      // Refresh session list
      try {
        const listData = await wizardService.getSessions(null, 50, 0, 'report');
        setSessions(listData.sessions || []);
      } catch { /* non-critical */ }
    } catch (err) {
      console.error('Failed to create report session:', err);
      showToast.error(err.message || 'Failed to create report session');
    } finally {
      setIsCreating(false);
    }
  }, [scope, selectedTags, drillIdsText, dateFrom, dateTo, maxDrills, initialDrillIds]);

  const handleSelectSession = useCallback((sid) => {
    if (sid === sessionId) return;
    loadSession(sid);
  }, [sessionId]);

  const handleNewSession = useCallback(() => {
    setSessionId(null);
    setSessionData(null);
  }, []);

  const handleDeleteSession = useCallback(async (sid) => {
    try {
      await wizardService.deleteSession(sid);
      setSessions((prev) => prev.filter((s) => s.session_id !== sid));
      if (sessionId === sid) {
        setSessionId(null);
        setSessionData(null);
      }
      showToast.success('Session deleted');
    } catch (err) {
      showToast.error('Failed to delete session');
    }
  }, [sessionId]);

  const handleRenameSession = useCallback(async (sid, title) => {
    try {
      await wizardService.renameSession(sid, title);
      setSessions((prev) =>
        prev.map((s) => (s.session_id === sid ? { ...s, title } : s))
      );
      if (sessionId === sid) {
        setSessionData((prev) => prev ? { ...prev, title } : prev);
      }
    } catch (err) {
      showToast.error('Failed to rename session');
    }
  }, [sessionId]);

  const openRename = (sid, currentTitle) => {
    setRenameValue(currentTitle || '');
    setRenameDialog({ open: true, sessionId: sid, currentTitle });
  };

  const handleRename = () => {
    if (renameValue.trim() && renameDialog.sessionId) {
      handleRenameSession(renameDialog.sessionId, renameValue.trim());
    }
    setRenameDialog({ open: false, sessionId: null, currentTitle: '' });
  };

  const sessionActive = Boolean(sessionId);

  const canStart =
    scope === 'all' ? true :
    scope === 'tag' ? selectedTags.length > 0 :
    scope === 'drill_ids' ? (drillIdsText || '').split(/[,\s]+/).filter((id) => id.trim()).length > 0 :
    true;

  if (!isPlatformEngineering) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Breadcrumbs />
        </Box>
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel */}
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
                  Peil Reports
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Natural language drill reporting
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
                  <Tooltip title="New report">
                    <IconButton size="small" onClick={handleNewSession}>
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
                      onClick={() => handleSelectSession(s.session_id)}
                      sx={{
                        px: 2,
                        py: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': { bgcolor: 'action.hover' },
                        ...(s.session_id === sessionId && { bgcolor: 'action.selected' }),
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
                              if (window.confirm('Delete this session?')) handleDeleteSession(s.session_id);
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
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                  New Report
                </Typography>

                {/* Scope selector */}
                <FormControl component="fieldset" size="small">
                  <FormLabel component="legend" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                    Scope
                  </FormLabel>
                  <RadioGroup
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                  >
                    <FormControlLabel
                      value="all"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">All Drills</Typography>}
                    />
                    <FormControlLabel
                      value="tag"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">By Tag</Typography>}
                    />
                    <FormControlLabel
                      value="drill_ids"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">Specific Drill IDs</Typography>}
                    />
                  </RadioGroup>
                </FormControl>

                {scope === 'tag' && (
                  <>
                    <Autocomplete
                      multiple
                      size="small"
                      options={availableTags}
                      getOptionLabel={(option) => option.tag_name}
                      value={selectedTags}
                      onChange={(_, newValue) => setSelectedTags(newValue)}
                      loading={tagsLoading}
                      renderOption={(props, option) => (
                        <li {...props} key={option.tag_name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2">{option.tag_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.drill_count} drills</Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tags"
                          placeholder={selectedTags.length === 0 ? 'Select tags...' : ''}
                        />
                      )}
                    />
                    {selectedTags.length > 0 && (() => {
                      const estimatedCount = selectedTags.reduce((sum, t) => sum + (t.drill_count || 0), 0);
                      const isOverLimit = estimatedCount > REPORT_MAX_DRILLS;
                      const isNearLimit = estimatedCount > REPORT_MAX_DRILLS * 0.75;
                      return (
                        <Typography
                          variant="caption"
                          sx={{
                            color: isOverLimit ? 'error.main' : isNearLimit ? 'warning.main' : 'text.secondary',
                            fontWeight: isOverLimit ? 600 : 400,
                          }}
                        >
                          ~{estimatedCount.toLocaleString()} drills from {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}
                          {isOverLimit && ` (exceeds ${REPORT_MAX_DRILLS.toLocaleString()} limit)`}
                        </Typography>
                      );
                    })()}
                  </>
                )}

                {scope === 'drill_ids' && (
                  <>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={4}
                      label="Drill IDs"
                      placeholder="Paste drill IDs, one per line or comma-separated"
                      value={drillIdsText}
                      onChange={(e) => setDrillIdsText(e.target.value)}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {(drillIdsText || '').split(/[,\s]+/).filter((id) => id.trim()).length} drill(s) entered
                    </Typography>
                  </>
                )}

                {/* Date range */}
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From Date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To Date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                {/* Max drills */}
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Drills"
                  value={maxDrills}
                  onChange={(e) => setMaxDrills(Number(e.target.value))}
                  inputProps={{ min: 1, max: 5000, step: 100 }}
                />

                <Button
                  variant="contained"
                  startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleStartSession}
                  disabled={!canStart || isCreating}
                  fullWidth
                >
                  {isCreating ? 'Creating Session...' : 'Start Session'}
                </Button>
              </Box>
            )}

            {/* Session Active: Header + Info */}
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
                        onClick={() => openRename(sessionId, sessionData?.title)}
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (window.confirm('Delete this session?')) handleDeleteSession(sessionId);
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
                            if (s.session_id !== sessionId) {
                              handleSelectSession(s.session_id);
                              setShowSessionSwitcher(false);
                            }
                          }}
                          sx={{
                            px: 2,
                            py: 0.75,
                            cursor: s.session_id === sessionId ? 'default' : 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            '&:hover': s.session_id !== sessionId ? { bgcolor: 'action.hover' } : {},
                            ...(s.session_id === sessionId && { bgcolor: 'primary.50', borderLeft: '3px solid', borderColor: 'primary.main' }),
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={s.session_id === sessionId ? 700 : 500} noWrap sx={{ fontSize: '0.78rem' }}>
                              {s.title || 'Untitled Session'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                {formatDate(s.updated_at)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                {s.drill_count || 0} drills
                              </Typography>
                            </Box>
                          </Box>
                          {s.session_id === sessionId && (
                            <Chip label="Active" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem', ml: 0.5 }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Session summary */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {sessionData?.scope && (
                      <Chip
                        label={`Scope: ${sessionData.scope}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                    {sessionData?.drill_count != null && (
                      <Chip
                        label={`${sessionData.drill_count} drills`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Empty space filler */}
                <Box sx={{ flex: 1 }} />
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

          {/* Right Panel */}
          <ReportChatPanel
            sessionId={sessionId}
            sessionData={sessionData}
          />
        </Box>
      </Box>
    </AppLayout>
  );
};

export default PeilReports;
