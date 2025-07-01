import React, { useRef, useEffect, useState } from 'react';
import { ChatInput } from './components/chat/ChatInput';
import { BrandLogo } from './components/brand/BrandLogo';
import { LoadingContainer } from './components/loading/LoadingContainer';
import { MusicPlayer } from './components/music/MusicPlayer';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { AboutUsToast } from './components/about/AboutUsToast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ChatMode } from './components/chat/ChatMode';
import { StageMode } from './components/chat/StageMode';
import { RateLimitModal } from './components/modals/RateLimitModal';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { ACCESS_TOKEN_REQUIRED, MAINTENANCE_MODE } from './config/constants';

function AppContent() {
  const { 
    messages, 
    isChatMode, 
    isLoading, 
    currentPersona,
    currentEmotion,
    streamingMessageId,
    error,
    showAboutUs,
    showRateLimitModal,
    setChatMode, 
    handleSendMessage, 
    handlePersonaChange,
    startNewChat,
    markMessageAsAnimated,
    dismissAboutUs,
    dismissRateLimitModal,
    loadChat
  } = useChat();
  
  const { theme } = useTheme();
  const [isCenterStage, setIsCenterStage] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    // Check if access token is required and if user has already been granted access
    if (!ACCESS_TOKEN_REQUIRED) return false;
    const accessGranted = localStorage.getItem('timeMachine_accessGranted');
    return accessGranted !== 'true';
  });

  // Check for maintenance mode
  if (MAINTENANCE_MODE) {
    window.location.href = '/maintenance.html';
    return null;
  }

  useEffect(() => {
    const updateVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVH();
    window.addEventListener('resize', updateVH);
    return () => window.removeEventListener('resize', updateVH);
  }, []);

  const personaGlowColors = {
    default: 'rgba(139,0,255,0.7)',
    girlie: 'rgba(199,21,133,0.7)',
    pro: 'rgba(30,144,255,0.7)'
  };

  const personaBackgroundColors = {
    default: 'rgba(139,0,255,0.2)',
    girlie: 'rgba(199,21,133,0.2)',
    pro: 'rgba(30,144,255,0.2)'
  };

  const getButtonStyles = (isCenterStage: boolean, persona: string, theme: any) => ({
    border: isCenterStage 
      ? `1px solid ${persona === 'girlie' ? 'rgb(199,21,133)' : 'rgb(139,0,255)'}` 
      : 'none',
    bg: isCenterStage 
      ? (persona === 'girlie' ? 'rgba(199,21,133,0.3)' : 'rgba(139,0,255,0.3)') 
      : personaBackgroundColors[persona],
    shadow: isCenterStage 
      ? `0 0 20px ${persona === 'girlie' ? 'rgba(199,21,133,0.8)' : 'rgba(139,0,255,0.8)'}` 
      : 'none',
    text: isCenterStage 
      ? (persona === 'girlie' ? 'rgb(238,130,238)' : 'rgb(186,85,211)') 
      : theme.text,
  });

  const buttonStyles = getButtonStyles(isCenterStage, currentPersona, theme);

  const handleAccessGranted = () => {
    setShowWelcomeModal(false);
  };

  // Don't render main app content if welcome modal is showing
  if (showWelcomeModal) {
    return (
      <div className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden`}>
        <WelcomeModal
          isOpen={showWelcomeModal}
          onAccessGranted={handleAccessGranted}
        />
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${theme.background} ${theme.text} relative overflow-hidden`}
      style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <main className="relative h-screen flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-transparent">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <BrandLogo 
              currentPersona={currentPersona}
              onPersonaChange={handlePersonaChange}
              onLoadChat={loadChat}
              onStartNewChat={startNewChat}
            />
            <div className="flex items-center gap-2">
              {(currentPersona === 'default' || currentPersona === 'girlie') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCenterStage(!isCenterStage)}
                  style={{
                    background: buttonStyles.bg,
                    color: buttonStyles.text,
                    border: buttonStyles.border,
                    boxShadow: buttonStyles.shadow,
                    borderRadius: '9999px',
                    backdropFilter: 'blur(10px)',
                    outline: 'none',
                    borderWidth: '0px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label={isCenterStage ? "Disable Center Stage" : "Enable Center Stage"}
                >
                  <Star style={{ width: '16px', height: '16px', color: buttonStyles.text }} />
                  <span style={{ fontSize: '14px', color: buttonStyles.text }}>Center Stage</span>
                </motion.button>
              )}
            </div>
          </div>
        </header>

        <LoadingContainer isVisible={isLoading} />
        
        <MusicPlayer 
          currentPersona={currentPersona}
          currentEmotion={currentEmotion}
          isCenterStage={isCenterStage}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar message-container">
          {isChatMode ? (
            <ChatMode
              messages={messages}
              currentPersona={currentPersona}
              streamingMessageId={streamingMessageId}
              onMessageAnimated={markMessageAsAnimated}
              error={error}
            />
          ) : (
            <StageMode
              messages={messages}
              currentPersona={currentPersona}
              streamingMessageId={streamingMessageId}
              onMessageAnimated={markMessageAsAnimated}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent">
          <div className="max-w-4xl mx-auto">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading}
              currentPersona={currentPersona}
            />
          </div>
        </div>

        <AboutUsToast
          isVisible={showAboutUs}
          onClose={dismissAboutUs}
          onClick={() => window.open('https://timemachine.notion.site', '_blank')}
          currentPersona={currentPersona}
        />

        <RateLimitModal
          isOpen={showRateLimitModal}
          onClose={dismissRateLimitModal}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}