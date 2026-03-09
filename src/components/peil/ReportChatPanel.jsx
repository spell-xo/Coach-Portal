import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import PeilWelcomeBanner from '../wizard/PeilWelcomeBanner';
import FunctionCallIndicator from '../wizard/FunctionCallIndicator';
import InputBox from '../wizard/InputBox';
import ReportCard from './ReportCard';
import wizardService from '../../api/wizardService';
import peilAvatar from '../../assets/images/peil-avatar-48.png';

const REPORT_SUGGESTIONS = [
  'Show me score distribution by drill type',
  'Which drills were classified BAD by Gemini but scored > 0?',
  'Average scores by month',
  'List drills with failed processing status',
];

// Regex to match [report:RPT-XXX] markers in message content
const REPORT_MARKER_RE = /\[report:(RPT-\d{3})\]/g;

/**
 * Lightweight markdown-to-HTML converter (mirrors MessageBubble's renderMarkdown).
 */
const renderMarkdown = (text) => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre style="background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;font-size:0.8rem;margin:8px 0"><code>${code.trim()}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f5f5f5;padding:1px 4px;border-radius:3px;font-size:0.8rem">$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li style="margin-left:16px">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px">$1</li>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

/**
 * Renders assistant message content, replacing [report:RPT-XXX] markers with ReportCard.
 * Text segments are rendered as markdown HTML.
 */
const AssistantContentWithReports = ({ content, sessionId, reportData }) => {
  const contentStyles = {
    '& pre': { my: 1 },
    '& li': { listStyle: 'disc' },
    '& code': { fontFamily: 'monospace' },
    fontSize: '0.875rem',
    lineHeight: 1.6,
    wordBreak: 'break-word',
  };

  if (!content) return null;

  // Check for report markers
  const hasReports = REPORT_MARKER_RE.test(content);
  REPORT_MARKER_RE.lastIndex = 0;

  if (!hasReports) {
    return (
      <Box sx={contentStyles} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    );
  }

  // Split on [report:RPT-XXX] — alternating: text, id, text, id, ...
  const parts = content.split(/\[report:(RPT-\d{3})\]/g);

  return (
    <Box sx={contentStyles}>
      {parts.map((part, i) => {
        if (i % 2 === 0) {
          if (!part) return null;
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(part) }} />;
        }
        // Report ID
        return (
          <ReportCard
            key={i}
            reportId={part}
            sessionId={sessionId}
            report={reportData[part]}
          />
        );
      })}
    </Box>
  );
};

/**
 * Single message bubble with report card support.
 */
const ReportMessageBubble = ({ message, sessionId, reportData }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming && !message.content;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = message.content || '';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        px: 2,
        '&:hover .copy-btn': { opacity: 1 },
      }}
    >
      {isUser && message.content && !isStreaming && (
        <Tooltip title={copied ? 'Copied!' : 'Copy'} placement="left">
          <IconButton
            className="copy-btn"
            size="small"
            onClick={handleCopy}
            sx={{
              opacity: 0.4,
              transition: 'opacity 0.2s',
              alignSelf: 'flex-start',
              mt: 0.5,
              mr: 0.5,
              color: 'text.disabled',
              '&:hover': { color: 'text.secondary', opacity: 1 },
            }}
          >
            {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Tooltip>
      )}
      {!isUser && (
        <Avatar
          src={peilAvatar}
          alt="Peil"
          sx={{ width: 28, height: 28, alignSelf: 'flex-start', mt: 0.5, mr: 0.75, flexShrink: 0 }}
        />
      )}
      <Box
        sx={{
          maxWidth: isUser ? '85%' : '78%',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          ...(isUser
            ? {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderBottomRightRadius: 4,
              }
            : {
                bgcolor: 'grey.100',
                color: 'text.primary',
                borderBottomLeftRadius: 4,
              }),
        }}
      >
        {isStreaming ? (
          <Box sx={{ display: 'flex', gap: 0.5, py: 0.5 }}>
            {[0, 1, 2].map((idx) => (
              <Box
                key={idx}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'wizardPulse 1.4s ease-in-out infinite',
                  animationDelay: `${idx * 0.2}s`,
                  '@keyframes wizardPulse': {
                    '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                    '40%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              />
            ))}
          </Box>
        ) : isUser ? (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
        ) : (
          <AssistantContentWithReports
            content={message.content}
            sessionId={sessionId}
            reportData={reportData}
          />
        )}
        {message.timestamp && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              opacity: 0.7,
              fontSize: '0.65rem',
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        )}
      </Box>
      {!isUser && message.content && !isStreaming && (
        <Tooltip title={copied ? 'Copied!' : 'Copy'} placement="right">
          <IconButton
            className="copy-btn"
            size="small"
            onClick={handleCopy}
            sx={{
              opacity: 0.4,
              transition: 'opacity 0.2s',
              alignSelf: 'flex-start',
              mt: 0.5,
              ml: 0.5,
              color: 'text.disabled',
              '&:hover': { color: 'text.secondary', opacity: 1 },
            }}
          >
            {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

const ReportChatPanel = ({ sessionId, sessionData }) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeFunctionCalls, setActiveFunctionCalls] = useState([]);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [reportData, setReportData] = useState({});
  const [progressInfo, setProgressInfo] = useState(null); // { processed, total, scope_total }
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeFunctionCalls, isStreaming]);

  // Reset state when session changes - load existing messages if resuming
  useEffect(() => {
    setError(null);
    setActiveFunctionCalls([]);
    setReportData({});
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    if (sessionData?.messages?.length > 0) {
      const loaded = sessionData.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(loaded);
      setShowSuggestions(false);
    } else {
      setMessages([]);
      setShowSuggestions(true);
    }
  }, [sessionId, sessionData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
      }
    };
  }, []);

  const handleDownloadTranscript = () => {
    if (messages.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const lines = [
      `Peil Report Session`,
      `Exported: ${new Date().toLocaleString()}`,
      `Session: ${sessionData?.title || sessionId || 'Untitled'}`,
      `Messages: ${messages.length}`,
      '\u2014'.repeat(40),
      '',
    ];
    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'Peil';
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
    a.download = `peil-report-${dateStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendMessage = useCallback(
    async (text) => {
      if (isStreaming || !text.trim() || !sessionId) return;

      setError(null);
      setShowSuggestions(false);
      setIsStreaming(true);
      setActiveFunctionCalls([]);
      setProgressInfo(null);

      const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
      const assistantMsg = { role: 'assistant', content: '', isStreaming: true, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        const { stream, abort } = wizardService.sendMessage(sessionId, null, text);
        abortRef.current = abort;

        for await (const event of stream) {
          switch (event.type) {
            case 'heartbeat':
              break;

            case 'session_id':
              break;

            case 'function_call':
              setActiveFunctionCalls((prev) => [...prev, event.content]);
              break;

            case 'function_result': {
              setActiveFunctionCalls((prev) => prev.slice(1));
              // Cache report data from generate_report function results
              if (event.report && event.report.report_id) {
                setReportData((prev) => ({
                  ...prev,
                  [event.report.report_id]: event.report,
                }));
              }
              // Update progress info from tool results
              if (event.progress) {
                setProgressInfo(event.progress);
              }
              break;
            }

            case 'chunk':
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.content };
                }
                return updated;
              });
              break;

            case 'done':
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return updated;
              });
              break;

            case 'error':
              setError(event.content || 'An error occurred.');
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant' && !last.content) {
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
        console.error('Report wizard stream error:', err);
        setError(err.message || 'Connection failed. Please try again.');
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
        setProgressInfo(null);
        abortRef.current = null;
      }
    },
    [isStreaming, sessionId]
  );

  // Empty state before session
  if (!sessionId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          color: 'text.secondary',
        }}
      >
        <PeilWelcomeBanner sessionType="report" />
        <Typography variant="body2" textAlign="center" sx={{ maxWidth: 400, mt: 1 }}>
          Configure a report scope on the left panel, then click "Start Session" to begin querying drill data with natural language.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Chat Header */}
      {messages.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tooltip title="Download transcript">
            <IconButton size="small" onClick={handleDownloadTranscript} disabled={isStreaming}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Error Banner */}
      {error && (
        <Box sx={{ px: 2, py: 1 }}>
          <Alert severity="error" onClose={() => setError(null)} sx={{ fontSize: '0.8rem' }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        {messages.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, flex: 1 }}>
            <PeilWelcomeBanner sessionType="report" />
          </Box>
        )}
        {messages.map((msg, index) => (
          <ReportMessageBubble
            key={index}
            message={msg}
            sessionId={sessionId}
            reportData={reportData}
          />
        ))}
        <FunctionCallIndicator activeCalls={activeFunctionCalls} />
        {/* Progress indicator for report tool calls */}
        {isStreaming && progressInfo && progressInfo.total > 0 && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Box
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Processing drills
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  {progressInfo.processed.toLocaleString()} / {progressInfo.total.toLocaleString()}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.round((progressInfo.processed / progressInfo.total) * 100))}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: progressInfo.processed >= progressInfo.total ? 'success.main' : 'primary.main',
                  },
                }}
              />
              {progressInfo.scope_total > 0 && progressInfo.scope_total !== progressInfo.total && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', mt: 0.25, display: 'block' }}>
                  {progressInfo.total.toLocaleString()} matching of {progressInfo.scope_total.toLocaleString()} in scope
                </Typography>
              )}
            </Box>
          </Box>
        )}
        <div ref={scrollRef} />
      </Box>

      {/* Welcome Banner + Suggested Questions */}
      {messages.length === 0 && showSuggestions && !isStreaming && (
        <Box sx={{ px: 2, pb: 1 }}>
          <PeilWelcomeBanner sessionType="report" />
        </Box>
      )}
      {showSuggestions && !isStreaming && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <AutoAwesomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Suggested queries
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {REPORT_SUGGESTIONS.map((question, index) => (
              <Chip
                key={index}
                label={question}
                size="small"
                variant="outlined"
                onClick={() => sendMessage(question)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  height: 'auto',
                  '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
                  '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input Box */}
      <InputBox onSend={sendMessage} disabled={isStreaming || !sessionId} />
    </Box>
  );
};

export default ReportChatPanel;
