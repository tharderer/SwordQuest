import { openDB, IDBPDatabase } from 'idb';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { BIBLE_SECTIONS } from '../lib/bibleSections';

export interface BibleQuestion {
  id?: number;
  text: string;
  answer: number;
  correctAnswer?: string; // For compatibility with multiple choice
  options?: string[]; // For compatibility with multiple choice
  era?: string;
  reference?: string;
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
export const JEOPARDY_STORE = 'questions_jeopardy';
export const WITS_STORE = 'questions_wits';
const META_STORE = 'metadata';

let dbPromise: Promise<IDBPDatabase<any>>;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains(JEOPARDY_STORE)) {
          db.createObjectStore(JEOPARDY_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(WITS_STORE)) {
          db.createObjectStore(WITS_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }

        // Ensure indices exist for both stores using the versionchange transaction
        const jStore = transaction.objectStore(JEOPARDY_STORE);
        if (!jStore.indexNames.contains('by-chapter')) jStore.createIndex('by-chapter', ['book', 'chapter']);
        if (!jStore.indexNames.contains('by-used')) jStore.createIndex('by-used', 'used');
        if (!jStore.indexNames.contains('by-section')) jStore.createIndex('by-section', 'sectionId');
        if (!jStore.indexNames.contains('by-lastSeen')) jStore.createIndex('by-lastSeen', 'lastSeen');

        const wStore = transaction.objectStore(WITS_STORE);
        if (!wStore.indexNames.contains('by-chapter')) wStore.createIndex('by-chapter', ['book', 'chapter']);
        if (!wStore.indexNames.contains('by-used')) wStore.createIndex('by-used', 'used');
        if (!wStore.indexNames.contains('by-lastSeen')) wStore.createIndex('by-lastSeen', 'lastSeen');
      },
    });
  }
  return dbPromise;
}

export const bibleQuestionService = {
  async saveQuestions(questions: BibleQuestion[], storeName: string = JEOPARDY_STORE) {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
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

  async getWitsSectionsProgress(): Promise<Record<string, SectionProgress>> {
    const db = await getDB();
    const progress = await db.get(META_STORE, 'witsSectionsProgress');
    return progress || {};
  },

  async updateWitsSectionsProgress(progress: Record<string, SectionProgress>) {
    const db = await getDB();
    await db.put(META_STORE, progress, 'witsSectionsProgress');
  },

  async getWitsQuestionsForGame(count: number = 7, excludeIds: number[] = []): Promise<BibleQuestion[]> {
    const db = await getDB();
    let allQuestions = await db.getAll(WITS_STORE);
    
    if (excludeIds.length > 0) {
      allQuestions = allQuestions.filter(q => q.id && !excludeIds.includes(q.id));
    }
    
    if (!allQuestions || allQuestions.length === 0) return [];

    // Sort: Unseen first (used === 0), then by lastSeen (oldest first)
    const sorted = allQuestions.sort((a, b) => {
      const aUsed = (a.used === true || a.used === 1) ? 1 : 0;
      const bUsed = (b.used === true || b.used === 1) ? 1 : 0;
      
      if (aUsed !== bUsed) return aUsed - bUsed;
      return (a.lastSeen || 0) - (b.lastSeen || 0);
    });

    // Take all unseen questions
    const unseen = sorted.filter(q => {
      const isUsed = (q.used === true || q.used === 1);
      return !isUsed;
    });
    
    let selected: BibleQuestion[] = [];
    if (unseen.length >= count) {
      // If we have enough unseen, pick randomly from THEM only
      selected = unseen.sort(() => Math.random() - 0.5).slice(0, count);
    } else {
      // Take all unseen, then fill the rest with the oldest used ones
      selected = [...unseen];
      const used = sorted.filter(q => (q.used === true || q.used === 1));
      const needed = count - unseen.length;
      // Take a pool of oldest used and pick randomly to avoid same repeat order
      const extra = used.slice(0, Math.max(needed, 20)).sort(() => Math.random() - 0.5).slice(0, needed);
      selected = [...selected, ...extra];
    }
    
    return selected;
  },

  async markAsUsed(ids: number[], storeName: string = WITS_STORE) {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
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

  async deleteQuestion(id: number, storeName: string = WITS_STORE) {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.store.delete(id);
    await tx.done;
  },

  async generateQuestions(apiKey: string, onProgress?: (count: number, total: number) => void) {
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please check your environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const witsProgress = await this.getWitsSectionsProgress();
    const allGeneratedQuestions: BibleQuestion[] = [];
    
    // Use the first 7 sections as requested
    const targetSections = BIBLE_SECTIONS.slice(0, 7);
    const totalToGenerate = targetSections.length * 2; // 2 per section to keep bank ahead

    for (let i = 0; i < targetSections.length; i++) {
      const section = targetSections[i];
      const prog = witsProgress[section.id] || { 
        currentBook: section.startBook, 
        currentChapter: section.startChapter, 
        currentVerse: section.startVerse 
      };

      if (onProgress) onProgress(allGeneratedQuestions.length, totalToGenerate);

      const prompt = `JSON only. List 2 obscure numerical facts from ${prog.currentBook} ${prog.currentChapter}:${prog.currentVerse} onwards in the ${section.name} section of the Bible. 
      Extract specific numbers mentioned in the text (ages, years, cubits, shekels, etc.). 
      Each fact must be a number mentioned in the narrative.
      Format: {
        "questions": [{"text": "Question?", "answer": 123, "book": "...", "chapter": 1, "verse": 1}],
        "nextBook": "...", "nextChapter": 1, "nextVerse": 1
      }`;

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      let batchSuccess = false;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
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
                        answer: { type: Type.NUMBER },
                        book: { type: Type.STRING },
                        chapter: { type: Type.NUMBER },
                        verse: { type: Type.NUMBER }
                      },
                      required: ["text", "answer", "book", "chapter", "verse"]
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
            throw new Error("Invalid response format");
          }

          const batchQuestions: BibleQuestion[] = data.questions.map((q: any) => ({
            ...q,
            used: 0,
            lastSeen: 0,
            sectionId: section.id
          }));

          allGeneratedQuestions.push(...batchQuestions);
          
          // Update progress for this section
          witsProgress[section.id] = {
            currentBook: data.nextBook,
            currentChapter: data.nextChapter,
            currentVerse: data.nextVerse
          };

          batchSuccess = true;
          break;
        } catch (e: any) {
          if (attempt < 1) await delay(1000);
        }
      }
      
      if (onProgress) onProgress(allGeneratedQuestions.length, totalToGenerate);
    }

    await this.saveQuestions(allGeneratedQuestions, WITS_STORE);
    await this.updateWitsSectionsProgress(witsProgress);
    
    return allGeneratedQuestions;
  },

  async getQuestionsForChapter(book: string, chapter: number): Promise<BibleQuestion[]> {
    const db = await getDB();
    return db.getAllFromIndex(WITS_STORE, 'by-chapter', [book, chapter]);
  },

  async getQuestionCount(storeName: string = WITS_STORE) {
    const db = await getDB();
    return db.count(storeName);
  },

  async getUnseenQuestionCount(storeName: string = WITS_STORE) {
    const db = await getDB();
    const count = await db.countFromIndex(storeName, 'by-used', 0);
    return count;
  },

  // Compatibility methods for App.tsx
  async initBibleQuestionDB() {
    await getDB();
  },

  async getQuestionsSortedByLastSeen(storeName: string = JEOPARDY_STORE): Promise<BibleQuestion[]> {
    const db = await getDB();
    const questions = await db.getAllFromIndex(storeName, 'by-lastSeen');
    return Array.isArray(questions) ? questions : [];
  },

  async getQuestionsBySection(sectionId: string): Promise<BibleQuestion[]> {
    const db = await getDB();
    const questions = await db.getAllFromIndex(JEOPARDY_STORE, 'by-section', sectionId);
    return Array.isArray(questions) ? questions : [];
  },

  async updateQuestionLastSeen(id: number, isCorrect?: boolean, storeName: string = JEOPARDY_STORE) {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
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

  async resetWitsAndWagersBank() {
    const db = await getDB();
    const tx = db.transaction([WITS_STORE, META_STORE], 'readwrite');
    await tx.objectStore(WITS_STORE).clear();
    await tx.objectStore(META_STORE).delete('witsSectionsProgress');
    await tx.done;
  },

  async deleteQuestions(ids: number[], storeName: string = JEOPARDY_STORE) {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    for (const id of ids) {
      await tx.store.delete(id);
    }
    await tx.done;
  },

  async deleteAllQuestions(storeName: string = JEOPARDY_STORE) {
    const db = await getDB();
    await db.clear(storeName);
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
export const resetWitsAndWagersBank = bibleQuestionService.resetWitsAndWagersBank;
export const getWitsQuestionsForGame = bibleQuestionService.getWitsQuestionsForGame;
export const saveQuestions = bibleQuestionService.saveQuestions;
export const deleteQuestion = bibleQuestionService.deleteQuestion;
export const deleteQuestions = bibleQuestionService.deleteQuestions;
export const deleteAllQuestions = bibleQuestionService.deleteAllQuestions;
