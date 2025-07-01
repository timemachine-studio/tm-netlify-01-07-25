import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Message } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  persona: keyof typeof AI_PERSONAS;
  createdAt: string;
  lastModified: string;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadChat: (session: ChatSession) => void;
}

export function ChatHistoryModal({ isOpen, onClose, onLoadChat }: ChatHistoryModalProps) {
  const { theme } = useTheme();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof AI_PERSONAS>('default');
  const personaKeys = Object.keys(AI_PERSONAS) as (keyof typeof AI_PERSONAS)[];

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = () => {
    try {
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      setChatSessions(sessions.sort((a: ChatSession, b: ChatSession) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      ));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setChatSessions([]);
    }
  };

  const handleRename = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setEditingId(sessionId);
      setEditingName(session.name);
    }
  };

  const handleSaveRename = () => {
    if (!editingId || !editingName.trim()) return;

    try {
      const updatedSessions = chatSessions.map(session =>
        session.id === editingId
          ? { ...session, name: editingName.trim(), lastModified: new Date().toISOString() }
          : session
      );

      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
      setChatSessions(updatedSessions);
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename chat session:', error);
    }
  };

  const handleDelete = (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    try {
      const updatedSessions = chatSessions.filter(session => session.id !== sessionId);
      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
      setChatSessions(updatedSessions);
    } catch (error) {
      console.error('Failed to delete chat session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLoadChat = (session: ChatSession) => {
    onLoadChat(session);
    onClose();
  };

  const handlePersonaChange = (direction: 'next' | 'prev') => {
    const currentIndex = personaKeys.indexOf(selectedPersona);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % personaKeys.length
      : (currentIndex - 1 + personaKeys.length) % personaKeys.length;
    setSelectedPersona(personaKeys[newIndex]);
  };

  const filteredSessions = chatSessions.filter(session => session.persona === selectedPersona);

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
                className={`fixed inset-0 ${theme.modal.overlay} backdrop-blur-xl z-50`}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 flex items-center justify-center p-4 sm:p-6 z-50"
              >
                <div
                  className={`relative w-full sm:w-[90vw] md:w-[700px] h-full sm:h-auto sm:max-h-[85vh] p-6 sm:p-10 rounded-none sm:rounded-2xl
                    bg-gradient-to-b from-white/3 to-white/1 backdrop-blur-3xl bg-opacity-5
                    border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.1)]`}
                  style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                >
                  <Dialog.Title className={`text-2xl font-bold mb-6 text-white tracking-tight`}>
                    Chat History
                  </Dialog.Title>

                  <Tabs.Root
                    value={selectedPersona}
                    onValueChange={(value) => setSelectedPersona(value as keyof typeof AI_PERSONAS)}
                  >
                    <Tabs.List className="mb-6">
                      <div className="sm:hidden flex items-center justify-between">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePersonaChange('prev')}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-200" />
                        </motion.button>
                        <motion.div
                          key={selectedPersona}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: 'easeInOut' }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium
                            border border-transparent bg-clip-padding
                            shadow-[0_0_10px_rgba(139,92,246,0.4),0_0_20px_rgba(139,92,246,0.2)]"
                        >
                          {AI_PERSONAS[selectedPersona].name}
                        </motion.div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePersonaChange('next')}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-200" />
                        </motion.button>
                      </div>
                      <div className="hidden sm:flex space-x-2 overflow-x-auto">
                        {Object.entries(AI_PERSONAS).map(([key, persona]) => (
                          <Tabs.Trigger
                            key={key}
                            value={key}
                            className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium whitespace-nowrap
                              ${selectedPersona === key
                                ? `bg-gradient-to-r from-purple-500 to-indigo-500 text-white
                                   border border-transparent bg-clip-padding
                                   shadow-[0_0_10px_rgba(139,92,246,0.4),0_0_20px_rgba(139,92,246,0.2)]`
                                : `bg-white/5 hover:bg-white/10 text-gray-200`
                              }`}
                          >
                            {persona.name}
                          </Tabs.Trigger>
                        ))}
                      </div>
                    </Tabs.List>

                    <motion.div
                      key={selectedPersona}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="max-h-[calc(100vh-14rem)] sm:max-h-[65vh] overflow-y-auto space-y-3"
                    >
                      {filteredSessions.length === 0 ? (
                        <div className={`text-center py-12 text-white opacity-70 text-lg font-light`}>
                          No chats found for {AI_PERSONAS[selectedPersona].name}
                        </div>
                      ) : (
                        filteredSessions.map(session => (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`p-4 rounded-xl bg-white/5 border border-white/10
                              transition-all duration-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-purple-500/10
                              cursor-pointer shadow-sm hover:shadow-lg`}
                            onClick={() => handleLoadChat(session)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {editingId === session.id ? (
                                  <div className="flex flex-col gap-2">
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                                      className={`w-full px-4 py-2 rounded-lg bg-white/10 text-white
                                        border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400
                                        text-sm font-medium`}
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveRename();
                                      }}
                                      className={`px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white
                                        text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 self-start`}
                                    >
                                      Save
                                    </motion.button>
                                  </div>
                                ) : (
                                  <>
                                    <h3 className={`font-semibold text-white truncate text-lg tracking-tight`}>
                                      {session.name || 'Untitled Chat'}
                                    </h3>
                                    <p className={`text-sm text-gray-300 opacity-70 font-light mt-1`}>
                                      Last modified: {formatDate(session.lastModified)}
                                    </p>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRename(session.id);
                                  }}
                                  className={`p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200`}
                                  title="Rename"
                                >
                                  <Pencil className="w-5 h-5 text-gray-200" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(session.id);
                                  }}
                                  className={`p-2 rounded-full bg-white/10 hover:bg-red-500/30 transition-all duration-200`}
                                  title="Delete"
                                >
                                  <Trash2 className="w-5 h-5 text-gray-200" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  </Tabs.Root>

                  <Dialog.Close asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200`}
                    >
                      <X className="w-5 h-5 text-gray-200" />
                    </motion.button>
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