import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Select,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import ChatPanel from './ChatPanel';
import InputBox from './InputBox';
import SuggestedQuestions from './SuggestedQuestions';
import AnnotationListPanel from './AnnotationListPanel';
import ScriptLibraryDialog from './ScriptLibraryDialog';
import ShortcutLibraryDialog from './ShortcutLibraryDialog';
import PatchCard from './PatchCard';
import DiffViewerModal from './DiffViewerModal';
import SandboxResultCard from './SandboxResultCard';
import DAReviewNote from './DAReviewNote';
import SandboxProgressIndicator from './SandboxProgressIndicator';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import BoltIcon from '@mui/icons-material/Bolt';
import BugReportIcon from '@mui/icons-material/BugReport';
import wizardService from '../../api/wizardService';

const DRAWER_WIDTH = 420;

const WizardDrawer = ({ open, onClose, drillId, drill, scores, highlights, onAnnotationReady, dawTier }) => {
  // Tier-based visibility helpers
  const tierAtLeast = (minTier) => {
    const hierarchy = ['support_agent', 'analyst', 'superadmin', 'platform_engineering', 'platform_engineering_admin'];
    const userIdx = hierarchy.indexOf(dawTier || 'superadmin');
    const minIdx = hierarchy.indexOf(minTier);
    return userIdx >= minIdx;
  };
  const isAnalystPlus = tierAtLeast('analyst');

  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeFunctionCalls, setActiveFunctionCalls] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [annotations, setAnnotations] = useState([]);
  const [visionFrames, setVisionFrames] = useState([]);
  const [savedAnnotations, setSavedAnnotations] = useState([]);
  const [scriptLibraryOpen, setScriptLibraryOpen] = useState(false);
  const [shortcutLibraryOpen, setShortcutLibraryOpen] = useState(false);
  const [viewVideoUrl, setViewVideoUrl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [saveDialog, setSaveDialog] = useState({ open: false, annotationId: null });
  const [saveForm, setSaveForm] = useState({ name: '', purpose: '', when_to_use: '', what_to_look_for: '' });
  const [sandboxProgress, setSandboxProgress] = useState(null);
  const [sandboxResults, setSandboxResults] = useState([]);
  const [patchCards, setPatchCards] = useState([]);
  const [daReviews, setDaReviews] = useState([]);
  const [diffViewPatch, setDiffViewPatch] = useState(null);
  const [visionDebug, setVisionDebug] = useState(false);
  const [budgetExhausted, setBudgetExhausted] = useState(null);
  const [visionDebugManifests, setVisionDebugManifests] = useState([]);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const abortRef = useRef(null);
  const turnIndexRef = useRef(0);

  // Load sessions when drawer opens
  useEffect(() => {
    if (open && drillId) {
      loadSessions();
    }
  }, [open, drillId]);

  // Start a new session automatically when drawer opens with no session
  useEffect(() => {
    if (open && drillId && !sessionId && sessions !== null) {
      // Only auto-start if no sessions loaded (first time)
      if (sessions.length === 0) {
        startNewSession();
      }
    }
  }, [open, drillId, sessions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
      }
    };
  }, []);

  const loadSessions = async () => {
    try {
      const data = await wizardService.getSessions(drillId);
      setSessions(data.sessions || []);
      // If there are existing sessions, load the most recent one
      if (data.sessions && data.sessions.length > 0) {
        await loadSession(data.sessions[0].session_id);
      }
    } catch (err) {
      console.error('Failed to load wizard sessions:', err);
      setSessions([]);
    }
  };

  const loadSession = async (sid) => {
    try {
      const data = await wizardService.getSession(sid);
      setSessionId(sid);
      setMessages(
        (data.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }))
      );
      // Restore vision frames from saved session
      if (data.vision_frames && data.vision_frames.length > 0) {
        setVisionFrames(
          data.vision_frames.map((vf) => ({
            id: vf.frame_id,
            imageUrl: vf.image_url,
            toolName: vf.tool_name,
            description: vf.description,
            turnIndex: vf.turn_index,
          }))
        );
      } else {
        setVisionFrames([]);
      }
      // Load saved annotations for this session
      if (drillId) {
        try {
          const annData = await wizardService.getAnnotations(drillId);
          const saved = (annData.annotations || []).filter((a) => a.saved);
          const unsaved = (annData.annotations || []).filter((a) => !a.saved && a.status === 'completed');
          setSavedAnnotations(saved.map((a) => ({
            id: a.id,
            status: 'completed',
            videoUrl: a.signed_url,
            name: a.name,
            saved: true,
            description: a.spec?.description || '',
          })));
          setAnnotations(unsaved.map((a) => ({
            id: a.id,
            status: 'completed',
            videoUrl: a.signed_url,
            description: a.spec?.description || '',
            percent: 100,
          })));
        } catch {
          // Non-critical — annotations just won't show
        }
      }
      setShowSuggestions(false);
      setError(null);
    } catch (err) {
      console.error('Failed to load wizard session:', err);
      setError('Failed to load session history.');
    }
  };

  const startNewSession = () => {
    if (abortRef.current) {
      abortRef.current();
    }
    setSessionId(null);
    setMessages([]);
    setIsStreaming(false);
    setActiveFunctionCalls([]);
    setIsThinking(false);
    setError(null);
    setShowSuggestions(true);
    setVisionFrames([]);
    setVisionDebugManifests([]);
    turnIndexRef.current = 0;
  };

  const handleDeleteSession = async (sid) => {
    try {
      await wizardService.deleteSession(sid);
      setSessions((prev) => prev.filter((s) => s.session_id !== sid));
      if (sessionId === sid) {
        startNewSession();
      }
    } catch (err) {
      console.error('Failed to delete wizard session:', err);
    }
  };

  const handleSessionChange = (event) => {
    const sid = event.target.value;
    if (sid === 'new') {
      startNewSession();
    } else {
      loadSession(sid);
    }
  };

  const handleDownloadConversation = () => {
    if (messages.length === 0) return;

    const drillName = drill?.drillType || drill?.gameType || 'Drill';
    const dateStr = new Date().toISOString().slice(0, 10);
    const lines = [
      `Drill Analysis Wizard — ${drillName}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Messages: ${messages.length}`,
      '—'.repeat(40),
      '',
    ];

    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'Wizard';
      const time = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
      lines.push(`[${role}] ${time}`);
      lines.push(msg.content || '');
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wizard-${drillName.replace(/\s+/g, '-').toLowerCase()}-${dateStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTranscript = async (format) => {
    setDownloadMenuAnchor(null);
    if (format === 'txt') {
      handleDownloadConversation();
      return;
    }
    if (!sessionId) {
      setSnackbar({ open: true, message: 'No active session to export' });
      return;
    }
    try {
      await wizardService.exportTranscript(sessionId, format);
    } catch {
      setSnackbar({ open: true, message: `Failed to export as ${format.toUpperCase()}` });
    }
  };

  const openSaveDialog = (annotationId) => {
    setSaveForm({ name: '', purpose: '', when_to_use: '', what_to_look_for: '' });
    setSaveDialog({ open: true, annotationId });
  };

  const handleSaveAnnotation = async () => {
    const { annotationId } = saveDialog;
    const { name, purpose, when_to_use, what_to_look_for } = saveForm;
    const metadata = { purpose, when_to_use, what_to_look_for };
    try {
      await wizardService.saveAnnotation(annotationId, name || 'Saved annotation', metadata);
      setAnnotations((prev) => {
        const ann = prev.find((a) => a.id === annotationId);
        if (ann) {
          setSavedAnnotations((s) => [...s, { ...ann, saved: true, name: name || 'Saved annotation' }]);
        }
        return prev.filter((a) => a.id !== annotationId);
      });
      setSnackbar({ open: true, message: 'Annotation saved to library' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save annotation' });
    }
    setSaveDialog({ open: false, annotationId: null });
  };

  const sendMessage = useCallback(
    async (text, attachments = []) => {
      if (isStreaming || !text.trim()) return;

      setError(null);
      setShowSuggestions(false);
      setIsStreaming(true);
      setActiveFunctionCalls([]);
      setIsThinking(false);
      setBudgetExhausted(null);

      // Add user message (with attachments if any)
      const userMsg = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
        ...(attachments.length > 0 ? { attachments } : {}),
      };
      // Increment turn counter for per-message frame tracking
      turnIndexRef.current += 1;
      const currentTurn = turnIndexRef.current;
      // Add placeholder for assistant streaming message
      const assistantMsg = { role: 'assistant', content: '', isStreaming: true, timestamp: new Date().toISOString(), turnIndex: currentTurn };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        const { stream, abort } = wizardService.sendMessage(sessionId, drillId, text, { visionDebug, attachments });
        abortRef.current = abort;

        for await (const event of stream) {
          switch (event.type) {
            case 'heartbeat':
              break;

            case 'session_id':
              setSessionId(event.content);
              break;

            case 'function_call':
              setIsThinking(false);
              setActiveFunctionCalls((prev) => [...prev, event.content]);
              break;

            case 'function_result':
              // Clear the completed function call
              setActiveFunctionCalls((prev) => prev.slice(1));
              // Show snackbar when engineering request is submitted
              if (event.engineering_request?.submitted) {
                setSnackbar({
                  open: true,
                  message: `Engineering request ${event.engineering_request.request_id} submitted for review`,
                });
              }
              break;

            case 'thinking':
              setIsThinking(true);
              break;

            case 'chunk':
              setIsThinking(false);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + event.content,
                  };
                }
                return updated;
              });
              break;

            case 'done':
              setIsThinking(false);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return updated;
              });
              break;

            case 'annotation_progress': {
              const data = event.content || event;
              setAnnotations((prev) => {
                const existing = prev.find((a) => a.id === data.annotation_id);
                if (existing) {
                  return prev.map((a) =>
                    a.id === data.annotation_id
                      ? { ...a, percent: data.percent, statusText: data.status_text, status: 'processing' }
                      : a
                  );
                }
                return [
                  ...prev,
                  {
                    id: data.annotation_id,
                    percent: data.percent,
                    statusText: data.status_text,
                    status: 'processing',
                    description: data.description || '',
                  },
                ];
              });
              break;
            }

            case 'annotation_complete': {
              const data = event.content || event;
              setAnnotations((prev) =>
                prev.map((a) =>
                  a.id === data.annotation_id
                    ? {
                        ...a,
                        status: 'completed',
                        videoUrl: data.video_url,
                        duration: data.duration,
                        frames: data.frames,
                        description: data.description || a.description,
                        percent: 100,
                      }
                    : a
                )
              );
              // Notify parent that annotation video is ready
              if (data.video_url && onAnnotationReady) {
                onAnnotationReady(data.video_url);
              }
              break;
            }

            case 'annotation_failed': {
              const data = event.content || event;
              setAnnotations((prev) =>
                prev.map((a) =>
                  a.id === data.annotation_id ? { ...a, status: 'failed', error: data.error } : a
                )
              );
              break;
            }

            case 'vision_frame': {
              const data = event.content || event;
              setVisionFrames((prev) => [...prev, {
                id: data.frame_id,
                imageUrl: data.image_url,
                toolName: data.tool_name,
                description: data.description,
                turnIndex: currentTurn,
              }]);
              break;
            }

            case 'vision_debug_manifest': {
              const data = event.content || event;
              setVisionDebugManifests((prev) => [...prev, {
                turnIndex: currentTurn,
                manifest: data.manifest,
                frameCount: data.frame_count,
                toolName: data.tool_name,
              }]);
              break;
            }

            case 'sandbox_progress': {
              const data = event.content || event;
              setSandboxProgress({ step: data.step, percent: data.percent, status_text: data.status_text });
              break;
            }

            case 'sandbox_complete': {
              const data = event.content || event;
              setSandboxProgress(null);
              setSandboxResults((prev) => [...prev, data]);
              break;
            }

            case 'sandbox_failed': {
              const data = event.content || event;
              setSandboxProgress(null);
              setError(data.error || 'Sandbox test failed');
              break;
            }

            case 'patch_created': {
              const data = event.content || event;
              setPatchCards((prev) => [...prev, data]);
              break;
            }

            case 'da_review': {
              const data = event.content || event;
              setDaReviews((prev) => [...prev, data]);
              break;
            }

            case 'budget_warning': {
              const bw = event.content || event;
              setSnackbar({
                open: true,
                message: `Tool budget running low (${bw.remaining} calls remaining). Peil will wrap up soon.`,
                severity: 'warning',
                autoHideDuration: 5000,
              });
              break;
            }

            case 'budget_exhausted': {
              setBudgetExhausted(event.content || event);
              break;
            }

            case 'cancelled':
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return [
                  ...updated,
                  { role: 'system', content: event.content || 'Operation cancelled.', timestamp: new Date().toISOString() },
                ];
              });
              break;

            case 'error':
              setIsThinking(false);
              setError(event.content || 'An error occurred.');
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant' && !last.content) {
                  // Remove empty assistant message on error
                  return updated.slice(0, -1);
                }
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return updated;
              });
              break;

            default:
              break;
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Wizard stream error:', err);
        setError(err.message || 'Connection failed. Please try again.');
        // Remove empty assistant placeholder on error
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && !last.content) {
            return updated.slice(0, -1);
          }
          if (last && last.role === 'assistant') {
            return [...updated.slice(0, -1), { ...last, isStreaming: false }];
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        setActiveFunctionCalls([]);
        setIsThinking(false);
        abortRef.current = null;
        // Refresh sessions list to pick up new/updated session
        if (drillId) {
          try {
            const data = await wizardService.getSessions(drillId);
            setSessions(data.sessions || []);
          } catch {
            // Non-critical; silently ignore
          }
        }
      }
    },
    [isStreaming, sessionId, drillId, visionDebug]
  );

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 56,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          Drill Analysis Wizard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {messages.length > 0 && (
            <>
              <Tooltip title="Download conversation">
                <IconButton
                  size="small"
                  onClick={(e) => setDownloadMenuAnchor(e.currentTarget)}
                  disabled={isStreaming}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={downloadMenuAnchor}
                open={Boolean(downloadMenuAnchor)}
                onClose={() => setDownloadMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={() => handleExportTranscript('txt')} sx={{ fontSize: '0.85rem' }}>
                  <ListItemIcon><TextSnippetIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Text (.txt)</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleExportTranscript('md')} sx={{ fontSize: '0.85rem' }}>
                  <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Markdown (.md)</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleExportTranscript('pdf')} sx={{ fontSize: '0.85rem' }}>
                  <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>PDF (.pdf)</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
          {tierAtLeast('superadmin') && (
            <Tooltip title={visionDebug ? 'Vision debug ON' : 'Vision debug OFF'}>
              <IconButton
                size="small"
                onClick={() => setVisionDebug((v) => !v)}
                sx={{ color: visionDebug ? 'warning.main' : 'text.secondary' }}
              >
                <BugReportIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="New session">
            <IconButton size="small" onClick={startNewSession} disabled={isStreaming}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Session Selector */}
      {sessions.length > 0 && (
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              size="small"
              value={sessionId || 'new'}
              onChange={handleSessionChange}
              sx={{ flex: 1, minWidth: 0, fontSize: '0.8rem' }}
              disabled={isStreaming}
            >
              <MenuItem value="new" sx={{ fontSize: '0.8rem' }}>
                <em>New Session</em>
              </MenuItem>
              {sessions.map((s) => (
                <MenuItem key={s.session_id} value={s.session_id} sx={{ fontSize: '0.8rem' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                      {s.title || `Session ${s.session_id.slice(-6)}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                      {s.message_count}msg
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {sessionId && (
              <Tooltip title="Delete session">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteSession(sessionId)}
                  disabled={isStreaming}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      {/* Annotation List Panel */}
      {isAnalystPlus && (
        <AnnotationListPanel
          annotations={annotations}
          savedAnnotations={savedAnnotations}
          onView={(url) => {
            setViewVideoUrl(url);
            onAnnotationReady?.(url);
          }}
          onSave={(id) => openSaveDialog(id)}
          onDelete={(id) => {
            wizardService.deleteAnnotation(id).then(() => {
              setSavedAnnotations((prev) => prev.filter((a) => a.id !== id));
              setSnackbar({ open: true, message: 'Annotation deleted' });
            }).catch(() => {
              setSnackbar({ open: true, message: 'Failed to delete annotation' });
            });
          }}
        />
      )}

      {/* Browse Library Buttons */}
      {drill && isAnalystPlus && (
        <Box sx={{ px: 2, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<MovieCreationIcon sx={{ fontSize: 14 }} />}
            onClick={() => setScriptLibraryOpen(true)}
            sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.25 }}
            fullWidth
          >
            Browse Script Library
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<BoltIcon sx={{ fontSize: 14 }} />}
            onClick={() => setShortcutLibraryOpen(true)}
            sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.25 }}
            fullWidth
          >
            Browse Analysis Shortcuts
          </Button>
        </Box>
      )}

      {/* Script Library Dialog */}
      <ScriptLibraryDialog
        open={scriptLibraryOpen}
        onClose={() => setScriptLibraryOpen(false)}
        onSelectScript={sendMessage}
        drillType={drill?.gameType}
      />

      {/* Shortcut Library Dialog */}
      <ShortcutLibraryDialog
        open={shortcutLibraryOpen}
        onClose={() => setShortcutLibraryOpen(false)}
        onSelectShortcut={sendMessage}
        drillType={drill?.gameType}
      />

      {/* Error Banner */}
      {error && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="caption">{error}</Typography>
        </Box>
      )}

      {/* Sandbox Progress */}
      {sandboxProgress && (
        <SandboxProgressIndicator progress={sandboxProgress} />
      )}

      {/* Patch Cards */}
      {patchCards.map((patch, idx) => (
        <PatchCard
          key={patch.patch_id || idx}
          patch={patch}
          onViewDiff={(p) => setDiffViewPatch(p)}
          onTest={(p) => sendMessage(`Test patch ${p.patch_id} on this drill`)}
        />
      ))}

      {/* Sandbox Result Cards */}
      {sandboxResults.map((result, idx) => (
        <SandboxResultCard
          key={result.run_id || idx}
          result={result}
          onViewFull={(r) => window.open(`/superadmin/sandbox/${r.run_id}`, '_blank')}
          onTestMore={(r) => sendMessage(`Test patch ${r.patch_id} on more drills`)}
          onTweak={(r) => sendMessage(`Tweak the patch ${r.patch_id}`)}
        />
      ))}

      {/* DA Review Notes */}
      {daReviews.map((review, idx) => (
        <DAReviewNote key={idx} review={review} />
      ))}

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        activeFunctionCalls={activeFunctionCalls}
        isThinking={isThinking}
        isStreaming={isStreaming}
        annotations={annotations}
        visionFrames={visionFrames}
        visionDebug={visionDebug}
        visionDebugManifests={visionDebugManifests}
        sessionType="drill"
        onAnnotationView={(url) => {
          setViewVideoUrl(url);
          onAnnotationReady?.(url);
        }}
        onAnnotationSave={(id) => {
          wizardService.saveAnnotation(id, 'Saved annotation').catch((err) =>
            console.error('Failed to save annotation:', err)
          );
        }}
      />

      {/* Budget Exhausted — Continue Investigation Card */}
      {budgetExhausted && !isStreaming && (
        <Paper
          sx={{
            p: 2,
            mx: 2,
            mb: 1,
            border: '1px solid',
            borderColor: 'warning.main',
            bgcolor: 'warning.50',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Peil used all {budgetExhausted.max_calls} tool calls this turn.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setBudgetExhausted(null);
                sendMessage('Continue investigating where you left off.');
              }}
              sx={{ textTransform: 'none' }}
            >
              Continue Investigation
            </Button>
          </Box>
        </Paper>
      )}

      {/* Suggested Questions */}
      {showSuggestions && !isStreaming && (
        <SuggestedQuestions
          drill={drill}
          scores={scores}
          onSelect={sendMessage}
        />
      )}

      {/* Input Box */}
      <InputBox
        onSend={sendMessage}
        disabled={isStreaming}
        isStreaming={isStreaming}
        onStop={() => {
          if (abortRef.current) {
            abortRef.current();
          }
          setIsStreaming(false);
          setActiveFunctionCalls([]);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, isStreaming: false };
            }
            return [
              ...updated,
              { role: 'system', content: 'Operation cancelled by user.', timestamp: new Date().toISOString() },
            ];
          });
        }}
      />

      {/* Annotation Video Dialog */}
      <Dialog
        open={Boolean(viewVideoUrl)}
        onClose={() => setViewVideoUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          <Typography variant="subtitle1">Annotated Video</Typography>
          <IconButton size="small" onClick={() => setViewVideoUrl(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {viewVideoUrl && (
            <video
              src={viewVideoUrl}
              controls
              autoPlay
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Save Annotation Dialog */}
      <Dialog
        open={saveDialog.open}
        onClose={() => setSaveDialog({ open: false, annotationId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <SaveIcon />
          <Typography variant="h6" component="span">Save Annotation</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Name"
            placeholder="e.g. Ball tracking overlay"
            value={saveForm.name}
            onChange={(e) => setSaveForm((f) => ({ ...f, name: e.target.value }))}
            sx={{ mb: 1.5, mt: 0.5 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Purpose (optional)"
            placeholder="What does this annotation do?"
            value={saveForm.purpose}
            onChange={(e) => setSaveForm((f) => ({ ...f, purpose: e.target.value }))}
            sx={{ mb: 1.5 }}
          />
          <TextField
            fullWidth
            size="small"
            label="When to use (optional)"
            placeholder="When should this annotation be applied?"
            value={saveForm.when_to_use}
            onChange={(e) => setSaveForm((f) => ({ ...f, when_to_use: e.target.value }))}
            sx={{ mb: 1.5 }}
          />
          <TextField
            fullWidth
            size="small"
            label="What to look for (optional)"
            placeholder="Key indicators or patterns to check"
            value={saveForm.what_to_look_for}
            onChange={(e) => setSaveForm((f) => ({ ...f, what_to_look_for: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog({ open: false, annotationId: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAnnotation}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar.severity ? (
          <Alert
            onClose={() => setSnackbar({ open: false, message: '' })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        ) : (
          <Alert severity="info" variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        )}
      </Snackbar>

      {/* Diff Viewer Modal */}
      <DiffViewerModal
        open={Boolean(diffViewPatch)}
        onClose={() => setDiffViewPatch(null)}
        patch={diffViewPatch}
      />
    </Drawer>
  );
};

export { DRAWER_WIDTH };
export default WizardDrawer;
