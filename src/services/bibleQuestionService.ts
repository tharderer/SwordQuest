import { openDB, IDBPDatabase } from 'idb';
import { GoogleGenAI, Type } from "@google/genai";

export interface BibleQuestion {
  id?: number;
  text: string;
  answer: number;
  book: string;
  chapter: number;
  verse?: number;
  used: boolean | number;
  lastSeen?: number;
  sectionId?: string;
  consecutiveCorrect?: number;
}

export interface SectionProgress {
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
}

export interface BibleProgress {
  sections: Record<string, SectionProgress>;
  lastSectionIndex?: number;
  lastQuestionInCurrentSection?: number;
}

const DB_NAME = 'BibleWitsAndWagers';
const STORE_NAME = 'questions';
const META_STORE = 'metadata';

let dbPromise: Promise<IDBPDatabase<any>>;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-chapter', ['book', 'chapter']);
          store.createIndex('by-used', 'used');
          store.createIndex('by-section', 'sectionId');
          store.createIndex('by-lastSeen', 'lastSeen');
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export const bibleQuestionService = {
  async saveQuestions(questions: BibleQuestion[]) {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const q of questions) {
      const question = {
        ...q,
        used: q.used ? 1 : 0,
        lastSeen: q.lastSeen || 0
      };
      await tx.store.add(question);
    }
    await tx.done;
  },

  async getNextUnusedQuestions(count: number): Promise<BibleQuestion[]> {
    const db = await getDB();
    const questions = await db.getAllFromIndex(STORE_NAME, 'by-used', 0); 
    return questions.slice(0, count);
  },

  async markAsUsed(ids: number[]) {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const id of ids) {
      const q = await tx.store.get(id);
      if (q) {
        q.used = 1;
        q.lastSeen = Date.now();
        await tx.store.put(q);
      }
    }
    await tx.done;
  },

  async getLastGeneratedChapter(): Promise<{ book: string; chapter: number }> {
    const db = await getDB();
    const last = await db.get(META_STORE, 'lastChapter');
    return last || { book: 'Genesis', chapter: 0 };
  },

  async setLastGeneratedChapter(book: string, chapter: number) {
    const db = await getDB();
    await db.put(META_STORE, { book, chapter }, 'lastChapter');
  },

  async getCurrentGameChapter(): Promise<{ book: string; chapter: number }> {
    const db = await getDB();
    const current = await db.get(META_STORE, 'currentGameChapter');
    return current || { book: 'Genesis', chapter: 1 };
  },

  async setCurrentGameChapter(book: string, chapter: number) {
    const db = await getDB();
    await db.put(META_STORE, { book, chapter }, 'currentGameChapter');
  },

  async generateQuestions(apiKey: string) {
    const last = await this.getLastGeneratedChapter();
    const nextChapter = last.chapter + 1;
    const book = last.book; 
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a Biblical scholar and trivia master. Generate exactly 15 of the ABSOLUTE HARDEST numerical trivia questions possible from the Bible book of ${book}, Chapter ${nextChapter}. 
    
    CRITICAL REQUIREMENTS:
    1. DIFFICULTY: The questions must be extremely obscure. They should be so difficult that even experts would likely not know the exact number without looking it up, yet they must be "guessable" (e.g., counts of people, objects, measurements, or specific actions).
    2. NUMERICAL ONLY: Every answer MUST be a single integer.
    3. TYPES OF QUESTIONS:
       - Obscure measurements or counts of objects/people/actions mentioned in the text.
       - Specific counts of genealogical links or generations mentioned in the chapter.
       - Numerical details about sacrifices, building dimensions, or tribal counts.
       - Verse numbers for specific events within the chapter.
       - NO WORD COUNTS, NO PUNCTUATION COUNTS, NO CHARACTER COUNTS. Avoid "boring" linguistic metrics. Focus on the CONTENT and NARRATIVE details of the chapter.
    4. FORMAT: Return ONLY a JSON array of objects with "text" and "answer" properties.
    
    Example Question: "How many generations are listed from Adam to Noah in this chapter?"
    Example Question: "What is the total number of verses in ${book} chapter ${nextChapter}?"
    
    Make them challenging enough that a winning 'Wits & Wagers' guess would be a true feat of estimation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              answer: { type: Type.NUMBER }
            },
            required: ["text", "answer"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const generated = JSON.parse(text);
    const questions: BibleQuestion[] = generated.map((q: any) => ({
      ...q,
      book,
      chapter: nextChapter,
      used: 0,
      lastSeen: 0
    }));

    await this.saveQuestions(questions);
    await this.setLastGeneratedChapter(book, nextChapter);
    
    return questions;
  },

  async getQuestionsForChapter(book: string, chapter: number): Promise<BibleQuestion[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORE_NAME, 'by-chapter', [book, chapter]);
  },

  async getQuestionCount() {
    const db = await getDB();
    return db.count(STORE_NAME);
  },

  // Compatibility methods for App.tsx
  async initBibleQuestionDB() {
    await getDB();
  },

  async getQuestionsSortedByLastSeen(): Promise<BibleQuestion[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORE_NAME, 'by-lastSeen');
  },

  async getQuestionsBySection(sectionId: string): Promise<BibleQuestion[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORE_NAME, 'by-section', sectionId);
  },

  async updateQuestionLastSeen(id: number, isCorrect?: boolean) {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const q = await tx.store.get(id);
    if (q) {
      q.lastSeen = Date.now();
      if (isCorrect !== undefined) {
        q.consecutiveCorrect = isCorrect ? (q.consecutiveCorrect || 0) + 1 : 0;
      }
      await tx.store.put(q);
    }
    await tx.done;
  },

  async getBibleProgress(): Promise<BibleProgress> {
    const db = await getDB();
    const sections = await db.get(META_STORE, 'sectionsProgress');
    const lastSectionIndex = await db.get(META_STORE, 'lastSectionIndex');
    const lastQuestionInCurrentSection = await db.get(META_STORE, 'lastQuestionInCurrentSection');
    return { 
      sections: sections || {},
      lastSectionIndex: lastSectionIndex || 0,
      lastQuestionInCurrentSection: lastQuestionInCurrentSection || 0
    };
  },

  async updateBibleProgress(sections: Record<string, SectionProgress>, lastSectionIndex?: number, lastQuestionInCurrentSection?: number) {
    const db = await getDB();
    await db.put(META_STORE, sections, 'sectionsProgress');
    if (lastSectionIndex !== undefined) {
      await db.put(META_STORE, lastSectionIndex, 'lastSectionIndex');
    }
    if (lastQuestionInCurrentSection !== undefined) {
      await db.put(META_STORE, lastQuestionInCurrentSection, 'lastQuestionInCurrentSection');
    }
  },

  async resetBibleProgress() {
    const db = await getDB();
    await db.delete(META_STORE, 'sectionsProgress');
    await db.delete(META_STORE, 'lastChapter');
    await db.delete(META_STORE, 'currentGameChapter');
  },

  async deleteQuestion(id: number) {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  async deleteQuestions(ids: number[]) {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const id of ids) {
      await tx.store.delete(id);
    }
    await tx.done;
  },

  async deleteAllQuestions() {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }
};

// Export individual functions for App.tsx compatibility
export const initBibleQuestionDB = bibleQuestionService.initBibleQuestionDB;
export const getQuestionsSortedByLastSeen = bibleQuestionService.getQuestionsSortedByLastSeen;
export const getQuestionsBySection = bibleQuestionService.getQuestionsBySection;
export const updateQuestionLastSeen = bibleQuestionService.updateQuestionLastSeen;
export const getBibleProgress = bibleQuestionService.getBibleProgress;
export const updateBibleProgress = bibleQuestionService.updateBibleProgress;
export const resetBibleProgress = bibleQuestionService.resetBibleProgress;
export const saveQuestions = bibleQuestionService.saveQuestions;
export const deleteQuestion = bibleQuestionService.deleteQuestion;
export const deleteQuestions = bibleQuestionService.deleteQuestions;
export const deleteAllQuestions = bibleQuestionService.deleteAllQuestions;
