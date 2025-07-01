import React from 'react';
import { ChatMessage } from './ChatMessage';
import { Message } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';

interface StageModeProps {
  messages: Message[];
  currentPersona: keyof typeof AI_PERSONAS;
  streamingMessageId: number | null;
  onMessageAnimated: (messageId: number) => void;
}

export function StageMode({ 
  messages, 
  currentPersona, 
  streamingMessageId,
  onMessageAnimated 
}: StageModeProps) {
  const { theme } = useTheme();
  const lastMessage = messages[messages.length - 1];
  const isShortMessage = lastMessage?.content.length < 350 && !lastMessage?.content.includes('\n');

  return (
    <div className={`min-h-full pt-16 pb-48flush ${theme.text}`}>
      <div className="h-[calc(100vh-16rem)] flex items-center justify-center">
        <div className="transform translate-y-8">
          <ChatMessage 
            {...lastMessage}
            isChatMode={false}
            onAnimationComplete={onMessageAnimated}
            currentPersona={currentPersona}
            isStreaming={lastMessage.id === streamingMessageId}
          />
        </div>
      </div>
    </div>
  );
}