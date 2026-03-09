import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper
} from '@mui/material';
import { Send, AttachFile, EmojiEmotions } from '@mui/icons-material';

const MessageInput = ({ onSend, disabled = false, placeholder = 'Type a message...' }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend({ content: message.trim(), messageType: 'text' });
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        backgroundColor: 'background.paper'
      }}
    >
      <IconButton size="small" color="primary" disabled={disabled}>
        <AttachFile />
      </IconButton>

      <IconButton size="small" color="primary" disabled={disabled}>
        <EmojiEmotions />
      </IconButton>

      <TextField
        inputRef={inputRef}
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3
          }
        }}
      />

      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {
            backgroundColor: 'primary.dark'
          },
          '&:disabled': {
            backgroundColor: 'action.disabledBackground'
          }
        }}
      >
        <Send />
      </IconButton>
    </Paper>
  );
};

export default MessageInput;
