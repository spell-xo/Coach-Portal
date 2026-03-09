import React, { useRef, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Divider
} from '@mui/material';
import MessageBubble from './MessageBubble';
import { format, isToday, isYesterday } from 'date-fns';

const MessageList = ({ messages, loading, currentUserId, onDeleteMessage }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatDateHeader = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMMM d, yyyy');
    }
  };

  const shouldShowDateHeader = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.sentAt).toDateString();
    const previousDate = new Date(previousMessage.sentAt).toDateString();

    return currentDate !== previousDate;
  };

  if (loading && messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No messages yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start the conversation!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {messages.map((message, index) => {
        const senderId = message.sender?._id?.toString();
        const userIdStr = currentUserId?.toString();
        const isOwnMsg = senderId === userIdStr;

        return (
          <React.Fragment key={message._id}>
            {shouldShowDateHeader(message, messages[index - 1]) && (
              <Box sx={{ my: 2 }}>
                <Divider>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateHeader(message.sentAt)}
                  </Typography>
                </Divider>
              </Box>
            )}

            <MessageBubble
              message={message}
              isOwnMessage={isOwnMsg}
              onDelete={onDeleteMessage}
            />
          </React.Fragment>
        );
      })}

      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
