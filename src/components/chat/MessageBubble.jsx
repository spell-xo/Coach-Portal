import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import BuildIcon from '@mui/icons-material/Build';
import { format } from 'date-fns';

const MessageBubble = ({ message, isOwnMessage, onDelete }) => {
  const formatTime = (date) => {
    try {
      return format(new Date(date), 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 1,
        alignItems: 'flex-end',
        gap: 1
      }}
    >
      {!isOwnMessage && (
        <Avatar
          src={message.sender?.profilePicture}
          sx={{ width: 32, height: 32 }}
        >
          {message.sender?.name?.charAt(0)}
        </Avatar>
      )}

      <Box sx={{ maxWidth: isOwnMessage ? '75%' : '75%' }}>
        {!isOwnMessage && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {message.sender?.name}
            </Typography>
            {message.isPlatformAdmin && (
              <Tooltip title={`Platform Admin: ${message.platformAdminEmail || 'Administrator'}`}>
                <Chip
                  icon={<BuildIcon sx={{ fontSize: '0.75rem' }} />}
                  label="Admin"
                  size="small"
                  color="warning"
                  sx={{
                    height: '18px',
                    fontSize: '0.65rem',
                    '& .MuiChip-label': {
                      px: 0.5
                    },
                    '& .MuiChip-icon': {
                      ml: 0.5,
                      mr: -0.25
                    }
                  }}
                />
              </Tooltip>
            )}
          </Box>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            backgroundColor: isOwnMessage ? '#24FF00' : '#F5F5F5',
            borderRadius: '12px',
            position: 'relative',
            borderTopRightRadius: isOwnMessage ? '4px' : '12px',
            borderTopLeftRadius: !isOwnMessage ? '4px' : '12px',
            '&:hover .delete-btn': {
              opacity: 1
            }
          }}
        >
          {message.replyTo && (
            <Box
              sx={{
                borderLeft: 3,
                borderColor: isOwnMessage ? 'rgba(255,255,255,0.3)' : 'primary.main',
                pl: 1,
                mb: 1,
                opacity: 0.7
              }}
            >
              <Typography variant="caption">
                {message.replyTo.sender?.name}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {message.replyTo.content}
              </Typography>
            </Box>
          )}

          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              color: isOwnMessage ? '#FFFFFF' : '#2C2C2C',
              fontSize: '16px',
              lineHeight: 1.5
            }}
          >
            {message.content?.text || message.content}
          </Typography>

          {message.sharedDrill && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'action.hover'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Shared Drill: {message.sharedDrill.drillName}
              </Typography>
              {message.sharedDrill.score && (
                <Typography variant="caption" display="block">
                  Score: {message.sharedDrill.score}
                </Typography>
              )}
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 0.5
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                opacity: 0.7,
                color: isOwnMessage ? '#FFFFFF' : 'text.secondary'
              }}
            >
              {formatTime(message.sentAt)}
            </Typography>

            {isOwnMessage && onDelete && (
              <IconButton
                className="delete-btn"
                size="small"
                onClick={() => onDelete(message._id)}
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'inherit'
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            )}
          </Box>

          {message.reactions && message.reactions.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                mt: 0.5,
                flexWrap: 'wrap'
              }}
            >
              {message.reactions.map((reaction, index) => (
                <Tooltip key={index} title={reaction.userId}>
                  <span style={{ fontSize: '1.2rem' }}>{reaction.emoji}</span>
                </Tooltip>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {isOwnMessage && (
        <Avatar
          src={message.sender?.profilePicture}
          sx={{ width: 32, height: 32 }}
        >
          {message.sender?.name?.charAt(0)}
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;
