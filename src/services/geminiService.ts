import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { BibleQuestion } from "./bibleQuestionService";
import { BIBLE_HEROES } from "../lib/bibleHeroes";
import { BIBLE_SECTIONS } from "../lib/bibleSections";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
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
  count = 10,
  retries = 2
): Promise<{ questions: BibleQuestion[], nextBook: string, nextChapter: number, nextVerse: number }> => {
  const section = BIBLE_SECTIONS.find(s => s.id === sectionId);
  
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Generating ${count} Bible questions for section "${section?.name}" starting from ${book} ${chapter}:${verse}... (Attempt ${i + 1}/${retries})`);
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `JSON only. List ${count} interesting Bible trivia questions starting from ${book} ${chapter}:${verse} onwards in the ${section?.name || 'Bible'}.
        IMPORTANT: Start as close to the beginning of the requested range as possible. Do not skip the early chapters (like Genesis 1-10) if they are within the range.
        Questions should cover people, places, events, miracles, or quotes mentioned in the text.
        Format: {"questions": [{"text": "Question?", "correctAnswer": "Correct Answer", "distractors": ["Wrong 1","Wrong 2","Wrong 3"], "era": "Era Name", "reference": "Book 1:1", "book": "Book", "chapter": 1, "verse": 1}], "nextBook": "...", "nextChapter": 1, "nextVerse": 1}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
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
                    chapter: { type: Type.NUMBER },
                    verse: { type: Type.NUMBER }
                  },
                  required: ["text", "correctAnswer", "distractors", "era", "reference", "book", "chapter", "verse"]
                }
              },
              nextBook: { type: Type.STRING },
              nextChapter: { type: Type.NUMBER },
              nextVerse: { type: Type.NUMBER }
            },
            required: ["questions", "nextBook", "nextChapter", "nextVerse"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      const data = JSON.parse(text.replace(/```json\n?|```/g, '').trim());
      
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
