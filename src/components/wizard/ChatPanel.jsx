import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import MessageBubble from './MessageBubble';
import PeilWelcomeBanner from './PeilWelcomeBanner';
import FunctionCallIndicator from './FunctionCallIndicator';
import AnnotationCard from './AnnotationCard';

const ChatPanel = ({ messages, activeFunctionCalls, isThinking, isStreaming, annotations = [], visionFrames = [], visionDebug = false, visionDebugManifests = [], onAnnotationView, onAnnotationSave, sessionType }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeFunctionCalls, isThinking, isStreaming, annotations]);

  if (messages.length === 0 && annotations.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <PeilWelcomeBanner sessionType={sessionType} />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
      {messages.map((msg, index) => (
        <MessageBubble
          key={index}
          message={msg}
          annotations={annotations}
          visionFrames={visionFrames}
          visionDebug={visionDebug}
          visionDebugManifests={visionDebugManifests}
          onAnnotationView={onAnnotationView}
          onAnnotationSave={onAnnotationSave}
        />
      ))}
      {/* Show only the most recent annotation in the chat — older ones are in the list panel */}
      {annotations.length > 0 && (
        <AnnotationCard
          key={annotations[annotations.length - 1].id}
          annotation={annotations[annotations.length - 1]}
          onView={onAnnotationView}
          onSave={onAnnotationSave}
        />
      )}
      <FunctionCallIndicator activeCalls={activeFunctionCalls} isThinking={isThinking} />
      <div ref={scrollRef} />
    </Box>
  );
};

export default ChatPanel;
