import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Avatar, Dialog, DialogContent, Chip, Collapse } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import BugReportIcon from '@mui/icons-material/BugReport';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import peilAvatar from '../../assets/images/peil-avatar-48.png';

/**
 * Lightweight markdown-to-HTML converter for assistant messages.
 * Handles: bold, italic, inline code, code blocks, lists, line breaks.
 */
const renderMarkdown = (text) => {
  if (!text) return '';

  let html = text
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre style="background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;font-size:0.8rem;margin:8px 0"><code>${code.trim()}</code></pre>`;
  });

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f5f5f5;padding:1px 4px;border-radius:3px;font-size:0.8rem">$1</code>');

  // Bold (**...**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic (*...*)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists (- item)
  html = html.replace(/^- (.+)$/gm, '<li style="margin-left:16px">$1</li>');

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px">$1</li>');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
};

// Combined regex to match both [annotation:ID] and [frame:ID] markers
const ANY_MARKER_RE = /\[(annotation|frame):([a-f0-9]+)\]/gi;

/**
 * Inline annotation action links rendered inside a message.
 */
const InlineAnnotationLinks = ({ annotationId, annotation, onView, onSave }) => {
  const linkSx = {
    fontSize: '0.72rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.3,
    textDecoration: 'none',
    fontWeight: 600,
    '&:hover': { textDecoration: 'underline' },
  };

  // Annotation available with video URL
  if (annotation?.status === 'completed' && annotation.videoUrl) {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          gap: 1,
          mx: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: 'success.50',
          border: '1px solid',
          borderColor: 'success.200',
          verticalAlign: 'middle',
        }}
      >
        <Typography
          component="span"
          sx={{ ...linkSx, color: 'primary.main' }}
          onClick={() => onView?.(annotation.videoUrl)}
        >
          <PlayCircleOutlineIcon sx={{ fontSize: 14 }} />
          View
        </Typography>
        <Typography
          component="a"
          href={annotation.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          sx={{ ...linkSx, color: 'text.secondary' }}
        >
          <FileDownloadIcon sx={{ fontSize: 14 }} />
          Download
        </Typography>
        {onSave && (
          <Typography
            component="span"
            sx={{ ...linkSx, color: 'text.secondary' }}
            onClick={() => onSave(annotationId)}
          >
            <SaveAltIcon sx={{ fontSize: 14 }} />
            Save
          </Typography>
        )}
      </Box>
    );
  }

  // Annotation in progress or not available (e.g. historical message)
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        gap: 0.5,
        mx: 0.5,
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'grey.200',
        verticalAlign: 'middle',
        fontSize: '0.72rem',
        color: 'text.secondary',
      }}
    >
      <MovieIcon sx={{ fontSize: 14 }} />
      Annotated video
    </Box>
  );
};

/**
 * Inline frame image rendered inside a message.
 * Shows a clickable thumbnail that opens a full-resolution lightbox.
 */
const InlineFrameImage = ({ frameId, frame }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!frame || !frame.imageUrl || imgError) {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          gap: 0.5,
          mx: 0.5,
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          bgcolor: 'grey.200',
          verticalAlign: 'middle',
          fontSize: '0.72rem',
          color: 'text.secondary',
        }}
      >
        <BrokenImageIcon sx={{ fontSize: 14 }} />
        Frame image expired
      </Box>
    );
  }

  return (
    <>
      <Box
        component="span"
        sx={{ display: 'block', my: 1, cursor: 'pointer' }}
        onClick={() => setLightboxOpen(true)}
      >
        <Box
          component="img"
          src={frame.imageUrl}
          alt={frame.description || 'Vision frame'}
          onError={() => setImgError(true)}
          sx={{
            maxWidth: '100%',
            maxHeight: 200,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.85 },
          }}
        />
        {frame.description && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 0.25, color: 'text.secondary', fontSize: '0.7rem' }}
          >
            <ImageIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'text-bottom' }} />
            {frame.description}
          </Typography>
        )}
      </Box>

      {/* Full-resolution lightbox */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
          <Box
            component="img"
            src={frame.imageUrl}
            alt={frame.description || 'Vision frame'}
            onClick={() => setLightboxOpen(false)}
            sx={{
              maxWidth: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Renders assistant message content, replacing [annotation:ID] and [frame:ID] markers
 * with interactive components.
 */
const AssistantContent = ({ content, annotations, visionFrames, onAnnotationView, onAnnotationSave }) => {
  const contentStyles = {
    '& pre': { my: 1 },
    '& li': { listStyle: 'disc' },
    '& code': { fontFamily: 'monospace' },
    fontSize: '0.875rem',
    lineHeight: 1.6,
    wordBreak: 'break-word',
  };

  // Check if content has any markers
  if (!content || !ANY_MARKER_RE.test(content)) {
    return (
      <Box sx={contentStyles} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    );
  }

  // Split content on markers — produces groups of 3: text, type, id
  // e.g. "Hello [frame:abc123] world" → ["Hello ", "frame", "abc123", " world"]
  const parts = content.split(ANY_MARKER_RE);

  return (
    <Box sx={contentStyles}>
      {parts.map((part, i) => {
        const mod = i % 3;
        if (mod === 0) {
          // Text segment
          if (!part) return null;
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(part) }} />;
        }
        if (mod === 1) {
          // Marker type (annotation|frame) — skip, handled with next part
          return null;
        }
        // mod === 2: Marker ID
        const markerType = parts[i - 1]; // The type captured in previous group
        if (markerType === 'annotation') {
          const annotation = annotations?.find((a) => a.id === part);
          return (
            <InlineAnnotationLinks
              key={i}
              annotationId={part}
              annotation={annotation}
              onView={onAnnotationView}
              onSave={onAnnotationSave}
            />
          );
        }
        if (markerType === 'frame') {
          const frame = visionFrames?.find((f) => f.id === part);
          return <InlineFrameImage key={i} frameId={part} frame={frame} />;
        }
        return null;
      })}
    </Box>
  );
};

/**
 * Debug panel showing all vision frames sent to Gemini for a given turn.
 * Highlights which frames Peil referenced vs. unreferenced ones.
 */
const VisionDebugPanel = ({ turnIndex, visionFrames, visionDebugManifests, messageContent }) => {
  const [expanded, setExpanded] = useState(false);

  const turnFrames = visionFrames.filter((f) => f.turnIndex === turnIndex);
  if (turnFrames.length === 0) return null;

  const manifests = visionDebugManifests.filter((m) => m.turnIndex === turnIndex);

  const referencedIds = new Set();
  const markerMatches = messageContent?.matchAll(/\[frame:([a-f0-9]+)\]/gi) || [];
  for (const m of markerMatches) referencedIds.add(m[1]);

  return (
    <Box sx={{ mt: 1, border: '1px solid', borderColor: 'warning.main', borderRadius: 1, overflow: 'hidden' }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.75, cursor: 'pointer',
          bgcolor: 'rgba(255, 152, 0, 0.08)',
          '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.15)' },
        }}
      >
        <BugReportIcon sx={{ fontSize: 14, color: 'warning.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.dark' }}>
          Vision Debug: {turnFrames.length} frame{turnFrames.length !== 1 ? 's' : ''} sent to LLM
          {referencedIds.size > 0 && ` (${referencedIds.size} shown to user)`}
        </Typography>
        {expanded ? <ExpandLessIcon sx={{ fontSize: 14, ml: 'auto' }} /> : <ExpandMoreIcon sx={{ fontSize: 14, ml: 'auto' }} />}
      </Box>

      {expanded && (
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {turnFrames.map((frame) => {
              const isReferenced = referencedIds.has(frame.id);
              return (
                <Box key={frame.id} sx={{
                  position: 'relative',
                  border: '2px solid',
                  borderColor: isReferenced ? 'success.main' : 'grey.300',
                  borderRadius: 1,
                  opacity: isReferenced ? 1 : 0.6,
                  cursor: 'pointer',
                  '&:hover': { opacity: 1 },
                }}>
                  <img
                    src={frame.imageUrl}
                    alt={frame.description}
                    style={{ maxHeight: 100, maxWidth: 160, display: 'block' }}
                  />
                  <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    bgcolor: 'rgba(0,0,0,0.7)', px: 0.5, py: 0.25,
                  }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.65rem' }}>
                      {frame.toolName} | {frame.id.slice(0, 8)}...
                    </Typography>
                  </Box>
                  {isReferenced && (
                    <CheckCircleIcon sx={{
                      position: 'absolute', top: 2, right: 2,
                      fontSize: 16, color: 'success.main',
                      bgcolor: '#fff', borderRadius: '50%',
                    }} />
                  )}
                </Box>
              );
            })}
          </Box>

          {manifests.length > 0 && (
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, p: 1, mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Manifest (injected into FunctionResponse):
              </Typography>
              {manifests.map((m, i) => (
                <Typography key={i} variant="caption" component="pre" sx={{
                  fontFamily: 'monospace', fontSize: '0.7rem',
                  whiteSpace: 'pre-wrap', color: 'text.secondary',
                }}>
                  {m.manifest}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const MessageBubble = ({ message, annotations, visionFrames, visionDebug = false, visionDebugManifests = [], onAnnotationView, onAnnotationSave }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming && !message.content;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
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
      {/* Copy button — positioned before bubble for assistant, after for user */}
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
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'wizardPulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                  '@keyframes wizardPulse': {
                    '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                    '40%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              />
            ))}
          </Box>
        ) : isUser ? (
          <>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
            {message.attachments?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                {message.attachments.map((att) => (
                  <Chip
                    key={att.file_id}
                    icon={att.mime_type?.startsWith('image/') ? <ImageIcon sx={{ fontSize: 14 }} /> : <DescriptionIcon sx={{ fontSize: 14 }} />}
                    label={att.filename}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', borderColor: 'rgba(255,255,255,0.5)', color: 'inherit' }}
                  />
                ))}
              </Box>
            )}
          </>
        ) : (
          <AssistantContent
            content={message.content}
            annotations={annotations}
            visionFrames={visionFrames}
            onAnnotationView={onAnnotationView}
            onAnnotationSave={onAnnotationSave}
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
        {!isUser && visionDebug && message.turnIndex && (
          <VisionDebugPanel
            turnIndex={message.turnIndex}
            visionFrames={visionFrames}
            visionDebugManifests={visionDebugManifests}
            messageContent={message.content}
          />
        )}
      </Box>
      {/* Copy button for assistant messages */}
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

export default MessageBubble;
