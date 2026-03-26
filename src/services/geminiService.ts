import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { BibleQuestion } from "./bibleQuestionService";
import { BIBLE_HEROES } from "../lib/bibleHeroes";
import { BIBLE_SECTIONS } from "../lib/bibleSections";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is missing. Please set it in your Vercel project settings.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateBibleQuestionsBatch = async (
  sectionId: string, 
  book: string, 
  chapter: number, 
  verse: number,
  retries = 5
): Promise<{ questions: BibleQuestion[], nextBook: string, nextChapter: number, nextVerse: number }> => {
  const section = BIBLE_SECTIONS.find(s => s.id === sectionId);
  
  // Create a summary of Bible Heroes for context
  const heroContext = BIBLE_HEROES.slice(0, 30).map(h => `${h.name} (${h.era}): ${h.deeds[0]}`).join('\n');

  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Generating Bible questions for section "${section?.name}" starting from ${book} ${chapter}:${verse}... (Attempt ${i + 1}/${retries})`);
      const ai = getAI();
      const model = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a batch of EXACTLY 10 Bible questions for the theme: "${section?.name}".
        
        CRITICAL STARTING POINT:
        You MUST start generating questions from ${book} chapter ${chapter}, verse ${verse}. 
        Go VERSE BY VERSE. Try to create a question for every verse if possible.
        
        CONTENT REQUIREMENTS:
        - Theme: ${section?.description}
        - Mix of Bible Hero deeds/actions AND general Bible trivia found in these verses.
        - EVERYTHING must be strictly from the verses starting at ${book} ${chapter}:${verse}.
        
        STRICT CHARACTER LIMITS (ABSOLUTE MAXIMUM):
        - Question text: MAX 70 characters. DO NOT EXCEED 70.
        - Correct answer: MAX 25 characters. DO NOT EXCEED 25.
        - Distractors: EXACTLY 3 distractors, MAX 25 characters each. DO NOT EXCEED 25.
        
        If a question or answer is too long, shorten it or choose a different verse.
        
        REFERENCE HEROES (Style Guide):
        ${heroContext}
        
        CRITICAL INSTRUCTIONS:
        - Use the King James Version (KJV).
        - EVERY question MUST have a precise Bible reference in the "reference" field (e.g., "John 3:16").
        - For each question, provide EXACTLY 3 era-appropriate distractors.
        - There MUST be exactly 4 total options (1 correct + 3 distractors) for every question.
        - Use ONLY one of these exact eras: Patriarchs, Judges, Kings, Prophets, Exile, Apostles, Early Church.
        - NO COMMENTARY: Do not include any notes, explanations, or parenthetical commentary in the question text, answers, or distractors.
        - RETURN ONLY THE JSON OBJECT. NO PREAMBLE. NO POSTAMBLE.
        
        Return the data in JSON format with the following structure:
        {
          "questions": [
            {
              "text": "Question (max 70 chars)?",
              "correctAnswer": "Answer (max 25 chars)",
              "distractors": ["D1", "D2", "D3"],
              "era": "One of the exact eras listed above",
              "reference": "The Bible verse reference",
              "book": "The Bible book name",
              "chapter": 1,
              "verse": 1
            }
          ],
          "nextBook": "The next book to start from",
          "nextChapter": 1,
          "nextVerse": 1
        }`,
        config: {
          systemInstruction: "You are a precise data generator. You MUST NOT include any conversational text, commentary, or explanations. Your output MUST be valid JSON only.",
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    correctAnswer: { type: Type.STRING },
                    distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    era: { type: Type.STRING },
                    reference: { type: Type.STRING },
                    book: { type: Type.STRING },
                    chapter: { type: Type.INTEGER },
                    verse: { type: Type.INTEGER }
                  },
                  required: ["text", "correctAnswer", "distractors", "era", "book", "chapter", "verse", "reference"]
                }
              },
              nextBook: { type: Type.STRING },
              nextChapter: { type: Type.INTEGER },
              nextVerse: { type: Type.INTEGER }
            },
            required: ["questions", "nextBook", "nextChapter", "nextVerse"]
          }
        }
      });

      const data = JSON.parse(model.text || '{}');
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response format from Gemini: missing questions array");
      }

      const questions: BibleQuestion[] = data.questions.map((q: any) => {
        const distractors = Array.isArray(q.distractors) ? q.distractors.slice(0, 3) : [];
        
        while (distractors.length < 3) {
          distractors.push("None of these");
        }
        
        return {
          text: q.text,
          correctAnswer: q.correctAnswer,
          options: [q.correctAnswer, ...distractors].sort(() => Math.random() - 0.5),
          era: q.era,
          reference: q.reference,
          lastSeen: 0,
          book: q.book,
          chapter: q.chapter,
          verse: q.verse,
          sectionId: sectionId
        };
      });

      return {
        questions,
        nextBook: data.nextBook || book,
        nextChapter: data.nextChapter || chapter,
        nextVerse: data.nextVerse || (verse + questions.length)
      };
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || 
                          error?.code === 429 || 
                          (error?.message && error.message.includes('quota')) ||
                          (error?.error?.code === 429) ||
                          (error?.error?.status === 'RESOURCE_EXHAUSTED');
      
      if (isQuotaError && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Quota exceeded for section ${sectionId}. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await delay(waitTime);
        continue;
      }
      console.error(`Error generating questions for section ${sectionId}:`, error);
      throw error;
    }
  }
  throw lastError;
};
