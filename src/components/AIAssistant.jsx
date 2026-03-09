import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  CircularProgress,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Clear,
  Refresh,
  Lightbulb,
  TrendingUp,
  EmojiObjects,
  Psychology,
} from '@mui/icons-material';
import aiAssistantService from '../services/aiAssistantService';

const AIAssistant = ({ context = {} }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load suggested questions
    const suggestions = aiAssistantService.getSuggestedQuestions(context);
    setSuggestedQuestions(suggestions.slice(0, 8));

    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! 👋 I'm your AI coaching assistant. I can help you analyze player performance, identify team strengths and weaknesses, recommend training strategies, and answer questions about your data.\n\nWhat would you like to know?",
          timestamp: new Date(),
          type: 'greeting',
        },
      ]);
    }
  }, [context]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiAssistantService.processQuery(input, context);

      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        type: response.type,
        suggestions: response.suggestions,
        actionItems: response.actionItems,
        priority: response.priority,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update suggested questions if provided
      if (response.suggestions) {
        setSuggestedQuestions(response.suggestions);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        type: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. What would you like to know?",
        timestamp: new Date(),
        type: 'greeting',
      },
    ]);
    aiAssistantService.clearHistory();
  };

  const getMessageStyle = (role, type) => {
    if (role === 'user') {
      return {
        bgcolor: 'primary.main',
        color: 'white',
        ml: 'auto',
        maxWidth: '70%',
        borderRadius: '18px 18px 4px 18px',
      };
    }

    let bgcolor = 'grey.100';
    if (type === 'action_needed' || type === 'recommendation') {
      bgcolor = 'warning.50';
    } else if (type === 'insight') {
      bgcolor = 'info.50';
    } else if (type === 'data') {
      bgcolor = 'success.50';
    }

    return {
      bgcolor,
      color: 'text.primary',
      mr: 'auto',
      maxWidth: '80%',
      borderRadius: '18px 18px 18px 4px',
    };
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'action_needed':
      case 'recommendation':
        return <Lightbulb fontSize="small" color="warning" />;
      case 'insight':
        return <Psychology fontSize="small" color="info" />;
      case 'data':
        return <TrendingUp fontSize="small" color="success" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '800px' }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SmartToy />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  AI Coaching Assistant
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Powered by Claude AI • Ask me anything about your team
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Clear chat">
                <IconButton onClick={handleClearChat} size="small">
                  <Clear />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                }}
              >
                {message.role === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
              </Avatar>

              <Paper sx={{ ...getMessageStyle(message.role, message.type), p: 2 }}>
                {message.type && message.role === 'assistant' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getTypeIcon(message.type)}
                    <Chip
                      label={message.type.replace(/_/g, ' ')}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                    {message.priority && (
                      <Chip
                        label={message.priority}
                        size="small"
                        color={message.priority === 'HIGH' ? 'error' : 'warning'}
                      />
                    )}
                  </Box>
                )}

                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                    '& strong': { fontWeight: 700 },
                  }}
                >
                  {message.content}
                </Typography>

                {message.actionItems && message.actionItems.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight={600} gutterBottom display="block">
                      ✅ Action Items:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {message.actionItems.map((item, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={<Typography variant="caption">• {item}</Typography>}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>

            {/* Follow-up suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <Box
                sx={{
                  mt: 1,
                  ml: message.role === 'user' ? 'auto' : 5,
                  mr: message.role === 'user' ? 5 : 'auto',
                  maxWidth: '70%',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  💡 You might also want to ask:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {message.suggestions.map((suggestion, idx) => (
                    <Chip
                      key={idx}
                      label={suggestion}
                      size="small"
                      variant="outlined"
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        mb: 0.5,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              <SmartToy fontSize="small" />
            </Avatar>
            <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: '18px 18px 18px 4px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Suggested Questions (shown when no messages or after assistant response) */}
      {suggestedQuestions.length > 0 && !loading && (
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            <EmojiObjects sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
            Suggested questions:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {suggestedQuestions.map((question, index) => (
              <Chip
                key={index}
                label={question}
                size="small"
                onClick={() => handleSuggestionClick(question)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.light', color: 'white' },
                  mb: 0.5,
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask me anything about your team's performance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          sx={{
            minWidth: 56,
            height: 56,
            borderRadius: 3,
          }}
        >
          {loading ? <CircularProgress size={24} /> : <Send />}
        </Button>
      </Box>

      {/* Helper Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        💡 Tip: Be specific in your questions for better answers. Example: "How does Sarah compare to the team average?"
      </Typography>
    </Box>
  );
};

export default AIAssistant;
