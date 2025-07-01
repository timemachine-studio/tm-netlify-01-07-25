import { AI_PERSONAS } from '../config/constants';

export interface Message {
  id: number;
  content: string;
  isAI: boolean;
  hasAnimated?: boolean;
  thinking?: string;
  imageData?: string | string[]; // Add imageData field
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isChatMode: boolean;
}

export interface ChatActions {
  handleSendMessage: (message: string, imageData?: string) => Promise<void>;
  setChatMode: (isChatMode: boolean) => void;
}

export interface ChatInputProps {
  onSendMessage: (message: string, imageData?: string) => Promise<void>;
  isLoading?: boolean;
  currentPersona?: keyof typeof AI_PERSONAS;
}

export interface ShowHistoryProps {
  isChatMode: boolean;
  onToggle: () => void;
}

export interface MessageProps {
  content: string;
  isLoading?: boolean;
  hasAnimated?: boolean;
  onAnimationComplete?: () => void;
  thinking?: string;
  imageData?: string | string[];
}