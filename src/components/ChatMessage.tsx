import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  isAI: boolean;
}

export function ChatMessage({ content, isAI }: ChatMessageProps) {
  if (isAI) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[200px] p-8"
      >
        <div className="flex items-center gap-4">
          <Bot className="w-8 h-8 text-purple-600" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-bold text-center text-gray-800 leading-relaxed"
          >
            {content}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 px-4 py-2"
    >
      <User className="w-4 h-4 mt-1 text-gray-600" />
      <p className="text-sm text-gray-600">{content}</p>
    </motion.div>
  );
}
