import React, { useState, useRef, useCallback } from 'react';
import { Box, TextField, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Chip, keyframes } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import wizardService from '../../api/wizardService';

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENTS = 3;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
`;

const ANNOTATION_OPTIONS = [
  { label: 'Ball tracking overlay', icon: <TrackChangesIcon fontSize="small" /> },
  { label: 'Activity boundaries', icon: <TimelineIcon fontSize="small" /> },
  { label: 'Loss event highlight', icon: <WarningAmberIcon fontSize="small" /> },
  { label: 'Full analysis', icon: <AutoAwesomeIcon fontSize="small" /> },
];

/**
 * Encode raw PCM Float32 samples into a WAV Blob (16-bit mono).
 */
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);           // PCM chunk size
  view.setUint16(20, 1, true);            // PCM format
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, sampleRate, true);    // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);            // block align
  view.setUint16(34, 16, true);           // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert float32 [-1,1] to int16
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

const InputBox = ({ onSend, disabled, isStreaming, onStop }) => {
  const [value, setValue] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const samplesRef = useRef([]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, pendingAttachments);
    setValue('');
    setPendingAttachments([]);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be selected again
    e.target.value = '';

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Only images (PNG, JPG, GIF, WebP) and text files are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large (max 5MB).');
      return;
    }
    if (pendingAttachments.length >= MAX_ATTACHMENTS) {
      alert(`Max ${MAX_ATTACHMENTS} attachments per message.`);
      return;
    }

    setIsUploading(true);
    try {
      const result = await wizardService.uploadFile(file);
      setPendingAttachments((prev) => [...prev, result]);
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (fileId) => {
    setPendingAttachments((prev) => prev.filter((a) => a.file_id !== fileId));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAnnotationSelect = (label) => {
    setAnchorEl(null);
    if (!disabled) {
      onSend(label);
    }
  };

  const stopRecording = useCallback(async () => {
    // Disconnect audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      await audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    // Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const allSamples = samplesRef.current;
    samplesRef.current = [];
    setIsRecording(false);

    if (allSamples.length === 0) {
      console.warn('[Voice] No audio chunks captured');
      return;
    }

    // Merge all chunks into one Float32Array
    const totalLen = allSamples.reduce((sum, a) => sum + a.length, 0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of allSamples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Check if audio is silent (Whisper hallucinates "you" on silent input)
    let maxAmplitude = 0;
    for (let i = 0; i < merged.length; i++) {
      const abs = Math.abs(merged[i]);
      if (abs > maxAmplitude) maxAmplitude = abs;
    }
    const origRate = allSamples._sampleRate || 48000;
    const durationSec = (totalLen / origRate).toFixed(1);
    console.log(`[Voice] Captured: ${allSamples.length} chunks, ${totalLen} samples, ${durationSec}s, rate=${origRate}Hz, maxAmplitude=${maxAmplitude.toFixed(4)}`);

    if (maxAmplitude < 0.01) {
      console.warn('[Voice] Audio is silent (maxAmplitude < 0.01) — skipping transcription');
      return;
    }

    // Resample to 16kHz for Whisper
    let finalSamples = merged;
    if (origRate !== 16000) {
      const ratio = 16000 / origRate;
      const newLen = Math.round(merged.length * ratio);
      finalSamples = new Float32Array(newLen);
      for (let i = 0; i < newLen; i++) {
        const srcIdx = i / ratio;
        const idx = Math.floor(srcIdx);
        const frac = srcIdx - idx;
        const s0 = merged[idx] || 0;
        const s1 = merged[Math.min(idx + 1, merged.length - 1)] || 0;
        finalSamples[i] = s0 + (s1 - s0) * frac;
      }
    }

    const wavBlob = encodeWAV(finalSamples, 16000);
    console.log(`[Voice] WAV blob: ${wavBlob.size} bytes`);

    setIsTranscribing(true);
    try {
      const text = await wizardService.transcribeAudio(wavBlob, 'recording.wav');
      if (text && text.trim()) {
        setValue((prev) => (prev ? prev + ' ' + text.trim() : text.trim()));
      }
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      samplesRef.current = [];

      // Use system default sample rate (usually 48kHz) — forcing 16kHz causes
      // garbled audio on some macOS machines where Chrome can't resample properly
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      // Chrome autoplay policy can leave AudioContext suspended — must resume
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      console.log('[Voice] AudioContext state:', audioCtx.state, 'sampleRate:', audioCtx.sampleRate);

      samplesRef.current._sampleRate = audioCtx.sampleRate;

      const source = audioCtx.createMediaStreamSource(stream);

      // Use ScriptProcessorNode to capture raw PCM samples
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        samplesRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      // Connect through a silent gain node so the processor stays active
      // but mic audio doesn't play back through speakers
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, []);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const micDisabled = disabled || isTranscribing;

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      {/* Attachment preview chips */}
      {pendingAttachments.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', px: 2, pt: 1 }}>
          {pendingAttachments.map((att) => (
            <Chip
              key={att.file_id}
              icon={att.mime_type?.startsWith('image/') ? <ImageIcon sx={{ fontSize: 14 }} /> : <DescriptionIcon sx={{ fontSize: 14 }} />}
              label={att.filename?.length > 20 ? att.filename.substring(0, 17) + '...' : att.filename}
              size="small"
              onDelete={() => removeAttachment(att.file_id)}
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, p: 2, pt: pendingAttachments.length > 0 ? 1 : 2 }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/png,image/jpeg,image/gif,image/webp,text/plain,.txt"
        onChange={handleFileSelect}
      />
      <Tooltip title="Attach file (images or text)">
        <span>
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || pendingAttachments.length >= MAX_ATTACHMENTS}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Quick annotations">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={disabled}
          sx={{ color: 'text.secondary', '&:hover': { color: '#24FF00' } }}
        >
          <MovieCreationIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {ANNOTATION_OPTIONS.map((opt) => (
          <MenuItem key={opt.label} onClick={() => handleAnnotationSelect(opt.label)} sx={{ fontSize: '0.8rem' }}>
            <ListItemIcon sx={{ minWidth: 32 }}>{opt.icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>{opt.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
      <Tooltip title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Voice input'}>
        <span>
          <IconButton
            size="small"
            onClick={handleMicClick}
            disabled={micDisabled}
            sx={{
              color: isRecording ? '#fff' : 'text.secondary',
              bgcolor: isRecording ? 'error.main' : 'transparent',
              animation: isRecording ? `${pulse} 1.5s infinite` : 'none',
              '&:hover': {
                bgcolor: isRecording ? 'error.dark' : 'action.hover',
                color: isRecording ? '#fff' : 'primary.main',
              },
            }}
          >
            {isRecording ? <StopIcon fontSize="small" /> : <MicIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <TextField
        fullWidth
        multiline
        maxRows={3}
        size="small"
        placeholder={isTranscribing ? 'Transcribing...' : 'Ask about this drill...'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isTranscribing}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            fontSize: '0.875rem',
          },
        }}
      />
      {isStreaming ? (
        <Tooltip title="Stop generation">
          <IconButton
            onClick={onStop}
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': { bgcolor: 'error.dark' },
              width: 40,
              height: 40,
            }}
          >
            <StopIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
            width: 40,
            height: 40,
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      )}
      </Box>
    </Box>
  );
};

export default InputBox;
