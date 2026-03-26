import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface JeopardyQuestion {
  id: string;
  clue: string;
  answer: string;
  value: number;
  isAnswered?: boolean;
  isDailyDouble?: boolean;
}

export interface JeopardyCategory {
  id: string;
  title: string;
  questions: JeopardyQuestion[];
}

const SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING, description: "A creative or fun category name related to History, Geography, or Science" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            clue: { type: Type.STRING, description: "A single trivia clue for the question." },
            answer: { type: Type.STRING, description: "The correct response in the form of a question (e.g., 'Who is Napoleon?', 'What is the Nile?')" },
            value: { type: Type.NUMBER, description: "The point value: 500, 1000, 1500, 2000, or 2500" }
          },
          required: ["id", "clue", "answer", "value"]
        }
      }
    },
    required: ["id", "title", "questions"]
  }
};

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;

export type JeopardyDifficulty = 'easy' | 'medium' | 'hard';
export type JeopardyMode = 'bible' | 'history' | 'geography' | 'science' | 'mixed';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateJeopardyBoard(
  mode: JeopardyMode = 'bible',
  difficulty: JeopardyDifficulty = 'medium',
  seenCategories: string[] = [], 
  seenClues: string[] = []
): Promise<JeopardyCategory[]> {
  let lastError: any;
  
  const recentCategories = seenCategories.slice(-100).join(', ');
  const recentClues = seenClues.slice(-250).join(' | ');

  const modeInstructions = {
    bible: {
      theme: "Bible Hero",
      description: "Focus on Bible stories, characters, and theological concepts.",
      categories: "Creative Bible-related categories (e.g., 'Bad Hair Days', 'Biblical Bloopers').",
      clueStyle: "Use the King James Version for all references."
    },
    history: {
      theme: "Secular History",
      description: "Focus on world history, major events, and historical figures.",
      categories: "Creative history categories (e.g., 'Lost Empires', 'Revolutionary Ideas').",
      clueStyle: "Focus on secular historical facts."
    },
    geography: {
      theme: "Geography",
      description: "Focus on world geography, landmarks, and cultures.",
      categories: "Creative geography categories (e.g., 'Island Hopping', 'Capital Crimes').",
      clueStyle: "Focus on geographic facts and locations."
    },
    science: {
      theme: "Science",
      description: "Focus on various scientific fields (biology, physics, chemistry, etc.).",
      categories: "Creative science categories (e.g., 'Microscopic Marvels', 'Scientific Scandals').",
      clueStyle: "Focus on scientific principles and discoveries."
    },
    mixed: {
      theme: "Mixed (Bible Hero + Secular)",
      description: "A mix of Bible and secular trivia.",
      categories: "EXACTLY 2 categories must be Bible-related. The remaining 3 categories must be a mix of History, Geography, and Science.",
      clueStyle: "Apply the relevant style (KJV for Bible, secular for others) to each category."
    }
  };

  const difficultyInstructions = {
    easy: "The overall game should be EASY. Clues should focus on extremely well-known facts and figures.",
    medium: "The overall game should be MEDIUM difficulty. A balanced mix of general knowledge and more specific facts.",
    hard: "The overall game should be HARD. Clues should focus on obscure details and advanced concepts."
  };

  const currentMode = modeInstructions[mode];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a full Jeopardy game with 5 categories and 5 questions per category.
        
        MODE: ${mode.toUpperCase()} - ${currentMode.theme}
        DESCRIPTION: ${currentMode.description}
        DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
        ${difficultyInstructions[difficulty]}
        
        CRITICAL: DO NOT EVER REPEAT ANY OF THE FOLLOWING CATEGORIES OR CLUES. 
        THEY HAVE BEEN USED IN PREVIOUS GAMES. YOU MUST GENERATE ENTIRELY NEW AND UNIQUE CONTENT.
 
        FORBIDDEN CATEGORIES: ${recentCategories || 'None'}
        FORBIDDEN CLUES: ${recentClues || 'None'}
 
        RULES:
        1. CATEGORIES: ${currentMode.categories} The clues in each category MUST strictly relate to the category title.
        2. QUESTIONS: Each question must have EXACTLY 1 clue.
        3. DIFFICULTY SCALING: Clues MUST get significantly harder as the money increases. 
           - $500: Basic knowledge.
           - $1000: Common knowledge.
           - $1500: Intermediate knowledge.
           - $2000: Advanced knowledge.
           - $2500: Deep cuts, obscure details, or complex connections.
        4. FORMAT: All answers must be in the form of a question (e.g., 'Who is...', 'What is...').
        5. VALUES: Questions in each category must be valued at 500, 1000, 1500, 2000, and 2500.
        6. STYLE: ${currentMode.clueStyle}
        7. NO COMMENTARY: Do not include any notes, explanations, or parenthetical commentary in the clues or answers.
        8. RETURN ONLY THE RAW JSON OBJECT. NO PREAMBLE. NO POSTAMBLE.`,
        config: {
          systemInstruction: "You are a precise data generator. You MUST NOT include any conversational text, commentary, or explanations. Your output MUST be valid JSON only.",
          responseMimeType: "application/json",
          responseSchema: SCHEMA
        }
      });

      const categories = JSON.parse(response.text);
      return categories;
    } catch (error: any) {
      lastError = error;
      
      const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || 
                          error?.code === 429 || 
                          (error?.message && error.message.includes('quota')) ||
                          (error?.error?.code === 429) ||
                          (error?.error?.status === 'RESOURCE_EXHAUSTED');

      if (attempt < MAX_RETRIES) {
        const waitTime = isQuotaError 
          ? Math.pow(2, attempt) * INITIAL_RETRY_DELAY + Math.random() * 1000
          : INITIAL_RETRY_DELAY + Math.random() * 500;
        
        console.warn(`Attempt ${attempt + 1} failed generating Jeopardy${isQuotaError ? ' (Quota Exceeded)' : ''}. Retrying in ${Math.round(waitTime)}ms...`, error);
        await delay(waitTime);
      } else {
        console.error(`Final attempt (${attempt + 1}) failed generating Jeopardy:`, error);
      }
    }
  }

  throw lastError;
}
