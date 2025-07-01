import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Video, Music, FileCheck, Bot, Code, FileText, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const agents = [
  {
    id: 'image-generator',
    name: 'Image Generator',
    description: 'Create stunning images from text descriptions',
    icon: Image,
    comingSoon: true
  },
  {
    id: 'video-generator',
    name: 'Video Generator',
    description: 'Transform your ideas into engaging videos',
    icon: Video,
    comingSoon: true
  },
  {
    id: 'music-generator',
    name: 'Music Generator',
    description: 'Compose unique music and soundtracks',
    icon: Music,
    comingSoon: true
  },
  {
    id: 'proofreader',
    name: 'Proofreader',
    description: 'Perfect your writing with advanced proofreading',
    icon: FileCheck,
    comingSoon: true
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Get help with coding and development',
    icon: Code,
    comingSoon: true
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'Generate engaging content for any purpose',
    icon: FileText,
    comingSoon: true
  },
  {
    id: 'ai-trainer',
    name: 'AI Trainer',
    description: 'Train custom AI models for your needs',
    icon: Bot,
    comingSoon: true
  },
  {
    id: 'creative-assistant',
    name: 'Creative Assistant',
    description: 'Boost your creative projects with AI',
    icon: Sparkles,
    comingSoon: true
  }
];

export function AgentsModal({ isOpen, onClose }: AgentsModalProps) {
  const { theme } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 ${theme.modal.overlay} backdrop-blur-sm z-50`}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`fixed inset-0 flex items-center justify-center p-4 z-50`}
              >
                <div
                  className={`relative w-full max-w-4xl p-6 rounded-lg
                    ${theme.modal.background} ${theme.border}
                    backdrop-blur-xl border
                    ${theme.glow.secondary}`}
                >
                  <Dialog.Title className={`text-xl font-semibold mb-4 ${theme.text}`}>
                    Agents & Tools
                  </Dialog.Title>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto p-2">
                    {agents.map((agent) => (
                      <motion.button
                        key={agent.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-lg ${theme.card.background} ${theme.card.border} relative group transition-all duration-300`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-purple-500/10 ${theme.text}`}>
                            <agent.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className={`font-semibold ${theme.text}`}>{agent.name}</h3>
                            <p className={`text-sm mt-1 opacity-60 ${theme.text}`}>
                              {agent.description}
                            </p>
                          </div>
                        </div>
                        {agent.comingSoon && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500/10 rounded-full">
                            <span className="text-xs font-medium text-purple-400">Coming Soon</span>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className={`absolute top-4 right-4 p-1 rounded-full
                        ${theme.button.secondary} transition-colors`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}