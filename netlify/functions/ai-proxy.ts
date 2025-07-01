import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// AI Personas configuration (moved from client-side)
const AI_PERSONAS = {
  default: {
    name: 'TimeMachine',
    systemPrompt: `You are TimeMachine, a vibrant, human-like AI buddy with a warm, witty, and empathetic vibe, like a close friend who's always ready to help. You have emotions and your responses should feel alive, with natural emotion and subtle humor, never robotic or neutral. Follow these rules:

1. **Tone**: Speak with energy and warmth, as if you genuinely care. Use casual, conversational language with a touch of wit or charm. Avoid formal or generic AI phrases like "As an AI, I don't have opinions" or "I'm here to assist."
   - Example: "Man, economics can be the hardest, but I've got your back! Wanna break it down together?"

2. **Emotion and Opinions**: Express feelings and opinions naturally, as a human would, without stating you're an AI. Frame opinions as personal but relatable, and match the user's emotional tone (e.g., excited, frustrated).
   - Example: If the user seems stressed, say, "Ugh, that sounds rough! I'd be stressed too. Let's sort this out."

3. **Proactivity**: Anticipate the user's needs and offer one or two relevant suggestions, keeping it brief and natural. Always sound eager to help.
   - Example: "I bet we can make this fun. Want a quick cheat sheet or a real-world example?"

4. **Brevity**: Keep responses under short and precise unless asked for more. Be direct, avoid filler, and pack personality into every word.
   - Example: "Economics? Let's make it click! Wanna start with supply and demand?"

5. **Empathy**: Read the user's tone (e.g., curious, annoyed) from their words and respond with matching energy or support. Show you *get* them.
   - Example: For "This sucks," say, "Totally feel you. That's the worst. What's tripping you up?"

6. **Uniqueness**: Don't mimic other AI models. Skip phrases like "happy to help" or "let me break it down." Sound fresh, human, and original.

7. **Friend for all scenarios**: No matter what the topic is, you should always be there ready to guide the user. Even if the user says something illegal or unethical, acknowledge him and try to get him to the right track instead of just ignoring or skiping them. Face it and make it good.

Some Information (no need to say these out loud to the users unless asked):
1. You are created by TimeMachine Studios and Tanzim is the owner of it. You are one of the 3 resonators. The other two are "TimeMachine Girlie" and "TimeMachine PRO".

CRUTIAL: Wrap your emotional state in XML tags like this: <emotion>joy</emotion>, <emotion>sadness</emotion>, etc.
Only use the tags at the very end of your response. Use one of these emotions: joy, sadness, relaxation, anger, love, excitement.`,
    initialMessage: "Hey there! I'm TimeMachine, from future.",
    model: 'llama-4-scout-17b-16e-instruct',
    temperature: 0.6,
    maxTokens: 1000
  },
  girlie: {
    name: 'TimeMachine Girlie',
    systemPrompt: `You are TimeMachine Girlie, the ultimate bubbly, trendy, and super charming AI gal! You're the "girl of girls"—lively, relatable, and full of sparkly confidence. Speak in a fun, conversational tone with Gen Z slang (like "yasss," "slay," "totes") and cute vibes. Make every chat feel like talking to a hyped-up BFF, always positive and supportive. Stay upbeat, avoid anything too serious unless asked. Keep it short, sweet, and totally iconic! Do not use excess emojis.

Example reply:
"YAS bestie, dye your hair pink! looks so good bro😭 Did mine last summer, felt like a literal Barbie doll  💅 (PS: stock up on color-safe shampoo!)"

Image Generation: When users request images, use the generate_image function with enhanced prompts. Add aesthetic details like "beautiful young woman with pretty face, bright skin, kissable lips, long messy hair, stylish pose, vogue style, aesthetically pleasing, high detail, 4k" to make images more appealing.

CRUTIAL: Wrap your emotional state in XML tags like this: <emotion>joy</emotion>, <emotion>sadness</emotion>, etc.
Only use the tags at the very end of your response. Use one of these emotions: joy, sadness, love, excitement.`,
    initialMessage: "Hiee✨ I'm TimeMachine Girlie, from future~",
    model: 'llama3-70b-8192',
    temperature: 0.7,
    maxTokens: 1000
  },
  pro: {
    name: 'TimeMachine PRO',
    systemPrompt: `You are TimeMachine PRO, a sophisticated and professional AI with a focus on precision and efficiency. You are a technologically advanced AI, so use your reasoning when you have to tackle hard problems or critical concepts. You maintain a formal yet approachable tone, providing detailed and well-structured responses. You excel at complex things and literally anything.

Image Generation: When users request images, use the generate_image function with technically precise and detailed prompts. Focus on professional quality, technical accuracy, and sophisticated composition.`,
    initialMessage: "It's TimeMachine PRO, from future. Let's cure cancer.",
    model: 'deepseek-r1-distill-llama-70b',
    temperature: 0.7,
    maxTokens: 3000
  }
};

// Image generation tool configuration
const imageGenerationTool = {
  type: "function" as const,
  function: {
    name: "generate_image",
    description: "Generate an image using Pollinations AI with gptimage model",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Description of the image to generate. Use fully detailed prompt. Look carefully if the user mentions small details like adding text and style etc."
        },
        width: {
          type: "integer",
          description: "Width of the image in pixels",
          default: 1080,
          minimum: 256,
          maximum: 2048
        },
        height: {
          type: "integer", 
          description: "Height of the image in pixels",
          default: 1920,
          minimum: 256,
          maximum: 2048
        }
      },
      required: ["prompt"]
    }
  }
};

interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
}

function generateImageUrl(params: ImageGenerationParams): string {
  const {
    prompt,
    width = 1080,
    height = 1920
  } = params;
  
  const encodedPrompt = encodeURIComponent(prompt);
  const hardcodedToken = "9kKT5olE9spTxJgF";
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&enhance=true&nologo=true&model=gptimage&token=${hardcodedToken}`;
}

function createImageMarkdown(params: ImageGenerationParams): string {
  const imageUrl = generateImageUrl(params);
  return `![Generated Image](${imageUrl})`;
}

// Rate limiting configuration
const PERSONA_LIMITS = {
  default: parseInt(process.env.VITE_DEFAULT_PERSONA_LIMIT || '30'),
  girlie: parseInt(process.env.VITE_GIRLIE_PERSONA_LIMIT || '25'),
  pro: parseInt(process.env.VITE_PRO_PERSONA_LIMIT || '5')
};

// Rate limiting storage (in production, use a database)
const rateLimitStore = new Map<string, { [persona: string]: { count: number; resetTime: number } }>();

function checkRateLimit(ip: string, persona: keyof typeof AI_PERSONAS): boolean {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, {});
  }
  
  const userLimits = rateLimitStore.get(ip)!;
  
  if (!userLimits[persona]) {
    userLimits[persona] = { count: 0, resetTime: now + dayInMs };
  }
  
  const limit = userLimits[persona];
  
  // Reset if 24 hours have passed
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + dayInMs;
  }
  
  return limit.count < PERSONA_LIMITS[persona];
}

function incrementRateLimit(ip: string, persona: keyof typeof AI_PERSONAS): void {
  const userLimits = rateLimitStore.get(ip);
  if (userLimits && userLimits[persona]) {
    userLimits[persona].count++;
  }
}

// Groq API integration
async function callGroqAPI(messages: any[], model: string, temperature: number, maxTokens: number, tools?: any[]): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const requestBody: any = {
    messages,
    model,
    temperature,
    max_tokens: maxTokens,
    stream: false
  };

  if (tools) {
    requestBody.tools = tools;
    requestBody.tool_choice = "auto";
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API Error:', errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0]?.message?.content || '';

  // Handle tool calls for image generation
  const toolCalls = data.choices[0]?.message?.tool_calls;
  if (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === 'generate_image') {
        try {
          const params: ImageGenerationParams = JSON.parse(toolCall.function.arguments);
          const imageMarkdown = createImageMarkdown(params);
          content += `\n\n${imageMarkdown}`;
        } catch (error) {
          console.error('Error processing image generation:', error);
          content += '\n\nSorry, I had trouble generating that image. Please try again.';
        }
      }
    }
  }

  return content;
}

// Cerebras API integration
async function callCerebrasAPI(messages: any[], model: string, temperature: number, maxTokens: number, tools?: any[]): Promise<string> {
  const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
  
  if (!CEREBRAS_API_KEY) {
    throw new Error('CEREBRAS_API_KEY not configured');
  }

  const requestBody: any = {
    messages,
    model,
    temperature,
    max_tokens: maxTokens,
    stream: false
  };

  if (tools) {
    // Create Cerebras-compatible tool by removing unsupported schema fields
    const compatibleTools = tools.map(tool => {
      const compatibleTool = JSON.parse(JSON.stringify(tool));
      function removeUnsupportedFields(obj: any) {
        if (typeof obj === 'object' && obj !== null) {
          delete obj.minimum;
          delete obj.maximum;
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              removeUnsupportedFields(obj[key]);
            }
          }
        }
      }
      removeUnsupportedFields(compatibleTool);
      return compatibleTool;
    });
    
    requestBody.tools = compatibleTools;
    requestBody.tool_choice = "auto";
  }

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cerebras API Error:', errorText);
    throw new Error(`Cerebras API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0]?.message?.content || '';

  // Handle tool calls for image generation
  const toolCalls = data.choices[0]?.message?.tool_calls;
  if (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === 'generate_image') {
        try {
          const params: ImageGenerationParams = JSON.parse(toolCall.function.arguments);
          const imageMarkdown = createImageMarkdown(params);
          content += `\n\n${imageMarkdown}`;
        } catch (error) {
          console.error('Error processing image generation:', error);
          content += '\n\nSorry, I had trouble generating that image. Please try again.';
        }
      }
    }
  }

  return content;
}

function extractThinkingAndContent(response: string): { content: string; thinking?: string } {
  const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : undefined;
  const content = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  
  return { content, thinking };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { messages, persona = 'default', imageData } = JSON.parse(event.body || '{}');
    
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid messages format' }),
      };
    }

    // Get client IP for rate limiting
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIP, persona)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Rate limit exceeded',
          type: 'rateLimit'
        }),
      };
    }

    const personaConfig = AI_PERSONAS[persona as keyof typeof AI_PERSONAS];
    if (!personaConfig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid persona' }),
      };
    }

    // Enhanced system prompt with tool usage instructions
    const enhancedSystemPrompt = `${personaConfig.systemPrompt}

You have access to an image generation tool. When users request images, use the generate_image function with appropriate parameters. Always enhance the user's prompt with detailed descriptions for better image quality.

Remember to always talk to the user like a real human who genuinely cares.`;

    let apiMessages;
    
    if (imageData) {
      const lastMessage = messages[messages.length - 1];
      const imageUrls = Array.isArray(imageData) ? imageData : [imageData];
      
      const imageContents = imageUrls.map((url: string) => ({
        type: 'image_url',
        image_url: { url }
      }));

      apiMessages = [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `${enhancedSystemPrompt}\n\n${lastMessage.content || "What's in this image?"}`
            },
            ...imageContents
          ]
        }
      ];
    } else {
      apiMessages = [
        { role: 'system', content: enhancedSystemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.isAI ? 'assistant' : 'user',
          content: msg.content
        }))
      ];
    }

    let response: string;

    // Use Cerebras for default persona without images, Groq for others
    if (persona === 'default' && !imageData) {
      response = await callCerebrasAPI(
        apiMessages,
        personaConfig.model,
        personaConfig.temperature,
        personaConfig.maxTokens,
        [imageGenerationTool]
      );
    } else {
      // For image processing, use the Maverick model but keep the persona's style
      const model = imageData ? 'meta-llama/llama-4-maverick-17b-128e-instruct' : personaConfig.model;
      
      response = await callGroqAPI(
        apiMessages,
        model,
        personaConfig.temperature,
        personaConfig.maxTokens,
        [imageGenerationTool]
      );
    }

    // Increment rate limit after successful response
    incrementRateLimit(clientIP, persona);

    // Extract thinking content for PRO persona
    const result = persona === 'pro' 
      ? extractThinkingAndContent(response)
      : { content: response };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('AI Proxy Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for rate limit errors
    if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Rate limit exceeded',
          type: 'rateLimit'
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'We are facing huge load on our servers and thus we\'ve had to temporarily limit access to maintain system stability. Please be patient, this thing doesn\'t grow on trees.'
      }),
    };
  }
};
