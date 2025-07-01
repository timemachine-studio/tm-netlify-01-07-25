import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BETA_ACCESS_TOKEN } from '../../config/constants';

interface WelcomeModalProps {
  isOpen: boolean;
  onAccessGranted: () => void;
}

export function WelcomeModal({ isOpen, onAccessGranted }: WelcomeModalProps) {
  const { theme } = useTheme();
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');

    // Simulate validation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    if (accessToken.trim() === BETA_ACCESS_TOKEN) {
      // Store access token in localStorage for future sessions
      localStorage.setItem('timeMachine_accessGranted', 'true');
      onAccessGranted();
    } else {
      setError('Invalid access token. Please check your token and try again.');
    }
    
    setIsValidating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessToken(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
              >
                <div
                  className="relative w-full max-w-md p-8 rounded-3xl
                    bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-3xl
                    border border-white/20 shadow-[0_8px_32px_rgba(139,92,246,0.2)]
                    overflow-hidden"
                >
                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl"
                    />
                    <motion.div
                      animate={{
                        rotate: [360, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <Dialog.Title className={`text-3xl font-extrabold ${theme.text}
                        bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400
                        drop-shadow-[0_2px_4px_rgba(139,92,246,0.4)] tracking-tight`}>
                        TimeMachine
                      </Dialog.Title>
                      
                      <p className={`text-sm opacity-80 ${theme.text} leading-relaxed mt-2`}>
                        Welcome to the Future
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                          Access Token
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={accessToken}
                            onChange={handleInputChange}
                            placeholder="Enter your beta access token"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl
                              bg-white/10 backdrop-blur-md
                              border border-white/20 focus:border-purple-400/50
                              ${theme.text} placeholder-gray-400
                              focus:outline-none focus:ring-2 focus:ring-purple-400/20
                              transition-all duration-200`}
                            disabled={isValidating}
                            autoFocus
                          />
                        </div>
                        
                        <AnimatePresence>
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-red-400 text-sm mt-2 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!accessToken.trim() || isValidating}
                        className="w-full py-3 px-6 rounded-xl font-medium
                          bg-white/10 backdrop-blur-md
                          border border-white/20
                          hover:bg-white/20
                          disabled:bg-gray-600/10 disabled:border-gray-600/20
                          text-white transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                          shadow-lg hover:shadow-xl
                          flex items-center justify-center gap-2"
                      >
                        {isValidating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Clock className="w-5 h-5" />
                            </motion.div>
                            Validating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Enter TimeMachine
                          </>
                        )}
                      </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                      <p className={`text-xs opacity-60 ${theme.text}`}>
                        Beta Preview • TimeMachine Studios
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}
