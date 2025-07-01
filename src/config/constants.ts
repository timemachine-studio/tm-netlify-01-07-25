// App Configuration
export const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
export const ACCESS_TOKEN_REQUIRED = import.meta.env.VITE_ACCESS_TOKEN_REQUIRED === 'true';
export const BETA_ACCESS_TOKEN = import.meta.env.VITE_BETA_ACCESS_TOKEN || 'TIMEMACHINE_BETA_2025';

// Rate Limits (for display purposes only - actual limits enforced server-side)
export const PERSONA_LIMITS = {
  default: parseInt(import.meta.env.VITE_DEFAULT_PERSONA_LIMIT) || 10,
  girlie: parseInt(import.meta.env.VITE_GIRLIE_PERSONA_LIMIT) || 10,
  pro: parseInt(import.meta.env.VITE_PRO_PERSONA_LIMIT) || 3
};

// Client-side AI Personas (for UI display only - actual prompts are server-side)
export const AI_PERSONAS = {
  default: {
    name: 'TimeMachine',
    initialMessage: "Hey there! I'm TimeMachine, from future.",
  },
  girlie: {
    name: 'TimeMachine Girlie',
    initialMessage: "Hiee✨ I'm TimeMachine Girlie, from future~",
  },
  pro: {
    name: 'TimeMachine PRO',
    initialMessage: "It's TimeMachine PRO, from future. Let's cure cancer.",
  }
};

// Animation constants
export const ANIMATION_CONFIG = {
  WORD_STAGGER: 0.12,
  WORD_DELAY: 0.04,
  SPRING_DAMPING: 12,
  SPRING_STIFFNESS: 100,
  FADE_DURATION: 0.6
} as const;

// Loading animation words with enhanced colors
export const LOADING_WORDS = [
  { text: 'Time', color: 'text-yellow-400' },
  { text: 'Future', color: 'text-purple-400' },
  { text: 'Magic', color: 'text-green-400' },
  { text: 'AGI', color: 'text-cyan-400' }
] as const;

export const INITIAL_MESSAGE = {
  id: 1,
  content: AI_PERSONAS.default.initialMessage,
  isAI: true,
};