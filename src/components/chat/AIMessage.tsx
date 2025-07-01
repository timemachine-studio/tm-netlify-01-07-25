import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { MessageProps } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';
import { Brain } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { GeneratedImage } from './GeneratedImage';
import { AnimatedShinyText } from '../ui/AnimatedShinyText';

interface AIMessageProps extends MessageProps {
  isChatMode: boolean;
  messageId: number;
  onAnimationComplete: (messageId: number) => void;
  currentPersona?: keyof typeof AI_PERSONAS;
  isStreaming?: boolean;
  previousMessage?: string | null;
}

const getPersonaColor = (persona: keyof typeof AI_PERSONAS = 'default') => {
  switch (persona) {
    case 'girlie':
      return 'text-pink-400';
    case 'pro':
      return 'text-cyan-400';
    default:
      return 'text-purple-400';
  }
};

const getPersonaShimmerColors = (persona: keyof typeof AI_PERSONAS = 'default') => {
  switch (persona) {
    case 'girlie':
      return { baseColor: '#ec4899', shimmerColor: '#ffffff' }; // Pink base with white shimmer
    case 'pro':
      return { baseColor: '#06b6d4', shimmerColor: '#ffffff' }; // Cyan base with white shimmer
    default:
      return { baseColor: '#a855f7', shimmerColor: '#ffffff' }; // Purple base with white shimmer
  }
};

const extractMentionedPersona = (message: string | null): keyof typeof AI_PERSONAS | null => {
  if (!message) return null;
  const match = message.match(/^@(girlie|pro)\s/);
  return match ? match[1] as keyof typeof AI_PERSONAS : null;
};

export function AIMessage({ 
  content, 
  thinking,
  isChatMode, 
  messageId, 
  hasAnimated, 
  onAnimationComplete, 
  currentPersona = 'default',
  isStreaming = false,
  previousMessage = null
}: AIMessageProps) {
  const [showThinking, setShowThinking] = useState(false);
  const [displayContent, setDisplayContent] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isWritingImageLink, setIsWritingImageLink] = useState(false);
  const mentionedPersona = extractMentionedPersona(previousMessage);
  const displayPersona = mentionedPersona || currentPersona;
  const personaColor = getPersonaColor(displayPersona);
  const shimmerColors = getPersonaShimmerColors(displayPersona);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (isStreaming && currentPersona === 'pro' && thinking) {
      setShowThinking(true);
    }
  }, [isStreaming, currentPersona, thinking]);

  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, thinking, isStreaming]);

  // Handle image generation detection and hiding
  useEffect(() => {
    // Check if we're in the middle of writing an image link
    if (content.includes('![Image](https://image.pollinations.ai/') && !content.includes('?width=')) {
      setIsWritingImageLink(true);
      setIsGeneratingImage(false);
      setDisplayContent('');
      return;
    }

    // Check if we have a complete image link
    if (content.includes('![Image](https://image.pollinations.ai/')) {
      const imageRegex = /!\[Image\]\(https:\/\/image\.pollinations\.ai\/prompt\/[^)]+\)/g;
      const matches = content.match(imageRegex);
      
      if (matches) {
        // Complete image markdown found, show generating state briefly then show content
        setIsWritingImageLink(false);
        setIsGeneratingImage(true);
        setTimeout(() => {
          setIsGeneratingImage(false);
          setDisplayContent(content);
        }, 1500);
      } else if (content.includes('![Image](https://image.pollinations.ai/')) {
        // Incomplete image markdown, hide it
        const beforeImage = content.split('![Image](https://image.pollinations.ai/')[0];
        setDisplayContent(beforeImage);
        setIsGeneratingImage(true);
        setIsWritingImageLink(false);
      } else {
        setDisplayContent(content);
        setIsGeneratingImage(false);
        setIsWritingImageLink(false);
      }
    } else {
      setDisplayContent(content);
      setIsGeneratingImage(false);
      setIsWritingImageLink(false);
    }
  }, [content]);

  const MarkdownComponents = {
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className={`text-2xl font-bold mt-6 mb-4 ${theme.text}`}>{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className={`text-xl font-bold mt-5 mb-3 ${theme.text}`}>{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className={`text-lg font-bold mt-4 mb-2 ${theme.text}`}>{children}</h3>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className={`mb-4 leading-relaxed ${theme.text}`}>{children}</p>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className={`font-bold ${personaColor}`}>{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className={`italic opacity-80 ${theme.text}`}>{children}</em>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc ml-4 mb-4 space-y-2">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal ml-4 mb-4 space-y-2">{children}</ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className={`leading-relaxed ${theme.text}`}>{children}</li>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className={`border-l-4 border-purple-500/50 pl-4 my-4 italic opacity-70 ${theme.text}`}>
        {children}
      </blockquote>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className={`bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono ${theme.text}`}>
        {children}
      </code>
    ),
    pre: ({ children }: { children: React.ReactNode }) => (
      <pre className={`bg-white/10 rounded-lg p-4 mb-4 overflow-x-auto font-mono text-sm ${theme.text}`}>
        {children}
      </pre>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      // Check if this is a Pollinations.ai generated image
      if (src && src.includes('image.pollinations.ai')) {
        return <GeneratedImage src={src} alt={alt || 'Generated image'} />;
      }
      
      // Fallback to regular image for other sources
      return (
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full h-auto rounded-xl my-4"
          loading="lazy"
        />
      );
    },
  };

  const MessageContent = () => (
    <>
      {thinking && currentPersona === 'pro' && (
        <div className="w-full max-w-4xl mx-auto mb-6">
          <motion.button
            onClick={() => !isStreaming && setShowThinking(!showThinking)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r from-cyan-600/20 to-blue-600/20
              backdrop-blur-xl border border-cyan-500/20
              shadow-[0_0_15px_rgba(34,211,238,0.3)]
              hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]
              transition-all duration-300
              mx-auto
              relative
              group
              animate-border-glow
              ${isStreaming ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="relative z-10 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className={`text-sm ${theme.text}`}>Thinking Process</span>
            </div>
          </motion.button>

          <AnimatePresence>
            {showThinking && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-4
                  bg-gradient-to-r from-cyan-950/90 to-blue-950/90
                  backdrop-blur-xl rounded-lg border border-cyan-500/20
                  shadow-[0_0_30px_rgba(34,211,238,0.2)]"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={MarkdownComponents}
                  className={`text-sm ${theme.text}`}
                >
                  {thinking}
                </ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Writing image link state */}
      {isWritingImageLink && (
        <div className="w-full max-w-2xl mx-auto my-4">
          <div className="flex items-center justify-center py-4 px-4 rounded-2xl bg-black/5 backdrop-blur-sm">
            <AnimatedShinyText
              text="Writing Image Prompt"
              useShimmer={true}
              baseColor={shimmerColors.baseColor}
              shimmerColor={shimmerColors.shimmerColor}
              gradientAnimationDuration={2}
              textClassName="text-base"
              className="py-1"
              style={{ 
                fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '16px'
              }}
            />
          </div>
        </div>
      )}

      {/* Generating image state */}
      {isGeneratingImage && !isWritingImageLink && (
        <div className="w-full max-w-2xl mx-auto my-4">
          <div className="flex items-center justify-center py-4 px-4 rounded-2xl bg-black/5 backdrop-blur-sm">
            <AnimatedShinyText
              text="Generating Image"
              useShimmer={true}
              baseColor={shimmerColors.baseColor}
              shimmerColor={shimmerColors.shimmerColor}
              gradientAnimationDuration={2}
              textClassName="text-base"
              className="py-1"
              style={{ 
                fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '16px'
              }}
            />
          </div>
        </div>
      )}

      {/* Show content only when not generating or when generation is complete */}
      {!isGeneratingImage && !isWritingImageLink && displayContent && (
        <>
          {isChatMode ? (
            <div className="flex flex-col gap-1">
              <div className={`text-xs font-medium ${personaColor} opacity-60`}>
                {AI_PERSONAS[displayPersona].name}
              </div>
              <div className={`${theme.text} text-base leading-relaxed max-w-[85%]`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={MarkdownComponents}
                  className="prose prose-invert prose-sm max-w-none"
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className={`${theme.text} ${
              isChatMode 
                ? 'text-base sm:text-lg' 
                : 'text-xl sm:text-2xl md:text-3xl'
            } w-full max-w-4xl mx-auto text-center`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={MarkdownComponents}
                className="prose prose-invert max-w-none"
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}
        </>
      )}
      <div ref={contentEndRef} />
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onAnimationComplete={() => !hasAnimated && onAnimationComplete(messageId)}
      className={`w-full`}
    >
      <MessageContent />
    </motion.div>
  );
}